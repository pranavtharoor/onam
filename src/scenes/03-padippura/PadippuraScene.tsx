import { useMemo, useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { pinned } from '../../core/motion/media'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import { BananaPlant } from '../../art/BananaPlant'
import { rng } from '../../art/random'
import { Ml } from '../../components/Ml'
import { copy } from '../../content'
import './padippura.css'

/** Doorway geometry in SVG units (viewBox 1600×1000). The earth seen through it is the fly-through target. */
const DOOR = { x: 712, y: 548, w: 176, h: 312 }
const EARTH = { x: DOOR.x, y: DOOR.y + 70, w: DOOR.w, h: DOOR.h - 70 }
const ORIGIN = { x: EARTH.x + EARTH.w / 2, y: EARTH.y + EARTH.h / 2 }

/**
 * The gatehouse. Enters by a coconut-trunk occlusion wipe over the paddy's held
 * frame; the camera then walks up to the lintel (സ്വാഗതം, "welcome") and flies
 * through the doorway until the courtyard's earth fills the frame — the first
 * frame of the pookalam scene. While the pookalam is skipped, it holds that earth
 * frame for one viewport and the nadumuttam irises open over it.
 */
export function PadippuraScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  const art = useMemo(() => {
    const r = rng(303)
    const blocks: { x: number; y: number; w: number }[] = []
    for (let row = 0; row < 9; row++) {
      let x = row % 2 ? -60 : -20
      while (x < 1700) {
        const w = r.range(70, 110)
        blocks.push({ x, y: 600 + row * 30, w })
        x += w + 4
      }
    }
    const pits = Array.from({ length: 500 }, () => ({ x: r.range(-60, 1660), y: r.range(600, 870), s: r.range(0.8, 2.4) }))
    return { blocks, pits }
  }, [])

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    const svg = q('svg.pp-art')[0] as SVGSVGElement
    // Scale about the earth-in-doorway so it covers the whole viewport, whatever the aspect ratio.
    const flyScale = () => {
      const m = svg.getScreenCTM()
      if (!m) return 8
      const rect = root.getBoundingClientRect()
      const px = ORIGIN.x * m.a + m.e - rect.left
      const py = ORIGIN.y * m.d + m.f - rect.top
      // The opened door leaves cover 22 units of each side of the earth: fill the gap between them.
      const halfW = ((EARTH.w - 2 * 22) * m.a) / 2, halfH = (EARTH.h * m.d) / 2
      // …and far enough that the courtyard details at the top of the doorway have left the frame.
      const clearTop = py / ((ORIGIN.y - (EARTH.y + 40)) * m.d)
      return Math.max(Math.max(px, innerWidth - px) / halfW, Math.max(py, innerHeight - py) / halfH, clearTop) * 1.06
    }

    // Entry: the wipe follows a coconut trunk crossing the lens, right to left.
    // The clipped layer's content is static during the wipe: give it its own layer
    // so each frame only moves the clip edge instead of repainting the gatehouse.
    const trunk = q('.pp-trunk')[0] as HTMLElement
    gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: root, start: 'top bottom', end: 'top top', scrub: true, invalidateOnRefresh: true,
        onToggle: (self) => { svg.style.willChange = self.isActive ? 'transform' : '' },
      },
    })
      .fromTo(q('.pp-reveal'), { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)' }, 0)
      // left: 100% → 0 as a transform (no layout per frame).
      .fromTo(trunk, { x: 0, xPercent: 0 }, { x: () => -(trunk.offsetParent as HTMLElement | null ?? root).clientWidth, xPercent: -100 }, 0)

    // If the next scene overlaps this one (today: the nadumuttam iris, while the pookalam
    // is skipped), hold the all-earth last frame for one viewport underneath it. Same pace
    // either way: the fly-through keeps its length and the hold adds 100% on top.
    const next = root.nextElementSibling as HTMLElement | null
    const holdEnd = next?.dataset[`entry${mode === 'desktop' ? 'Desktop' : 'Mobile'}`] === 'overlap'
    const length = mode === 'desktop' ? 240 : 200
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: `+=${length + (holdEnd ? 100 : 0)}%`, pin: true, ...pinned(mode), invalidateOnRefresh: true },
    })
    tl.addLabel('approach')
      .to(q('#pp-house'), { scale: 1.55, svgOrigin: `${ORIGIN.x} ${ORIGIN.y}`, duration: 0.35 }, 0)
      .to(q('#pp-plants-l'), { x: -380, scale: 1.4, svgOrigin: '200 1000', duration: 0.35 }, 0)
      .to(q('#pp-plants-r'), { x: 380, scale: 1.4, svgOrigin: '1400 1000', duration: 0.35 }, 0)
      .fromTo(q('.pp-caption'), { opacity: 0 }, { opacity: 1, duration: 0.08 }, 0.12)
      .addLabel('read-lintel', 0.35)
      .to({}, { duration: 0.15 })
      .addLabel('fly-through', 0.5)
      .to(q('.pp-caption'), { opacity: 0, duration: 0.08 }, 0.5)
      .to(q('#pp-house'), { scale: flyScale, svgOrigin: `${ORIGIN.x} ${ORIGIN.y}`, duration: 0.5, ease: 'power2.in' }, 0.5)
      .to(q('#pp-plants-l'), { x: -1400, duration: 0.3 }, 0.5)
      .to(q('#pp-plants-r'), { x: 1400, duration: 0.3 }, 0.5)
    if (holdEnd) tl.addLabel('hold-earth', 1).to({}, { duration: 100 / length })
  })

  return (
    <Scene ref={root} {...props} className="s-padippura">
      <div className="scene__stage">
        <div className="pp-reveal fill">
          <svg className="fill pp-art" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <rect x={-600} y={-600} width={2800} height={2200} fill="var(--c-dawn)" />
            <rect x={-600} y={560} width={2800} height={1100} fill="#9a6a3c" />
            <g id="pp-house">
              {/* Compound wall of laterite blocks */}
              <rect x={-600} y={596} width={2800} height={284} fill="var(--c-laterite)" />
              <path fill="#b35a36" d={art.blocks.map((b) => `M${b.x.toFixed(0)},${b.y}h${b.w.toFixed(0)}v26h${(-b.w).toFixed(0)}z`).join('')} />
              <path stroke="#6f2f19" opacity={0.55} strokeLinecap="round" d={art.pits.map((p) => `M${p.x.toFixed(0)},${p.y.toFixed(0)}h0.1`).join('')} strokeWidth={3.2} />
              <rect x={-600} y={582} width={2800} height={18} fill="#5b2a17" />
              <path d="M-600,578 L2200,578 L2200,560 Q800,548 -600,560Z" fill="var(--c-tile)" />
              {/* Gatehouse body */}
              <rect x={600} y={500} width={400} height={380} fill="#c8a57a" />
              <rect x={600} y={500} width={400} height={380} fill="none" stroke="var(--c-black)" strokeWidth={3} />
              {/* Doorway: through it, the courtyard's swept earth */}
              <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={DOOR.h} fill="#2a1a10" />
              <rect x={EARTH.x} y={EARTH.y} width={EARTH.w} height={EARTH.h} fill="var(--c-earth)" />
              {/* The house beyond: tiled roof, lime-washed wall, dark verandah */}
              <rect x={DOOR.x} y={DOOR.y} width={DOOR.w} height={30} fill="var(--c-dawn-pale)" />
              <path d={`M${DOOR.x},${DOOR.y + 44} L${DOOR.x + 30},${DOOR.y + 22} L${DOOR.x + DOOR.w - 30},${DOOR.y + 22} L${DOOR.x + DOOR.w},${DOOR.y + 44}Z`} fill="var(--c-tile)" />
              <rect x={DOOR.x} y={DOOR.y + 44} width={DOOR.w} height={26} fill="#e4d9bf" />
              <rect x={DOOR.x + 40} y={DOOR.y + 50} width={96} height={20} fill="#2a1a10" />
              {[DOOR.x + 48, DOOR.x + 86, DOOR.x + 124].map((x) => <rect key={x} x={x} y={DOOR.y + 48} width={4} height={22} fill="var(--c-wood)" />)}
              {/* Far edge of the courtyard: a sunlit strip and the pookalam, small, in perspective.
                  All above the fly-through origin, so they sweep out of frame and the seam stays earth. */}
              <rect x={EARTH.x} y={EARTH.y} width={EARTH.w} height={16} fill="#8a4e2e" />
              <g transform={`translate(${ORIGIN.x} ${EARTH.y + 30})`}>
                {[['var(--c-leaf)', 44], ['var(--c-chendumalli)', 37], ['var(--c-chethi)', 30], ['var(--c-thumba)', 21], ['var(--c-mukkutti)', 12]].map(([c, rx]) => (
                  <ellipse key={String(rx)} rx={Number(rx)} ry={Number(rx) * 0.2} fill={String(c)} />
                ))}
              </g>
              {/* Door leaves, opened inward */}
              <path d={`M${DOOR.x},${DOOR.y} l22,8 v${DOOR.h - 16} l-22,8Z`} fill="#4a2c18" />
              <path d={`M${DOOR.x + DOOR.w},${DOOR.y} l-22,8 v${DOOR.h - 16} l22,8Z`} fill="#4a2c18" />
              <rect x={DOOR.x - 14} y={DOOR.y - 6} width={14} height={DOOR.h + 6} fill="var(--c-wood)" />
              <rect x={DOOR.x + DOOR.w} y={DOOR.y - 6} width={14} height={DOOR.h + 6} fill="var(--c-wood)" />
              {/* Lintel with painted lettering */}
              <rect x={640} y={500} width={320} height={50} fill="var(--c-wood)" />
              <text x={800} y={538} textAnchor="middle" className="pp-lintel" fill="var(--c-yellow-ochre)" stroke="var(--c-red-ochre)" strokeWidth={1.2} paintOrder="stroke" lang="ml">
                {copy.padippura.lintel.ml}
              </text>
              {/* Steps */}
              <rect x={690} y={860} width={220} height={16} fill="#8b7355" />
              <rect x={670} y={876} width={260} height={16} fill="#7a6248" />
              <rect x={650} y={892} width={300} height={18} fill="#6a543e" />
              {/* Roof: steep tiled hip roof with a front gable lattice */}
              <path d="M520,505 L1080,505 L960,330 L640,330Z" fill="var(--c-tile)" />
              <g stroke="#6a2814" strokeWidth={3}>
                {Array.from({ length: 9 }, (_, i) => {
                  const y = 350 + i * 19
                  const t = (y - 330) / 175
                  return <line key={i} x1={640 - 120 * t} x2={960 + 120 * t} y1={y} y2={y} />
                })}
              </g>
              <path d="M700,330 L800,238 L900,330Z" fill="var(--c-tile)" />
              <path d="M726,330 L800,262 L874,330Z" fill="var(--c-wood)" />
              <g stroke="#c8a57a" strokeWidth={2}>
                {[740, 760, 780, 800, 820, 840, 860].map((x) => <line key={x} x1={x} y1={330} x2={x} y2={330 - (74 - Math.abs(x - 800)) * 0.92} />)}
              </g>
              <path d="M510,505 L1090,505 L1090,516 L510,516Z" fill="var(--c-wood)" />
              <path d="M520,505 L640,330 L960,330 L1080,505" stroke="var(--c-black)" strokeWidth={3} fill="none" />
            </g>
            <g id="pp-plants-l">
              <BananaPlant x={160} y={1000} height={760} seed={31} />
              <BananaPlant x={380} y={1020} height={560} seed={32} flip />
            </g>
            <g id="pp-plants-r">
              <BananaPlant x={1430} y={1000} height={780} seed={33} flip />
              <BananaPlant x={1230} y={1030} height={520} seed={34} />
            </g>
          </svg>
          <p className="pp-caption plaque">
            <Ml className="pp-caption-ml">{copy.padippura.lintel.ml}</Ml>
            <span>{copy.padippura.lintel.roman}, “{copy.padippura.lintel.en}”</span>
          </p>
        </div>
        <div className="pp-trunk" aria-hidden="true" />
      </div>
    </Scene>
  )
}
