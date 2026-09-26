import type { MotionMode } from '../../core/motion/media'

/**
 * The pookalam and the nadumuttam share one frame so the match cut (pookalam
 * circle → opening onto the courtyard sky) lines up exactly: same viewBox and
 * aspect mapping, same centre, per mode.
 */
export const COURTYARD = { cx: 800, cy: 520, r: 380 }

export function courtyardViewBox(mode: MotionMode) {
  // Portrait: fit the whole circle to the width and let the verandah fill the top.
  return mode === 'mobile'
    ? { viewBox: '400 120 800 800', preserveAspectRatio: 'xMidYMid meet' }
    : { viewBox: '0 0 1600 1000', preserveAspectRatio: 'xMidYMid slice' }
}

/** Screen geometry of the courtyard circle for an SVG using courtyardViewBox. */
export function courtyardOnScreen(svg: SVGSVGElement, container: Element) {
  const m = svg.getScreenCTM()
  const rect = container.getBoundingClientRect()
  if (!m) return { x: innerWidth / 2, y: innerHeight / 2, r: Math.min(innerWidth, innerHeight) * 0.4 }
  return { x: COURTYARD.cx * m.a + m.e - rect.left, y: COURTYARD.cy * m.d + m.f - rect.top, r: COURTYARD.r * m.a }
}
