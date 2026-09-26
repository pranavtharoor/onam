/**
 * Motion modes. Every scene is authored against these three modes explicitly —
 * mobile is a different choreography, not a scaled-down desktop, and reduced
 * motion is a designed experience, not "animations off".
 */
export type MotionMode = 'desktop' | 'mobile' | 'reduced'

export const BREAKPOINT = 900

/** Conditions object for gsap.matchMedia(). Exactly one of these is true at a time. */
export const MOTION_CONDITIONS = {
  desktop: `(min-width: ${BREAKPOINT}px) and (prefers-reduced-motion: no-preference)`,
  mobile: `(max-width: ${BREAKPOINT - 0.02}px) and (prefers-reduced-motion: no-preference)`,
  reduced: '(prefers-reduced-motion: reduce)',
  /** Not a mode: an extra flag for landscape phones / short laptop windows. */
  short: '(max-height: 620px)',
} as const

export type MotionConditions = { [K in keyof typeof MOTION_CONDITIONS]: boolean }

export function modeFromConditions(c: MotionConditions): MotionMode {
  if (c.reduced) return 'reduced'
  return c.desktop ? 'desktop' : 'mobile'
}

export function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia(MOTION_CONDITIONS.reduced).matches
}
