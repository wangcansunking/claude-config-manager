import React from 'react';
import { Text } from 'ink';
import type { CcmStore, StoreState } from '../store.js';

export function renderPage(state: StoreState, _store: CcmStore): React.ReactNode {
  return <Text dimColor>page: {state.activePage} (TODO)</Text>;
}
