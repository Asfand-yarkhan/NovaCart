import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// In development, /api, /uploads and /sitemap.xml are proxied to the Express server,
// so the browser talks to one origin and no CORS setup is needed.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_PROXY_TARGET || 'http://localhost:5000';
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': target,
        '/uploads': target,
        '/sitemap.xml': target
      }
    },
    preview: {
      port: 4173,
      proxy: {
        '/api': target,
        '/uploads': target,
        '/sitemap.xml': target
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: { vendor: ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'] }
        }
      }
    }
  };
});
