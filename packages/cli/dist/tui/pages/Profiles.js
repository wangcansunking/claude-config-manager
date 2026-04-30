import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { List } from '../components/List.js';
export function Profiles({ state, store }) {
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "Profiles" }), _jsx(Box, { marginTop: 1, children: _jsx(List, { items: state.profiles, filterKey: (p) => p.name, renderItem: (p, sel) => {
                        const active = p.name === state.activeProfile ? ' [active]' : '';
                        const pending = state.pendingActions.has(`profile:switch:${p.name}`) ? ' …' : '';
                        return `${sel ? '▶' : ' '} ${p.name}${active}${pending}`;
                    }, onSelect: (p) => {
                        if (p.name === state.activeProfile)
                            return;
                        store.getState().openModal({
                            title: `Switch to ${p.name}?`,
                            body: `Active profile becomes "${p.name}". This rewrites ~/.claude/settings.json.`,
                            onConfirm: () => store.getState().switchProfile(p.name),
                        });
                    } }) })] }));
}
//# sourceMappingURL=Profiles.js.map