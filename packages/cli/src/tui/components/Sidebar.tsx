import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { PageId } from '../store.js';

interface Item { id: PageId; label: string; key: string }

const ITEMS: Item[] = [
  { id: 'overview',      label: 'Overview',  key: '1' },
  { id: 'config',        label: 'Config',    key: '2' },
  { id: 'profiles',      label: 'Profiles',  key: '3' },
  { id: 'sessions',      label: 'Sessions',  key: '4' },
  { id: 'recommended',   label: 'Recommend', key: '5' },
  { id: 'settingsPrefs', label: 'Settings',  key: '6' },
];

export function Sidebar({
  active, focused, onSelect,
}: { active: PageId; focused: boolean; onSelect: (id: PageId) => void }) {
  const { stdin } = useStdin();

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();

      // Digit keys 1–6: always handled regardless of focus
      const byKey = ITEMS.find((i) => i.key === str);
      if (byKey) {
        onSelect(byKey.id);
        return;
      }

      // j/k/arrows navigation when sidebar is focused
      if (focused) {
        const idx = ITEMS.findIndex((i) => i.id === active);
        if ((str === 'j' || str === '\x1b[B') && idx < ITEMS.length - 1) {
          onSelect(ITEMS[idx + 1].id);
        } else if ((str === 'k' || str === '\x1b[A') && idx > 0) {
          onSelect(ITEMS[idx - 1].id);
        }
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, active, focused, onSelect]);

  return (
    <Box
      flexDirection="column" borderStyle="single"
      borderColor={focused ? 'cyan' : 'gray'}
      paddingX={1} width={16}
    >
      {ITEMS.map((it) => {
        const sel = it.id === active;
        return (
          <Text key={it.id} bold={sel}>{sel ? '▶ ' : '  '}{it.label}</Text>
        );
      })}
    </Box>
  );
}
