import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { List } from '../../components/List.js';
export function Commands({ state, store: _store }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsxs(Text, { children: ["Commands (", state.commands.length, ") \u2014 read-only in v1"] }), _jsx(List, { items: state.commands, filterKey: (c) => c.name, renderItem: (c, sel) => `${sel ? '▶' : ' '} /${c.name.padEnd(30)} ${c.source}`, onSelect: () => { } })] }));
}
//# sourceMappingURL=Commands.js.map