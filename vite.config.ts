import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: path.resolve(__dirname, './src/renderer'),
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
      '@renderer': path.resolve(__dirname, './src/renderer'),
    },
  },
  server: {
    port: 3000,
    strictPort: false,
    middlewareMode: false,
  },
  // base relativo para funcionar via file:// (offline) no Electron
  base: './',
  build: {
    target: 'baseline-widely-available',
    outDir: path.resolve(__dirname, './dist/renderer'),
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : true,
    minify: 'oxc',
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
    reportCompressedSize: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
            return 'react'
          }

          if (id.includes('node_modules/recharts')) {
            return 'charts'
          }

          if (id.includes('node_modules/lucide-react')) {
            return 'icons'
          }

          return undefined
        },
      },
    },
  },
})
