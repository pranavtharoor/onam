import { useSyncExternalStore } from 'react'
import { MOTION_CONDITIONS, type MotionMode } from './media'

const queries = typeof window === 'undefined' ? null : {
  reduced: window.matchMedia(MOTION_CONDITIONS.reduced),
  desktop: window.matchMedia(MOTION_CONDITIONS.desktop),
}

function subscribe(onChange: () => void) {
  if (!queries) return () => {}
  queries.reduced.addEventListener('change', onChange)
  queries.desktop.addEventListener('change', onChange)
  return () => {
    queries.reduced.removeEventListener('change', onChange)
    queries.desktop.removeEventListener('change', onChange)
  }
}

function snapshot(): MotionMode {
  if (!queries) return 'desktop'
  if (queries.reduced.matches) return 'reduced'
  return queries.desktop.matches ? 'desktop' : 'mobile'
}

/**
 * The current motion mode for React render decisions (e.g. whether to mount a
 * canvas layer at all). Timelines should use useScene's `mode` instead, which is
 * driven by gsap.matchMedia and rebuilds the timeline when the mode changes.
 */
export function useMotionMode(): MotionMode {
  return useSyncExternalStore(subscribe, snapshot, () => 'desktop')
}
