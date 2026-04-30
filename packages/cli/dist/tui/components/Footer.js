import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { GLOBAL_HINT_DEFS } from '../keymap.js';
import { t } from '../i18n.js';
export function Footer() {
    const hints = GLOBAL_HINT_DEFS;
    return (_jsx(Box, { paddingX: 1, children: hints.map((h, i) => (_jsxs(Text, { dimColor: true, children: [h.key, _jsx(Text, { bold: true, children: ":" }), t(h.labelKey), i < hints.length - 1 ? '   ' : ''] }, i))) }));
}
//# sourceMappingURL=Footer.js.map