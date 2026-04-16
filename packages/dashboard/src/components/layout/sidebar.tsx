'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const VERSION = '1.0.0-draft';

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const primaryNavItems: NavItem[] = [
  { label: 'Overview', icon: '📊', href: '/' },
  { label: 'Plugins', icon: '🧩', href: '/plugins' },
  { label: 'MCP Servers', icon: '🔌', href: '/mcp-servers' },
  { label: 'Skills', icon: '⚡', href: '/skills' },
  { label: 'Commands', icon: '📝', href: '/commands' },
  { label: 'Settings', icon: '⚙\uFE0F', href: '/settings' },
  { label: 'Sessions', icon: '🖥\uFE0F', href: '/sessions' },
];

const secondaryNavItems: NavItem[] = [
  { label: 'Profiles', icon: '👤', href: '/profiles' },
  { label: 'Export / Import', icon: '📦', href: '/export-import' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: '#0f1011',
        borderRight: '1px solid rgba(255, 255, 255, 0.05)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'fixed',
        top: 0,
        left: 0,
        overflowY: 'auto',
      }}
    >
      {/* Logo area */}
      <div
        className="p-4"
        style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{
              backgroundColor: '#5e6ad2',
            }}
          >
            C
          </div>
          <div>
            <div className="text-sm" style={{ color: '#f7f8f8', fontWeight: 510 }}>Claude Config</div>
            <div className="text-xs" style={{ color: '#62666d' }}>{VERSION}</div>
          </div>
        </div>
      </div>

      {/* Primary navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {primaryNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'hover:text-text-primary'
                }`}
                style={
                  isActive(item.href)
                    ? { backgroundColor: '#5e6ad2', color: '#f7f8f8' }
                    : { color: '#d0d6e0' }
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>

        {/* Divider */}
        <div className="my-3" style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)' }} />

        <ul className="space-y-1">
          {secondaryNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                prefetch={true}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  isActive(item.href)
                    ? 'text-white'
                    : 'hover:text-text-primary'
                }`}
                style={
                  isActive(item.href)
                    ? { backgroundColor: '#5e6ad2', color: '#f7f8f8' }
                    : { color: '#d0d6e0' }
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
