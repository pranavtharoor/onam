import { useMemo, useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { pinned } from '../../core/motion/media'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import { useMotionMode } from '../../core/motion/useMotionMode'
import type { SceneProps } from '../../core/scene/types'
import { RINGS, PetalDefs, ringBase, ringPetals, FLOWER_COLOR } from '../../art/pookalam'
import { rng } from '../../art/random'
import { Ml } from '../../components/Ml'
import { copy } from '../../content'
import { COURTYARD, courtyardViewBox } from '../shared/courtyardFrame'
import './pookalam.css'

const { cx, cy } = COURTYARD
const SANDAL_COLORS = ['#1d1a18', '#2c4a7a', '#6b3a1e', '#7a1f2b', '#1d1a18', '#3d5a3a', '#8a6a2a', '#1d1a18', '#5a2a4a', '#2a2a2a']

/**
 * The muttam, seen from above. Ten mornings, Atham to Thiruvonam: each scroll
 * "day" hands add a ring of named flowers while the camera pulls back, and a
 * new pair of sandals appears at the verandah step as family arrives.
 * Holds the finished pookalam for one viewport: the nadumuttam match-cuts in
 * through its circle.
 */
export function PookalamScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)
  const mode = useMotionMode()
  const density = mode === 'mobile' ? 0.4 : 0.75

  const art = useMemo(() => {
    const r = rng(404)
    const rings = RINGS.map((spec) => ({ base: ringBase(cx, cy, spec, r), petals: ringPetals(cx, cy, spec, density, r) }))
    const specks = Array.from({ length: 700 }, () => ({ x: r.range(-400, 2000), y: r.range(80, 1500), s: r.range(0.6, 2.2), o: r.range(0.08, 0.3) }))
    const sandals = Array.from({ length: 10 }, (_, i) => {
      const side = i % 2 ? 1 : -1
      const k = Math.floor(i / 2)
      return { x: cx + side * (250 + k * 78 + r.jitter(10)), y: 118 + r.jitter(8), rot: r.jitter(14), color: SANDAL_COLORS[i]!, gap: r.range(18, 26) }
    })
    return { rings, specks, sandals }
  }, [density])

  useScene(root, ({ root, mode, q }) => {
    const days = q('.pk-day')
    if (mode === 'reduced') {
      gsap.set(days.slice(0, -1), { autoAlpha: 0 })
      return
    }
    const seg = 0.08
    const petalScale = (_: number, el: Element) => Number((el as HTMLElement).dataset.s ?? 1)
    // Atham is laid while the courtyard slides in under the doorway: no dead scroll at the seam.
    gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: 1 } })
      .fromTo(q('.pk-ring-0 .pk-base'), { opacity: 0 }, { opacity: 1, duration: 0.5 }, 0.2)
      .fromTo(q('.pk-ring-0 .pk-petal'), { scale: 0, transformOrigin: '50% 50%' }, { scale: petalScale, ease: 'power2.out', duration: 0.3, stagger: { amount: 0.5, from: 'random' } }, 0.2)
      .fromTo(q('.pk-sandal-0'), { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, duration: 0.3 }, 0.6)
      .fromTo(days[0]!, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.3 }, 0.5)
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=380%' : '+=320%', pin: true, ...pinned(mode), invalidateOnRefresh: true },
    })
    if (mode === 'desktop') {
      tl.fromTo(q('#pk-world'), { scale: 3.4, svgOrigin: `${cx} ${cy}` }, { scale: 1, svgOrigin: `${cx} ${cy}`, duration: 0.8 }, 0.02)
    } else {
      // Phones: pull back by scaling the whole SVG element (its own composited layer), so
      // each petal that lands repaints a small patch instead of Safari re-rasterising
      // every petal on every frame. Scaled about the courtyard centre on screen: the
      // same picture as scaling #pk-world inside the SVG (viewBox 400 120 800 800, meet).
      const art = q('svg.pk-art')[0] as SVGSVGElement
      const origin = () => {
        const W = art.parentElement!.clientWidth, H = art.parentElement!.clientHeight, k = Math.min(W / 800, H / 800)
        return `${(W - 800 * k) / 2 + (cx - 400) * k}px ${(H - 800 * k) / 2 + (cy - 120) * k}px`
      }
      tl.fromTo(art, { scale: 2.8, transformOrigin: origin }, { scale: 1, transformOrigin: origin, duration: 0.8 }, 0.02)
    }
    tl.fromTo(q('.pk-intro'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.04 }, 0)
      .to(q('.pk-intro'), { autoAlpha: 0, duration: 0.04 }, 0.3)
    RINGS.forEach((_, i) => {
      const t = 0.05 + (i - 1) * seg
      if (i === 0) {
        tl.addLabel('day-1', 0).to(days[0]!, { autoAlpha: 0, duration: seg * 0.25 }, 0.05 - seg * 0.2)
        return
      }
      tl.addLabel(`day-${i + 1}`, t)
        .fromTo(q(`.pk-ring-${i} .pk-base`), { opacity: 0 }, { opacity: 1, duration: seg * 0.6 }, t)
        .fromTo(q(`.pk-ring-${i} .pk-petal`), { scale: 0, transformOrigin: '50% 50%' }, { scale: petalScale, ease: 'power2.out', duration: seg * 0.35, stagger: { amount: seg * 0.55, from: 'random' } }, t)
        .fromTo(q(`.pk-sandal-${i}`), { autoAlpha: 0, y: -24 }, { autoAlpha: 1, y: 0, ease: 'power2.out', duration: seg * 0.4 }, t + seg * 0.3)
      if (days[i]) {
        tl.fromTo(days[i], { autoAlpha: 0 }, { autoAlpha: 1, duration: seg * 0.25 }, t)
        if (i < RINGS.length - 1) tl.to(days[i], { autoAlpha: 0, duration: seg * 0.25 }, t + seg * 0.8)
      }
    })
    tl.addLabel('finished', 0.8)
      .fromTo(q('.pk-outro'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.8)
      .to({}, { duration: 0.34 }) // held frame under the nadumuttam match cut
  })

  const vb = courtyardViewBox(mode)
  return (
    <Scene ref={root} {...props} className="s-pookalam">
      <div className="scene__stage">
        <svg className="fill pk-art" {...vb} aria-hidden="true">
          <PetalDefs />
          <g id="pk-world">
            <rect x={-2000} y={-2000} width={5600} height={5600} fill="var(--c-earth)" />
            <path stroke="var(--c-black)" opacity={0.2} strokeLinecap="round" strokeWidth={3} d={art.specks.map((s) => `M${s.x.toFixed(0)},${s.y.toFixed(0)}h0.1`).join('')} />
            {/* Verandah: red-oxide floor, laterite step */}
            <rect x={-2000} y={-3000} width={5600} height={3070} fill="var(--c-oxide)" />
            <rect x={-2000} y={62} width={5600} height={6} fill="#4a160f" />
            <rect x={-2000} y={68} width={5600} height={26} fill="var(--c-laterite)" />
            <rect x={-2000} y={94} width={5600} height={4} fill="#4a1f12" opacity={0.6} />
            {art.sandals.map((s, i) => (
              <g key={i} className={`pk-sandal-${i}`} transform={`translate(${s.x} ${s.y}) rotate(${s.rot})`}>
                {[-1, 1].map((side) => (
                  <g key={side} transform={`translate(${(side * s.gap) / 2} 0) rotate(${side * 4})`}>
                    <path d="M0,-26 C9,-26 11,-12 10,0 C9,16 8,24 0,26 C-8,24 -9,16 -10,0 C-11,-12 -9,-26 0,-26Z" fill={s.color} />
                    <path d="M-8,-4 L0,-16 L8,-4" stroke="#d8cdb4" strokeWidth={2.4} fill="none" strokeLinecap="round" />
                  </g>
                ))}
              </g>
            ))}
            {art.rings.map((ring, i) => (
              <g key={i} className={`pk-ring-${i}`}>
                {ring.base.map((b, k) => <path key={k} className="pk-base" d={b.d} fill={FLOWER_COLOR[b.flower]} />)}
                {ring.petals.map((p, k) => (
                  <use key={k} className="pk-petal" href={`#fl-${p.flower}`} data-s={p.s.toFixed(2)} transform={`translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.rot.toFixed(0)}) scale(${p.s.toFixed(2)})`} />
                ))}
              </g>
            ))}
          </g>
        </svg>
        <div className="pk-copy">
          <p className="pk-intro display">{copy.pookalam.intro}</p>
          <ol className="pk-days" aria-label="The ten days of Onam">
            {copy.pookalam.days.map((d, i) => (
              <li key={d.en} className="pk-day">
                <span className="pk-day-n">Day {i + 1}</span>
                <Ml className="pk-day-ml">{d.ml}</Ml>
                <span className="pk-day-en">{d.en}</span>
              </li>
            ))}
          </ol>
          <p className="pk-outro display">{copy.pookalam.outro}</p>
        </div>
      </div>
    </Scene>
  )
}
