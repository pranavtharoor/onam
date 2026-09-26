import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { installQABridge } from './core/qa/qaBridge'
import { getLenis } from './core/motion/SmoothScroll'
import './styles/global.css'

// Scroll restoration fights pinned scenes on reload; always start at the opening.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

installQABridge(getLenis)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
