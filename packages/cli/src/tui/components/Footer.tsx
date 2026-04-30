import { Box, Text } from 'ink';
import type { KeyHint } from '../keymap.js';
import { GLOBAL_HINTS } from '../keymap.js';

export function Footer({ pageHints }: { pageHints?: KeyHint[] }) {
  const hints = pageHints && pageHints.length > 0 ? pageHints : GLOBAL_HINTS;
  return (
    <Box paddingX={1}>
      {hints.map((h, i) => (
        <Text key={i} dimColor>
          {h.key}<Text bold>:</Text>{h.label}{i < hints.length - 1 ? '   ' : ''}
        </Text>
      ))}
    </Box>
  );
}
