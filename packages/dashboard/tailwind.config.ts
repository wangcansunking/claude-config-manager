import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './client/**/*.{ts,tsx}',
    './index.html',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-hover': 'var(--bg-hover)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'text-faint': 'var(--text-faint)',
        'accent-purple': 'var(--accent)',
        'accent-purple-light': 'var(--accent-light)',
        'accent-purple-hover': 'var(--accent-hover)',
        'accent-green': 'var(--status-green)',
        'accent-emerald': '#10b981',
        'border-primary': 'var(--border-strong)',
        'border-secondary': '#34343a',
      },
    },
  },
  plugins: [],
};

export default config;
