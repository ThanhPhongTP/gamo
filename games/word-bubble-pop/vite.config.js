import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  // Root: game source directory is current folder
  root: '.',

  // Resolve @gamo/* packages to local workspace
  resolve: {
    alias: {
      '@gamo/engine':  resolve(__dirname, '../../packages/engine/src/index.js'),
      '@gamo/content': resolve(__dirname, '../../packages/content/src/index.js'),
      '@gamo/ui':      resolve(__dirname, '../../packages/ui/src'),
    },
  },

  // Dev server config
  server: {
    port: 3000,
    open: true,        // auto-open browser
    host: '127.0.0.1', // strictly localhost only, block LAN
  },

  // Build config
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
    // Game-specific chunk naming
    chunkSizeWarningLimit: 1000,
  },

  // Base path for hosting (can be overridden with VITE_BASE env)
  base: process.env.VITE_BASE || '/',
});
