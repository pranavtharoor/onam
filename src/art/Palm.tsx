import { rng, fmt as f } from './random'

interface PalmProps {
  x: number
  /** ground y */
  y: number
  height: number
  /** horizontal offset of the crown relative to the base (lean) */
  lean: number
  seed: number
  trunk?: string
  crown?: string
  line?: string
  /** silhouette palms (far planes) skip line work */
  silhouette?: boolean
}

/**
 * A coconut palm: tapered, slightly curved trunk with growth rings, and a crown
 * of arching fronds whose leaflets droop and thin toward the tip. Drawn as
 * filled shapes (brush-like), not uniform strokes.
 */
export function Palm({ x, y, height, lean, seed, trunk = 'var(--c-wood)', crown = 'var(--c-verdigris)', line = 'var(--c-black)', silhouette }: PalmProps) {
  const r = rng(seed)
  const topX = x + lean
  const topY = y - height
  const ctrlX = x + lean * 0.15 + r.jitter(height * 0.05)
  const ctrlY = y - height * 0.55
  const wBase = height * 0.035
  const wTop = height * 0.018
  // Trunk as a filled quad-bezier ribbon.
  const trunkD = `M${f(x - wBase)},${f(y)} Q${f(ctrlX - wBase * 0.8)},${f(ctrlY)} ${f(topX - wTop)},${f(topY)} L${f(topX + wTop)},${f(topY)} Q${f(ctrlX + wBase * 0.8)},${f(ctrlY)} ${f(x + wBase)},${f(y)} Z`
  const rings: string[] = []
  if (!silhouette) {
    for (let t = 0.08; t < 0.95; t += 0.045 + r.next() * 0.02) {
      const px = (1 - t) * (1 - t) * x + 2 * (1 - t) * t * ctrlX + t * t * topX
      const py = (1 - t) * (1 - t) * y + 2 * (1 - t) * t * ctrlY + t * t * topY
      const w = wBase + (wTop - wBase) * t
      rings.push(`M${f(px - w)},${f(py)} q${f(w)},${f(w * 0.35)} ${f(w * 2)},0`)
    }
  }

  const fronds: { rachis: string; leaves: string }[] = []
  const count = 11 + Math.floor(r.next() * 4)
  for (let i = 0; i < count; i++) {
    const a = -Math.PI / 2 + ((i / (count - 1)) - 0.5) * Math.PI * 1.55 + r.jitter(0.12)
    const len = height * (0.34 + r.next() * 0.12)
    const droop = height * (0.1 + r.next() * 0.14) * Math.abs(Math.cos(a)) + height * 0.04
    const ex = topX + Math.cos(a) * len
    const ey = topY + Math.sin(a) * len * 0.55 + droop
    const cx = topX + Math.cos(a) * len * 0.55
    const cy = topY + Math.sin(a) * len * 0.55 - height * 0.05
    const rachis = `M${f(topX)},${f(topY)} Q${f(cx)},${f(cy)} ${f(ex)},${f(ey)}`
    let leaves = ''
    const n = 16
    for (let k = 1; k < n; k++) {
      const t = k / n
      const px = (1 - t) * (1 - t) * topX + 2 * (1 - t) * t * cx + t * t * ex
      const py = (1 - t) * (1 - t) * topY + 2 * (1 - t) * t * cy + t * t * ey
      const tx = 2 * (1 - t) * (cx - topX) + 2 * t * (ex - cx)
      const ty = 2 * (1 - t) * (cy - topY) + 2 * t * (ey - cy)
      const tl = Math.hypot(tx, ty) || 1
      const nx = -ty / tl, ny = tx / tl
      const ll = height * 0.085 * Math.sin(Math.PI * Math.min(0.95, t + 0.1)) * (0.8 + r.next() * 0.4)
      const hang = height * 0.05 * t
      for (const side of [1, -1]) {
        const lx = px + nx * ll * side + tx / tl * ll * 0.3
        const ly = py + ny * ll * side + hang + Math.abs(nx) * ll * 0.5
        leaves += `M${f(px)},${f(py)} Q${f((px + lx) / 2 + r.jitter(2))},${f((py + ly) / 2 - ll * 0.15)} ${f(lx)},${f(ly)} `
      }
    }
    fronds.push({ rachis, leaves })
  }

  const leafWidth = Math.max(1.2, height * 0.006)
  return (
    <g>
      <path d={trunkD} fill={silhouette ? crown : trunk} />
      {!silhouette && <path d={rings.join(' ')} stroke={line} strokeWidth={Math.max(0.8, height * 0.003)} fill="none" opacity={0.55} />}
      {/* All fronds in two paths: static art doesn't need per-frond nodes. */}
      <g fill="none" strokeLinecap="round">
        <path d={fronds.map((fr) => fr.leaves).join(' ')} stroke={crown} strokeWidth={leafWidth} />
        <path d={fronds.map((fr) => fr.rachis).join(' ')} stroke={silhouette ? crown : line} strokeWidth={leafWidth * 1.6} />
      </g>
      {!silhouette && (
        <g fill="var(--c-leaf-dark)">
          {[0, 1, 2].map((k) => <ellipse key={k} cx={topX + (k - 1) * height * 0.018} cy={topY + height * 0.018} rx={height * 0.014} ry={height * 0.016} />)}
        </g>
      )}
    </g>
  )
}
