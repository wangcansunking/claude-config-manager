import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../util/clipboard.js';
import { tildify } from '../util/path.js';
import { t } from '../i18n.js';
function relativeTime(startedAt) {
    if (!startedAt)
        return '';
    const diffMs = Date.now() - startedAt;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60)
        return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60)
        return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)
        return `${diffHr}h`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d`;
}
function absoluteTime(startedAt) {
    if (!startedAt)
        return '';
    const d = new Date(startedAt);
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function truncatePath(p, maxLen) {
    if (p.length <= maxLen)
        return p;
    // try to keep the last segment
    const parts = p.split('/');
    if (parts.length > 3) {
        const last = parts[parts.length - 1];
        const truncated = `~/.../` + last;
        if (truncated.length <= maxLen)
            return truncated;
        return truncated.slice(0, maxLen - 1) + '…';
    }
    return p.slice(0, maxLen - 1) + '…';
}
export function Sessions({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const [filterMode, setFilterMode] = useState(false);
    const [query, setQuery] = useState('');
    const { stdin } = useStdin();
    const visible = useMemo(() => {
        if (!query)
            return state.sessions;
        const q = query.toLowerCase();
        return state.sessions.filter((s) => `${s.projectDir || s.cwd} ${s.name ?? ''}`.toLowerCase().includes(q));
    }, [state.sessions, query]);
    const clampedCursor = Math.min(cursor, Math.max(visible.length - 1, 0));
    const selectedSession = visible[clampedCursor] ?? null;
    // Load history whenever selected session changes
    useEffect(() => {
        if (selectedSession?.historyFile) {
            void store.getState().loadSessionHistory(selectedSession.historyFile);
        }
    }, [selectedSession?.historyFile, store]);
    useLayoutEffect(() => {
        if (state.focused !== 'main')
            return;
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (filterMode) {
                if (str === '\r' || str === '\n' || str === '\x1b') {
                    setFilterMode(false);
                    return;
                }
                if (str === '\x7f' || str === '\x08') {
                    setQuery((q) => q.slice(0, -1));
                    return;
                }
                if (str.length >= 1) {
                    setQuery((q) => q + str);
                }
                return;
            }
            if (str === '/') {
                setFilterMode(true);
                setQuery('');
                return;
            }
            if (str === 'j' || str === '\x1b[B') {
                setCursor((c) => Math.min(c + 1, visible.length - 1));
            }
            else if (str === 'k' || str === '\x1b[A') {
                setCursor((c) => Math.max(c - 1, 0));
            }
            else if (str === 'y') {
                const s = visible[clampedCursor];
                if (!s)
                    return;
                void (async () => {
                    const result = await copyToClipboard(s.sessionId);
                    store.getState().pushToast({
                        kind: result.ok ? 'success' : 'error',
                        text: result.ok
                            ? t('sessions.copy_ok', { via: result.via })
                            : t('sessions.copy_fail'),
                    });
                })();
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, state.focused, filterMode, visible, clampedCursor, store]);
    // Detail pane content
    const historyFile = selectedSession?.historyFile;
    const historyLoaded = historyFile ? state.sessionHistories.has(historyFile) : false;
    const historyEntries = historyFile ? (state.sessionHistories.get(historyFile) ?? null) : null;
    const userInputs = historyEntries
        ? historyEntries.filter((e) => e.role === 'user').slice(-10)
        : null;
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsx(Text, { bold: true, children: t('sessions.title', { n: state.sessions.length }) }), filterMode && (_jsxs(Box, { children: [_jsxs(Text, { color: "cyan", children: ["/", query] }), _jsxs(Text, { dimColor: true, children: [" ", t('sessions.filter_hint')] })] })), _jsxs(Box, { marginTop: 1, flexDirection: "row", flexGrow: 1, children: [_jsx(Box, { flexDirection: "column", width: 36, flexShrink: 0, marginRight: 2, children: visible.length === 0 ? (_jsx(Text, { dimColor: true, children: t('sessions.no_matches') })) : (visible.map((s, idx) => {
                            const sel = idx === clampedCursor;
                            const displayName = s.name || s.sessionId.slice(0, 8);
                            const status = s.alive ? '●' : '○';
                            const prefix = sel ? '▶' : ' ';
                            const project = tildify(s.projectDir || s.cwd || t('common.unknown'));
                            const when = relativeTime(s.startedAt);
                            // path budget: 36 - 4 (prefix+status+spaces) - 4 (" · Xh") = ~28
                            const truncPath = truncatePath(project, 28);
                            const timeStr = when ? ` · ${when}` : '';
                            return (_jsxs(Box, { flexDirection: "column", marginBottom: 0, children: [_jsxs(Box, { children: [_jsxs(Text, { color: sel ? 'cyan' : undefined, children: [prefix, ' ', status, ' '] }), _jsx(Text, { bold: sel, children: displayName })] }), _jsxs(Text, { dimColor: true, children: ["     ", truncPath, timeStr] })] }, s.sessionId));
                        })) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "single", paddingX: 1, children: !selectedSession ? (_jsx(Text, { dimColor: true, children: t('sessions.no_selected') })) : (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Name:       " }), _jsx(Text, { bold: true, children: selectedSession.name || selectedSession.sessionId.slice(0, 8) })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Project:    " }), _jsx(Text, { children: tildify(selectedSession.projectDir || selectedSession.cwd || t('common.unknown')) })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Session ID: " }), _jsx(Text, { children: selectedSession.sessionId })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Started:    " }), _jsxs(Text, { children: [relativeTime(selectedSession.startedAt), " ago (", absoluteTime(selectedSession.startedAt), ")"] })] }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "Status:     " }), selectedSession.alive
                                                    ? _jsx(Text, { color: "green", children: t('sessions.status_live') })
                                                    : _jsx(Text, { dimColor: true, children: t('sessions.status_ended') }), selectedSession.alive && selectedSession.pid
                                                    ? _jsxs(Text, { dimColor: true, children: [" (pid ", selectedSession.pid, ")"] })
                                                    : null] })] }), _jsx(Text, { bold: true, underline: true, children: t('sessions.recent_inputs') }), _jsx(Text, { dimColor: true, children: "\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500" }), !historyFile ? (_jsx(Text, { dimColor: true, children: t('sessions.no_history_file') })) : !historyLoaded ? (_jsx(Text, { dimColor: true, children: t('common.loading_lower') })) : !userInputs || userInputs.length === 0 ? (_jsx(Text, { dimColor: true, children: t('sessions.no_input_history') })) : (_jsx(Box, { flexDirection: "column", marginTop: 1, children: userInputs.map((entry, i) => (_jsxs(Box, { children: [_jsxs(Text, { dimColor: true, children: [i + 1, ". "] }), _jsx(Text, { wrap: "wrap", children: entry.text })] }, i))) })), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('sessions.hint') }) })] })) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: t('sessions.hint') }) })] }));
}
//# sourceMappingURL=Sessions.js.map