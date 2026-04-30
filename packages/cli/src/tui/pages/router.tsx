import React from 'react';
import { Text } from 'ink';
import type { CcmStore, StoreState } from '../store.js';
import { Overview } from './Overview.js';

export function renderPage(state: StoreState, _store: CcmStore): React.ReactNode {
  switch (state.activePage) {
    case 'overview': return <Overview state={state} />;
    default:         return <Text dimColor>page: {state.activePage} (TODO)</Text>;
  }
}
