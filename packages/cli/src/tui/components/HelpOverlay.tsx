import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { KeyHint } from '../keymap.js';
import { GLOBAL_HINT_DEFS } from '../keymap.js';
import { t } from '../i18n.js';

export function HelpOverlay({
  pageHints, onClose,
}: { pageHints?: KeyHint[]; onClose: () => void }) {
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === '\x1b') onClose();
    };
    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, onClose]);

  return (
    <Box
      borderStyle="round" borderColor="cyan"
      flexDirection="column" padding={1} marginX={4} marginY={2}
    >
      <Text bold>{t('help.title')}</Text>
      {GLOBAL_HINT_DEFS.map((h, i) => (
        <Box key={i}>
          <Text color="cyan">{h.key.padEnd(10)}</Text>
          <Text>{t(h.labelKey)}</Text>
        </Box>
      ))}
      {(pageHints ?? []).map((h, i) => (
        <Box key={`page-${i}`}>
          <Text color="cyan">{h.key.padEnd(10)}</Text>
          <Text>{h.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
