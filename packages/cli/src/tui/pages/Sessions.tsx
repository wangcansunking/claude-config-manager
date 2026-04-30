import { useLayoutEffect, useState } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../components/List.js';
import { copyToClipboard } from '../util/clipboard.js';
import type { CcmStore, StoreState } from '../store.js';

export function Sessions({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();

      if (str === 'y') {
        const s = state.sessions[cursor];
        if (!s) return;
        void (async () => {
          const result = await copyToClipboard(s.sessionId);
          store.getState().pushToast({
            kind: result.ok ? 'success' : 'error',
            text: result.ok ? `Resume id copied (${result.via})` : 'Copy failed; install pbcopy/xclip',
          });
        })();
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, state.sessions, cursor, store]);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Sessions ({state.sessions.length})</Text>
      <Box marginTop={1}>
        <List
          items={state.sessions}
          filterKey={(s) => `${s.projectDir || s.cwd} ${s.name ?? ''}`}
          renderItem={(s, sel, idx) => {
            if (sel) setCursor(idx);
            const project = s.projectDir || s.cwd || '(unknown)';
            const name = s.name ? ` (${s.name})` : '';
            const status = s.alive ? '●' : '○';
            return `${sel ? '▶' : ' '} ${status} ${project.padEnd(40)}${name}`;
          }}
          onSelect={() => {}}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>y:copy resume id  /:filter  ?:help</Text>
      </Box>
    </Box>
  );
}
