import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'bg-primary': '#0f0f14',
        'bg-secondary': '#1e1e28',
        'bg-tertiary': '#2a2a35',
        'text-primary': '#ffffff',
        'text-secondary': '#b2bec3',
        'text-muted': '#636e72',
        'accent-purple': '#6c5ce7',
        'accent-purple-light': '#a29bfe',
        'accent-green': '#00b894',
        'accent-blue': '#0984e3',
        'accent-orange': '#e17055',
        'accent-yellow': '#fdcb6e',
        'accent-pink': '#fd79a8',
        'accent-red': '#ff4757',
      },
    },
  },
  plugins: [],
};

export default config;
