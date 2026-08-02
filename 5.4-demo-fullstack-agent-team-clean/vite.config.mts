import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The API and the UI are served separately in dev: the Express app listens on
// 3001, Vite on 5173. The proxy below lets the frontend call same-origin
// "/api/..." paths so the browser never needs a CORS preflight.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  // `tsc` emits the compiled API to dist/, and Vite empties its outDir on
  // build — so the web bundle gets its own subdirectory to avoid deleting it.
  build: {
    outDir: 'dist/web',
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
