import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
import { t } from '../../i18n.js';
export function Plugins({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === ' ') {
                const p = state.plugins[cursor];
                if (p)
                    void store.getState().togglePlugin(p.name);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, state.plugins, state.focused, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: t('config.plugins.title', { n: state.plugins.length }) }), _jsx(List, { items: state.plugins, filterKey: (p) => p.name, cursor: cursor, onCursorChange: (idx) => setCursor(idx), renderItem: (p, sel) => {
                    const mark = p.enabled ? '[✓]' : '[ ]';
                    const pending = state.pendingActions.has(`plugin:${p.name}`) ? ' …' : '';
                    return `${sel ? '▶' : ' '} ${mark} ${p.name.padEnd(40)} ${p.version ?? ''}${pending}`;
                }, onSelect: (p) => store.getState().togglePlugin(p.name) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('config.plugins.hint') }) })] }));
}
//# sourceMappingURL=Plugins.js.map