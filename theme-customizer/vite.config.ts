import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: process.env.CF_PAGES === '1' ? '/' : '/customizer/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/themes': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})

