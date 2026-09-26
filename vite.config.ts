import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Relative base: works on GitHub Pages project sites (/onam/) and any other static host.
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': '/src' },
  },
  server: { host: true, port: 5173, strictPort: true },
  preview: { host: true, port: 4173, strictPort: true },
  build: {
    target: 'es2022',
    // Large media lives in public/media and is streamed, never inlined.
    assetsInlineLimit: 2048,
    rollupOptions: {
      output: {
        // Keep the animation runtime in its own long-cached chunk.
        manualChunks(id) {
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
})
