import { useMemo, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../core/motion/gsap'
import { pinned } from '../../core/motion/media'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import { LeafShape } from '../../art/Leaf'
import { DishArt } from '../../art/Dishes'
import { rng } from '../../art/random'
import { Ml } from '../../components/Ml'
import { copy, sadhya, SADHYA_STAGES } from '../../content'
import { FLAME_AT } from '../05-nadumuttam/NadumuttamScene'
import './sadhya-row.css'

const SHIRT: readonly string[] = ['#2e5b48', '#efe8d6', '#243452', '#a33b1f', '#d39a2c', '#efe8d6']

/**
 * A diner seated cross-legged across the leaf, cropped at the chest by the frame:
 * shirt or blouse at the waist, kasavu mundu spread over the crossed knees, zari hem.
 */
function Diner({ seed }: { seed: number }) {
  const r = rng(seed)
  const saree = r.next() > 0.5
  const shirt = r.pick(SHIRT)
  const lap = 'M400,44 C470,36 630,36 700,44 C880,64 1060,120 1060,178 C980,232 850,246 700,226 C630,216 590,236 550,238 C520,236 470,216 400,226 C250,246 120,232 40,178 C40,120 220,64 400,44Z'
  const hem = 'M40,178 C120,232 250,246 400,226 C470,216 520,236 550,238 C590,236 630,216 700,226 C850,246 980,232 1060,178'
  return (
    <g>
      <path d="M392,-20 L708,-20 L700,52 L400,52Z" fill={shirt} stroke="var(--c-black)" strokeWidth={3} />
      <path d={lap} fill="var(--c-mundu)" />
      <path d="M550,60 C540,120 548,190 550,236 M250,90 C320,130 420,180 520,214 M850,90 C780,130 680,180 580,214" stroke="#d3c8ae" strokeWidth={4} fill="none" />
      <path d={hem} stroke="var(--c-kasavu)" strokeWidth={16} fill="none" />
      {saree && <path d={hem} transform="translate(0 -14)" stroke="var(--c-red-ochre)" strokeWidth={5} fill="none" />}
      <path d={hem} transform="translate(0 -22)" stroke="var(--c-kasavu)" strokeWidth={2.5} fill="none" />
      <path d="M400,44 C470,36 630,36 700,44" stroke="var(--c-kasavu)" strokeWidth={5} fill="none" />
      <path d={lap} fill="none" stroke="var(--c-black)" strokeWidth={3} />
    </g>
  )
}

function Place({ stage, empty }: { stage: number; empty?: boolean }) {
  const dishes = empty ? [] : sadhya.filter((d) => d.stage <= stage)
  const fresh = sadhya.filter((d) => d.stage === stage)
  return (
    <figure className={`row-place${empty ? ' row-place--empty' : ''}`} data-stage={stage}>
      <svg className="row-art" viewBox="0 0 1100 1000" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <rect x={30} y={320} width={1040} height={520} fill="#b9955a" />
        <path stroke="#9a7840" strokeWidth={2} d={Array.from({ length: 52 }, (_, i) => `M${30 + i * 20},320V840`).join('')} />
        <rect x={30} y={320} width={1040} height={520} fill="none" stroke="#7a5a2a" strokeWidth={6} />
        {!empty && <Diner seed={stage * 17 + 3} />}
        {/* Diners face the camera from across the leaf, so their left is screen right: the tip points right. */}
        <g transform="translate(50 380) rotate(180 500 200)">
          <LeafShape seed={stage + 9} />
          {dishes.map((d) => (
            <g key={d.id} className={d.stage === stage ? 'dish-new' : undefined}><DishArt dish={d} /></g>
          ))}
        </g>
      </svg>
      <figcaption className="row-legend">
        <span className="row-legend-line">{empty ? copy.row.emptyPlace : copy.row.stages[stage]}</span>
        {!empty && (
          <span className="row-legend-items">
            {fresh.map((d, i) => (
              <span key={d.id}>{d.name}{d.ml && <> <Ml>{d.ml}</Ml></>}{i < fresh.length - 1 ? ', ' : ''}</span>
            ))}
          </span>
        )}
      </figcaption>
    </figure>
  )
}

/**
 * The dining hall. A row of banana leaves; each leaf you pass is one step
 * further along the serving order, so crossing the room is the meal being
 * served. Ends on the one empty place. Desktop: the camera trucks along the row.
 * Mobile / reduced: you walk down the row (a vertical column).
 * Entry: an iris opens from the nilavilakku flame of the previous scene.
 */
export function SadhyaRowScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)
  const stages = useMemo(() => Array.from({ length: SADHYA_STAGES }, (_, i) => i), [])

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    // Iris from the lamp flame, which is fixed on screen while the nadumuttam holds.
    const stage = q('.row-stage')[0] as HTMLElement
    ScrollTrigger.create({
      trigger: root, start: 'top bottom', end: 'top top', scrub: true,
      // During the iris only the clip circle changes: keep the hall on its own layer meanwhile.
      onToggle: (self) => { stage.style.willChange = self.isActive ? 'transform' : '' },
      onUpdate: (self) => {
        const p = self.progress
        const x = innerWidth * FLAME_AT.x
        const y = innerHeight * (FLAME_AT.y - (1 - p)) // flame position in the section's own box
        const r = Math.hypot(innerWidth, innerHeight) * 1.05 * gsap.parseEase('power2.in')(p)
        root.style.clipPath = p >= 1 ? 'none' : `circle(${r.toFixed(1)}px at ${x.toFixed(1)}px ${y.toFixed(1)}px)`
      },
      onLeaveBack: () => { root.style.clipPath = '' },
    })

    const places = q('.row-place') as HTMLElement[]
    if (mode === 'desktop') {
      const track = q('.row-track')[0] as HTMLElement
      const distance = () => Math.max(0, track.scrollWidth - innerWidth)
      const travel = gsap.to(track, {
        x: () => -distance(), ease: 'none',
        // Slightly faster than 1:1 so the row stays a walk, not a trek.
        scrollTrigger: { trigger: root, start: 'top top', end: () => `+=${distance() * 0.8}`, pin: true, ...pinned(mode), invalidateOnRefresh: true },
      })
      places.forEach((place) => {
        const fresh = place.querySelectorAll('.dish-new')
        if (!fresh.length) return // the empty place
        gsap.fromTo(fresh, { scale: 0.4, opacity: 0 }, {
          scale: 1, opacity: 1, transformOrigin: '50% 50%', ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: place, containerAnimation: travel, start: 'left 95%', end: 'left 35%', scrub: true },
        })
      })
      gsap.fromTo(q('.row-song'), { opacity: 0.15 }, { opacity: 1, ease: 'none', scrollTrigger: { trigger: q('.row-song')[0], containerAnimation: travel, start: 'left 80%', end: 'left 40%', scrub: true } })
    } else {
      places.forEach((place) => {
        const fresh = place.querySelectorAll('.dish-new')
        if (!fresh.length) return
        gsap.fromTo(fresh, { scale: 0.4, opacity: 0 }, {
          scale: 1, opacity: 1, transformOrigin: '50% 50%', ease: 'power2.out', stagger: 0.12,
          scrollTrigger: { trigger: place, start: 'top 90%', end: 'top 30%', scrub: true },
        })
      })
    }
  })

  return (
    <Scene ref={root} {...props} className="s-row">
      <div className="scene__stage row-stage">
        <div className="row-track">
          <div className="row-panel row-intro"><p className="display">{copy.row.intro}</p></div>
          {stages.map((s) => <Place key={s} stage={s} />)}
          <div className="row-panel row-song">
            <Ml className="row-song-ml">{copy.row.song.ml}</Ml>
            <p className="display row-song-roman">{copy.row.song.roman}</p>
            <p className="row-song-en">{copy.row.song.en}</p>
            <p className="row-song-note">{copy.row.songNote}</p>
          </div>
          <Place stage={SADHYA_STAGES} empty />
          <div className="row-end" aria-hidden="true" />
        </div>
      </div>
    </Scene>
  )
}
