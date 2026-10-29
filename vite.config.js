import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true, // Listen on all local IPs (0.0.0.0)
    port: 5173,
    allowedHosts: true, // Allow tunnel domains (Cloudflare, localtunnel, etc.)
  },
})

