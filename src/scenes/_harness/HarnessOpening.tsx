import { useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import './harness.css'

/**
 * Proves: pinned stage, scrubbed "camera push" where depth layers scale at
 * different rates (near layers move most), and a mode-specific branch for each
 * of desktop / mobile / reduced.
 */
export function HarnessOpening(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return // static composition: layers rest in their CSS positions

    const depth = mode === 'desktop' ? 1 : 0.6 // gentler camera on phones
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=150%' : '+=100%', pin: true, scrub: 1 },
    })
    tl.to(q('.layer--far'), { scale: 1 + 0.15 * depth, yPercent: -4 * depth }, 0)
      .to(q('.layer--mid'), { scale: 1 + 0.45 * depth, yPercent: -8 * depth }, 0)
      .to(q('.layer--near'), { scale: 1 + 1.2 * depth, yPercent: 20 * depth }, 0)
      .to(q('.h-open__title'), { letterSpacing: '0.12em', opacity: 0, scale: 1.1 }, 0.35)
  })

  return (
    <Scene ref={root} {...props} className="h-open">
      <div className="scene__stage">
        <div className="layer layer--far"><div className="h-shape" /></div>
        <div className="layer layer--mid"><div className="h-shape" /></div>
        <h1 className="h-open__title">Opening</h1>
        <div className="layer layer--near"><div className="h-shape" /></div>
        <p className="h-caption">Harness scene. Depth layers scale at different rates under a pinned, scrubbed timeline.</p>
      </div>
    </Scene>
  )
}
