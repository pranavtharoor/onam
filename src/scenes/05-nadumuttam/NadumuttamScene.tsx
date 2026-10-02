import { useMemo, useRef } from 'react'
import { gsap, ScrollTrigger } from '../../core/motion/gsap'
import { pinned } from '../../core/motion/media'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import { useMotionMode } from '../../core/motion/useMotionMode'
import { useCanvasStage } from '../../core/media/useCanvasStage'
import type { SceneProps } from '../../core/scene/types'
import { Nilavilakku } from '../../art/Nilavilakku'
import { rng } from '../../art/random'
import { copy, event } from '../../content'
import { COURTYARD, courtyardOnScreen, courtyardViewBox } from '../shared/courtyardFrame'
import './nadumuttam.css'

const { cx, cy } = COURTYARD
const HALF = 215 // half side of the sky square, inside the pookalam circle (r 380)
const FAR = 2600

/** Where the next scene's iris opens: the lamp flame. Kept in one place so both scenes agree. */
export const FLAME_AT = { x: 0.5, y: 0.8 }

/**
 * Inside the nalukettu, looking up through the nadumuttam at the square of sky,
 * rain from last night dripping off the eaves toward the lens. It match-cuts in
 * through the pookalam's circle (or, while the pookalam is skipped, a square
 * opening grows over the gatehouse's held courtyard earth). Then the camera tilts down to the beam, where
 * the invitation is painted like a Kerala signboard, above a lit nilavilakku.
 * Holds for one viewport: the Sadhya hall irises open from the lamp flame.
 */
export function NadumuttamScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)
  const canvas = useRef<HTMLCanvasElement>(null)
  const mode = useMotionMode()
  const sky = useRef({ x: 0, y: 0, half: 0 })

  const tiles = useMemo(() => {
    // Tile courses on each of the four roof slopes, spaced wider toward the lens (perspective).
    const rows: number[] = []
    let d = HALF + 16
    for (let k = 0; k < 26; k++) { d += 14 + k * k * 0.9; rows.push(d) }
    return rows
  }, [])

  const drops = useMemo(() => {
    const r = rng(505)
    return Array.from({ length: mode === 'desktop' ? 110 : 28 }, () => ({ u: r.jitter(1), v: r.jitter(1), t: r.next(), speed: r.range(0.25, 0.5) }))
  }, [mode])

  useCanvasStage(canvas, {
    // Thin streaks of rain: phones draw them at 1× (and half as many), desktop at up to 1.5×.
    maxDpr: mode === 'desktop' ? 1.5 : 1,
    animate: mode !== 'reduced',
    onResize: () => {
      const svg = root.current?.querySelector<SVGSVGElement>('svg.nm-up')
      if (!svg || !canvas.current) return
      const m = svg.getScreenCTM()
      const box = canvas.current.getBoundingClientRect()
      if (m) sky.current = { x: cx * m.a + m.e - box.left, y: cy * m.d + m.f - box.top, half: HALF * m.a }
    },
    draw: ({ ctx, width, height, dt }) => {
      ctx.clearRect(0, 0, width, height)
      const { x, y, half } = sky.current
      ctx.strokeStyle = 'rgba(236, 229, 210, 0.55)'
      ctx.lineCap = 'round'
      for (const d of drops) {
        d.t += d.speed * dt
        if (d.t > 1) d.t -= 1
        // Falling toward the viewer: drops start inside the sky square and stream outward, growing.
        const k = 1 + d.t * d.t * 3.2
        const px = x + d.u * half * k, py = y + d.v * half * k
        const len = 2 + d.t * d.t * 26
        const dx = d.u, dy = d.v
        const n = Math.hypot(dx, dy) || 1
        ctx.lineWidth = 0.6 + d.t * 1.8
        ctx.globalAlpha = Math.min(1, d.t * 3) * (1 - d.t * 0.6)
        ctx.beginPath()
        ctx.moveTo(px, py)
        ctx.lineTo(px + (dx / n) * len, py + (dy / n) * len)
        ctx.stroke()
      }
      ctx.globalAlpha = 1
    },
  })

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    const svg = q('svg.nm-up')[0] as SVGSVGElement
    // Entry. With the pookalam in the film, its finished circle becomes the opening onto
    // the sky (a match cut). While the pookalam is skipped, a square opening (the shape
    // of the nadumuttam's sky) grows from nothing at the same centre, over the gatehouse's
    // held courtyard earth: stepping through into the open courtyard. Square, not round,
    // so it doesn't repeat the lamp-flame iris that follows this scene.
    const reveal = q('.nm-reveal')[0] as HTMLElement
    const matchCut = !!document.querySelector('[data-scene="pookalam"]')
    ScrollTrigger.create({
      trigger: root, start: 'top bottom', end: 'top top', scrub: true,
      onUpdate: (self) => {
        // Hold the revealed layer still on screen while the section scrolls up underneath,
        // so the opening stays locked onto the (pinned) frame underneath.
        const top = root.getBoundingClientRect().top
        reveal.style.transform = self.progress >= 1 ? '' : `translateY(${(-top).toFixed(1)}px)`
        const c = courtyardOnScreen(svg, reveal)
        const full = Math.hypot(innerWidth, innerHeight)
        if (self.progress >= 1) { reveal.style.clipPath = 'none'; return }
        if (matchCut) {
          const p = gsap.parseEase('power2.in')(self.progress)
          reveal.style.clipPath = `circle(${(c.r + (full - c.r) * p).toFixed(1)}px at ${c.x.toFixed(1)}px ${c.y.toFixed(1)}px)`
        } else {
          const W = innerWidth, H = innerHeight
          const h = Math.max(c.x, W - c.x, c.y, H - c.y) * gsap.parseEase('power1.in')(self.progress)
          const e = (v: number) => `${Math.max(0, v).toFixed(1)}px`
          reveal.style.clipPath = `inset(${e(c.y - h)} ${e(W - c.x - h)} ${e(H - c.y - h)} ${e(c.x - h)})`
        }
      },
      onLeaveBack: () => { reveal.style.clipPath = ''; reveal.style.transform = '' },
    })
    gsap.fromTo(q('#nm-up-art'), { scale: 1.45, svgOrigin: `${cx} ${cy}` }, {
      scale: 1, svgOrigin: `${cx} ${cy}`, ease: 'none',
      scrollTrigger: { trigger: root, start: 'top bottom', end: 'top top', scrub: true },
    })

    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=280%' : '+=240%', pin: true, ...pinned(mode) },
    })
    tl.addLabel('sky')
      .fromTo(q('.nm-lead'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.05 }, 0.02)
      .to(q('.nm-lead'), { autoAlpha: 0, duration: 0.05 }, 0.2)
      .addLabel('tilt-down', 0.22)
      .fromTo(q('.nm-upview'), { yPercent: 0 }, { yPercent: -100, ease: 'sine.inOut', duration: 0.26 }, 0.22)
      .fromTo(q('.nm-wall'), { yPercent: 100 }, { yPercent: 0, ease: 'sine.inOut', duration: 0.26 }, 0.22)
      .addLabel('light-on-the-beam', 0.44)
      .fromTo(q('.nm-sign > *'), { opacity: 0.12 }, { opacity: 1, stagger: 0.035, duration: 0.08 }, 0.44)
      .fromTo(q('.nm-sheen'), { xPercent: -120 }, { xPercent: 120, duration: 0.2 }, 0.44)
      .to({}, { duration: 0.38 }) // read, then hold under the hall's iris
  })

  const vb = courtyardViewBox(mode)
  const slope = (rot: number) => (
    <g transform={`rotate(${rot} ${cx} ${cy})`}>
      <path d={`M${cx - HALF},${cy - HALF} L${cx + HALF},${cy - HALF} L${cx + FAR},${cy - FAR} L${cx - FAR},${cy - FAR}Z`} fill={rot % 180 ? '#7f3119' : 'var(--c-tile)'} />
      <g stroke="#5a1f0f">
        {tiles.map((d, i) => <line key={i} x1={cx - d} x2={cx + d} y1={cy - d} y2={cy - d} strokeWidth={2 + i * 0.6} />)}
      </g>
    </g>
  )

  return (
    <Scene ref={root} {...props} className="s-nadumuttam">
      <div className="scene__stage">
        <div className="nm-reveal fill">
          <div className="nm-upview fill">
            <svg className="fill nm-up" {...vb} aria-hidden="true">
              <g id="nm-up-art">
                <rect x={cx - HALF} y={cy - HALF} width={HALF * 2} height={HALF * 2} fill="#dfe4d8" />
                <path d={`M${cx - 150},${cy - 120} q40,-34 90,-10 q40,-30 80,4 q34,4 30,30 q-100,10 -200,-24Z`} fill="#f2efe4" opacity={0.9} />
                <path d={`M${cx + 30},${cy + 90} q30,-22 70,-6 q30,-20 60,6 q-70,12 -130,0Z`} fill="#f2efe4" opacity={0.7} />
                {[0, 90, 180, 270].map((rot) => <g key={rot}>{slope(rot)}</g>)}
                <g stroke="var(--c-wood)" strokeWidth={10}>
                  {[[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sy]) => <line key={`${sx}${sy}`} x1={cx + sx! * HALF} y1={cy + sy! * HALF} x2={cx + sx! * FAR} y2={cy + sy! * FAR} />)}
                </g>
                <rect x={cx - HALF - 14} y={cy - HALF - 14} width={HALF * 2 + 28} height={HALF * 2 + 28} fill="none" stroke="var(--c-wood)" strokeWidth={28} />
                <rect x={cx - HALF} y={cy - HALF} width={HALF * 2} height={HALF * 2} fill="none" stroke="var(--c-black)" strokeWidth={3} />
              </g>
            </svg>
            <canvas ref={canvas} className="fill" aria-hidden="true" />
            <p className="nm-lead display plaque">{copy.nadumuttam.lead}</p>
          </div>
          <div className="nm-wall fill">
            <div className="nm-rafters" />
            <div className="nm-beam">
              <div className="nm-sign" role="group" aria-label="Invitation">
                <p className="nm-sign-lead">{copy.nadumuttam.beamLead}</p>
                <p className="nm-sign-title">{event.title}</p>
                <p className="nm-sign-when">{event.dayLabel}</p>
                <p className="nm-sign-time"><span className="nm-nowrap">{event.timeLabel},</span> <span className="nm-nowrap">{event.sadhyaLabel}</span></p>
                <p className="nm-sign-where"><span className="nm-nowrap">{event.venue},</span> {event.area}</p>
              </div>
              <div className="nm-sheen" aria-hidden="true" />
            </div>
            <div className="nm-pillar nm-pillar--l" />
            <div className="nm-pillar nm-pillar--r" />
            <div className="nm-floor" />
            <svg className="nm-lamp" viewBox="-60 -10 120 240" aria-hidden="true">
              <Nilavilakku flameClass="nm-flame" />
            </svg>
          </div>
        </div>
      </div>
    </Scene>
  )
}
