import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../util/clipboard.js';
function relativeTime(startedAt) {
    if (!startedAt)
        return '';
    const diffMs = Date.now() - startedAt;
    const diffSec = Math.floor(diffMs / 1000);
    if (diffSec < 60)
        return 'just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60)
        return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24)
        return `${diffHr}h ago`;
    const diffDay = Math.floor(diffHr / 24);
    return `${diffDay}d ago`;
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
                        text: result.ok ? `Resume id copied (${result.via})` : 'Copy failed; install pbcopy/xclip',
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
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [_jsxs(Text, { bold: true, children: ["Sessions (", state.sessions.length, ")"] }), filterMode && (_jsxs(Box, { children: [_jsxs(Text, { color: "cyan", children: ["/", query] }), _jsx(Text, { dimColor: true, children: " (Enter to confirm, Esc to clear)" })] })), _jsxs(Box, { marginTop: 1, flexDirection: "row", children: [_jsx(Box, { flexDirection: "column", minWidth: 36, marginRight: 2, children: visible.length === 0 ? (_jsx(Text, { dimColor: true, children: "(no matches)" })) : (visible.map((s, idx) => {
                            const sel = idx === clampedCursor;
                            const displayName = s.name || s.sessionId.slice(0, 8);
                            const status = s.alive ? '●' : '○';
                            const prefix = sel ? '▶' : ' ';
                            const project = s.projectDir || s.cwd || '(unknown)';
                            const when = relativeTime(s.startedAt);
                            return (_jsxs(Box, { flexDirection: "column", marginBottom: 0, children: [_jsxs(Box, { children: [_jsxs(Text, { color: sel ? 'cyan' : undefined, children: [prefix, ' ', status, ' '] }), _jsx(Text, { bold: sel, children: displayName })] }), _jsxs(Text, { dimColor: true, children: ["     ", project, "  ", when] })] }, s.sessionId));
                        })) }), _jsx(Box, { flexDirection: "column", flexGrow: 1, borderStyle: "single", paddingX: 1, children: !selectedSession ? (_jsx(Text, { dimColor: true, children: "(no session selected)" })) : (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Box, { flexDirection: "column", marginBottom: 1, children: [_jsx(Text, { bold: true, children: selectedSession.name || selectedSession.sessionId.slice(0, 8) }), _jsx(Text, { dimColor: true, children: selectedSession.projectDir || selectedSession.cwd || '(unknown)' }), _jsxs(Box, { children: [_jsx(Text, { dimColor: true, children: "id: " }), _jsx(Text, { children: selectedSession.sessionId.slice(0, 8) }), _jsx(Text, { children: "  " }), selectedSession.alive
                                                    ? _jsx(Text, { color: "green", children: "\u25CF live" })
                                                    : _jsx(Text, { dimColor: true, children: "\u25CB ended" })] })] }), _jsx(Text, { bold: true, underline: true, children: "Recent inputs" }), !historyFile ? (_jsx(Text, { dimColor: true, children: "(no history file)" })) : !historyLoaded ? (_jsx(Text, { dimColor: true, children: "loading\u2026" })) : !userInputs || userInputs.length === 0 ? (_jsx(Text, { dimColor: true, children: "(no input history found)" })) : (_jsx(Box, { flexDirection: "column", marginTop: 1, children: userInputs.map((entry, i) => (_jsxs(Box, { marginBottom: 1, children: [_jsx(Text, { dimColor: true, children: "\u00B7 " }), _jsx(Text, { wrap: "wrap", children: entry.text })] }, i))) }))] })) })] }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "y:copy resume id  /:filter  ?:help" }) })] }));
}
//# sourceMappingURL=Sessions.js.map