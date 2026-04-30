import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { CcmStore, StoreState } from '../../store.js';

const MODEL_CHOICES = [
  'opus', 'opus[1m]', 'sonnet', 'sonnet[1m]', 'haiku',
];

export function Settings({ state, store }: { state: StoreState; store: CcmStore }) {
  const settings = state.settings;
  const env      = settings.env  ?? {};
  const hooks    = settings.hooks ?? {};

  const { stdin } = useStdin();

  useLayoutEffect(() => {
    if (!stdin) return;

    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === '\r') {
        const cur = (settings.model as string | undefined) ?? MODEL_CHOICES[0];
        const idx = MODEL_CHOICES.indexOf(cur);
        const next = MODEL_CHOICES[(idx + 1) % MODEL_CHOICES.length];
        void store.getState().setModel(next);
      }
    };

    stdin.on('data', handler);
    return () => { stdin.off('data', handler); };
  }, [stdin, settings.model, store]);

  return (
    <Box flexDirection="column">
      <Box>
        <Text bold color="cyan">▶ </Text>
        <Text>model       </Text>
        <Text>{String((settings.model as string | undefined) ?? '(unset)')}</Text>
        <Text dimColor>   (Enter to cycle)</Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>env</Text>
        {Object.keys(env).length === 0 && <Text dimColor>  (none)</Text>}
        {Object.entries(env).map(([k, v]) => (
          <Box key={k}>
            <Text>  {k.padEnd(28)}</Text>
            <Text>{String(v)}</Text>
          </Box>
        ))}
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Text bold>hooks</Text>
        {Object.keys(hooks).length === 0 && <Text dimColor>  (none)</Text>}
        {Object.keys(hooks).map((k) => (
          <Text key={k}>  {k}</Text>
        ))}
      </Box>
    </Box>
  );
}
