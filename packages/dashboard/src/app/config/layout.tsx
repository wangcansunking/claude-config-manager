'use client';
import { usePathname } from 'next/navigation';
import Link from 'next/link';

const tabs = [
  { label: 'Plugins', href: '/config/plugins' },
  { label: 'MCP Servers', href: '/config/mcp' },
  { label: 'Skills', href: '/config/skills' },
  { label: 'Commands', href: '/config/commands' },
  { label: 'Settings', href: '/config/settings' },
];

export default function ConfigLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div>
      {/* Sub-navigation tabs */}
      <div className="flex items-center gap-1 mb-6 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
        {tabs.map(tab => {
          const active = pathname.startsWith(tab.href);
          return (
            <Link key={tab.href} href={tab.href}
              className="px-4 py-2 rounded-md text-sm transition-colors"
              style={{
                backgroundColor: active ? 'var(--accent)' : 'transparent',
                color: active ? '#fff' : 'var(--text-muted)',
                fontWeight: active ? 510 : 400,
              }}
            >{tab.label}</Link>
          );
        })}
      </div>
      {children}
    </div>
  );
}
