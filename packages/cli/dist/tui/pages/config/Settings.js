import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useLayoutEffect, useMemo } from 'react';
import { Box, Text, useStdin } from 'ink';
import { copyToClipboard } from '../../util/clipboard.js';
import { t } from '../../i18n.js';
const MODEL_CHOICES = [
    'opus', 'opus[1m]', 'sonnet', 'sonnet[1m]', 'haiku',
];
export function Settings({ state, store }) {
    const [cursor, setCursor] = useState(0);
    const { stdin } = useStdin();
    const settings = state.settings;
    const env = settings.env ?? {};
    const hooks = settings.hooks ?? {};
    const rows = useMemo(() => [
        { kind: 'model', label: 'model', value: String(settings.model ?? t('common.unset')) },
        ...Object.entries(env).map(([k, v]) => ({ kind: 'env', label: k, value: String(v) })),
        ...Object.keys(hooks).map((k) => ({ kind: 'hook', label: k })),
        // eslint-disable-next-line react-hooks/exhaustive-deps
    ], [settings.model, env, hooks]);
    const LABEL_W = Math.max(14, ...rows.map((r) => r.label.length)) + 2;
    // Precompute which rows need a section header
    const showHeader = useMemo(() => rows.map((row, idx) => {
        if (row.kind === 'model')
            return false; // model row has no separate header
        if (idx === 0)
            return true;
        return rows[idx - 1].kind !== row.kind;
    }), [rows]);
    useLayoutEffect(() => {
        if (!stdin)
            return;
        const handler = (data) => {
            if (state.focused !== 'main')
                return;
            const str = typeof data === 'string' ? data : data.toString();
            if (str === 'j' || str === '\x1b[B') {
                setCursor((c) => Math.min(c + 1, rows.length - 1));
                return;
            }
            if (str === 'k' || str === '\x1b[A') {
                setCursor((c) => Math.max(c - 1, 0));
                return;
            }
            if (str === '\r' || str === '\n') {
                const row = rows[cursor];
                if (!row)
                    return;
                if (row.kind === 'model') {
                    const cur = settings.model ?? MODEL_CHOICES[0];
                    const idx = MODEL_CHOICES.indexOf(cur);
                    const next = MODEL_CHOICES[(idx + 1) % MODEL_CHOICES.length];
                    void store.getState().setModel(next);
                }
                else if (row.kind === 'env') {
                    void (async () => {
                        const text = `${row.label}=${row.value}`;
                        const result = await copyToClipboard(text);
                        store.getState().pushToast({
                            kind: result.ok ? 'success' : 'error',
                            text: result.ok
                                ? t('toasts.copied', { text })
                                : t('toasts.copy_failed'),
                        });
                    })();
                }
                else if (row.kind === 'hook') {
                    void (async () => {
                        const result = await copyToClipboard(row.label);
                        store.getState().pushToast({
                            kind: result.ok ? 'success' : 'error',
                            text: result.ok
                                ? t('toasts.copied', { text: row.label })
                                : t('toasts.copy_failed'),
                        });
                    })();
                }
            }
        };
        stdin.on('data', handler);
        return () => { stdin.off('data', handler); };
    }, [stdin, cursor, rows, settings.model, state.focused, store]);
    const envEmpty = Object.keys(env).length === 0;
    const hookEmpty = Object.keys(hooks).length === 0;
    return (_jsxs(Box, { flexDirection: "column", padding: 1, children: [rows.map((row, idx) => {
                const isSelected = cursor === idx;
                const needsHeader = showHeader[idx];
                const needsTopMargin = needsHeader && idx > 0;
                return (_jsxs(Box, { flexDirection: "column", children: [needsHeader && (_jsx(Box, { marginTop: needsTopMargin ? 1 : 0, children: _jsx(Text, { bold: true, children: row.kind }) })), _jsxs(Box, { children: [_jsx(Text, { children: isSelected ? '▶ ' : '  ' }), _jsx(Text, { children: row.label.padEnd(LABEL_W) }), row.kind !== 'hook' && _jsx(Text, { children: row.value }), row.kind === 'model' && _jsxs(Text, { dimColor: true, children: ["   ", t('config.settings.model_cycle_hint')] }), row.kind === 'env' && _jsxs(Text, { dimColor: true, children: ["   ", t('config.settings.env_copy_hint')] })] })] }, `${row.kind}-${row.label}`));
            }), envEmpty && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "env" }), _jsxs(Text, { dimColor: true, children: ["  ", t('common.none')] })] })), hookEmpty && (_jsxs(Box, { marginTop: 1, flexDirection: "column", children: [_jsx(Text, { bold: true, children: "hooks" }), _jsxs(Text, { dimColor: true, children: ["  ", t('common.none')] })] }))] }));
}
//# sourceMappingURL=Settings.js.map