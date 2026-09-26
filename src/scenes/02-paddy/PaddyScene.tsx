import { useMemo, useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import { CoconutTree } from '../../art/CoconutTree'
import { rng, blobPath } from '../../art/random'
import { copy } from '../../content'
import './paddy.css'

const W = 2400
const H = 1000
const HORIZON = 520

/** How far each plane travels relative to the nearest ground plane (1 = near ground). */
const DEPTH = { far: 0.3, mid: 0.65, near: 1, fore: 1.45 } as const

/**
 * Dawn over paddy and coconut trees. Crane down from the sky (the frame the backwater
 * scene ended on), then truck right along the bund. Holds its last frame for
 * one viewport: the gatehouse wipes in over it.
 */
export function PaddyScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  const art = useMemo(() => {
    const r = rng(207)
    const farTrees = Array.from({ length: 34 }, (_, i) => ({ x: i * 72 + r.jitter(24), h: r.range(120, 200), lean: r.jitter(30), seed: 400 + i }))
    const fields = Array.from({ length: 7 }, (_, i) => {
      const y0 = HORIZON + 14 + Math.pow(i / 7, 1.5) * 250
      const y1 = HORIZON + 14 + Math.pow((i + 1) / 7, 1.5) * 250
      return { y0, y1, fill: i % 2 ? 'var(--c-paddy)' : '#6c9a33', water: r.next() > 0.55 }
    })
    const stalks = Array.from({ length: 900 }, () => {
      const y = HORIZON + 20 + Math.pow(r.next(), 1.3) * 240
      const d = (y - HORIZON) / 260
      return { x: r.range(0, W), y, h: 3 + d * 12 }
    })
    const egrets = Array.from({ length: 7 }, () => ({ x: r.range(150, W - 150), y: r.range(HORIZON + 60, HORIZON + 220), s: r.range(0.7, 1.2), flip: r.next() > 0.5 }))
    const nearTrees = [
      { x: 140, h: 560, lean: 60, seed: 71 }, { x: 1120, h: 500, lean: -60, seed: 72 }, { x: 1560, h: 580, lean: 80, seed: 73 },
      { x: 2280, h: 540, lean: -40, seed: 75 },
    ]
    const tufts = Array.from({ length: 60 }, () => ({ x: r.range(0, W), y: r.range(880, 1000), s: r.range(0.6, 1.4), seed: Math.floor(r.range(0, 1e6)) }))
    return { farTrees, fields, stalks, egrets, nearTrees, tufts, r }
  }, [])

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    const plane = (name: keyof typeof DEPTH) => q(`.pd-${name}`)[0] as SVGSVGElement
    const nearWidth = () => plane('near').getBoundingClientRect().width
    const travel = (k: keyof typeof DEPTH) => () => -Math.max(0, nearWidth() - window.innerWidth) * DEPTH[k] * (mode === 'desktop' ? 1 : 0.55)
    const crane = mode === 'desktop' ? { far: 30, mid: 55, near: 80, fore: 110 } : { far: 22, mid: 40, near: 60, fore: 85 }

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=320%' : '+=260%', pin: true, scrub: 1, invalidateOnRefresh: true },
    })
    tl.addLabel('crane')
    for (const k of Object.keys(DEPTH) as (keyof typeof DEPTH)[]) {
      tl.fromTo(plane(k), { yPercent: crane[k] }, { yPercent: 0, duration: 0.3 }, 0)
    }
    tl.fromTo(q('.pd-sun'), { yPercent: 10 }, { yPercent: -4, duration: 0.3 }, 0)
      .addLabel('truck', 0.3)
    for (const k of Object.keys(DEPTH) as (keyof typeof DEPTH)[]) {
      tl.to(plane(k), { x: travel(k), duration: 0.55 }, 0.3)
    }
    tl.fromTo(q('.pd-line'), { opacity: 0 }, { opacity: 1, duration: 0.06 }, 0.3)
      .addLabel('hold', 0.85)
      .to({}, { duration: 0.35 }) // held frame under the gatehouse wipe
  })

  const { r } = art
  return (
    <Scene ref={root} {...props} className="s-paddy">
      <div className="scene__stage pd-ground">
        <svg className="fill pd-sky" viewBox={`0 0 1600 ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
          <rect x={-800} y={-2000} width={3200} height={2000 + HORIZON} fill="var(--c-dawn)" />
          <rect x={-800} y={300} width={3200} height={120} fill="#edd29a" />
          <rect x={-800} y={410} width={3200} height={200} fill="var(--c-dawn-pale)" />
          <circle className="pd-sun" cx={1180} cy={470} r={70} fill="#f8ead0" />
        </svg>

        <svg className="plane pd-far" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {art.farTrees.map((p) => <CoconutTree key={p.seed} x={p.x} y={HORIZON + 10} height={p.h} lean={p.lean} seed={p.seed} crown="#2b5541" silhouette />)}
          <rect x={0} y={HORIZON + 4} width={W} height={20} fill="#2b5541" />
        </svg>


        <svg className="plane pd-mid" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          {art.fields.map((f, i) => (
            <g key={i}>
              <rect x={0} y={f.y0} width={W} height={f.y1 - f.y0 + 1} fill={f.fill} />
              {f.water && <rect x={r.range(0, W / 2)} y={f.y0 + 3} width={r.range(300, 900)} height={(f.y1 - f.y0) * 0.35} fill="var(--c-dawn-pale)" opacity={0.55} />}
              <rect x={0} y={f.y1 - 2} width={W} height={2 + i * 0.6} fill="var(--c-earth)" opacity={0.7} />
            </g>
          ))}
          <path d={art.stalks.map((s) => `M${s.x.toFixed(0)},${s.y.toFixed(0)}l1,${(-s.h).toFixed(1)}`).join('')} stroke="#4f7a26" strokeWidth={1.2} strokeLinecap="round" />
          <rect x={0} y={HORIZON + 264} width={W} height={H} fill="var(--c-paddy)" />
          {art.egrets.map((e, i) => (
            <g key={i} transform={`translate(${e.x} ${e.y}) scale(${e.flip ? -e.s : e.s} ${e.s})`}>
              <path d="M0,0 C6,-10 18,-10 22,-4 C26,2 18,8 6,6 C2,5 -2,3 0,0Z" fill="var(--c-thumba)" />
              <path d="M20,-6 C22,-16 24,-24 30,-26 L36,-25 L30,-23 C28,-18 25,-12 22,-4" fill="var(--c-thumba)" />
              <line x1={8} y1={6} x2={7} y2={16} stroke="var(--c-black)" strokeWidth={1} />
              <line x1={13} y1={6} x2={14} y2={16} stroke="var(--c-black)" strokeWidth={1} />
            </g>
          ))}
        </svg>

        <svg className="plane pd-near" viewBox={`0 0 ${W} ${H}`} aria-hidden="true">
          <path d={`M0,${H} L0,820 C400,800 700,760 1100,770 C1500,780 1900,740 ${W},720 L${W},${H}Z`} fill="var(--c-leaf-dark)" />
          <path d={`M0,${H} C300,930 700,880 1200,860 C1700,840 2100,820 ${W},800 L${W},860 C2100,880 1700,900 1200,920 C800,940 400,980 200,${H}Z`} fill="var(--c-laterite)" />
          <path d={`M0,${H} C300,935 700,885 1200,866 C1700,846 2100,826 ${W},806`} stroke="var(--c-black)" strokeWidth={2} fill="none" opacity={0.35} />
          {art.nearTrees.map((p) => <CoconutTree key={p.seed} x={p.x} y={840} height={p.h} lean={p.lean} seed={p.seed} crown="var(--c-leaf-dark)" />)}
          {art.tufts.map((t, i) => <path key={i} d={blobPath(t.x, t.y, 26 * t.s, 10 * t.s, rng(t.seed), 0.3)} fill="#2f5e2c" />)}
        </svg>

        <svg className="plane pd-fore" viewBox={`0 0 ${W} ${H}`} overflow="visible" aria-hidden="true">
          {/* Close-up coconut trees passing the lens. Their crowns sit at the top of the
              frame, so they are visible during the crane down — never a headless trunk. */}
          {[{ x: 700, lean: 40, seed: 91 }, { x: 1750, lean: -50, seed: 92 }, { x: 2330, lean: 30, seed: 93 }].map((t) => (
            <CoconutTree key={t.seed} x={t.x} y={H + 40} height={1180} lean={t.lean} seed={t.seed} crown="var(--c-leaf-dark)" />
          ))}
        </svg>

        <p className="pd-line display plaque">{copy.paddy.line}</p>
      </div>
    </Scene>
  )
}
