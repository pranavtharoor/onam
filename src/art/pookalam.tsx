import { rng, fmt as f, type Rng } from './random'

export type Flower = 'thumba' | 'mukkutti' | 'chethi' | 'chendumalli' | 'vadamalli' | 'shankhu' | 'leaf'

export const FLOWER_COLOR: Record<Flower, string> = {
  thumba: 'var(--c-thumba)',
  mukkutti: 'var(--c-mukkutti)',
  chethi: 'var(--c-chethi)',
  chendumalli: 'var(--c-chendumalli)',
  vadamalli: 'var(--c-vadamalli)',
  shankhu: 'var(--c-shankhu)',
  leaf: 'var(--c-leaf)',
}

/** One ring of the pookalam = one morning. Inner ring (Atham) first. */
export interface RingSpec {
  r0: number
  r1: number
  /** Base fill; when `segments` is set, alternates between `flowers`. */
  flowers: Flower[]
  segments?: number
  /** Scalloped outer edge: number of lobes. */
  lobes?: number
}

export const RINGS: RingSpec[] = [
  { r0: 0, r1: 42, flowers: ['mukkutti'] },
  { r0: 42, r1: 76, flowers: ['thumba'] },
  { r0: 76, r1: 112, flowers: ['chethi'], lobes: 12 },
  { r0: 112, r1: 150, flowers: ['chendumalli'] },
  { r0: 150, r1: 186, flowers: ['leaf'] },
  { r0: 186, r1: 226, flowers: ['vadamalli', 'thumba'], segments: 16 },
  { r0: 226, r1: 262, flowers: ['mukkutti'], lobes: 20 },
  { r0: 262, r1: 302, flowers: ['chethi'], lobes: 24 },
  { r0: 302, r1: 342, flowers: ['shankhu', 'chendumalli'], segments: 24 },
  { r0: 342, r1: 380, flowers: ['leaf'], lobes: 32 },
]

const TAU = Math.PI * 2

/** Closed polar outline r(θ) with hand-placed irregularity. */
function polar(cx: number, cy: number, radius: (a: number) => number, n: number, reverse = false) {
  const pts = Array.from({ length: n }, (_, i) => {
    const a = ((reverse ? n - i : i) / n) * TAU
    const rr = radius(a)
    return `${f(cx + Math.cos(a) * rr)},${f(cy + Math.sin(a) * rr)}`
  })
  return `M${pts.join('L')}Z`
}

export function ringBase(cx: number, cy: number, spec: RingSpec, r: Rng) {
  const noise = Array.from({ length: 360 }, () => r.jitter(1.6))
  const outer = (a: number) => {
    const lobe = spec.lobes ? Math.pow(Math.abs(Math.sin((a * spec.lobes) / 2)), 0.6) * (spec.r1 - spec.r0) * 0.28 : 0
    return spec.r1 - lobe + noise[Math.floor((a / TAU) * 359)]!
  }
  const inner = (a: number) => spec.r0 + noise[(Math.floor((a / TAU) * 359) + 97) % 360]! * 0.7
  const n = spec.lobes ? spec.lobes * 12 : 180
  if (spec.r0 === 0) return [{ d: polar(cx, cy, outer, n), flower: spec.flowers[0]! }]
  if (!spec.segments) return [{ d: polar(cx, cy, outer, n) + polar(cx, cy, inner, 180, true), flower: spec.flowers[0]! }]
  // Alternating wedges.
  return Array.from({ length: spec.segments }, (_, s) => {
    const a0 = (s / spec.segments!) * TAU, a1 = ((s + 1) / spec.segments!) * TAU
    const steps = 8
    const out = Array.from({ length: steps + 1 }, (_, k) => { const a = a0 + ((a1 - a0) * k) / steps; return `${f(cx + Math.cos(a) * outer(a))},${f(cy + Math.sin(a) * outer(a))}` })
    const inn = Array.from({ length: steps + 1 }, (_, k) => { const a = a1 - ((a1 - a0) * k) / steps; return `${f(cx + Math.cos(a) * inner(a))},${f(cy + Math.sin(a) * inner(a))}` })
    return { d: `M${out.join('L')}L${inn.join('L')}Z`, flower: spec.flowers[s % spec.flowers.length]! }
  })
}

/** Loose petals / florets scattered over a ring: the texture of flowers placed by hand. */
export function ringPetals(cx: number, cy: number, spec: RingSpec, density: number, r: Rng) {
  const area = Math.PI * (spec.r1 * spec.r1 - spec.r0 * spec.r0)
  const count = Math.round((area / 420) * density)
  return Array.from({ length: count }, () => {
    const a = r.next() * TAU
    const rr = Math.sqrt(r.range(spec.r0 * spec.r0, spec.r1 * spec.r1)) * 0.97
    const seg = spec.segments ? Math.floor((a / TAU) * spec.segments) : 0
    return {
      x: cx + Math.cos(a) * rr,
      y: cy + Math.sin(a) * rr,
      rot: (a * 180) / Math.PI + r.jitter(35),
      s: r.range(0.75, 1.25),
      flower: spec.flowers[seg % spec.flowers.length]!,
    }
  })
}

/** Petal symbols, one per flower; drawn at ~14 units. */
export function PetalDefs() {
  return (
    <defs>
      <symbol id="fl-thumba" overflow="visible">
        <ellipse cx={-2.5} cy={0} rx={3} ry={4.2} fill="#fffdf6" />
        <ellipse cx={2.8} cy={-0.5} rx={2.6} ry={3.6} fill="#f1ede0" />
        <circle cx={0} cy={2.5} r={1.1} fill="#c9c2a8" />
      </symbol>
      <symbol id="fl-mukkutti" overflow="visible">
        {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx={0} cy={-3} rx={1.8} ry={3} fill="#f4c731" transform={`rotate(${a})`} />)}
        <circle r={1.3} fill="#d59a14" />
      </symbol>
      <symbol id="fl-chethi" overflow="visible">
        {[0, 90, 180, 270].map((a) => <ellipse key={a} cx={0} cy={-3.4} rx={2.3} ry={3.3} fill="#d63a2f" transform={`rotate(${a + 45})`} />)}
        <circle r={1} fill="#8f1d18" />
      </symbol>
      <symbol id="fl-chendumalli" overflow="visible">
        <path d="M0,-7 L2,-4 L6,-5 L4,-1 L7,2 L3,3 L3,7 L0,4 L-3,7 L-3,3 L-7,2 L-4,-1 L-6,-5 L-2,-4Z" fill="#f09424" />
        <circle r={2.4} fill="#d8701a" />
      </symbol>
      <symbol id="fl-vadamalli" overflow="visible">
        <ellipse rx={4} ry={5} fill="#b23c77" />
        <ellipse rx={2} ry={2.6} cx={-1} cy={-1} fill="#cf6197" />
      </symbol>
      <symbol id="fl-shankhu" overflow="visible">
        <path d="M0,6 C-5,3 -6,-4 0,-7 C6,-4 5,3 0,6Z" fill="#3446a8" />
        <path d="M0,5 C-1.5,3 -1.5,1 0,0 C1.5,1 1.5,3 0,5Z" fill="#f2efe4" />
      </symbol>
      <symbol id="fl-leaf" overflow="visible">
        <path d="M-7,0 C-3,-3.5 3,-3.5 7,0 C3,3.5 -3,3.5 -7,0Z" fill="#4c8a3a" />
        <line x1={-6} x2={6} y1={0} y2={0} stroke="#2f5e2c" strokeWidth={0.6} />
      </symbol>
    </defs>
  )
}

export { rng }
