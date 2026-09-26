import { useEffect, useRef, type RefObject } from 'react'
import { gsap } from '../motion/gsap'
import { ambient } from '../motion/ambient'

export interface CanvasFrame {
  ctx: CanvasRenderingContext2D
  /** CSS pixel size of the canvas. Draw in CSS pixels; DPR scaling is applied for you. */
  width: number
  height: number
  /** Seconds since the previous drawn frame (clamped to avoid huge jumps). */
  dt: number
  time: number
}

export interface CanvasStageOptions {
  /** Cap device pixel ratio. Atmosphere layers rarely need > 1.5; image sequences may want 2. */
  maxDpr?: number
  /** When false, draw one frame on resize only (used for reduced motion / static states). */
  animate?: boolean
  draw: (frame: CanvasFrame) => void
  onResize?: (width: number, height: number) => void
}

/**
 * A DPR-aware 2D canvas that only runs while it is on screen and the tab is visible.
 * Frames are driven by gsap.ticker so canvas work is in lockstep with Lenis and
 * ScrollTrigger (one rAF loop for the whole site).
 */
export function useCanvasStage(canvasRef: RefObject<HTMLCanvasElement | null>, options: CanvasStageOptions) {
  const opts = useRef(options)
  opts.current = options

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    let width = 0
    let height = 0
    let visible = false
    let last = 0

    const render = (time: number) => {
      const dt = last ? Math.min(time - last, 1 / 20) : 1 / 60
      last = time
      opts.current.draw({ ctx, width, height, dt, time })
    }

    const tick = (time: number) => {
      if (visible && !document.hidden && !ambient.paused) render(time)
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, opts.current.maxDpr ?? 1.5)
      width = rect.width
      height = rect.height
      canvas.width = Math.round(width * dpr)
      canvas.height = Math.round(height * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      opts.current.onResize?.(width, height)
      render(gsap.ticker.time)
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting
      last = 0
    })
    io.observe(canvas)

    const animate = opts.current.animate ?? true
    if (animate) gsap.ticker.add(tick)

    return () => {
      ro.disconnect()
      io.disconnect()
      gsap.ticker.remove(tick)
    }
  }, [canvasRef])
}
