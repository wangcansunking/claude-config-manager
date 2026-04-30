import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { GLOBAL_HINT_DEFS } from '../keymap.js';
import { t } from '../i18n.js';
export function HelpOverlay({ pageHints, onClose, }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === '\x1b')
                onClose();
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, onClose]);
    return (_jsxs(Box, { borderStyle: "round", borderColor: "cyan", flexDirection: "column", padding: 1, marginX: 4, marginY: 2, children: [_jsx(Text, { bold: true, children: t('help.title') }), GLOBAL_HINT_DEFS.map((h, i) => (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: h.key.padEnd(10) }), _jsx(Text, { children: t(h.labelKey) })] }, i))), (pageHints ?? []).map((h, i) => (_jsxs(Box, { children: [_jsx(Text, { color: "cyan", children: h.key.padEnd(10) }), _jsx(Text, { children: h.label })] }, `page-${i}`)))] }));
}
//# sourceMappingURL=HelpOverlay.js.map