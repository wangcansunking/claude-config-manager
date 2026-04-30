import { Box, Text } from 'ink';
import { List } from '../components/List.js';
import type { CcmStore, StoreState } from '../store.js';

export function Profiles({ state, store }: { state: StoreState; store: CcmStore }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Profiles</Text>
      <Box marginTop={1}>
        <List
          items={state.profiles}
          filterKey={(p) => p.name}
          renderItem={(p, sel) => {
            const active  = p.name === state.activeProfile ? ' [active]' : '';
            const pending = state.pendingActions.has(`profile:switch:${p.name}`) ? ' …' : '';
            return `${sel ? '▶' : ' '} ${p.name}${active}${pending}`;
          }}
          onSelect={(p) => {
            if (p.name === state.activeProfile) return;
            store.getState().openModal({
              title: `Switch to ${p.name}?`,
              body: `Active profile becomes "${p.name}". This rewrites ~/.claude/settings.json.`,
              onConfirm: () => store.getState().switchProfile(p.name),
            });
          }}
        />
      </Box>
    </Box>
  );
}
