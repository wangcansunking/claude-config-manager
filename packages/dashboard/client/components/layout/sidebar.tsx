import { Link, useLocation } from 'react-router-dom';
import useSWR from 'swr';
import { useTheme } from '@/lib/theme-context';

interface NavItem {
  label: string;
  icon: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: '\u{1F4CA}', href: '/' },
  { label: 'Recommended', icon: '\u2728', href: '/recommended' },
  { label: 'Configuration', icon: '\u2699\uFE0F', href: '/config' },
  { label: 'Profiles', icon: '\u{1F464}', href: '/profiles' },
  { label: 'Activity', icon: '\u{1F5A5}\uFE0F', href: '/activity' },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const { data: info } = useSWR<{ version: string }>('/api/info', (url: string) => fetch(url).then(r => r.json()), { revalidateOnFocus: false });
  const version = info?.version ?? '…';

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/' || pathname === '/metrics';
    }
    return pathname.startsWith(href);
  };

  return (
    <aside
      style={{
        width: '240px',
        minWidth: '240px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border)',
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
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-medium"
            style={{
              backgroundColor: 'var(--accent)',
            }}
          >
            C
          </div>
          <div>
            <div className="text-sm" style={{ color: 'var(--text-primary)', fontWeight: 510 }}>Claude Config</div>
            <div className="text-xs" style={{ color: 'var(--text-faint)' }}>{`v${version}`}</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors"
                style={
                  isActive(item.href)
                    ? { backgroundColor: 'var(--accent)', color: '#fff' }
                    : { color: 'var(--text-secondary)' }
                }
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Theme switcher */}
      <div className="p-3" style={{ borderTop: '1px solid var(--border)' }}>
        <div className="flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          {(['system', 'dark', 'light'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTheme(t)}
              className="flex-1 px-2 py-1 rounded text-xs capitalize transition-colors"
              style={{
                backgroundColor: theme === t ? 'var(--accent)' : 'transparent',
                color: theme === t ? '#fff' : 'var(--text-muted)',
              }}
            >
              {t === 'system' ? '\u{1F5A5}\uFE0F Auto' : t === 'dark' ? '\u{1F319} Dark' : '\u2600\uFE0F Light'}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
