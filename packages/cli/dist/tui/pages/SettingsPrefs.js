import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
const ROWS = ['language', 'theme', 'quit-confirm'];
export function SettingsPrefs({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    const env = state.settings.env ?? {};
    const lang = env.CLAUDE_CONFIG_LANG ?? 'en';
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === 'j' || str === '\x1b[B') {
                setCursor((c) => Math.min(c + 1, ROWS.length - 1));
            }
            else if (str === 'k' || str === '\x1b[A') {
                setCursor((c) => Math.max(c - 1, 0));
            }
            else if (str === '\r' || str === '\n') {
                const row = ROWS[cursor];
                if (row === 'language') {
                    void store.getState().setLanguage(lang === 'en' ? 'zh' : 'en');
                }
                if (row === 'theme' || row === 'quit-confirm') {
                    store.getState().pushToast({
                        kind: 'info',
                        text: `${row}: TUI inherits terminal palette; coming in v2`,
                    });
                }
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, lang, state.focused, store]);
    const ROW_LABEL_W = 14; // 'quit-confirm'.length (12) + 2 = 14
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "TUI preferences" }), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { children: [cursor === 0 ? '▶ ' : '  ', 'language'.padEnd(ROW_LABEL_W)] }), _jsx(Text, { children: lang }), _jsx(Text, { dimColor: true, children: "   (Enter to toggle en \u2194 zh)" })] }), _jsxs(Box, { children: [_jsxs(Text, { children: [cursor === 1 ? '▶ ' : '  ', 'theme'.padEnd(ROW_LABEL_W)] }), _jsx(Text, { dimColor: true, children: "auto (terminal palette)" })] }), _jsxs(Box, { children: [_jsxs(Text, { children: [cursor === 2 ? '▶ ' : '  ', 'quit-confirm'.padEnd(ROW_LABEL_W)] }), _jsx(Text, { dimColor: true, children: "off" })] })] }));
}
//# sourceMappingURL=SettingsPrefs.js.map