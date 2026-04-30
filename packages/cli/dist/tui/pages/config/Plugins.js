import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
export function Plugins({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === ' ') {
                const p = state.plugins[cursor];
                if (p)
                    void store.getState().togglePlugin(p.name);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, state.plugins, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["Plugins (", state.plugins.length, " installed)"] }), _jsx(List, { items: state.plugins, filterKey: (p) => p.name, renderItem: (p, sel, idx) => {
                    if (sel)
                        setTimeout(() => setCursor(idx), 0); // sync cursor
                    const mark = p.enabled ? '[✓]' : '[ ]';
                    const pending = state.pendingActions.has(`plugin:${p.name}`) ? ' …' : '';
                    return `${sel ? '▶' : ' '} ${mark} ${p.name.padEnd(40)} ${p.version ?? ''}${pending}`;
                }, onSelect: (p) => store.getState().togglePlugin(p.name) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "space:toggle  enter:toggle  /:filter  ?:help" }) })] }));
}
//# sourceMappingURL=Plugins.js.map