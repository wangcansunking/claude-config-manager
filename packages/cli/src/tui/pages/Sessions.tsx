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

/** Visual display width: CJK / full-width chars count as 2 columns. */
function displayWidth(s: string): number {
  let w = 0;
  for (const ch of s) {
    const cp = ch.codePointAt(0) ?? 0;
    // CJK Unified Ideographs and common full-width ranges
    const wide =
      (cp >= 0x1100 && cp <= 0x115f) ||   // Hangul Jamo
      (cp >= 0x2e80 && cp <= 0x303e) ||   // CJK Radicals / punctuation
      (cp >= 0x3041 && cp <= 0x33ff) ||   // Japanese kana / CJK compat
      (cp >= 0x3400 && cp <= 0x9fff) ||   // CJK Unified Ideographs
      (cp >= 0xac00 && cp <= 0xd7af) ||   // Hangul Syllables
      (cp >= 0xf900 && cp <= 0xfaff) ||   // CJK Compatibility Ideographs
      (cp >= 0xfe30 && cp <= 0xfe4f) ||   // CJK Compatibility Forms
      (cp >= 0xff01 && cp <= 0xff60) ||   // Fullwidth / Halfwidth forms
      (cp >= 0xffe0 && cp <= 0xffe6);     // Currency symbols
    w += wide ? 2 : 1;
  }
  return w;
}

/** Pad a label string to targetWidth display columns using trailing spaces. */
function padLabel(label: string, targetWidth: number): string {
  const current = displayWidth(label);
  return current >= targetWidth ? label : label + ' '.repeat(targetWidth - current);
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

  // Compute a consistent label column width across all detail-pane labels
  // so values are all left-aligned at the same column. Add 2 for ": " separator.
  const labelNames = [
    t('sessions.detail.name'),
    t('sessions.detail.project'),
    t('sessions.detail.session_id'),
    t('sessions.detail.started'),
    t('sessions.detail.status'),
  ];
  const LABEL_W = Math.max(...labelNames.map(displayWidth)) + 2; // +2 for ": "

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
              const truncId = s.sessionId.slice(0, 8);
              const status = s.alive ? '●' : '○';
              const project = tildify(s.projectDir || s.cwd || t('common.unknown'));
              const when = relativeTime(s.startedAt);
              // path budget: 36 col box − 5 (indent spaces) − 6 (max " · 99d") = 25
              const truncPath = truncatePath(project, 25);
              const timeStr = when ? ` · ${when}` : '';
              return (
                <Box key={s.sessionId} flexDirection="column">
                  <Box>
                    <Text bold color={sel ? 'cyan' : undefined}>{sel ? '▶' : ' '} </Text>
                    <Text color={s.alive ? 'green' : undefined}>{status}</Text>
                    <Text>{' '}</Text>
                    <Text bold={sel}>{displayName}</Text>
                  </Box>
                  <Box>
                    <Text dimColor>{'  '}{truncId}  {truncPath}{timeStr}</Text>
                  </Box>
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
              {/* Session header — label column uses padLabel() for consistent alignment */}
              <Box flexDirection="column" marginBottom={1}>
                <Box>
                  <Text dimColor>{padLabel(`${t('sessions.detail.name')}:`, LABEL_W)}</Text>
                  <Text bold>{selectedSession.name || selectedSession.sessionId.slice(0, 8)}</Text>
                </Box>
                <Box>
                  <Text dimColor>{padLabel(`${t('sessions.detail.project')}:`, LABEL_W)}</Text>
                  <Text>{tildify(selectedSession.projectDir || selectedSession.cwd || t('common.unknown'))}</Text>
                </Box>
                <Box>
                  <Text dimColor>{padLabel(`${t('sessions.detail.session_id')}:`, LABEL_W)}</Text>
                  <Text>{selectedSession.sessionId}</Text>
                </Box>
                <Box>
                  <Text dimColor>{padLabel(`${t('sessions.detail.started')}:`, LABEL_W)}</Text>
                  <Text>{relativeTime(selectedSession.startedAt)} ago ({absoluteTime(selectedSession.startedAt)})</Text>
                </Box>
                <Box>
                  <Text dimColor>{padLabel(`${t('sessions.detail.status')}:`, LABEL_W)}</Text>
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
