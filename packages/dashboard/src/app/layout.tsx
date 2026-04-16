import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
import { RealtimeSync } from '@/components/layout/realtime-sync';
import './globals.css';

export const metadata: Metadata = {
  title: 'Claude Config Manager',
  description: 'Manage your Claude configuration, plugins, MCP servers, and more.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <RealtimeSync />
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: '240px',
              padding: '24px',
              backgroundColor: '#08090a',
              minHeight: '100vh',
            }}
          >
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
