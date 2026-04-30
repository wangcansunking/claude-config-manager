import { useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../util/clipboard.js';
import { tildify } from '../util/path.js';
import type { CcmStore, StoreState } from '../store.js';
import { t } from '../i18n.js';

function relativeTime(startedAt: number): string {
  if (!startedAt) return '';
  const diffMs = Date.now() - startedAt;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d`;
}

function absoluteTime(startedAt: number): string {
  if (!startedAt) return '';
  const d = new Date(startedAt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function truncatePath(p: string, maxLen: number): string {
  if (p.length <= maxLen) return p;
  // try to keep the last segment
  const parts = p.split('/');
  if (parts.length > 3) {
    const last = parts[parts.length - 1];
    const truncated = `~/.../` + last;
    if (truncated.length <= maxLen) return truncated;
    return truncated.slice(0, maxLen - 1) + '…';
  }
  return p.slice(0, maxLen - 1) + '…';
}

export function Sessions({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const [filterMode, setFilterMode] = useState(false);
  const [query, setQuery] = useState('');
  const { stdin } = useStdin();

  const visible = useMemo(() => {
    if (!query) return state.sessions;
    const q = query.toLowerCase();
    return state.sessions.filter((s) =>
      `${s.projectDir || s.cwd} ${s.name ?? ''}`.toLowerCase().includes(q),
    );
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
    if (state.focused !== 'main') return;

    const handler = (data: Buffer | string) => {
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
      } else if (str === 'k' || str === '\x1b[A') {
        setCursor((c) => Math.max(c - 1, 0));
      } else if (str === 'y') {
        const s = visible[clampedCursor];
        if (!s) return;
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

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{t('sessions.title', { n: state.sessions.length })}</Text>
      {filterMode && (
        <Box>
          <Text color="cyan">/{query}</Text>
          <Text dimColor> {t('sessions.filter_hint')}</Text>
        </Box>
      )}
      <Box marginTop={1} flexDirection="row" flexGrow={1}>
        {/* Left pane: list — locked at 36 cols, shrinks last */}
        <Box flexDirection="column" width={36} flexShrink={0} marginRight={2}>
          {visible.length === 0 ? (
            <Text dimColor>{t('sessions.no_matches')}</Text>
          ) : (
            visible.map((s, idx) => {
              const sel = idx === clampedCursor;
              const displayName = s.name || s.sessionId.slice(0, 8);
              const status = s.alive ? '●' : '○';
              const prefix = sel ? '▶' : ' ';
              const project = tildify(s.projectDir || s.cwd || t('common.unknown'));
              const when = relativeTime(s.startedAt);
              // path budget: 36 - 4 (prefix+status+spaces) - 4 (" · Xh") = ~28
              const truncPath = truncatePath(project, 28);
              const timeStr = when ? ` · ${when}` : '';
              return (
                <Box key={s.sessionId} flexDirection="column" marginBottom={0}>
                  <Box>
                    <Text color={sel ? 'cyan' : undefined}>
                      {prefix}{' '}{status}{' '}
                    </Text>
                    <Text bold={sel}>{displayName}</Text>
                  </Box>
                  <Text dimColor>     {truncPath}{timeStr}</Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right pane: detail — absorbs remaining space */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" paddingX={1}>
          {!selectedSession ? (
            <Text dimColor>{t('sessions.no_selected')}</Text>
          ) : (
            <Box flexDirection="column">
              {/* Session header */}
              <Box flexDirection="column" marginBottom={1}>
                <Box>
                  <Text dimColor>Name:       </Text>
                  <Text bold>{selectedSession.name || selectedSession.sessionId.slice(0, 8)}</Text>
                </Box>
                <Box>
                  <Text dimColor>Project:    </Text>
                  <Text>{tildify(selectedSession.projectDir || selectedSession.cwd || t('common.unknown'))}</Text>
                </Box>
                <Box>
                  <Text dimColor>Session ID: </Text>
                  <Text>{selectedSession.sessionId}</Text>
                </Box>
                <Box>
                  <Text dimColor>Started:    </Text>
                  <Text>{relativeTime(selectedSession.startedAt)} ago ({absoluteTime(selectedSession.startedAt)})</Text>
                </Box>
                <Box>
                  <Text dimColor>Status:     </Text>
                  {selectedSession.alive
                    ? <Text color="green">{t('sessions.status_live')}</Text>
                    : <Text dimColor>{t('sessions.status_ended')}</Text>}
                  {selectedSession.alive && (selectedSession as any).pid
                    ? <Text dimColor> (pid {(selectedSession as any).pid})</Text>
                    : null}
                </Box>
              </Box>

              {/* Recent user inputs */}
              <Text bold underline>{t('sessions.recent_inputs')}</Text>
              <Text dimColor>─────────────</Text>
              {!historyFile ? (
                <Text dimColor>{t('sessions.no_history_file')}</Text>
              ) : !historyLoaded ? (
                <Text dimColor>{t('common.loading_lower')}</Text>
              ) : !userInputs || userInputs.length === 0 ? (
                <Text dimColor>{t('sessions.no_input_history')}</Text>
              ) : (
                <Box flexDirection="column" marginTop={1}>
                  {userInputs.map((entry, i) => (
                    <Box key={i}>
                      <Text dimColor>{i + 1}. </Text>
                      <Text wrap="wrap">{entry.text}</Text>
                    </Box>
                  ))}
                </Box>
              )}

              <Box marginTop={1}>
                <Text dimColor>{t('sessions.hint')}</Text>
              </Box>
            </Box>
          )}
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{t('sessions.hint')}</Text>
      </Box>
    </Box>
  );
}
