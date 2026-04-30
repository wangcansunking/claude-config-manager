import { useLayoutEffect, useEffect, useState, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../util/clipboard.js';
import { tildify } from '../util/path.js';
import type { CcmStore, StoreState } from '../store.js';

function relativeTime(startedAt: number): string {
  if (!startedAt) return '';
  const diffMs = Date.now() - startedAt;
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
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

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Sessions ({state.sessions.length})</Text>
      {filterMode && (
        <Box>
          <Text color="cyan">/{query}</Text>
          <Text dimColor> (Enter to confirm, Esc to clear)</Text>
        </Box>
      )}
      <Box marginTop={1} flexDirection="row">
        {/* Left pane: list */}
        <Box flexDirection="column" minWidth={36} marginRight={2}>
          {visible.length === 0 ? (
            <Text dimColor>(no matches)</Text>
          ) : (
            visible.map((s, idx) => {
              const sel = idx === clampedCursor;
              const displayName = s.name || s.sessionId.slice(0, 8);
              const status = s.alive ? '●' : '○';
              const prefix = sel ? '▶' : ' ';
              const project = s.projectDir || s.cwd || '(unknown)';
              const when = relativeTime(s.startedAt);
              return (
                <Box key={s.sessionId} flexDirection="column" marginBottom={0}>
                  <Box>
                    <Text color={sel ? 'cyan' : undefined}>
                      {prefix}{' '}{status}{' '}
                    </Text>
                    <Text bold={sel}>{displayName}</Text>
                  </Box>
                  <Text dimColor>     {tildify(project)}  {when}</Text>
                </Box>
              );
            })
          )}
        </Box>

        {/* Right pane: detail */}
        <Box flexDirection="column" flexGrow={1} borderStyle="single" paddingX={1}>
          {!selectedSession ? (
            <Text dimColor>(no session selected)</Text>
          ) : (
            <Box flexDirection="column">
              {/* Session header */}
              <Box flexDirection="column" marginBottom={1}>
                <Text bold>{selectedSession.name || selectedSession.sessionId.slice(0, 8)}</Text>
                <Text dimColor>{tildify(selectedSession.projectDir || selectedSession.cwd || '(unknown)')}</Text>
                <Box>
                  <Text dimColor>id: </Text>
                  <Text>{selectedSession.sessionId.slice(0, 8)}</Text>
                  <Text>  </Text>
                  {selectedSession.alive
                    ? <Text color="green">● live</Text>
                    : <Text dimColor>○ ended</Text>}
                </Box>
              </Box>

              {/* Recent user inputs */}
              <Text bold underline>Recent inputs</Text>
              {!historyFile ? (
                <Text dimColor>(no history file)</Text>
              ) : !historyLoaded ? (
                <Text dimColor>loading…</Text>
              ) : !userInputs || userInputs.length === 0 ? (
                <Text dimColor>(no input history found)</Text>
              ) : (
                <Box flexDirection="column" marginTop={1}>
                  {userInputs.map((entry, i) => (
                    <Box key={i} marginBottom={1}>
                      <Text dimColor>· </Text>
                      <Text wrap="wrap">{entry.text}</Text>
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>y:copy resume id  /:filter  ?:help</Text>
      </Box>
    </Box>
  );
}
