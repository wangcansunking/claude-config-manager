import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';

export interface ConfirmModalProps {
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm(): Promise<void> | void;
  onCancel(): void;
}

export function ConfirmModal({
  title, body,
  confirmLabel = 'Confirm',
  cancelLabel  = 'Cancel',
  onConfirm, onCancel,
}: ConfirmModalProps) {
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === '\r' || str === '\n') void onConfirm();
      else if (str === '\x1b') onCancel();
    };
    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, onConfirm, onCancel]);

  return (
    <Box
      borderStyle="round" borderColor="yellow"
      flexDirection="column" padding={1} marginX={4} marginY={2}
    >
      <Text bold>{title}</Text>
      <Box marginTop={1}><Text>{body}</Text></Box>
      <Box marginTop={1}>
        <Text dimColor>Enter: {confirmLabel}    Esc: {cancelLabel}</Text>
      </Box>
    </Box>
  );
}
