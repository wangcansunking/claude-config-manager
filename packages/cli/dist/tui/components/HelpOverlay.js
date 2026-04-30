import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { GLOBAL_HINTS } from '../keymap.js';
export function HelpOverlay({ pageHints, onClose, }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === '\x1b')
                onClose();
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, onClose]);
    const all = [...GLOBAL_HINTS, ...(pageHints ?? [])];
    return (_jsxs(Box, { borderStyle: "round", borderColor: "cyan", flexDirection: "column", padding: 1, marginX: 4, marginY: 2, children: [_jsx(Text, { bold: true, children: "Keymap (Esc to close)" }), all.map((h, i) => (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: h.key.padEnd(10) }), _jsx(Text, { children: h.label })] }, i)))] }));
}
//# sourceMappingURL=HelpOverlay.js.map