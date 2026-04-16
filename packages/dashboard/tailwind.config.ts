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
        'bg-primary': '#08090a',
        'bg-secondary': '#0f1011',
        'bg-tertiary': '#191a1b',
        'bg-hover': '#28282c',
        'text-primary': '#f7f8f8',
        'text-secondary': '#d0d6e0',
        'text-muted': '#8a8f98',
        'text-faint': '#62666d',
        'accent-purple': '#5e6ad2',
        'accent-purple-light': '#7170ff',
        'accent-purple-hover': '#828fff',
        'accent-green': '#27a644',
        'accent-emerald': '#10b981',
        'border-primary': '#23252a',
        'border-secondary': '#34343a',
      },
    },
  },
  plugins: [],
};

export default config;
