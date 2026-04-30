import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
export function Overview({ state }) {
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: "Active profile: " }), _jsx(Text, { children: state.activeProfile ?? '(none)' }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsxs(Text, { children: ["Plugins: ", state.plugins.length] }), _jsxs(Text, { children: ["MCPs: ", state.mcpServers.length] }), _jsxs(Text, { children: ["Skills: ", state.skills.length] }), _jsxs(Text, { children: ["Commands: ", state.commands.length] })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "Recent sessions" }), state.sessions.slice(0, 3).map((s, i) => (_jsxs(Text, { dimColor: true, children: ["\u00B7 ", s.projectDir ?? s.name ?? '—'] }, i))), state.sessions.length === 0 && _jsx(Text, { dimColor: true, children: "(none)" })] }), _jsxs(Box, { marginTop: 1, children: [_jsx(Text, { children: "Dashboard: " }), state.dashboardStatus.running
                        ? _jsx(Text, { color: "green", children: "\u25CF running" })
                        : _jsx(Text, { color: "gray", children: "\u25CB stopped" })] })] }));
}
//# sourceMappingURL=Overview.js.map