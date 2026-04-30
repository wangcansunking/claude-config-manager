import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
import type { CcmStore, StoreState } from '../../store.js';

export function McpServers({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();
      if (str === ' ') {
        const m = state.mcpServers[cursor];
        if (m) void store.getState().toggleMcp(m.name);
      }
    };
    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, cursor, state.mcpServers, store]);

  return (
    <Box flexDirection="column">
      <Text>MCP servers ({state.mcpServers.length})</Text>
      <List
        items={state.mcpServers}
        filterKey={(m) => m.name}
        renderItem={(m, sel, idx) => {
          if (sel) setTimeout(() => setCursor(idx), 0);
          const mark = m.enabled ? '[✓]' : '[ ]';
          const pending = state.pendingActions.has(`mcp:${m.name}`) ? ' …' : '';
          return `${sel ? '▶' : ' '} ${mark} ${m.name.padEnd(30)} ${m.config.command ?? ''}${pending}`;
        }}
        onSelect={(m) => store.getState().toggleMcp(m.name)}
      />
      <Box marginTop={1}>
        <Text dimColor>space:toggle  enter:toggle  /:filter</Text>
      </Box>
    </Box>
  );
}
