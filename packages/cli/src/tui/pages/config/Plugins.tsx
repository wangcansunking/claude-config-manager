import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
import type { CcmStore, StoreState } from '../../store.js';

export function Plugins({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === ' ') {
        const p = state.plugins[cursor];
        if (p) void store.getState().togglePlugin(p.name);
      }
    };
    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, cursor, state.plugins, store]);

  return (
    <Box flexDirection="column">
      <Text>Plugins ({state.plugins.length} installed)</Text>
      <List
        items={state.plugins}
        filterKey={(p) => p.name}
        renderItem={(p, sel, idx) => {
          if (sel) setTimeout(() => setCursor(idx), 0);  // sync cursor
          const mark = p.enabled ? '[✓]' : '[ ]';
          const pending = state.pendingActions.has(`plugin:${p.name}`) ? ' …' : '';
          return `${sel ? '▶' : ' '} ${mark} ${p.name.padEnd(40)} ${p.version ?? ''}${pending}`;
        }}
        onSelect={(p) => store.getState().togglePlugin(p.name)}
      />
      <Box marginTop={1}>
        <Text dimColor>space:toggle  enter:toggle  /:filter  ?:help</Text>
      </Box>
    </Box>
  );
}
