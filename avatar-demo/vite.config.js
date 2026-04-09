import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  assetsInclude: ['**/*.vrm'],
  optimizeDeps: {
    exclude: ['inochi_viewer'], // evita que Vite pre-bundlee el módulo WASM
  },
  server: {
    headers: {
      // Requerido para SharedArrayBuffer / WASM threads
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
})