import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { Plugins } from './Plugins.js';
import { McpServers } from './McpServers.js';
import { Skills } from './Skills.js';
import { Commands } from './Commands.js';
import { Settings } from './Settings.js';
const TABS = [
    { id: 'plugins', label: 'plugins', key: 'p' },
    { id: 'mcps', label: 'MCPs', key: 'm' },
    { id: 'skills', label: 'skills', key: 's' },
    { id: 'commands', label: 'commands', key: 'c' },
    { id: 'settings', label: 'settings', key: 'g' },
];
export function ConfigFrame({ state, store }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            // Letter keys p/m/s/c/g: jump to tab
            const t = TABS.find((x) => x.key === str);
            if (t) {
                store.getState().setInnerTab(t.id);
                return;
            }
            // h: previous tab
            if (str === 'h') {
                const idx = TABS.findIndex((x) => x.id === state.configInnerTab);
                store.getState().setInnerTab(TABS[Math.max(idx - 1, 0)].id);
                return;
            }
            // l: next tab
            if (str === 'l') {
                const idx = TABS.findIndex((x) => x.id === state.configInnerTab);
                store.getState().setInnerTab(TABS[Math.min(idx + 1, TABS.length - 1)].id);
                return;
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, state.configInnerTab, store]);
    let content = null;
    switch (state.configInnerTab) {
        case 'plugins':
            content = _jsx(Plugins, { state: state, store: store });
            break;
        case 'mcps':
            content = _jsx(McpServers, { state: state, store: store });
            break;
        case 'skills':
            content = _jsx(Skills, { state: state, store: store });
            break;
        case 'commands':
            content = _jsx(Commands, { state: state, store: store });
            break;
        case 'settings':
            content = _jsx(Settings, { state: state, store: store });
            break;
    }
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Box, { children: TABS.map((t, i) => (_jsxs(Text, { bold: t.id === state.configInnerTab, children: [i > 0 ? ' | ' : '', _jsx(Text, { color: t.id === state.configInnerTab ? 'cyan' : undefined, children: `[${t.key}] ${t.label}` })] }, t.id))) }), _jsx(Box, { marginTop: 1, flexDirection: "column", flexGrow: 1, children: content })] }));
}
//# sourceMappingURL=ConfigFrame.js.map