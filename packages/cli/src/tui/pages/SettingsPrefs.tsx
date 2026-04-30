import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { CcmStore, StoreState } from '../store.js';

const ROWS = ['language', 'theme', 'quit-confirm'] as const;
type Row = typeof ROWS[number];

export function SettingsPrefs({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();
  const env = (state.settings.env as Record<string, string> | undefined) ?? {};
  const lang = env.CLAUDE_CONFIG_LANG ?? 'en';

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();

      if (str === 'j' || str === '\x1b[B') {
        setCursor((c) => Math.min(c + 1, ROWS.length - 1));
      } else if (str === 'k' || str === '\x1b[A') {
        setCursor((c) => Math.max(c - 1, 0));
      } else if (str === '\r' || str === '\n') {
        const row = ROWS[cursor] as Row;
        if (row === 'language') {
          void store.getState().setLanguage(lang === 'en' ? 'zh' : 'en');
        }
        if (row === 'theme' || row === 'quit-confirm') {
          store.getState().pushToast({
            kind: 'info',
            text: `${row}: TUI inherits terminal palette; coming in v2`,
          });
        }
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, cursor, lang, store]);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>TUI preferences</Text>

      <Box marginTop={1}>
        <Text>{cursor === 0 ? '▶ ' : '  '}language    </Text>
        <Text>{lang}</Text>
        <Text dimColor>   (Enter to toggle en ↔ zh)</Text>
      </Box>

      <Box>
        <Text>{cursor === 1 ? '▶ ' : '  '}theme       </Text>
        <Text dimColor>auto (terminal palette)</Text>
      </Box>

      <Box>
        <Text>{cursor === 2 ? '▶ ' : '  '}quit-confirm</Text>
        <Text dimColor>off</Text>
      </Box>
    </Box>
  );
}
