import { useEffect, useLayoutEffect, useMemo } from 'react';
import { Box, useStdin } from 'ink';
import { useStore } from 'zustand';
import { Header } from './components/Header.js';
import { Sidebar } from './components/Sidebar.js';
import { Footer } from './components/Footer.js';
import { ConfirmModal } from './components/ConfirmModal.js';
import { Toast } from './components/Toast.js';
import { useWatcher } from './hooks/useWatcher.js';
import { createStore } from './store.js';
import { renderPage } from './pages/router.js';

const store = createStore();

export function App() {
  const state = useStore(store, (s) => s);
  const { stdin } = useStdin();

  useEffect(() => {
    void state.init();
  }, []);
  useWatcher(store);

  useLayoutEffect(() => {
    const handler = (data: Buffer | string) => {
      if (state.modal) return;          // modal owns input

      const str = typeof data === 'string' ? data : data.toString();
      if (str === 'q' || str === '\x03') {
        process.exit(0);
      }
      if (str === 'r') void state.refresh();
      if (str === '\t') state.setFocus(state.focused === 'sidebar' ? 'main' : 'sidebar');
    };

    stdin?.on('data', handler);
    return () => { stdin?.off('data', handler); };
  }, [stdin, state]);

  const pageNode = useMemo(() => renderPage(state, store), [state]);

  return (
    <Box flexDirection="column" height={process.stdout.rows ?? 30}>
      <Header
        version="1.2.0"
        language={((state.settings.env ?? {}) as Record<string, string>).CLAUDE_CONFIG_LANG ?? 'en'}
        dashboard={state.dashboardStatus}
      />
      <Box flexGrow={1}>
        <Sidebar active={state.activePage}
                 focused={state.focused === 'sidebar'}
                 onSelect={(id) => state.setPage(id)} />
        <Box flexGrow={1} flexDirection="column"
             borderStyle="single"
             borderColor={state.focused === 'main' ? 'cyan' : 'gray'}>
          {pageNode}
        </Box>
      </Box>
      {state.toasts.map((t) => <Toast key={t.id} {...t} />)}
      {state.modal ? (
        <ConfirmModal
          title={state.modal.title}
          body={state.modal.body}
          confirmLabel={state.modal.confirmLabel}
          cancelLabel={state.modal.cancelLabel}
          onConfirm={async () => { await state.modal!.onConfirm(); state.closeModal(); }}
          onCancel={() => state.closeModal()}
        />
      ) : null}
      <Footer />
    </Box>
  );
}
