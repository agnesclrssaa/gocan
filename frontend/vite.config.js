import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '..', '')

  return {
    envDir: '..',
    base: '/',
    plugins: [react(), tailwindcss()],
    server: {
      host: true, // Listen on all local IPs (0.0.0.0)
      port: 5173,
      allowedHosts: true, // Allow tunnel domains, Cloudflare, localtunnel, etc.
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
  }
})
