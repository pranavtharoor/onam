import { rng, blobPath, fmt as f, type Rng } from './random'
import type { Dish } from '../content'

/*
 * The Sadhya, dish by dish, in LEAF coordinates (1000 × 400, see Leaf.tsx).
 *
 * Light: one warm light from the screen's top-left. The row draws every leaf
 * rotated 180° (the diners sit across from the camera), so in leaf coordinates
 * that light comes from +x/+y. Highlights sit toward LIGHT, soft shadows away.
 *
 * DOM budget: texture (grains, vegetable pieces, shreds) is always merged into
 * ONE path per tone: many short round-capped strokes, never one element each.
 */
const LIGHT = { x: Math.SQRT1_2, y: Math.SQRT1_2 }
const SHADOW_INK = '#1d3a18'

/** Short fat round-capped stroke = one grain / baton / shred, as a path fragment. */
const dash = (x: number, y: number, len: number, a: number) => {
  const dx = (Math.cos(a) * len) / 2, dy = (Math.sin(a) * len) / 2
  return `M${f(x - dx)},${f(y - dy)}l${f(dx * 2)},${f(dy * 2)}`
}
/** A uniform point in the unit disc (scaled by the caller to an ellipse); s = distance from centre. */
const inside = (r: Rng, reach = 1) => {
  const a = r.next() * Math.PI * 2, s = Math.sqrt(r.next()) * reach
  return { u: Math.cos(a) * s, v: Math.sin(a) * s, s }
}
/** Soft contact shadow on the leaf, away from the light. */
const contact = (x: number, y: number, rx: number, ry: number, r: Rng, lift = 8, opacity = 0.28) => (
  <path d={blobPath(x - LIGHT.x * lift, y - LIGHT.y * lift, rx * 1.03, ry * 1.05, r, 0.08, 9)} fill={SHADOW_INK} opacity={opacity} />
)
/** A glossy sheen toward the light. */
const sheen = (x: number, y: number, rx: number, ry: number, r: Rng, fill: string, opacity = 0.55) => (
  <path d={blobPath(x + LIGHT.x * rx * 0.35, y + LIGHT.y * ry * 0.35, rx * 0.38, ry * 0.26, r, 0.2, 7)} fill={fill} opacity={opacity} />
)

/** A poured liquid (parippu, sambar, payasam, gravies): translucent wet edge, body, sheen. */
function Pool({ lobes, color, gloss, r }: { lobes: [number, number, number, number][]; color: string; gloss: string; r: Rng }) {
  const edge = lobes.map(([x, y, rx, ry]) => blobPath(x, y, rx * 1.12, ry * 1.14, r, 0.1, 10)).join('')
  const body = lobes.map(([x, y, rx, ry]) => blobPath(x, y, rx, ry, r, 0.1, 10)).join('')
  const [x0, y0, rx0, ry0] = lobes[0]!
  return (
    <g>
      <path d={edge} fill={color} opacity={0.45} />
      <path d={body} fill={color} />
      {sheen(x0, y0, rx0, ry0, r, gloss)}
    </g>
  )
}

/** Kerala matta rice: a heaped mound built out of plump grains, lit from the top-left. */
function Rice({ x, y, rad, r }: { x: number; y: number; rad: number; r: Rng }) {
  const rx = rad * 1.1, ry = rad * 0.62
  // A wobbly footprint so the silhouette is uneven; grains near the rim make it bumpy.
  const ph = r.next() * 6
  const rim = (a: number) => 1 + 0.07 * Math.sin(3 * a + ph) + 0.04 * Math.sin(7 * a + ph * 2)
  // Two interleaved layers per tone, so grains of the same tone keep their outlines where they overlap.
  const tones = { shade: ['', ''], mid: ['', ''], light: ['', ''], matta: ['', ''] }
  const n = Math.round((rx * ry) / 21)
  for (let i = 0; i < n; i++) {
    const a = r.next() * Math.PI * 2
    const loose = i < 9 // a few grains fallen just outside the heap
    const s = loose ? r.range(1.02, 1.1) : Math.sqrt(r.next()) * 0.97
    const k = rim(a) * s
    const u = Math.cos(a) * k, v = Math.sin(a) * k
    // Dome: facing the light = lighter; the far side and the foot of the heap = darker.
    const h = (u * LIGHT.x + v * LIGHT.y) * 0.8 + (1 - s) * 0.45 + r.jitter(0.25)
    const tone = r.next() < 0.09 ? 'matta' : h > 0.3 ? 'light' : h < -0.25 ? 'shade' : 'mid'
    tones[tone][i % 2] += dash(x + u * rx, y + v * ry, r.range(4.5, 7), r.next() * Math.PI)
  }
  const grain = (ds: string[], fill: string, line: string) => ds.map((d, i) => (
    <g key={i}>
      <path d={d} stroke={line} strokeWidth={9} strokeLinecap="round" fill="none" />
      <path d={d} stroke={fill} strokeWidth={7} strokeLinecap="round" fill="none" />
    </g>
  ))
  return (
    <g>
      {contact(x, y, rx, ry, r, 9, 0.26)}
      {/* The body under the grains: shows through the gaps as the shadowed depth of the heap. */}
      <path d={blobPath(x, y, rx * 0.94, ry * 0.94, r, 0.06, 11)} fill="#a88469" />
      {grain(tones.shade, '#dcc3ad', '#b48f76')}
      {grain(tones.matta, '#b8674a', '#8a4330')}
      {grain(tones.mid, '#efdfcf', '#c7a891')}
      {grain(tones.light, '#fbf4ea', '#d6bca6')}
    </g>
  )
}

/** Vegetable pieces as one path of small rounded cubes (fat very short strokes). */
const cubes = (r: Rng, x: number, y: number, rx: number, ry: number, n: number, size: number) => {
  let d = ''
  for (let i = 0; i < n; i++) {
    const p = inside(r, 0.72)
    d += dash(x + p.u * rx, y + p.v * ry, size * 0.25, r.next() * Math.PI)
  }
  return d
}

/** One dish on the leaf, drawn by kind. */
export function DishArt({ dish }: { dish: Dish }) {
  const r = rng(dish.id.length * 131 + dish.x)
  const { x, y, color, fleck } = dish
  const rad = dish.r * 1.3
  switch (dish.kind) {
    case 'upperi':
      return <g>{Array.from({ length: 7 }, (_, i) => { const cx = x + r.jitter(rad * 0.6), cy = y + r.jitter(rad * 0.4); return <g key={i}><circle cx={cx} cy={cy} r={rad * 0.34} fill={color} /><circle cx={cx} cy={cy} r={rad * 0.34} fill="none" stroke="#b8861a" strokeWidth={1.5} /><circle cx={cx} cy={cy} r={rad * 0.12} fill="#f3d36a" /></g> })}</g>
    case 'varatti':
      return <g>{contact(x, y, rad * 0.8, rad * 0.55, r, 5, 0.22)}{Array.from({ length: 9 }, (_, i) => <path key={i} d={blobPath(x + r.jitter(rad * 0.7), y + r.jitter(rad * 0.45), rad * 0.22, rad * 0.16, r, 0.3, 6)} fill={i % 3 ? color : '#a8612a'} />)}</g>
    case 'pappadam':
      return <g>{contact(x, y, rad, rad * 0.95, r, 6, 0.2)}<path d={blobPath(x, y, rad, rad * 0.95, r, 0.05, 12)} fill={color} />{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={x + r.jitter(rad * 0.75)} cy={y + r.jitter(rad * 0.7)} r={r.range(2, 6)} fill="#d6c08c" />)}<path d={blobPath(x, y, rad, rad * 0.95, r, 0.05, 12)} fill="none" stroke="#b89d62" strokeWidth={1.5} /></g>
    case 'pazham':
      return <g><path d={`M${x - rad},${y} C${x - rad * 0.5},${y + rad * 0.55} ${x + rad * 0.5},${y + rad * 0.55} ${x + rad},${y - rad * 0.1} C${x + rad * 0.45},${y + rad * 0.25} ${x - rad * 0.45},${y + rad * 0.25} ${x - rad},${y}Z`} fill={color} stroke="#8a6a1a" strokeWidth={2} /><circle cx={x - rad} cy={y} r={4} fill="#4a2e14" /><circle cx={x + rad} cy={y - rad * 0.1} r={4} fill="#4a2e14" /></g>
    case 'salt':
      return <g><path d={blobPath(x, y, rad, rad * 0.8, r, 0.25)} fill={color} /><path d={blobPath(x - LIGHT.x * 3, y - LIGHT.y * 3, rad * 0.7, rad * 0.5, r, 0.2)} fill="#ddd8cc" opacity={0.6} /></g>
    case 'rice':
      return <Rice x={x} y={y} rad={rad} r={r} />
    case 'parippu': {
      // Poured over the rice's near side: one lobe on the heap, one run settled on the leaf.
      return <g><Pool r={r} color="#e2b845" gloss="#f7e08e" lobes={[[x + rad * 0.1, y, rad * 0.5, rad * 0.85], [x - rad * 0.55, y + rad * 0.3, rad * 0.6, rad * 0.42]]} /></g>
    }
    case 'ghee':
      return <g><path d={blobPath(x, y, rad, rad * 0.7, r, 0.2)} fill="#f2c64a" opacity={0.95} /><ellipse cx={x + LIGHT.x * rad * 0.3} cy={y + LIGHT.y * rad * 0.2} rx={rad * 0.32} ry={rad * 0.16} fill="#fff4c8" /></g>
    case 'sambar': {
      // Poured over the rice: a thin gravy pool with drumstick segments and cubes of vegetable.
      const lobes: [number, number, number, number][] = [[x, y, rad * 0.95, rad * 0.62], [x + rad * 0.55, y + rad * 0.3, rad * 0.55, rad * 0.4]]
      let drum = ''
      for (let i = 0; i < 3; i++) { const p = inside(r, 0.6); drum += dash(x + p.u * rad, y + p.v * rad * 0.6, r.range(20, 28), r.next() * Math.PI) }
      return (
        <g>
          <Pool r={r} color={color} gloss="#d98a45" lobes={lobes} />
          <path d={drum} stroke="#4f5a22" strokeWidth={9.5} strokeLinecap="round" fill="none" />
          <path d={drum} stroke="#7d8a38" strokeWidth={6} strokeLinecap="round" fill="none" />
          <path d={cubes(r, x, y, rad * 0.9, rad * 0.55, 7, 30)} stroke={fleck} strokeWidth={8} strokeLinecap="round" fill="none" />
          <path d={cubes(r, x, y, rad * 0.9, rad * 0.55, 4, 26)} stroke="#f2e6c8" strokeWidth={7} strokeLinecap="round" fill="none" />
        </g>
      )
    }
    case 'payasam': {
      // Ada pradhaman: a glossy jaggery-brown pool with flat pieces of rice ada.
      let ada = ''
      for (let i = 0; i < 7; i++) { const p = inside(r, 0.65); ada += dash(x + p.u * rad, y + p.v * rad * 0.6, r.range(8, 13), r.next() * Math.PI) }
      return (
        <g>
          <Pool r={r} color={color} gloss="#b07a40" lobes={[[x, y, rad, rad * 0.62]]} />
          <path d={ada} stroke={fleck} strokeWidth={5} strokeLinecap="round" fill="none" opacity={0.9} />
        </g>
      )
    }
    case 'pickle': {
      // Glossy dark chunks sitting in their own oil.
      let chunks = '', glints = ''
      for (let i = 0; i < 6; i++) {
        const p = inside(r, 0.7), cx = x + p.u * rad, cy = y + p.v * rad * 0.7, s = r.range(0.26, 0.36) * rad
        chunks += blobPath(cx, cy, s, s * 0.8, r, 0.3, 6)
        glints += dash(cx + LIGHT.x * s * 0.35, cy + LIGHT.y * s * 0.3, s * 0.35, r.next() * Math.PI)
      }
      return (
        <g>
          <path d={blobPath(x, y, rad * 0.95, rad * 0.72, r, 0.2)} fill={color} opacity={0.5} />
          <path d={chunks} fill={color} stroke={fleck} strokeWidth={1.2} strokeOpacity={0.5} />
          <path d={glints} stroke="#fff6e0" strokeWidth={2.4} strokeLinecap="round" fill="none" opacity={0.75} />
        </g>
      )
    }
    default: {
      const ry = rad * 0.72
      if (dish.id === 'thoran') {
        // Dry shredded vegetable with grated coconut: short dense shreds following the heap.
        let greens = '', coconut = ''
        for (let i = 0; i < 90; i++) {
          const p = inside(r, 0.92), a = Math.atan2(p.v, p.u) + Math.PI / 2 + r.jitter(0.6)
          const d = dash(x + p.u * rad, y + p.v * ry, r.range(3, 6), a)
          if (i % 3 === 0) coconut += d; else greens += d
        }
        return (
          <g>
            {contact(x, y, rad, ry, r, 5, 0.22)}
            <path d={blobPath(x, y, rad, ry, r, 0.18, 11)} fill="#557d27" />
            <path d={greens} stroke={color} strokeWidth={2.4} strokeLinecap="round" fill="none" />
            <path d={coconut} stroke={fleck} strokeWidth={2} strokeLinecap="round" fill="none" />
            {sheen(x, y, rad, ry, r, '#9cc25a', 0.35)}
          </g>
        )
      }
      if (dish.id === 'avial') {
        // Vegetable batons in a thick coconut-curd coat.
        let carrot = '', green = '', pale = ''
        for (let i = 0; i < 16; i++) {
          const p = inside(r, 0.75), d = dash(x + p.u * rad, y + p.v * ry, r.range(14, 20), r.next() * Math.PI)
          if (i % 3 === 0) carrot += d; else if (i % 3 === 1) green += d; else pale += d
        }
        return (
          <g>
            {contact(x, y, rad, ry, r, 5, 0.22)}
            <path d={blobPath(x, y, rad, ry, r, 0.16, 10)} fill={color} />
            <path d={carrot} stroke={fleck} strokeWidth={5.5} strokeLinecap="round" fill="none" />
            <path d={green} stroke="#8aa447" strokeWidth={5.5} strokeLinecap="round" fill="none" />
            <path d={pale} stroke="#f4eed8" strokeWidth={5.5} strokeLinecap="round" fill="none" />
            <path d={blobPath(x, y, rad * 0.9, ry * 0.9, r, 0.2, 10)} fill={color} opacity={0.35} />
            {sheen(x, y, rad, ry, r, '#fbf6e6', 0.6)}
          </g>
        )
      }
      // Other curries (kichadi, pachadi, olan, kaalan, erissery): a thick pool with a few pieces.
      return (
        <g>
          {contact(x, y, rad, ry, r, 5, 0.22)}
          <Pool r={r} color={color} gloss="#fffaf0" lobes={[[x, y, rad, ry]]} />
          {fleck && <path d={cubes(r, x, y, rad, ry, 6, 26)} stroke={fleck} strokeWidth={6.5} strokeLinecap="round" fill="none" />}
        </g>
      )
    }
  }
}
