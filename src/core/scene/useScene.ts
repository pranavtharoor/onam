import type { RefObject } from 'react'
import { gsap, useGSAP } from '../motion/gsap'
import { MOTION_CONDITIONS, modeFromConditions, type MotionConditions } from '../motion/media'
import type { SceneChoreography } from './types'

/**
 * Binds a scene's choreography to its root element.
 *
 * Built on useGSAP (automatic revert on unmount) + gsap.matchMedia, so when the
 * viewport crosses the breakpoint or the user toggles reduced motion, the scene's
 * timelines, ScrollTriggers and inline styles are reverted and rebuilt for the
 * new mode. Every scene therefore gets desktop / mobile / reduced branches for free
 * and cannot leak triggers.
 */
export function useScene(root: RefObject<HTMLElement | null>, choreography: SceneChoreography) {
  useGSAP(
    () => {
      const el = root.current
      if (!el) return
      const mm = gsap.matchMedia()
      mm.add(MOTION_CONDITIONS, (context) => {
        const conditions = context.conditions as MotionConditions
        return choreography({
          root: el,
          mode: modeFromConditions(conditions),
          conditions,
          q: gsap.utils.selector(el),
        })
      })
      return () => mm.revert()
    },
    { scope: root },
  )
}
