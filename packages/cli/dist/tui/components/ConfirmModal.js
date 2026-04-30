import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
export function ConfirmModal({ title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === '\r' || str === '\n')
                void onConfirm();
            else if (str === '\x1b')
                onCancel();
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, onConfirm, onCancel]);
    return (_jsxs(Box, { borderStyle: "round", borderColor: "yellow", flexDirection: "column", padding: 1, marginX: 4, marginY: 2, children: [_jsx(Text, { bold: true, children: title }), _jsx(Box, { marginTop: 1, children: _jsx(Text, { children: body }) }), _jsx(Box, { marginTop: 1, children: _jsxs(Text, { dimColor: true, children: ["Enter: ", confirmLabel, "    Esc: ", cancelLabel] }) })] }));
}
//# sourceMappingURL=ConfirmModal.js.map