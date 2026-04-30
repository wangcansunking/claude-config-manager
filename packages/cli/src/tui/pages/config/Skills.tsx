import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
import type { CcmStore, StoreState } from '../../store.js';

export function Skills({ state, store }: { state: StoreState; store: CcmStore }) {
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      if (state.focused !== 'main') return;
      const str = typeof data === 'string' ? data : data.toString();
      if (str === ' ') {
        const s = state.skills[cursor];
        if (s) void store.getState().toggleSkill(s.name);
      }
    };
    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, cursor, state.skills, state.focused, store]);

  return (
    <Box flexDirection="column">
      <Text>Skills ({state.skills.length})</Text>
      <List
        items={state.skills}
        filterKey={(s) => s.name}
        cursor={cursor}
        onCursorChange={(idx) => setCursor(idx)}
        renderItem={(s, sel) => {
          const mark = s.enabled ? '[✓]' : '[ ]';
          const pending = state.pendingActions.has(`skill:${s.name}`) ? ' …' : '';
          return `${sel ? '▶' : ' '} ${mark} ${s.name.padEnd(30)} ${s.source}${pending}`;
        }}
        onSelect={(s) => store.getState().toggleSkill(s.name)}
      />
      <Box marginTop={1}>
        <Text dimColor>space:toggle  enter:toggle  /:filter</Text>
      </Box>
    </Box>
  );
}
