import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        chunkFileNames: `assets/[name]-[hash]-v${Date.now()}.js`,
        assetFileNames: `assets/[name]-[hash]-v${Date.now()}[extname]`
      }
    }
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    hmr: {
      host: '127.0.0.1',
      port: 5173
    },
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})

