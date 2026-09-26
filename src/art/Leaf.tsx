import { useId } from 'react'
import { rng, blobPath, fmt as f } from './random'
import type { Dish } from '../content'

/**
 * A served banana leaf, in the DINER'S frame: tip pointing to the diner's left
 * (x→0), far edge along the top with the midrib, near edge curving toward the
 * diner at the bottom. Units: 1000 × 400.
 */
export const LEAF_PATH = 'M1000,26 L1000,392 C760,410 420,402 200,344 C100,304 32,214 6,122 C120,72 300,42 520,32 C700,26 860,22 1000,26Z'
const MIDRIB = 'M1000,26 C860,22 700,26 520,32 C300,42 120,72 6,122'

export function LeafShape({ seed = 1 }: { seed?: number }) {
  const clip = useId()
  const r = rng(seed)
  const veins: string[] = []
  for (let x = 40; x < 1000; x += 17 + r.next() * 6) {
    const top = 26 + Math.max(0, (520 - x) / 520) * 70
    veins.push(`M${f(x)},${f(top)} L${f(x - 120)},${f(420)}`)
  }
  return (
    <g>
      <clipPath id={clip}><path d={LEAF_PATH} /></clipPath>
      <path d={LEAF_PATH} fill="var(--c-leaf)" />
      <g clipPath={`url(#${clip})`}>
        <path d="M0,0 L1000,0 L1000,150 C700,190 400,170 0,220Z" fill="#4a8a3c" opacity={0.55} />
        <path d={veins.join(' ')} stroke="#5f9a47" strokeWidth={1.4} opacity={0.7} />
        <path d="M1000,300 C700,380 380,360 140,300 L140,420 L1000,420Z" fill="#2f6a2b" opacity={0.35} />
      </g>
      <path d={MIDRIB} stroke="#9fc46a" strokeWidth={9} fill="none" strokeLinecap="round" />
      <path d={LEAF_PATH} fill="none" stroke="var(--c-black)" strokeWidth={2.5} opacity={0.6} />
    </g>
  )
}

/** One dish on the leaf, drawn by kind. */
export function DishArt({ dish }: { dish: Dish }) {
  const r = rng(dish.id.length * 131 + dish.x)
  const { x, y, color, fleck } = dish
  const rad = dish.r * 1.3
  // Many tiny grains/flecks as ONE path (keeps the DOM small): each fleck is a short fat stroke at a random angle.
  const flecks = (n: number, size: number, c = fleck ?? '#000', spread = 0.75) => {
    let d = ''
    for (let i = 0; i < n; i++) {
      const a = r.next() * Math.PI * 2, dist = Math.sqrt(r.next()) * rad * spread
      const px = x + Math.cos(a) * dist, py = y + Math.sin(a) * dist * 0.8
      const t = r.next() * Math.PI, len = size * r.range(0.7, 1.3)
      d += `M${(px - Math.cos(t) * len).toFixed(1)},${(py - Math.sin(t) * len).toFixed(1)}L${(px + Math.cos(t) * len).toFixed(1)},${(py + Math.sin(t) * len).toFixed(1)}`
    }
    return <path d={d} stroke={c} strokeWidth={size * 1.2} strokeLinecap="round" fill="none" />
  }
  switch (dish.kind) {
    case 'upperi':
      return <g>{Array.from({ length: 7 }, (_, i) => { const cx = x + r.jitter(rad * 0.6), cy = y + r.jitter(rad * 0.4); return <g key={i}><circle cx={cx} cy={cy} r={rad * 0.34} fill={color} /><circle cx={cx} cy={cy} r={rad * 0.34} fill="none" stroke="#b8861a" strokeWidth={1.5} /><circle cx={cx} cy={cy} r={rad * 0.12} fill="#f3d36a" /></g> })}</g>
    case 'varatti':
      return <g>{Array.from({ length: 9 }, (_, i) => <path key={i} d={blobPath(x + r.jitter(rad * 0.7), y + r.jitter(rad * 0.45), rad * 0.22, rad * 0.16, r, 0.3, 6)} fill={i % 3 ? color : '#a8612a'} />)}</g>
    case 'pappadam':
      return <g><path d={blobPath(x, y, rad, rad * 0.95, r, 0.05, 12)} fill={color} />{Array.from({ length: 14 }, (_, i) => <circle key={i} cx={x + r.jitter(rad * 0.75)} cy={y + r.jitter(rad * 0.7)} r={r.range(2, 6)} fill="#d6c08c" />)}<path d={blobPath(x, y, rad, rad * 0.95, r, 0.05, 12)} fill="none" stroke="#b89d62" strokeWidth={1.5} /></g>
    case 'pazham':
      return <g><path d={`M${x - rad},${y} C${x - rad * 0.5},${y + rad * 0.55} ${x + rad * 0.5},${y + rad * 0.55} ${x + rad},${y - rad * 0.1} C${x + rad * 0.45},${y + rad * 0.25} ${x - rad * 0.45},${y + rad * 0.25} ${x - rad},${y}Z`} fill={color} stroke="#8a6a1a" strokeWidth={2} /><circle cx={x - rad} cy={y} r={4} fill="#4a2e14" /><circle cx={x + rad} cy={y - rad * 0.1} r={4} fill="#4a2e14" /></g>
    case 'salt':
      return <path d={blobPath(x, y, rad, rad * 0.8, r, 0.25)} fill={color} />
    case 'ghee':
      return <g><path d={blobPath(x, y, rad, rad * 0.7, r, 0.2)} fill={color} opacity={0.9} /><ellipse cx={x - rad * 0.3} cy={y - rad * 0.25} rx={rad * 0.3} ry={rad * 0.15} fill="#fff6d0" /></g>
    case 'rice':
      // Kerala matta rice: a loose, uneven heap, pinkish with red-brown bran flecks.
      return <g><path d={blobPath(x, y, rad * 1.1, rad * 0.62, r, 0.22, 13)} fill={color} />{flecks(140, 3.4, fleck, 0.95)}{flecks(60, 3, '#f7efe2', 0.95)}</g>
    case 'payasam':
      return <g><path d={blobPath(x, y, rad, rad * 0.62, r, 0.1)} fill={color} /><path d={`M${x - rad * 0.5},${y - 4} q${rad * 0.3},-${rad * 0.25} ${rad * 0.6},0 t${rad * 0.4},0`} stroke={fleck} strokeWidth={5} fill="none" opacity={0.8} />{flecks(10, 4, '#e8c98a', 0.6)}</g>
    case 'parippu':
      // Poured over one side of the rice, not a neat disc.
      return <path d={blobPath(x - rad * 0.2, y + rad * 0.1, rad * 1.1, rad * 0.55, r, 0.32, 10)} fill={color} opacity={0.95} />
    default: // pickles, curries, sambar
      return <g><path d={blobPath(x, y, rad, rad * 0.72, r, dish.kind === 'sambar' ? 0.14 : 0.2)} fill={color} />{fleck && flecks(dish.kind === 'pickle' ? 5 : 12, dish.kind === 'sambar' ? 5 : 3, fleck)}</g>
  }
}
