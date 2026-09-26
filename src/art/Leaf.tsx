import { useId } from 'react'
import { rng, fmt as f } from './random'

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
