import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function Header({ version, language, dashboard, }) {
    const dot = dashboard.running ? '●' : '○';
    const color = dashboard.running ? 'green' : 'gray';
    return (_jsxs(Box, { paddingX: 1, children: [_jsx(Text, { bold: true, children: "ccm " }), _jsxs(Text, { dimColor: true, children: [version, " \u00B7 "] }), _jsxs(Text, { children: [language, " \u00B7 "] }), _jsx(Text, { children: "dashboard " }), _jsx(Text, { color: color, children: dot }), _jsxs(Text, { dimColor: true, children: ["  (", dashboard.running ? 'running' : 'stopped', ")"] })] }));
}
//# sourceMappingURL=Header.js.map