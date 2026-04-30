import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { tildify } from '../util/path.js';
import { t } from '../i18n.js';
export function Overview({ state }) {
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { bold: true, children: [t('overview.active_profile'), " "] }), _jsx(Text, { children: state.activeProfile ?? t('common.none') }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { children: t('overview.plugins_count', { n: state.plugins.length }) }), _jsx(Text, { children: t('overview.mcps_count', { n: state.mcpServers.length }) }), _jsx(Text, { children: t('overview.skills_count', { n: state.skills.length }) }), _jsx(Text, { children: t('overview.commands_count', { n: state.commands.length }) })] }), _jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: t('overview.recent_sessions') }), state.sessions.slice(0, 3).map((s, i) => (_jsxs(Text, { dimColor: true, children: ["\u00B7 ", tildify(s.projectDir ?? s.name ?? '—')] }, i))), state.sessions.length === 0 && _jsx(Text, { dimColor: true, children: t('common.none') })] }), _jsxs(Box, { marginTop: 1, children: [_jsxs(Text, { children: [t('overview.dashboard'), " "] }), state.dashboardStatus.running
                        ? _jsx(Text, { color: "green", children: t('overview.running') })
                        : _jsx(Text, { color: "gray", children: t('overview.stopped') })] })] }));
}
//# sourceMappingURL=Overview.js.map