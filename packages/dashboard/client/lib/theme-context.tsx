import { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: 'light' | 'dark';
  setTheme: (t: Theme) => void;
}

/**
 * Resolve the actual theme based on user preference and system setting.
 * Runs synchronously to avoid flash of wrong theme on initial render.
 */
function getInitialTheme(): { theme: Theme; resolved: 'light' | 'dark' } {
  // Check localStorage first (only in browser)
  if (typeof window === 'undefined') {
    return { theme: 'system', resolved: 'dark' };
  }

  const saved = localStorage.getItem('ccm-theme') as Theme | null;
  const theme = saved ?? 'system';

  // Resolve based on saved preference or system
  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return { theme, resolved: prefersDark ? 'dark' : 'light' };
  }

  return { theme, resolved: theme };
}

// Initialize synchronously to avoid theme flash
const initial = getInitialTheme();

// Apply theme immediately before React hydrates (prevents flash)
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-theme', initial.resolved);
}

const ThemeContext = createContext<ThemeContextType>({
  theme: initial.theme,
  resolvedTheme: initial.resolved,
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initial.theme);
  const [resolvedTheme, setResolved] = useState<'light' | 'dark'>(initial.resolved);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    localStorage.setItem('ccm-theme', theme);

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      const update = () => setResolved(mq.matches ? 'dark' : 'light');
      update();
      mq.addEventListener('change', update);
      return () => mq.removeEventListener('change', update);
    }
    setResolved(theme);
    return undefined;
  }, [theme]);

  // Apply theme to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme: setThemeState }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
