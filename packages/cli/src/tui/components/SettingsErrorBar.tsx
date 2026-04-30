import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
import type { CcmStore } from '../store.js';

export function SettingsErrorBar({ store, message }: { store: CcmStore; message: string }) {
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === 'r') void store.getState().refresh('settings');
      if (str === 'o') {
        const editor = process.env.EDITOR ?? 'vi';
        const path = join(homedir(), '.claude/settings.json');
        spawn(editor, [path], { stdio: 'inherit', detached: true });
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, store]);

  return (
    <Box paddingX={1} flexDirection="column">
      <Box>
        <Text color="red" bold>⚠ Settings unreadable: </Text>
        <Text>{message}</Text>
      </Box>
      <Text dimColor>r: reload   o: open in $EDITOR</Text>
    </Box>
  );
}
