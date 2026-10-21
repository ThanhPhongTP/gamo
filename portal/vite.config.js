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
    host: '127.0.0.1', // strictly localhost only, block LAN
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        bank: resolve(__dirname, 'bank.html'),
      },
    },
  },
  base: process.env.VITE_BASE || '/',
});
