import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Box, Text } from 'ink';
import { List } from '../../components/List.js';
import { t } from '../../i18n.js';
export function Commands({ state, store: _store }) {
    return (_jsxs(Box, { flexDirection: "column", children: [_jsx(Text, { children: t('config.commands.title', { n: state.commands.length }) }), _jsx(List, { items: state.commands, filterKey: (c) => c.name, renderItem: (c, sel) => `${sel ? '▶' : ' '} /${c.name.padEnd(30)} ${c.source}`, onSelect: () => { } })] }));
}
//# sourceMappingURL=Commands.js.map