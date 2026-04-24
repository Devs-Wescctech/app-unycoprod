import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

function lpSessionRedirectPlugin() {
  return {
    name: 'lp-session-redirect',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/' || req.url === '/home' || req.url === '/home/') {
          const cookies = req.headers.cookie || '';
          const hasLpToken = cookies.split(';').some(c => c.trim().startsWith('lp_token='));
          if (!hasLpToken) {
            res.writeHead(302, { Location: '/lp/index.html' });
            res.end();
            return;
          }
        }
        next();
      });
    }
  };
}

export default defineConfig({
  plugins: [lpSessionRedirectPlugin(), react()],
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@assets': path.resolve(__dirname, './attached_assets'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
})
