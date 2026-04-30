import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { useState, useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { List } from '../../components/List.js';
export function McpServers({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === ' ') {
                const m = state.mcpServers[cursor];
                if (m)
                    void store.getState().toggleMcp(m.name);
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, cursor, state.mcpServers, state.focused, store]);
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["MCP servers (", state.mcpServers.length, ")"] }), _jsx(List, { items: state.mcpServers, filterKey: (m) => m.name, cursor: cursor, onCursorChange: (idx) => setCursor(idx), renderItem: (m, sel) => {
                    const mark = m.enabled ? '[✓]' : '[ ]';
                    const pending = state.pendingActions.has(`mcp:${m.name}`) ? ' …' : '';
                    return `${sel ? '▶' : ' '} ${mark} ${m.name.padEnd(30)} ${m.config.command ?? ''}${pending}`;
                }, onSelect: (m) => store.getState().toggleMcp(m.name) }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { dimColor: true, children: "space:toggle  enter:toggle  /:filter" }) })] }));
}
//# sourceMappingURL=McpServers.js.map