import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function DetailPane({ title, fields, children, }) {
    return (_jsxs(Box, { borderStyle: "single", borderColor: "gray", flexDirection: "column", padding: 1, children: [title ? _jsx(Text, { bold: true, children: title }) : null, fields?.map((f) => (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [f.label.padEnd(14), " "] }), _jsx(Text, { children: f.value })] }, f.label))), children] }));
}
//# sourceMappingURL=DetailPane.js.map