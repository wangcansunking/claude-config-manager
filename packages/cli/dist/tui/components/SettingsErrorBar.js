import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useLayoutEffect } from 'react';
import { Box, Text, useStdin } from 'ink';
import { spawn } from 'child_process';
import { homedir } from 'os';
import { join } from 'path';
export function SettingsErrorBar({ store, message }) {
    const { stdin } = useStdin();
    useLayoutEffect(() => {
        const handler = (data) => {
            const str = typeof data === 'string' ? data : data.toString();
            if (str === 'r')
                void store.getState().refresh('settings');
            if (str === 'o') {
                const editor = process.env.EDITOR ?? 'vi';
                const path = join(homedir(), '.claude/settings.json');
                spawn(editor, [path], { stdio: 'inherit', detached: true });
            }
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, store]);
    return (_jsxs(Box, { paddingX: 1, flexDirection: "column", children: [_jsxs(Box, { children: [_jsx(Text, { color: "red", bold: true, children: "\u26A0 Settings unreadable: " }), _jsx(Text, { children: message })] }), _jsx(Text, { dimColor: true, children: "r: reload   o: open in $EDITOR" })] }));
}
//# sourceMappingURL=SettingsErrorBar.js.map