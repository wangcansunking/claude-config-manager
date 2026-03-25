import type { Metadata } from 'next';
import { Sidebar } from '@/components/layout/sidebar';
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
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main
            style={{
              flex: 1,
              marginLeft: '240px',
              padding: '24px',
              backgroundColor: '#0f0f14',
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
