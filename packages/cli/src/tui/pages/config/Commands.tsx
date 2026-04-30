import { Box, Text } from 'ink';
import { List } from '../../components/List.js';
import type { CcmStore, StoreState } from '../../store.js';
import { t } from '../../i18n.js';

export function Commands({ state, store: _store }: { state: StoreState; store: CcmStore }) {
  return (
    <Box flexDirection="column">
      <Text>{t('config.commands.title', { n: state.commands.length })}</Text>
      <List
        items={state.commands}
        filterKey={(c) => c.name}
        renderItem={(c, sel) => `${sel ? '▶' : ' '} /${c.name.padEnd(30)} ${c.source}`}
        onSelect={() => {}}
      />
    </Box>
  );
}
