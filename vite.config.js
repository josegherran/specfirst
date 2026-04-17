import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/anthropic-api': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/anthropic-api/, ''),
        headers: {
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        configure: (proxy) => {
          proxy.on('proxyRes', (proxyRes) => {
            // Disable buffering so SSE streams through immediately
            proxyRes.headers['x-accel-buffering'] = 'no';
          });
        },
      },
    },
  },
})
