import { useEffect, useLayoutEffect, useState } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../components/List.js';
import { EmptyState } from '../components/EmptyState.js';
import { copyToClipboard } from '../util/clipboard.js';
import type { CcmStore, StoreState } from '../store.js';

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
      const str = typeof data === 'string' ? data : data.toString();

      if (str === 'c' || str === 'y') {
        const sorted = getSortedRecs(recs);
        const r = sorted[cursor];
        if (!r) return;
        void (async () => {
          const result = await copyToClipboard(r.installCommand);
          store.getState().pushToast({
            kind: result.ok ? 'success' : 'error',
            text: result.ok ? `Install command copied: ${r.installCommand}` : 'Copy failed',
          });
        })();
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, recs, cursor, store]);

  if (recs.length === 0) {
    return (
      <EmptyState
        title="No recommendations yet"
        hint="Run `/ccm-recommendations` in Claude Code to generate."
      />
    );
  }

  const sorted = getSortedRecs(recs);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold>Recommended ({sorted.length})</Text>
      <Box marginTop={1}>
        <List
          items={sorted}
          filterKey={(r) => `${r.name} ${r.type}`}
          renderItem={(r, sel, idx) => {
            if (sel) setCursor(idx);
            return `${sel ? '▶' : ' '} [${r.type.toUpperCase()}/${r.popularity}] ${r.name.padEnd(28)} ${r.description.slice(0, 50)}`;
          }}
          onSelect={() => {}}
        />
      </Box>
      <Box marginTop={1}>
        <Text dimColor>c/y:copy install cmd  /:filter</Text>
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
