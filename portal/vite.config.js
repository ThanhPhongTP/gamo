import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Plugin hỗ trợ Clean URLs trong môi trường phát triển Vite:
 * - Truy cập /bank hoặc /bank?type=vocab sẽ hiển thị URL sạch không có đuôi .html
 * - Nếu người dùng gõ /bank.html hoặc /index.html sẽ tự chuyển hướng về URL sạch
 */
const cleanUrlsPlugin = () => ({
  name: 'vite-plugin-clean-urls',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (!req.url) return next();
      const [pathname, search] = req.url.split('?');
      const query = search ? `?${search}` : '';

      // 1. Chuyển hướng các URL có đuôi .html về URL sạch
      if (pathname === '/bank.html') {
        res.writeHead(301, { Location: `/bank${query}` });
        res.end();
        return;
      }
      if (pathname === '/index.html') {
        res.writeHead(301, { Location: `/${query}` });
        res.end();
        return;
      }

      // 2. Rewrite ngầm /bank -> nạp file bank.html mà vẫn giữ nguyên URL sạch trên trình duyệt
      if (pathname === '/bank' || pathname === '/bank/') {
        req.url = `/bank.html${query}`;
      }
      next();
    });
  },
});

export default defineConfig({
  root: '.',
  plugins: [cleanUrlsPlugin()],
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
