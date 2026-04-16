import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: { '@': resolve(__dirname, 'client') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3399',
    },
  },
  build: {
    outDir: 'dist/client',
    emptyOutDir: true,
  },
});
