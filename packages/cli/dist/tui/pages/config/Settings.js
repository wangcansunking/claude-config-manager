import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
const MODEL_CHOICES = [
    'opus', 'opus[1m]', 'sonnet', 'sonnet[1m]', 'haiku',
];
export function Settings({ state, store }) {
    const settings = state.settings;
    const env = settings.env ?? {};
    const hooks = settings.hooks ?? {};
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        if (!stdin)
            return;
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === '\r') {
                const cur = settings.model ?? MODEL_CHOICES[0];
                const idx = MODEL_CHOICES.indexOf(cur);
                const next = MODEL_CHOICES[(idx + 1) % MODEL_CHOICES.length];
                void store.getState().setModel(next);
            }
        };
        stdin.on('data', handler);
        return () => { stdin.off('data', handler); };
    }, [stdin, settings.model, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { bold: true, color: "cyan", children: "\u25B6 " }), _jsx(Text, { children: "model       " }), _jsx(Text, { children: String(settings.model ?? '(unset)') }), _jsx(Text, { dimColor: true, children: "   (Enter to cycle)" })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "env" }), Object.keys(env).length === 0 && _jsx(Text, { dimColor: true, children: "  (none)" }), Object.entries(env).map(([k, v]) => (_jsxs(Box, { children: [_jsxs(Text, { children: ["  ", k.padEnd(28)] }), _jsx(Text, { children: String(v) })] }, k)))] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "hooks" }), Object.keys(hooks).length === 0 && _jsx(Text, { dimColor: true, children: "  (none)" }), Object.keys(hooks).map((k) => (_jsxs(Text, { children: ["  ", k] }, k)))] })] }));
}
//# sourceMappingURL=Settings.js.map