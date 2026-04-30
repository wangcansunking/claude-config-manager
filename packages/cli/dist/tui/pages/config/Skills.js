import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
export function Skills({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === ' ') {
                const s = state.skills[cursor];
                if (s)
                    void store.getState().toggleSkill(s.name);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, state.skills, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["Skills (", state.skills.length, ")"] }), _jsx(List, { items: state.skills, filterKey: (s) => s.name, renderItem: (s, sel, idx) => {
                    if (sel)
                        setTimeout(() => setCursor(idx), 0);
                    const mark = s.enabled ? '[✓]' : '[ ]';
                    const pending = state.pendingActions.has(`skill:${s.name}`) ? ' …' : '';
                    return `${sel ? '▶' : ' '} ${mark} ${s.name.padEnd(30)} ${s.source}${pending}`;
                }, onSelect: (s) => store.getState().toggleSkill(s.name) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "space:toggle  enter:toggle  /:filter" }) })] }));
}
//# sourceMappingURL=Skills.js.map