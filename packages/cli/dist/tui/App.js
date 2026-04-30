import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { Box, useStdin } from 'ink';
import { useStore } from 'zustand';
import { Header } from './components/Header.js';
import { SettingsErrorBar } from './components/SettingsErrorBar.js';
import { Sidebar } from './components/Sidebar.js';
import { Footer } from './components/Footer.js';
import { ConfirmModal } from './components/ConfirmModal.js';
import { HelpOverlay } from './components/HelpOverlay.js';
import { Toast } from './components/Toast.js';
import { useWatcher } from './hooks/useWatcher.js';
import { useAutoDismissToasts } from './hooks/useToast.js';
import { createStore } from './store.js';
import { renderPage } from './pages/router.js';
import { initI18n } from './i18n.js';
const store = createStore();
export function App() {
    const state = useStore(store, (s) => s);
    const { stdin } = useStdin();
    const [showHelp, setShowHelp] = useState(false);
    const lang = (state.settings.env ?? {}).CLAUDE_CONFIG_LANG ?? 'en';
    useEffect(() => {
        initI18n(lang);
    }, [lang]);
    useWatcher(store);
    useAutoDismissToasts(store);
    useEffect(() => {
        void state.init();
    }, []);
    useLayoutEffect(() => {
        // Ensure stdin is in flowing mode so 'data' events fire in a PTY context.
        // Calling setRawMode(true) disables line buffering; resume() starts the
        // stream so data events are delivered immediately.
        if (stdin && stdin.isTTY) {
            stdin.setRawMode?.(true);
            stdin.resume();
        }
        const handler = (data) => {
            if (state.modal)
                return; // modal owns input
            const str = typeof data === 'string' ? data : data.toString();
            // Esc: move focus back to sidebar (when main is focused and no overlay is open)
            if (str === '\x1b' && state.focused === 'main' && !state.modal && !showHelp) {
                state.setFocus('sidebar');
                return;
            }
            if (str === 'q' || str === '\x03') {
                process.exit(0);
            }
            if (str === '?') {
                setShowHelp(true);
                return;
            }
            if (str === 'r')
                void state.refresh();
            if (str === '\t')
                state.setFocus(state.focused === 'sidebar' ? 'main' : 'sidebar');
        };
        stdin?.on('data', handler);
        return () => { stdin?.off('data', handler); };
    }, [stdin, state]);
    const pageNode = useMemo(() => renderPage(state, store), [state]);
    return (_jsxs(Box, { flexDirection: "column", height: process.stdout.rows ?? 30, children: [_jsx(Header, { version: "1.1.4", language: lang, dashboard: state.dashboardStatus }), state.lastError?.section === 'settings' && (_jsx(SettingsErrorBar, { store: store, message: state.lastError.err.message })), _jsxs(Box, { flexGrow: 1, children: [_jsx(Sidebar, { active: state.activePage, focused: state.focused === 'sidebar', onSelect: (id) => state.setPage(id), onEnter: () => state.setFocus('main') }, lang), _jsx(Box, { flexGrow: 1, flexDirection: "column", borderStyle: "single", borderColor: state.focused === 'main' ? 'cyan' : 'gray', children: pageNode }, lang)] }), state.toasts.map((t) => _jsx(Toast, { ...t }, t.id)), state.modal ? (_jsx(ConfirmModal, { title: state.modal.title, body: state.modal.body, confirmLabel: state.modal.confirmLabel, cancelLabel: state.modal.cancelLabel, onConfirm: async () => { await state.modal.onConfirm(); state.closeModal(); }, onCancel: () => state.closeModal() })) : null, showHelp ? _jsx(HelpOverlay, { onClose: () => setShowHelp(false) }) : null, _jsx(Footer, {})] }));
}
//# sourceMappingURL=App.js.map