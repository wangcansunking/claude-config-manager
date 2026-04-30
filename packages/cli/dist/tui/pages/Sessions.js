import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useState } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../components/List.js';
import { copyToClipboard } from '../util/clipboard.js';
export function Sessions({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === 'y') {
                const s = state.sessions[cursor];
                if (!s)
                    return;
                void (async () => {
                    const result = await copyToClipboard(s.sessionId);
                    store.getState().pushToast({
                        kind: result.ok ? 'success' : 'error',
                        text: result.ok ? `Resume id copied (${result.via})` : 'Copy failed; install pbcopy/xclip',
                    });
                })();
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, state.sessions, state.focused, cursor, store]);
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { bold: true, children: ["Sessions (", state.sessions.length, ")"] }), _jsx(Box, { marginTop: 1, children: _jsx(List, { items: state.sessions, filterKey: (s) => `${s.projectDir || s.cwd} ${s.name ?? ''}`, cursor: cursor, onCursorChange: (idx) => setCursor(idx), renderItem: (s, sel) => {
                        const project = s.projectDir || s.cwd || '(unknown)';
                        const name = s.name ? ` (${s.name})` : '';
                        const status = s.alive ? '●' : '○';
                        return `${sel ? '▶' : ' '} ${status} ${project.padEnd(40)}${name}`;
                    }, onSelect: () => { } }) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "y:copy resume id  /:filter  ?:help" }) })] }));
}
//# sourceMappingURL=Sessions.js.map