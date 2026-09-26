/**
 * Builds public/og.jpg (1200×630 link preview) from the hosts' portrait poster:
 * the whole poster, uncropped, scaled to the full height and centred, with the
 * sides filled in the poster's own cream (sampled from its edges) so the card
 * reads as one image. Usage: npm run assets:og [-- <poster.jpg>]
 */
import sharp from 'sharp'

const src = process.argv[2] ?? 'public/invitation-poster.jpg'
const out = 'public/og.jpg'
const W = 1200, H = 630

const { width: w, height: h } = await sharp(src).metadata()
// Thin strips on the left/right edges (clear of the garland at the top) and the bottom corners.
const strips = [
  { left: 0, top: Math.round(h * 0.45), width: 12, height: Math.round(h * 0.1) },
  { left: w - 12, top: Math.round(h * 0.45), width: 12, height: Math.round(h * 0.1) },
  { left: 0, top: h - 12, width: 12, height: 12 },
  { left: w - 12, top: h - 12, width: 12, height: 12 },
]
const samples = []
for (const r of strips) {
  const { data, info } = await sharp(src).extract(r).removeAlpha().raw().toBuffer({ resolveWithObject: true })
  const sum = [0, 0, 0]
  for (let i = 0; i < data.length; i += 3) { sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2] }
  samples.push(sum.map((v) => v / (info.width * info.height)))
}
// Median of the four samples per channel, robust to one strip catching artwork.
const [r, g, b] = [0, 1, 2].map((c) => Math.round(samples.map((s) => s[c]).sort((x, y) => x - y)[1]))

const poster = await sharp(src).resize({ height: H }).toBuffer()
const { width: pw } = await sharp(poster).metadata()
const info = await sharp({ create: { width: W, height: H, channels: 3, background: { r, g, b } } })
  .composite([{ input: poster, left: Math.round((W - pw) / 2), top: 0 }])
  .jpeg({ quality: 90, mozjpeg: true })
  .toFile(out)
console.log(`${out}: ${W}×${H}, ${(info.size / 1024).toFixed(0)} KB, ground rgb(${r} ${g} ${b})`)
