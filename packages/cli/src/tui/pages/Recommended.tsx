import { useEffect, useLayoutEffect, useState } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../components/List.js';
import { EmptyState } from '../components/EmptyState.js';
import { copyToClipboard } from '../util/clipboard.js';
import type { CcmStore, StoreState } from '../store.js';
import { t } from '../i18n.js';

interface Reco {
  name: string;
  type: 'mcp' | 'plugin' | 'skill';
  description: string;
  installCommand: string;
  popularity: 'Top' | 'Trending';
}

export function Recommended({ state, store }: { state: StoreState; store: CcmStore }) {
  const recs = state.recommendations as Reco[];
  const [cursor, setCursor] = useState(0);
  const { stdin } = useStdin();

  useEffect(() => {
    void store.getState().loadRecommendations();
  }, [store]);

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      if (state.focused !== 'main') return;
      const str = typeof data === 'string' ? data : data.toString();

      if (str === 'c' || str === 'y') {
        const sorted = getSortedRecs(recs);
        const r = sorted[cursor];
        if (!r) return;
        void (async () => {
          const result = await copyToClipboard(r.installCommand);
          store.getState().pushToast({
            kind: result.ok ? 'success' : 'error',
            text: result.ok
              ? t('toasts.install_cmd_copied', { cmd: r.installCommand })
              : t('toasts.copy_failed'),
          });
        })();
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, recs, state.focused, cursor, store]);

  if (recs.length === 0) {
    return (
      <EmptyState
        title={t('recommended.empty_title')}
        hint={t('recommended.empty_hint')}
      />
    );
  }

  const sorted = getSortedRecs(recs);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>{t('recommended.count_title', { n: sorted.length })}</Text>
      <Box marginTop={1}>
        <List
          items={sorted}
          filterKey={(r) => `${r.name} ${r.type}`}
          cursor={cursor}
          onCursorChange={(idx) => setCursor(idx)}
          renderItem={(r, sel) => {
            return `${sel ? '▶' : ' '} [${r.type.toUpperCase()}/${r.popularity}] ${r.name.padEnd(28)} ${r.description.slice(0, 50)}`;
          }}
          onSelect={() => {}}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>{t('recommended.copy_hint')}</Text>
      </Box>
    </Box>
  );
}

function getSortedRecs(recs: Reco[]): Reco[] {
  const orderType = { mcp: 0, plugin: 1, skill: 2 };
  const orderPop  = { Top: 0, Trending: 1 };
  return [...recs].sort((a, b) =>
    orderType[a.type] - orderType[b.type]
    || orderPop[a.popularity] - orderPop[b.popularity]);
}
