import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  resolve: {
    alias: {
      '@gamo/engine':  resolve(__dirname, '../../packages/engine/src/index.js'),
      '@gamo/content': resolve(__dirname, '../../packages/content/src/index.js'),
      '@gamo/ui':      resolve(__dirname, '../../packages/ui/src'),
    },
  },
  server: {
    port: 3001,
    open: true,
    host: true,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  base: process.env.VITE_BASE || '/',
});
