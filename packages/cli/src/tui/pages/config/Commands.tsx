import { Box, Text } from 'ink';
import { List } from '../../components/List.js';
import type { CcmStore, StoreState } from '../../store.js';

export function Commands({ state, store: _store }: { state: StoreState; store: CcmStore }) {
  return (
    <Box flexDirection="column">
      <Text>Commands ({state.commands.length}) — read-only in v1</Text>
      <List
        items={state.commands}
        filterKey={(c) => c.name}
        renderItem={(c, sel) => `${sel ? '▶' : ' '} /${c.name.padEnd(30)} ${c.source}`}
        onSelect={() => {}}
      />
    </Box>
  );
}
