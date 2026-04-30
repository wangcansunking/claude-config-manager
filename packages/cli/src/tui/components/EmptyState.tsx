import { Box, Text } from 'ink';

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      <Text dimColor>{title}</Text>
      {hint ? <Text dimColor>{hint}</Text> : null}
    </Box>
  );
}
