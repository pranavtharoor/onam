import { defineConfig, mergeConfig } from 'vite'
import base from './vite.config.ts'

/**
 * The 3D edition (/3d/) is a second, separate build into dist/3d/.
 *
 * Why not one multi-page build: Rollup would extract the code both pages share
 * into common chunks, which rewrites the 2D page's chunk graph and its index.html.
 * A separate pass leaves the 2D build byte-for-byte as it was. The cost is that the
 * two pages don't share cached chunks, which doesn't matter: a guest opens one of them.
 *
 * `public/` is copied by the 2D build only (models live in public/models/ and are
 * fetched from ../models/ at runtime).
 */
export default mergeConfig(base, defineConfig({
  publicDir: false,
  build: {
    outDir: 'dist',
    emptyOutDir: false,
    assetsDir: '3d/assets',
    rollupOptions: {
      input: { '3d': '3d/index.html' },
      output: {
        manualChunks(id: string) {
          if (id.includes('node_modules/three')) return 'three'
          if (id.includes('node_modules/gsap') || id.includes('node_modules/lenis')) return 'motion'
          if (id.includes('node_modules/react')) return 'react'
        },
      },
    },
  },
}))
