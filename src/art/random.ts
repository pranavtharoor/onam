/** Seeded PRNG (mulberry32): stable "hand-made" irregularity across renders and QA runs. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    range: (min: number, max: number) => min + (max - min) * next(),
    jitter: (amount: number) => (next() * 2 - 1) * amount,
    pick: <T,>(list: readonly T[]) => list[Math.floor(next() * list.length)]!,
  }
}
export type Rng = ReturnType<typeof rng>

const f = (n: number) => n.toFixed(1)

/** A closed, irregular round blob — the basic "placed by hand" shape. */
export function blobPath(cx: number, cy: number, rx: number, ry: number, r: Rng, wobble = 0.12, points = 9) {
  const pts = Array.from({ length: points }, (_, i) => {
    const a = (i / points) * Math.PI * 2
    const k = 1 + r.jitter(wobble)
    return [cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k] as const
  })
  // Catmull-Rom → cubic bezier for a soft closed outline.
  let d = `M${f(pts[0]![0])},${f(pts[0]![1])}`
  for (let i = 0; i < points; i++) {
    const p0 = pts[(i - 1 + points) % points]!, p1 = pts[i]!, p2 = pts[(i + 1) % points]!, p3 = pts[(i + 2) % points]!
    d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`
  }
  return d + 'Z'
}

export { f as fmt }
