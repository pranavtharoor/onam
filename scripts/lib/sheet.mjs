// Contact sheets: many screenshots → one labelled image Claude can read at a glance.
import sharp from 'sharp'

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/**
 * @param {{ file: string, label: string }[]} items
 * @param {string} out
 * @param {{ columns?: number, cellWidth?: number, title?: string }} opts
 */
export async function contactSheet(items, out, { columns = 4, cellWidth = 360, title = '' } = {}) {
  if (!items.length) return
  const meta = await sharp(items[0].file).metadata()
  const cellHeight = Math.round((cellWidth * meta.height) / meta.width)
  const labelH = 22
  const pad = 8
  const header = title ? 34 : 0
  const rows = Math.ceil(items.length / columns)
  const width = columns * (cellWidth + pad) + pad
  const height = header + rows * (cellHeight + labelH + pad) + pad

  const composites = []
  if (title) composites.push({ input: Buffer.from(`<svg width="${width}" height="${header}"><text x="${pad}" y="23" font-family="sans-serif" font-size="18" fill="#eee">${esc(title)}</text></svg>`), left: 0, top: 0 })
  for (const [i, item] of items.entries()) {
    const left = pad + (i % columns) * (cellWidth + pad)
    const top = header + pad + Math.floor(i / columns) * (cellHeight + labelH + pad)
    composites.push({ input: await sharp(item.file).resize(cellWidth, cellHeight, { fit: 'cover', position: 'top' }).toBuffer(), left, top })
    composites.push({ input: Buffer.from(`<svg width="${cellWidth}" height="${labelH}"><text x="2" y="15" font-family="sans-serif" font-size="12" fill="#ddd">${esc(item.label)}</text></svg>`), left, top: top + cellHeight })
  }
  await sharp({ create: { width, height, channels: 3, background: '#1b1b1b' } }).composite(composites).png().toFile(out)
}

/** Mean absolute per-pixel difference (0–255) between two images at low resolution. */
export async function frameDiff(a, b, width = 160) {
  const load = (f) => sharp(f).resize(width).greyscale().raw().toBuffer()
  const [pa, pb] = await Promise.all([load(a), load(b)])
  let sum = 0
  for (let i = 0; i < pa.length; i++) sum += Math.abs(pa[i] - pb[i])
  return sum / pa.length
}
