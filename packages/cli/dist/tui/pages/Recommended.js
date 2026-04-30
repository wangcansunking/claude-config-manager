import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useState } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../components/List.js';
import { EmptyState } from '../components/EmptyState.js';
import { copyToClipboard } from '../util/clipboard.js';
export function Recommended({ state, store }) {
    const recs = state.recommendations;
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useEffect(() => {
        void store.getState().loadRecommendations();
    }, [store]);
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === 'c' || str === 'y') {
                const sorted = getSortedRecs(recs);
                const r = sorted[cursor];
                if (!r)
                    return;
                void (async () => {
                    const result = await copyToClipboard(r.installCommand);
                    store.getState().pushToast({
                        kind: result.ok ? 'success' : 'error',
                        text: result.ok ? `Install command copied: ${r.installCommand}` : 'Copy failed',
                    });
                })();
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, recs, state.focused, cursor, store]);
    if (recs.length === 0) {
        return (_jsx(EmptyState, { title: "No recommendations yet", hint: "Run `/ccm-recommendations` in Claude Code to generate." }));
    }
    const sorted = getSortedRecs(recs);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { bold: true, children: ["Recommended (", sorted.length, ")"] }), _jsx(Box, { marginTop: 1, children: _jsx(List, { items: sorted, filterKey: (r) => `${r.name} ${r.type}`, cursor: cursor, onCursorChange: (idx) => setCursor(idx), renderItem: (r, sel) => {
                        return `${sel ? '▶' : ' '} [${r.type.toUpperCase()}/${r.popularity}] ${r.name.padEnd(28)} ${r.description.slice(0, 50)}`;
                    }, onSelect: () => { } }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "c/y:copy install cmd  /:filter" }) })] }));
}
function getSortedRecs(recs) {
    const orderType = { mcp: 0, plugin: 1, skill: 2 };
    const orderPop = { Top: 0, Trending: 1 };
    return [...recs].sort((a, b) => orderType[a.type] - orderType[b.type]
        || orderPop[a.popularity] - orderPop[b.popularity]);
}
//# sourceMappingURL=Recommended.js.map