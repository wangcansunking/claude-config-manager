import { useState, useMemo, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';

export interface ListProps<T> {
  items:        T[];
  renderItem:   (item: T, selected: boolean, idx: number) => string | React.ReactNode;
  onSelect:     (item: T) => void;
  filterKey?:   (item: T) => string;
  /** when true, this list owns input focus */
  active?:      boolean;
}

export function List<T>({ items, renderItem, onSelect, filterKey, active = true }: ListProps<T>) {
  const [cursor, setCursor]     = useState(0);
  const [filterMode, setFilter] = useState(false);
  const [query, setQuery]       = useState('');

  const { stdin } = useStdin();

  const visible = useMemo(() => {
    if (!filterKey || !query) return items;
    const q = query.toLowerCase();
    return items.filter((i) => filterKey(i).toLowerCase().includes(q));
  }, [items, query, filterKey]);

  useLayoutEffect(() => {
    if (!active) return;

    const handler = (data: Buffer | string) => {
      const str = typeof data === 'string' ? data : data.toString();

      if (filterMode) {
        if (str === '\r' || str === '\n' || str === '\x1b') {
          setFilter(false);
          return;
        }
        if (str === '\x7f' || str === '\x08') {
          setQuery((q) => q.slice(0, -1));
          return;
        }
        // Printable chars — append to query
        if (str.length >= 1) {
          setQuery((q) => q + str);
        }
        return;
      }

      if (str === '/' && filterKey) {
        setFilter(true);
        setQuery('');
        return;
      }
      if (str === 'j' || str === '\x1b[B') {
        setCursor((c) => Math.min(c + 1, visible.length - 1));
      } else if (str === 'k' || str === '\x1b[A') {
        setCursor((c) => Math.max(c - 1, 0));
      } else if (str === 'g') {
        setCursor(0);
      } else if (str === 'G') {
        setCursor(visible.length - 1);
      } else if (str === '\r' || str === '\n') {
        const item = visible[cursor];
        if (item) onSelect(item);
      }
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, active, filterMode, filterKey, visible, cursor, onSelect]);

  if (visible.length === 0) {
    return <Text dimColor>(no matches)</Text>;
  }

  return (
    <Box flexDirection="column">
      {filterMode && (
        <Box>
          <Text color="cyan">/{query}</Text>
          <Text dimColor> (Enter to confirm, Esc to clear)</Text>
        </Box>
      )}
      {visible.map((item, idx) => (
        <Box key={idx}>
          <Text>{renderItem(item, idx === cursor, idx)}</Text>
        </Box>
      ))}
    </Box>
  );
}
