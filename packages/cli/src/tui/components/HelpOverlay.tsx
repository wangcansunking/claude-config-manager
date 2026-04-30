import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { KeyHint } from '../keymap.js';
import { GLOBAL_HINTS } from '../keymap.js';

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

  const all = [...GLOBAL_HINTS, ...(pageHints ?? [])];
  return (
    <Box
      borderStyle="round" borderColor="cyan"
      flexDirection="column" padding={1} marginX={4} marginY={2}
    >
      <Text bold>Keymap (Esc to close)</Text>
      {all.map((h, i) => (
        <Box key={i}>
          <Text color="cyan">{h.key.padEnd(10)}</Text>
          <Text>{h.label}</Text>
        </Box>
      ))}
    </Box>
  );
}
