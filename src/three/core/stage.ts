import { WebGLRenderer } from 'three'
import { gsap } from '../../core/motion/gsap'
import { ambient } from '../../core/motion/ambient'
import { allowSoftwareGL } from './capability'

export interface StageFrame {
  /** Seconds on gsap's clock (frozen while QA stills are on). */
  time: number
  dt: number
}

export interface StageOptions {
  /** Device pixel ratio cap. The site's canvases stay at ≤ 1.5. */
  maxDpr?: number
  onResize: (width: number, height: number) => void
  /**
   * Called every ticker frame while the canvas is on screen. Update the scene and
   * return true to draw this frame (false when nothing changed).
   */
  frame: (f: StageFrame) => boolean
  render: () => void
}

export interface Stage {
  renderer: WebGLRenderer
  /** Ask for a draw on the next frame (e.g. after a resize or an asset arrives). */
  invalidate: () => void
  dispose: () => void
}

/**
 * A WebGL canvas on the site's one loop: renders from gsap.ticker (with Lenis and
 * ScrollTrigger), only while the canvas intersects the viewport and the tab is
 * visible, at a capped DPR, and only on frames where `frame` reports a change.
 * The 3D equivalent of core/media/useCanvasStage.
 */
export function createStage(canvas: HTMLCanvasElement, opts: StageOptions): Stage {
  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    premultipliedAlpha: true,
    antialias: true, // the rim and stem silhouettes alias badly without it; cheap on any real GPU
    powerPreference: 'high-performance',
    failIfMajorPerformanceCaveat: !allowSoftwareGL(),
  })
  renderer.setClearColor(0x000000, 0)

  let visible = false
  let dirty = true
  let last = 0
  let clock = 0
  // Adaptive resolution: if drawn frames keep running slow (a weak integrated GPU), step the
  // pixel ratio down once, ×0.75. Never back up: no oscillation mid-scene. Off in QA runs
  // (software GL is always slow; captures must show the real quality).
  const adaptive = !allowSoftwareGL()
  let scale = 1
  let slow = 0
  let drawn = 0

  const resize = () => {
    const rect = canvas.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, opts.maxDpr ?? 1.5) * scale)
    renderer.setSize(rect.width, rect.height, false)
    opts.onResize(rect.width, rect.height)
    dirty = true
  }

  const tick = (time: number) => {
    if (!visible || document.hidden) { last = 0; return }
    const dt = last ? Math.min(time - last, 1 / 20) : 1 / 60
    last = time
    if (!ambient.paused) clock += dt
    const changed = opts.frame({ time: clock, dt: ambient.paused ? 0 : dt })
    if (changed || dirty) {
      opts.render()
      dirty = false
      if (++drawn > 20 && dt > 1 / 30) slow++
      else if (dt < 1 / 45) slow = Math.max(0, slow - 1)
      if (adaptive && slow > 24 && scale === 1) {
        scale *= 0.75
        slow = 0
        resize()
      }
    }
  }

  const ro = new ResizeObserver(resize)
  ro.observe(canvas)
  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    dirty = true
  })
  io.observe(canvas)
  gsap.ticker.add(tick)
  resize()

  return {
    renderer,
    invalidate: () => { dirty = true },
    dispose() {
      gsap.ticker.remove(tick)
      ro.disconnect()
      io.disconnect()
      renderer.dispose()
      renderer.forceContextLoss()
    },
  }
}
