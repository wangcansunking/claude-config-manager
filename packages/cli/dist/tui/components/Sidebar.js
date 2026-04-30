import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { t } from '../i18n.js';
const ITEMS = [
    { id: 'overview', labelKey: 'nav.overview', key: '1' },
    { id: 'config', labelKey: 'nav.config', key: '2' },
    { id: 'sessions', labelKey: 'nav.sessions', key: '3' },
    { id: 'recommended', labelKey: 'nav.recommend', key: '4' },
    { id: 'settingsPrefs', labelKey: 'nav.settings', key: '5' },
    { id: 'profiles', labelKey: 'nav.profiles_wip', key: '6' },
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
    return (_jsx(Box, { flexDirection: "column", borderStyle: "single", borderColor: focused ? 'cyan' : 'gray', paddingX: 1, width: 16, flexShrink: 0, children: ITEMS.map((it) => {
            const sel = it.id === active;
            return (_jsxs(Text, { bold: sel, children: [sel ? '▶ ' : '  ', t(it.labelKey)] }, it.id));
        }) }));
}
//# sourceMappingURL=Sidebar.js.map