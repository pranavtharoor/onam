import { useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import { useCanvasStage } from '../../core/media/useCanvasStage'
import { useMotionMode } from '../../core/motion/useMotionMode'
import type { SceneProps } from '../../core/scene/types'

/**
 * Proves: `entry: 'overlap'` — this scene sits over the previous scene's held
 * frame and owns the transition (clip-path iris); plus a canvas atmosphere
 * layer that pauses off-screen and draws a single static frame under reduced motion.
 */
export function HarnessReveal(props: SceneProps) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const mode = useMotionMode()
  const motes = useRef<{ x: number; y: number; r: number; v: number }[]>([])

  useCanvasStage(canvas, {
    maxDpr: 1.5,
    animate: mode !== 'reduced',
    onResize: (w, h) => {
      const count = mode === 'desktop' ? 90 : 40 // fewer particles on phones
      motes.current = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 1 + Math.random() * 2.5, v: 8 + Math.random() * 18 }))
    },
    draw: ({ ctx, width, height, dt }) => {
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = 'rgba(246, 241, 230, 0.55)'
      for (const m of motes.current) {
        m.y -= m.v * dt
        if (m.y < -5) m.y = height + 5
        ctx.beginPath()
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2)
        ctx.fill()
      }
    },
  })

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    // Iris opens while this scene scrolls up over the held previous frame.
    gsap.fromTo(root, { clipPath: 'circle(0% at 50% 60%)' }, {
      clipPath: 'circle(75% at 50% 60%)', ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true },
    })
    gsap.from(q('.h-reveal__title'), {
      yPercent: 40, opacity: 0, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top 40%', end: 'top top', scrub: true },
    })
  })

  return (
    <Scene ref={root} {...props} className="h-reveal">
      <div className="scene__stage">
        <canvas ref={canvas} className="h-reveal__canvas" aria-hidden="true" />
        <h2 className="h-reveal__title">Reveal</h2>
        <p className="h-caption">Harness scene. Enters over the held previous frame through a clip-path iris; canvas layer runs only while visible.</p>
      </div>
    </Scene>
  )
}
