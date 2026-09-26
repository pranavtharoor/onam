import { useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'

const PANELS = ['Landscape', 'Courtyard', 'Threshold', 'Hold']

/**
 * Proves: horizontal travel pinned to vertical scroll on desktop (with a held
 * final frame that the next, overlapping scene transitions over), and a
 * different choreography on mobile — a native vertical stack with light
 * per-panel parallax instead of a long horizontal pin.
 */
export function HarnessTravel(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  useScene(root, ({ root, mode, q }) => {
    const track = q('.h-travel__track')[0] as HTMLElement
    if (mode === 'desktop') {
      const distance = () => track.scrollWidth - window.innerWidth
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: {
          trigger: root, start: 'top top', pin: true, scrub: 0.8, invalidateOnRefresh: true,
          // travel distance + one viewport of held last frame for the next scene's overlap entry
          end: () => `+=${distance() + window.innerHeight}`,
        },
      })
      tl.to(track, { x: () => -distance(), duration: 1 })
        .to({}, { duration: () => window.innerHeight / Math.max(distance(), 1) }) // hold
    } else if (mode === 'mobile') {
      q('.h-shape').forEach((shape) => {
        gsap.fromTo(shape, { yPercent: 12 }, { yPercent: -12, ease: 'none', scrollTrigger: { trigger: shape, start: 'top bottom', end: 'bottom top', scrub: true } })
      })
    }
  })

  return (
    <Scene ref={root} {...props} className="h-travel">
      <div className="scene__stage">
        <div className="h-travel__track">
          {PANELS.map((name) => (
            <div key={name} className="h-travel__panel">
              <div className="h-shape" />
              {name}
            </div>
          ))}
        </div>
      </div>
    </Scene>
  )
}
