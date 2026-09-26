#!/usr/bin/env node
/**
 * Raw images → responsive AVIF + WebP.
 *
 * Put masters (PNG/TIFF/JPG, any size) in media-src/images/<category>/<name>.<ext>
 * (media-src/ is gitignored). Output goes to src/assets/<category>/<name>-<width>.{avif,webp}
 * so Vite fingerprints them, or to public/media/<category>/ with --public (for
 * assets that are streamed/lazy-loaded by URL rather than imported).
 *
 * Usage:
 *   npm run assets:images                         # all masters, default widths
 *   npm run assets:images -- --widths 640,1280,2048 --quality 55
 *   npm run assets:images -- --only textures --public
 *
 * Textures meant to tile (paper, fibre, grain) keep one width and are written as WebP
 * only with --tile.
 */
import { readdir, mkdir } from 'node:fs/promises'
import { join, parse, relative, dirname } from 'node:path'
import { existsSync } from 'node:fs'
import sharp from 'sharp'
import { parseArgs } from '../lib/browser.mjs'

const args = parseArgs()
const SRC = 'media-src/images'
const widths = String(args.widths ?? '750,1280,1920,2560').split(',').map(Number)
const q = Number(args.quality ?? 60)

if (!existsSync(SRC)) {
  console.log(`No masters found. Put source images in ${SRC}/<category>/.`)
  process.exit(0)
}

async function walk(dir) {
  const out = []
  for (const e of await readdir(dir, { withFileTypes: true })) out.push(...(e.isDirectory() ? await walk(join(dir, e.name)) : [join(dir, e.name)]))
  return out
}

for (const file of await walk(SRC)) {
  if (!/\.(png|jpe?g|tiff?|webp)$/i.test(file)) continue
  const rel = relative(SRC, file)
  if (args.only && !rel.startsWith(args.only)) continue
  const { name } = parse(file)
  const outDir = join(args.public ? 'public/media' : 'src/assets', dirname(rel))
  await mkdir(outDir, { recursive: true })
  const meta = await sharp(file).metadata()
  if (args.tile) {
    await sharp(file).webp({ quality: q + 10 }).toFile(join(outDir, `${name}.webp`))
    console.log(`${rel} → ${name}.webp (tile)`)
    continue
  }
  for (const w of widths.filter((w) => w <= (meta.width ?? 0)).concat((meta.width ?? 0) < widths[0] ? [meta.width] : [])) {
    const img = sharp(file).resize({ width: w, withoutEnlargement: true })
    await img.clone().avif({ quality: q - 10, effort: 6 }).toFile(join(outDir, `${name}-${w}.avif`))
    await img.clone().webp({ quality: q + 10 }).toFile(join(outDir, `${name}-${w}.webp`))
  }
  console.log(`${rel} → ${outDir}/${name}-{${widths.join(',')}}.{avif,webp}`)
}
