import { Box, Text } from 'ink';
import { GLOBAL_HINT_DEFS } from '../keymap.js';
import { t } from '../i18n.js';

export function Footer() {
  const hints = GLOBAL_HINT_DEFS;
  return (
    <Box paddingX={1}>
      {hints.map((h, i) => (
        <Text key={i} dimColor>
          {h.key}<Text bold>:</Text>{t(h.labelKey)}{i < hints.length - 1 ? '   ' : ''}
        </Text>
      ))}
    </Box>
  );
}
