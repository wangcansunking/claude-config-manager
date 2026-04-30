import { useState, useLayoutEffect, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../../util/clipboard.js';
import type { CcmStore, StoreState } from '../../store.js';

const MODEL_CHOICES = [
  'opus', 'opus[1m]', 'sonnet', 'sonnet[1m]', 'haiku',
];

type SettingsRow =
  | { kind: 'model';  label: string; value: string }
  | { kind: 'env';    label: string; value: string }
  | { kind: 'hook';   label: string };

export function Settings({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();
  const settings = state.settings;
  const env   = (settings.env  as Record<string, unknown> | undefined) ?? {};
  const hooks = (settings.hooks as Record<string, unknown> | undefined) ?? {};

  const rows: SettingsRow[] = useMemo(() => [
    { kind: 'model', label: 'model', value: String((settings.model as string | undefined) ?? '(unset)') },
    ...Object.entries(env).map(([k, v]) => ({ kind: 'env' as const, label: k, value: String(v) })),
    ...Object.keys(hooks).map((k) => ({ kind: 'hook' as const, label: k })),
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], [settings.model, env, hooks]);

  const LABEL_W = Math.max(14, ...rows.map((r) => r.label.length)) + 2;

  // Precompute which rows need a section header
  const showHeader: boolean[] = useMemo(() => rows.map((row, idx) => {
    if (row.kind === 'model') return false; // model row has no separate header
    if (idx === 0) return true;
    return rows[idx - 1].kind !== row.kind;
  }), [rows]);

  useLayoutEffect(() => {
    if (!stdin) return;

    const handler = (data: Buffer | string) => {
      if (state.focused !== 'main') return;
      const str = typeof data === 'string' ? data : data.toString();

      if (str === 'j' || str === '\x1b[B') {
        setCursor((c) => Math.min(c + 1, rows.length - 1));
        return;
      }
      if (str === 'k' || str === '\x1b[A') {
        setCursor((c) => Math.max(c - 1, 0));
        return;
      }
      if (str === '\r' || str === '\n') {
        const row = rows[cursor];
        if (!row) return;
        if (row.kind === 'model') {
          const cur = (settings.model as string | undefined) ?? MODEL_CHOICES[0];
          const idx = MODEL_CHOICES.indexOf(cur);
          const next = MODEL_CHOICES[(idx + 1) % MODEL_CHOICES.length];
          void store.getState().setModel(next);
        } else if (row.kind === 'env') {
          void (async () => {
            const text = `${row.label}=${row.value}`;
            const result = await copyToClipboard(text);
            store.getState().pushToast({
              kind: result.ok ? 'success' : 'error',
              text: result.ok ? `Copied: ${text}` : 'Copy failed; install pbcopy/xclip',
            });
          })();
        } else if (row.kind === 'hook') {
          void (async () => {
            const result = await copyToClipboard(row.label);
            store.getState().pushToast({
              kind: result.ok ? 'success' : 'error',
              text: result.ok ? `Copied: ${row.label}` : 'Copy failed; install pbcopy/xclip',
            });
          })();
        }
      }
    };

    stdin.on('data', handler);
    return () => { stdin.off('data', handler); };
  }, [stdin, cursor, rows, settings.model, state.focused, store]);

  const envEmpty  = Object.keys(env).length === 0;
  const hookEmpty = Object.keys(hooks).length === 0;

  return (
    <Box flexDirection="column" padding={1}>
      {rows.map((row, idx) => {
        const isSelected = cursor === idx;
        const needsHeader = showHeader[idx];
        const needsTopMargin = needsHeader && idx > 0;

        return (
          <Box key={`${row.kind}-${row.label}`} flexDirection="column">
            {needsHeader && (
              <Box marginTop={needsTopMargin ? 1 : 0}>
                <Text bold>{row.kind}</Text>
              </Box>
            )}
            <Box>
              <Text>{isSelected ? '▶ ' : '  '}</Text>
              <Text>{row.label.padEnd(LABEL_W)}</Text>
              {row.kind !== 'hook' && <Text>{(row as { value: string }).value}</Text>}
              {row.kind === 'model' && <Text dimColor>   (Enter to cycle)</Text>}
              {row.kind === 'env'   && <Text dimColor>   (Enter to copy KEY=value)</Text>}
            </Box>
          </Box>
        );
      })}
      {envEmpty && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>env</Text>
          <Text dimColor>  (none)</Text>
        </Box>
      )}
      {hookEmpty && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>hooks</Text>
          <Text dimColor>  (none)</Text>
        </Box>
      )}
    </Box>
  );
}
