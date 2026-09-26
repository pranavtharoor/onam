import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '../motion/gsap'
import { useCanvasStage } from './useCanvasStage'

export interface ImageSequenceProps {
  /** Returns the URL of frame i (0-based). Frames live in public/media/sequences/<name>/. */
  frame: (index: number) => string
  count: number
  trigger: () => Element | null
  start?: string
  end?: string
  scrub?: number | boolean
  /** How the frame fills the canvas. */
  fit?: 'cover' | 'contain'
  className?: string
  /** Render only this frame, no scroll binding (reduced motion). */
  staticFrame?: number
}

/**
 * Frame-by-frame image sequence rendered to canvas, with scroll → frame index.
 * Use when a moment needs exact scroll control that video seeking cannot give
 * (especially on mobile Safari).
 *
 * Loading strategy: frame 0 first, then a coarse pass (every 8th frame) so
 * scrubbing works almost immediately, then fill in the rest. While a frame is
 * missing, the nearest loaded frame is drawn.
 */
export function ImageSequence({ frame, count, trigger, start = 'top top', end = 'bottom bottom', scrub = 0.3, fit = 'cover', className, staticFrame }: ImageSequenceProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const images = useRef<(HTMLImageElement | undefined)[]>([])
  const current = useRef(staticFrame ?? 0)
  const drawn = useRef(-1)

  useEffect(() => {
    let cancelled = false
    const order: number[] = [staticFrame ?? 0]
    for (const step of [8, 4, 2, 1]) for (let i = 0; i < count; i += step) if (!order.includes(i)) order.push(i)
    if (staticFrame !== undefined) order.length = 1

    let cursor = 0
    const loadNext = () => {
      if (cancelled || cursor >= order.length) return
      const i = order[cursor++]!
      const img = new Image()
      img.decoding = 'async'
      img.src = frame(i)
      img.decode().then(() => {
        if (cancelled) return
        images.current[i] = img
        drawn.current = -1
      }).catch(() => {}).finally(loadNext)
    }
    // A few parallel lanes; the browser caps connections anyway.
    for (let lane = 0; lane < 4; lane++) loadNext()
    return () => { cancelled = true }
  }, [frame, count, staticFrame])

  useEffect(() => {
    const el = trigger()
    if (staticFrame !== undefined || !el) return
    const st = ScrollTrigger.create({
      trigger: el, start, end, scrub,
      onUpdate: (self) => { current.current = Math.round(self.progress * (count - 1)) },
    })
    return () => st.kill()
  }, [trigger, start, end, scrub, count, staticFrame])

  useCanvasStage(canvasRef, {
    maxDpr: 2,
    draw: ({ ctx, width, height }) => {
      const want = current.current
      if (want === drawn.current) return
      let img = images.current[want]
      for (let d = 1; !img && d < count; d++) img = images.current[want - d] ?? images.current[want + d]
      if (!img) return
      const scale = fit === 'cover'
        ? Math.max(width / img.naturalWidth, height / img.naturalHeight)
        : Math.min(width / img.naturalWidth, height / img.naturalHeight)
      const w = img.naturalWidth * scale
      const h = img.naturalHeight * scale
      ctx.clearRect(0, 0, width, height)
      ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
      if (images.current[want]) drawn.current = want
    },
    onResize: () => { drawn.current = -1 },
  })

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}
