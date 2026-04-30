import { Box, Text } from 'ink';
import { List } from '../components/List.js';
import type { CcmStore, StoreState } from '../store.js';
import { t } from '../i18n.js';

export function Profiles({ state, store }: { state: StoreState; store: CcmStore }) {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{t('profiles.title')}</Text>
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
              title: t('modals.switch_profile_title', { name: p.name }),
              body: t('modals.switch_profile_body', { name: p.name }),
              onConfirm: () => store.getState().switchProfile(p.name),
            });
          }}
        />
      </Box>
    </Box>
  );
}
