import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The API owns the root namespace (/ledger and /e/{token} are API routes), so the built UI is
// served under /app by the engine. In dev, VITE_API_URL points at the engine on :18000.
export default defineConfig({
  plugins: [react()],
  base: '/app/',
  server: {
    port: 5173,
    proxy: {
      '^/(risks|pulses|ledger|e|integrity|analyst|radar|me|demo|events|health|ready|version|drafts|experts|panels|sim)(/|$)': {
        target: 'http://127.0.0.1:18000',
        changeOrigin: true,
      },
    },
  },
  build: { outDir: 'dist', sourcemap: false },
})
