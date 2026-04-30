import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { GLOBAL_HINTS } from '../keymap.js';
export function Footer({ pageHints }) {
    const hints = pageHints && pageHints.length > 0 ? pageHints : GLOBAL_HINTS;
    return (_jsx(Box, { paddingX: 1, children: hints.map((h, i) => (_jsxs(Text, { dimColor: true, children: [h.key, _jsx(Text, { bold: true, children: ":" }), h.label, i < hints.length - 1 ? '   ' : ''] }, i))) }));
}
//# sourceMappingURL=Footer.js.map