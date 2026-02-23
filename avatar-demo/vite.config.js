import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'pixi-live2d-display/cubism4': path.resolve(
        __dirname,
        'node_modules/pixi-live2d-display/dist/cubism4.js'
      ),
      'pixi-live2d-display/cubism2': path.resolve(
        __dirname,
        'node_modules/pixi-live2d-display/dist/cubism2.js'
      ),
    }
  },
  optimizeDeps: {
    include: ['pixi-live2d-display'],
    exclude: []
  }
})