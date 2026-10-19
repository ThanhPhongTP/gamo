import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@gamo/engine':  resolve(__dirname, '../packages/engine/src/index.js'),
      '@gamo/content': resolve(__dirname, '../packages/content/src/index.js'),
      '@gamo/ui':      resolve(__dirname, '../packages/ui/src'),
    },
  },
  server: {
    port: 5173,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  base: process.env.VITE_BASE || '/',
});
