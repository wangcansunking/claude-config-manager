import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function EmptyState({ title, hint }) {
    return (_jsxs(Box, { flexDirection: "column", alignItems: "center", justifyContent: "center", flexGrow: 1, children: [_jsx(Text, { dimColor: true, children: title }), hint ? _jsx(Text, { dimColor: true, children: hint }) : null] }));
}
//# sourceMappingURL=EmptyState.js.map