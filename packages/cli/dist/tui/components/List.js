import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useMemo, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
export function List({ items, renderItem, onSelect, filterKey, active = true, cursor: controlledCursor, onCursorChange, }) {
    const [internalCursor, setInternalCursor] = useState(0);
    const [filterMode, setFilter] = useState(false);
    const [query, setQuery] = useState('');
    const { stdin } = useStdin();
    // Whether we're in controlled mode
    const isControlled = controlledCursor !== undefined;
    const cursor = isControlled ? controlledCursor : internalCursor;
    const setCursor = (newIdx) => {
        const next = typeof newIdx === 'function' ? newIdx(cursor) : newIdx;
        if (isControlled) {
            const item = visible[next];
            if (item)
                onCursorChange?.(next, item);
        }
        else {
            setInternalCursor(next);
        }
    };
    const visible = useMemo(() => {
        if (!filterKey || !query)
            return items;
        const q = query.toLowerCase();
        return items.filter((i) => filterKey(i).toLowerCase().includes(q));
    }, [items, query, filterKey]);
    useLayoutEffect(() => {
        if (!active)
            return;
        const handler = (data) => {
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
            }
            else if (str === 'k' || str === '\x1b[A') {
                setCursor((c) => Math.max(c - 1, 0));
            }
            else if (str === 'l' || str === '\x1b[C') {
                // right arrow → intentionally do nothing; parent ConfigFrame handles inner-tab nav
            }
            else if (str === 'h' || str === '\x1b[D') {
                // left arrow → intentionally do nothing; parent ConfigFrame handles inner-tab nav
            }
            else if (str === '\x1b[H' || str === 'g') {
                setCursor(0);
            }
            else if (str === '\x1b[F' || str === 'G') {
                setCursor(visible.length - 1);
            }
            else if (str === '\r' || str === '\n') {
                const item = visible[cursor];
                if (item)
                    onSelect(item);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, active, filterMode, filterKey, visible, cursor, onSelect, isControlled, onCursorChange]);
    if (visible.length === 0) {
        return _jsx(Text, { dimColor: true, children: "(no matches)" });
    }
    return (_jsxs(Box, { flexDirection: "column", children: [filterMode && (_jsxs(Box, { children: [_jsxs(Text, { color: "cyan", children: ["/", query] }), _jsx(Text, { dimColor: true, children: " (Enter to confirm, Esc to clear)" })] })), visible.map((item, idx) => (_jsx(Box, { children: _jsx(Text, { children: renderItem(item, idx === cursor, idx) }) }, idx)))] }));
}
//# sourceMappingURL=List.js.map