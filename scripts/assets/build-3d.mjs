#!/usr/bin/env node
/**
 * 3D models for the 3D edition (/3d/): Blender (headless) → glTF → optimised .glb.
 *
 *   npm run assets:3d                     # every model in scripts/blender/*.py
 *   npm run assets:3d -- --only nilavilakku --preview   # + Cycles preview stills → qa-artifacts/blender/
 *   npm run assets:3d -- --tex 512        # faster, lower-res bake while iterating
 *
 * Each scripts/blender/<name>.py builds its model procedurally and exports an
 * unoptimised media-src/models/<name>.glb (gitignored). This script then:
 *   - welds, prunes (keeping empty nodes: they are anchors, e.g. Flame_0..4), dedups,
 *   - quantises + meshopt-compresses geometry (three: MeshoptDecoder),
 *   - re-encodes textures as WebP (lossy for colour, near-lossless for ORM data),
 * and writes public/models/<name>.glb. Needs `blender` (apt-get install blender python3-numpy).
 */
import { spawnSync } from 'node:child_process'
import { mkdir, readdir, stat } from 'node:fs/promises'
import { basename, join } from 'node:path'
import sharp from 'sharp'
import { MeshoptEncoder } from 'meshoptimizer'
import { NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import { dedup, meshopt, prune, reorder, textureCompress, weld } from '@gltf-transform/functions'
import { parseArgs } from '../lib/browser.mjs'

const args = parseArgs()
const SRC = 'media-src/models'
const OUT = 'public/models'
await mkdir(SRC, { recursive: true })
await mkdir(OUT, { recursive: true })

const scripts = (await readdir('scripts/blender')).filter((f) => f.endsWith('.py') && !f.startsWith('_'))
  .filter((f) => !args.only || basename(f, '.py') === args.only)

await MeshoptEncoder.ready
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({ 'meshopt.encoder': MeshoptEncoder })

for (const file of scripts) {
  const name = basename(file, '.py')
  const raw = join(SRC, `${name}.glb`)
  if (!args['skip-blender']) {
    const blenderArgs = ['-b', '--factory-startup', '--python', join('scripts/blender', file), '--', '--out', raw, '--tex', String(args.tex ?? 1024)]
    if (args.preview) blenderArgs.push('--preview', 'qa-artifacts/blender', '--samples', String(args.samples ?? 160))
    console.log(`blender ${name}…`)
    const r = spawnSync('blender', blenderArgs, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
    const log = `${r.stdout}\n${r.stderr}`
    if (r.status !== 0 || /Traceback/.test(log)) {
      console.error(log.split('\n').filter((l) => /Error|Traceback|File "|^\s+\w/.test(l)).join('\n'))
      process.exit(1)
    }
    for (const line of log.split('\n')) if (/^(EXPORTED|RENDERED)/.test(line)) console.log('  ' + line)
  }

  const doc = await io.read(raw)
  await doc.transform(
    weld(),
    dedup(),
    prune({ keepLeaves: true, keepAttributes: false }),
    reorder({ encoder: MeshoptEncoder, level: 'medium' }),
    // Data textures (occlusion/roughness/metalness) at half size: their detail is sub-pixel on screen.
    textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /^(occlusion|metallicRoughness)/, resize: [512, 512], quality: 90 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /^(?!baseColor|occlusion|metallicRoughness).*/, quality: 90 }),
    textureCompress({ encoder: sharp, targetFormat: 'webp', slots: /^baseColor/, quality: 86 }),
    meshopt({ encoder: MeshoptEncoder, level: 'high' }),
  )
  const out = join(OUT, `${name}.glb`)
  await io.write(out, doc)
  const kb = (b) => `${(b / 1024).toFixed(1)} KB`
  console.log(`${name}: ${kb((await stat(raw)).size)} → ${out} ${kb((await stat(out)).size)}`)
  for (const t of doc.getRoot().listTextures()) console.log(`  texture ${t.getName() || t.getURI()} ${t.getMimeType()} ${t.getSize()?.join('×')} ${kb(t.getImage().byteLength)}`)
}
