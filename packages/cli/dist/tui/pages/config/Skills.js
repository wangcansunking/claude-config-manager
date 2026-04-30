import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
import { t } from '../../i18n.js';
export function Skills({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === ' ') {
                const s = state.skills[cursor];
                if (s)
                    void store.getState().toggleSkill(s.name);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, state.skills, state.focused, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: t('config.skills.title', { n: state.skills.length }) }), _jsx(List, { items: state.skills, filterKey: (s) => s.name, cursor: cursor, onCursorChange: (idx) => setCursor(idx), renderItem: (s, sel) => {
                    const mark = s.enabled ? '[✓]' : '[ ]';
                    const pending = state.pendingActions.has(`skill:${s.name}`) ? ' …' : '';
                    return `${sel ? '▶' : ' '} ${mark} ${s.name.padEnd(30)} ${s.source}${pending}`;
                }, onSelect: (s) => store.getState().toggleSkill(s.name) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('config.skills.hint') }) })] }));
}
//# sourceMappingURL=Skills.js.map