import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import type { PageId } from '../store.js';
import { t } from '../i18n.js';

interface Item { id: PageId; labelKey: string; key: string }

const ITEMS: Item[] = [
  { id: 'overview',      labelKey: 'nav.overview',      key: '1' },
  { id: 'config',        labelKey: 'nav.config',        key: '2' },
  { id: 'sessions',      labelKey: 'nav.sessions',      key: '3' },
  { id: 'recommended',   labelKey: 'nav.recommend',     key: '4' },
  { id: 'settingsPrefs', labelKey: 'nav.settings',      key: '5' },
  { id: 'profiles',      labelKey: 'nav.profiles_wip',  key: '6' },
];

export function Sidebar({
  active, focused, onSelect, onEnter,
}: { active: PageId; focused: boolean; onSelect: (id: PageId) => void; onEnter?: () => void }) {
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
        } else if (str === '\r' && onEnter) {
          onEnter();
        }
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, active, focused, onSelect, onEnter]);

  return (
    <Box
      flexDirection="column" borderStyle="single"
      borderColor={focused ? 'cyan' : 'gray'}
      paddingX={1} width={16} flexShrink={0}
    >
      {ITEMS.map((it) => {
        const sel = it.id === active;
        return (
          <Text key={it.id} bold={sel}>{sel ? '▶ ' : '  '}{t(it.labelKey)}</Text>
        );
      })}
    </Box>
  );
}
