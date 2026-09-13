import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// App nay duoc build ra static assets va serve boi NestJS (app.useStaticAssets),
// cung origin voi API - khong can CORS/proxy khi chay production.
const BASE_PATH = '/ai-agent-config/'

// https://vite.dev/config/
export default defineConfig({
  base: BASE_PATH,
  plugins: [react(), tailwindcss()],
  build: {
    outDir: '../public/ai-agent-config',
    emptyOutDir: true,
  },
  server: {
    // Khi chay `npm run dev` rieng, proxy /api sang NestJS dang chay o :3000
    // de goi API cung origin trong luc phat trien.
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
})
