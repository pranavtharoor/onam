import { rng, fmt as f } from './random'

/** A banana plant: pseudo-stem and broad paddle leaves torn into strips by the wind. */
export function BananaPlant({ x, y, height, seed, flip = false }: { x: number; y: number; height: number; seed: number; flip?: boolean }) {
  const r = rng(seed)
  const top = y - height * 0.55
  const leaves = Array.from({ length: 6 }, (_, i) => {
    const a = (-150 + i * 26 + r.jitter(8)) * (Math.PI / 180)
    const len = height * r.range(0.45, 0.62)
    const droop = Math.abs(Math.cos(a)) * len * 0.35
    const ex = x + Math.cos(a) * len
    const ey = top + Math.sin(a) * len * 0.6 + droop
    const w = height * 0.11
    const mx = (x + ex) / 2, my = (top + ey) / 2 - height * 0.08
    const nx = -(ey - top) / len, ny = (ex - x) / len
    const blade = `M${f(x)},${f(top)} Q${f(mx + nx * w)},${f(my + ny * w)} ${f(ex)},${f(ey)} Q${f(mx - nx * w * 0.9)},${f(my - ny * w * 0.9)} ${f(x)},${f(top)}Z`
    const midrib = `M${f(x)},${f(top)} Q${f(mx)},${f(my)} ${f(ex)},${f(ey)}`
    let tears = ''
    for (let k = 0; k < 7; k++) {
      const t = 0.25 + k * 0.1 + r.jitter(0.03)
      const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * mx + t * t * ex
      const py = (1 - t) * (1 - t) * top + 2 * (1 - t) * t * my + t * t * ey
      const side = r.next() > 0.5 ? 1 : -1
      tears += `M${f(px)},${f(py)} l${f(nx * w * 0.8 * side)},${f(ny * w * 0.8 * side)} `
    }
    return { blade, midrib, tears, shade: i % 2 ? 'var(--c-leaf)' : 'var(--c-leaf-dark)' }
  })
  return (
    <g transform={flip ? `translate(${2 * x} 0) scale(-1 1)` : undefined}>
      <path d={`M${f(x - height * 0.04)},${f(y)} L${f(x - height * 0.025)},${f(top)} L${f(x + height * 0.025)},${f(top)} L${f(x + height * 0.045)},${f(y)}Z`} fill="#5b6b2c" />
      {leaves.map((l, i) => (
        <g key={i}>
          <path d={l.blade} fill={l.shade} />
          <path d={l.midrib} stroke="var(--c-leaf-young)" strokeWidth={height * 0.008} fill="none" />
          <path d={l.tears} stroke="var(--c-dawn)" strokeWidth={height * 0.006} fill="none" opacity={0.9} />
        </g>
      ))}
    </g>
  )
}
