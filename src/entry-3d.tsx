/**
 * Entry for the 3D edition (/3d/). Same film, same words, same scenes, except
 * where registry3d swaps in a scene variant with a WebGL hero moment (desktop only).
 * Kept in step with main.tsx by hand: it is deliberately a copy, so the 2D entry
 * never has to know the 3D edition exists.
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App3D } from './three/App3D'
import { installQABridge } from './core/qa/qaBridge'
import { getLenis } from './core/motion/SmoothScroll'
import '@fontsource/young-serif/latin-400.css'
import '@fontsource/manjari/latin-400.css'
import '@fontsource/manjari/latin-700.css'
import '@fontsource/manjari/malayalam-400.css'
import '@fontsource/manjari/malayalam-700.css'
import './styles/global.css'

if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

installQABridge(getLenis)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App3D />
  </StrictMode>,
)
