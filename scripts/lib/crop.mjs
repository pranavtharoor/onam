// Crop + upscale a region of a screenshot for close inspection:
//   node scripts/lib/crop.mjs in.png out.png x y w h [scale]
import sharp from 'sharp'

const [inp, out, x, y, w, h, s = 3] = process.argv.slice(2)
await sharp(inp)
  .extract({ left: +x, top: +y, width: +w, height: +h })
  .resize(Math.round(w * s), Math.round(h * s), { kernel: 'lanczos3' })
  .toFile(out)
