import { Box, Text } from 'ink';
import type { Toast as ToastModel } from '../store.js';

export function Toast({ kind, text }: ToastModel) {
  const prefix = kind === 'error' ? '✗' : kind === 'success' ? '✓' : '·';
  const color  = kind === 'error' ? 'red' : kind === 'success' ? 'green' : 'cyan';
  return (
    <Box>
      <Text color={color}>{prefix} </Text>
      <Text>{text}</Text>
    </Box>
  );
}
