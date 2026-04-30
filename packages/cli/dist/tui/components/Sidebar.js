import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
const ITEMS = [
    { id: 'overview', label: 'Overview', key: '1' },
    { id: 'config', label: 'Config', key: '2' },
    { id: 'sessions', label: 'Sessions', key: '3' },
    { id: 'recommended', label: 'Recommend', key: '4' },
    { id: 'settingsPrefs', label: 'Settings', key: '5' },
    { id: 'profiles', label: 'Profiles (WIP)', key: '6' },
];
export function Sidebar({ active, focused, onSelect, onEnter, }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            // Digit keys 1–6: always handled regardless of focus
            const byKey = ITEMS.find((i) => i.key === str);
            if (byKey) {
                onSelect(byKey.id);
                return;
            }
            // j/k/arrows navigation when sidebar is focused
            if (focused) {
                const idx = ITEMS.findIndex((i) => i.id === active);
                if ((str === 'j' || str === '\x1b[B') && idx < ITEMS.length - 1) {
                    onSelect(ITEMS[idx + 1].id);
                }
                else if ((str === 'k' || str === '\x1b[A') && idx > 0) {
                    onSelect(ITEMS[idx - 1].id);
                }
                else if (str === '\r' && onEnter) {
                    onEnter();
                }
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, active, focused, onSelect, onEnter]);
    return (_jsx(Box, { flexDirection: "column", borderStyle: "single", borderColor: focused ? 'cyan' : 'gray', paddingX: 1, width: 16, children: ITEMS.map((it) => {
            const sel = it.id === active;
            return (_jsxs(Text, { bold: sel, children: [sel ? '▶ ' : '  ', it.label] }, it.id));
        }) }));
}
//# sourceMappingURL=Sidebar.js.map