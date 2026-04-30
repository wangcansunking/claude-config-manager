import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function Toast({ kind, text }) {
    const prefix = kind === 'error' ? '✗' : kind === 'success' ? '✓' : '·';
    const color = kind === 'error' ? 'red' : kind === 'success' ? 'green' : 'cyan';
    return (_jsxs(Box, { children: [_jsxs(Text, { color: color, children: [prefix, " "] }), _jsx(Text, { children: text })] }));
}
//# sourceMappingURL=Toast.js.map