import { Sidebar } from './components/layout/sidebar';
import { RealtimeSync } from './components/layout/realtime-sync';
import { AppRoutes } from './router';

export function App() {
  return (
    <>
      <RealtimeSync />
      <div style={{ display: 'flex', minHeight: '100vh' }}>
        <Sidebar />
        <main style={{ flex: 1, marginLeft: '240px', padding: '24px', backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
          <AppRoutes />
        </main>
      </div>
    </>
  );
}
