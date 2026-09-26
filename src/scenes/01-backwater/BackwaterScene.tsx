import { useMemo, useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { pinned } from '../../core/motion/media'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import { CoconutTree } from '../../art/CoconutTree'
import { rng } from '../../art/random'
import { copy, event } from '../../content'
import { DetailsJump } from '../../components/DetailsJump'
import './backwater.css'

const LAMP = { x: 860, y: 548 }
const HORIZON = 560
const SKY_NIGHT = ['#141c30', '#1a2440', '#212e4d', '#2a3858', '#34425f']
const SKY_DAWN = '#e9c98b'
const DAWN_RAMP = ['#4a4468', '#9a6f7e', '#d9a383', SKY_DAWN]

/**
 * Pre-dawn backwater. The only trace of Maveli is the reflection of a palm-leaf
 * umbrella (olakkuda) crossing the water; as it passes, it uncovers the turn
 * line. Then the camera tilts up into first light, ending on a frame of pure
 * dawn sky, which is exactly where the paddy scene begins.
 */
export function BackwaterScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  const art = useMemo(() => {
    const r = rng(11)
    const ripples = Array.from({ length: 90 }, () => {
      const y = HORIZON + 12 + Math.pow(r.next(), 1.6) * 430
      const depth = (y - HORIZON) / 440
      return { x: r.range(-100, 1700), y, w: 20 + depth * 120 * r.range(0.5, 1.2), o: 0.08 + depth * 0.22 }
    })
    const reflection = Array.from({ length: 16 }, (_, i) => ({ y: HORIZON + 10 + i * 14 + r.jitter(3), w: 6 + i * 1.3 + r.jitter(3), dx: r.jitter(4 + i) }))
    const stars = Array.from({ length: 26 }, () => ({ x: r.range(0, 1600), y: r.range(20, 330), s: r.range(0.8, 2) }))
    return { ripples, reflection, stars }
  }, [])

  useScene(root, ({ root, mode, q }) => {
    const turn = q('.bw-turn')
    if (mode === 'reduced') {
      gsap.set(turn, { clipPath: 'inset(0 0% 0 0)' })
      gsap.set(q('#bw-olakkuda'), { x: 1000 })
      return
    }
    const push = mode === 'desktop' ? 1.45 : 1.3
    // Camera on the water and the bank. Desktop moves the groups inside their SVGs.
    // Phones move the whole layer SVGs with CSS transforms instead: composited, so
    // Safari doesn't re-rasterise the palms every frame. Same picture either way,
    // because each layer SVG has the same viewBox and box as the one they replaced.
    const stage = q('.bw-ground')[0] as HTMLElement
    const fit = () => {
      const W = stage.clientWidth, H = stage.clientHeight, k = Math.max(W / 1600, H / 1000)
      return { k, x: (W - 1600 * k) / 2 + LAMP.x * k, y: (H - 1000 * k) / 2 + LAMP.y * k }
    }
    const layer = (name: 'bank' | 'water') => (mode === 'desktop' ? q(`#bw-${name}`) : q(`.bw-layer--${name}`))
    const about = mode === 'desktop' ? { svgOrigin: `${LAMP.x} ${LAMP.y}` } : { transformOrigin: () => { const f = fit(); return `${f.x}px ${f.y}px` } }
    const drop = mode === 'desktop' ? 1150 : () => 1150 * fit().k
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=230%' : '+=190%', pin: true, ...pinned(mode), invalidateOnRefresh: true },
    })
    tl.addLabel('push')
      .to(layer('bank'), { scale: push, ...about }, 0)
      .to(layer('water'), { scale: push * 1.08, ...about }, 0)
      .to(q('#bw-stars'), { scale: 1.08, svgOrigin: `${LAMP.x} ${LAMP.y}` }, 0)
      .to(q('.bw-opening'), { opacity: 0, y: -30, duration: 0.14 }, 0.16)
      // The details tag leaves with the opening; autoAlpha also takes it out of the tab order.
      .to(q('.bw-details'), { autoAlpha: 0, y: 16, duration: 0.1 }, 0.16)
      .addLabel('umbrella', 0.12)
      .fromTo(q('#bw-olakkuda'), { x: -520 }, { x: 2200, duration: 0.5 }, 0.12)
      // The passing reflection uncovers the line, left to right.
      .fromTo(turn, { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.26 }, 0.3)
      .addLabel('first-light', 0.64)
      .to(layer('bank'), { y: drop, duration: 0.3 }, 0.64)
      .to(layer('water'), { y: drop, duration: 0.3 }, 0.64)
      .to(q('#bw-stars'), { y: 240, opacity: 0, duration: 0.26 }, 0.64)
      .to(turn, { y: () => window.innerHeight * 0.45, opacity: 0, duration: 0.2 }, 0.66)
    // A real dawn ramp (indigo → mauve → peach → first light), not a straight blend through grey.
    const step = 0.28 / DAWN_RAMP.length
    SKY_NIGHT.forEach((_, i) => {
      const at = 0.66 + (SKY_NIGHT.length - 1 - i) * 0.012
      DAWN_RAMP.forEach((fill, k) => tl.to(q(`#bw-sky-${i}`), { fill, duration: step }, at + k * step))
    })
    DAWN_RAMP.forEach((backgroundColor, k) => tl.to(q('.bw-ground'), { backgroundColor, duration: step }, 0.66 + k * step))
    tl.to({}, { duration: 0.06 }) // settle on pure dawn before the paddy rises in
  })

  return (
    <Scene ref={root} {...props} className="s-backwater">
      <div className="scene__stage bw-ground">
        <svg className="fill" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g id="bw-sky">
            {SKY_NIGHT.map((c, i) => (
              <rect key={c} id={`bw-sky-${i}`} x={-400} y={-600 + i * 230} width={2400} height={i === SKY_NIGHT.length - 1 ? 2000 : 240} fill={c} />
            ))}
          </g>
          <g id="bw-stars" fill="var(--c-lime)">
            {art.stars.map((s, i) => <circle key={i} cx={s.x} cy={s.y} r={s.s} opacity={0.5} />)}
          </g>
        </svg>
        <svg className="fill bw-layer bw-layer--water" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g id="bw-water">
            <rect x={-400} y={HORIZON} width={2400} height={900} fill="var(--c-indigo-deep)" />
            <g className="bw-ripples" data-ambient stroke="var(--c-lime)" strokeLinecap="round">
              {[0, 1, 2, 3].map((band) => {
                const inBand = art.ripples.filter((p) => Math.min(3, Math.floor(((p.y - HORIZON) / 440) * 4)) === band)
                return <path key={band} d={inBand.map((p) => `M${p.x.toFixed(0)},${p.y.toFixed(0)}h${p.w.toFixed(0)}`).join('')} strokeWidth={1 + band * 0.7} opacity={0.1 + band * 0.07} />
              })}
            </g>
            <g stroke="var(--c-yellow-ochre)" strokeLinecap="round">
              {art.reflection.map((p, i) => <line key={i} x1={LAMP.x - p.w + p.dx} x2={LAMP.x + p.w + p.dx} y1={p.y} y2={p.y} strokeWidth={2.4} opacity={0.75 - i * 0.04} />)}
            </g>
            {/* Olakkuda reflection: an inverted palm-leaf umbrella, broken by ripples. */}
            <g id="bw-olakkuda" opacity={0.9}>
              <g transform="translate(0 800)">
                <path d="M-150,0 Q-140,-14 0,-18 Q140,-14 150,0 Q120,70 0,92 Q-120,70 -150,0Z" fill="#0b0f1c" />
                <g stroke="#1f2a45" strokeWidth={2}>
                  {[-110, -70, -32, 0, 32, 70, 110].map((x) => <line key={x} x1={x * 0.2} y1={86} x2={x} y2={-8} />)}
                </g>
                <rect x={-3} y={-150} width={6} height={140} fill="#0b0f1c" />
                <g fill="var(--c-indigo-deep)">
                  {[12, 30, 50, 72].map((y) => <rect key={y} x={-170} y={y} width={340} height={3} />)}
                </g>
              </g>
            </g>
          </g>
        </svg>
        <svg className="fill bw-layer bw-layer--bank" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
          <g id="bw-bank">
            <path d={`M-400,${HORIZON} L-400,${HORIZON - 14} Q300,${HORIZON - 26} 800,${HORIZON - 18} T2000,${HORIZON - 16} L2000,${HORIZON}Z`} fill="var(--c-black)" />
            {/* Two houses on the far bank: steep roof with a small eave over a short wall that
                runs down to HORIZON, below the bank's curved top edge, so they always stand on it. */}
            <path d={[
              `M526,${HORIZON} V${HORIZON - 36} H514 L560,${HORIZON - 66} L606,${HORIZON - 36} H594 V${HORIZON}Z`,
              `M1150,${HORIZON} V${HORIZON - 38} H1136 L1195,${HORIZON - 76} L1254,${HORIZON - 38} H1240 V${HORIZON}Z`,
            ].join(' ')} fill="var(--c-black)" />
            {[
              { x: 120, h: 300, lean: 30, seed: 3 }, { x: 330, h: 240, lean: -20, seed: 5 }, { x: 640, h: 330, lean: 45, seed: 8 },
              { x: 1010, h: 260, lean: -35, seed: 13 }, { x: 1300, h: 340, lean: 25, seed: 21 }, { x: 1500, h: 250, lean: -15, seed: 34 },
            ].map((p) => <CoconutTree key={p.seed} x={p.x} y={HORIZON - 12} height={p.h} lean={p.lean} seed={p.seed} crown="var(--c-black)" silhouette />)}
            {/* Nilavilakku on the far bank */}
            <g transform={`translate(${LAMP.x} ${LAMP.y})`}>
              <circle r={34} fill="var(--c-yellow-ochre)" opacity={0.18} />
              <circle r={14} fill="var(--c-yellow-ochre)" opacity={0.35} />
              <path d="M-7,6 h14 l-3,4 h-8z M-2,10 h4 v6 h-4z" fill="var(--c-brass)" />
              <path d="M0,-12 C4,-6 4,0 0,3 C-4,0 -4,-6 0,-12Z" fill="#ffd98a" />
            </g>
          </g>
        </svg>
        <div className="bw-copy">
          <div className="bw-opening">
            <p className="bw-kicker">{copy.backwater.kicker}</p>
            <h1 className="display bw-headline">{copy.backwater.headline}</h1>
            <p className="bw-neighbours">{copy.backwater.neighbours} <span className="display bw-venue">{event.community}</span>.</p>
          </div>
          <DetailsJump className="bw-details" />
          <p className="display bw-turn">{copy.backwater.turn}</p>
        </div>
      </div>
    </Scene>
  )
}
