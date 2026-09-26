#!/usr/bin/env node
/**
 * Motion strip — evidence for animation review.
 *
 * Screenshots cannot show motion, so this samples the experience densely along
 * the scroll axis and measures how much the picture changes per step:
 *
 *   1. Walks the whole page in fixed scroll steps (default 4% of a viewport),
 *      settling scrub tweens at each step, and grabs a small frame.
 *   2. Computes "motion energy" = mean pixel difference between consecutive frames.
 *   3. Flags DEAD ZONES (long runs of scroll where almost nothing changes) and
 *      JOLTS (a single step that changes far more than its neighbours — an abrupt
 *      cut or a pop).
 *   4. Writes filmstrip sheets per scene and an energy chart across the whole film.
 *
 * With --video it also records a real-time wheel-driven pass (Lenis smoothing,
 * non-scrubbed tweens, canvas loops included) and, if ffmpeg is installed,
 * extracts frames at --fps into time-based filmstrips.
 *
 * Usage:
 *   npm run qa:motion                          # desktop
 *   npm run qa:motion -- --viewport mobile --step 0.05
 *   npm run qa:motion -- --scene harness-travel --step 0.02
 *   npm run qa:motion -- --video --fps 8
 *
 * Output: qa-artifacts/motion/<timestamp>/{report.md,report.json,energy.png,strip-<scene>-N.png}
 */
import { mkdir, writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { execFileSync } from 'node:child_process'
import sharp from 'sharp'
import { ensureServer } from '../lib/server.mjs'
import { launch, openSite, getScenes, jump, parseArgs, stamp, touchSwipe, VIEWPORTS } from '../lib/browser.mjs'
import { contactSheet, frameDiff } from '../lib/sheet.mjs'

const args = parseArgs()
const preset = args.viewport ?? 'desktop'
const stepVh = Number(args.step ?? 0.04)
const out = args.out ?? join('qa-artifacts', 'motion', `${stamp()}-${preset}`)
const framesDir = join(out, 'frames')
await mkdir(framesDir, { recursive: true })

const server = await ensureServer({ page: args.page, url: args.url, mode: args.preview ? 'preview' : 'dev' })
const browser = await launch({ webgl: !!args.page })
const { context, page, issues } = await openSite(browser, server.url, preset, { reducedMotion: !!args.reduced, still: true })
const { scenes, max } = await getScenes(page)
const vh = VIEWPORTS[preset].viewport.height
const step = Math.max(8, Math.round(vh * stepVh))

const sceneAt = (y) => {
  // The scene whose box covers the viewport centre; later (overlapping) scenes win.
  let hit = scenes[0]
  for (const s of scenes) if (y + vh / 2 >= s.start && y + vh / 2 < s.end) hit = s
  return hit
}

const inScope = (y) => !args.scene || sceneAt(y).id === args.scene
const frames = []
for (let y = 0; y <= max; y += step) {
  if (!inScope(y)) continue
  await jump(page, y)
  const file = join(framesDir, `${String(frames.length).padStart(4, '0')}.png`)
  await page.screenshot({ path: file, scale: 'css', type: 'png' })
  await sharp(file).resize(480).toFile(file + '.small.png')
  frames.push({ y, scene: sceneAt(y).id, file: file + '.small.png' })
}

// Motion energy per step.
for (let i = 1; i < frames.length; i++) frames[i].energy = await frameDiff(frames[i - 1].file, frames[i].file)
frames[0].energy = 0
const energies = frames.slice(1).map((f) => f.energy).sort((a, b) => a - b)
const median = energies[Math.floor(energies.length / 2)] ?? 0

const DEAD = Number(args.dead ?? 0.35) // mean abs diff (0–255) below which a step shows essentially no change
const deadZones = []
let run = null
for (const f of frames.slice(1)) {
  if (f.energy < DEAD) { run ??= { from: f.y - step, scene: f.scene, steps: 0 }; run.steps++; run.to = f.y }
  else { if (run) deadZones.push(run); run = null }
}
if (run) deadZones.push(run)
const longDead = deadZones.filter((z) => (z.to - z.from) >= vh * 0.6)
const jolts = frames.filter((f, i) => i > 0 && f.energy > Math.max(median * 6, 12)).map((f) => ({ y: f.y, scene: f.scene, energy: +f.energy.toFixed(2), ratio: +(f.energy / Math.max(median, 0.01)).toFixed(1) }))

// Per-scene energy summary.
const perScene = scenes.map((s) => {
  const fs = frames.filter((f) => f.scene === s.id).slice(1)
  const e = fs.map((f) => f.energy)
  const total = e.reduce((a, b) => a + b, 0)
  return { id: s.id, steps: fs.length, meanEnergy: +(total / Math.max(e.length, 1)).toFixed(2), peak: +Math.max(0, ...e).toFixed(2), stillShare: +(e.filter((x) => x < DEAD).length / Math.max(e.length, 1)).toFixed(2) }
}).filter((s) => s.steps)

// Energy chart (SVG → PNG) with scene bands.
const W = 1400, H = 260, pad = 30
const peak = Math.max(1, ...frames.map((f) => f.energy))
const x = (y) => pad + ((W - 2 * pad) * y) / Math.max(max, 1)
const yv = (e) => H - pad - ((H - 2 * pad) * e) / peak
const band = scenes.map((s, i) => `<rect x="${x(s.start)}" y="${pad}" width="${Math.max(1, x(Math.min(s.end, max)) - x(s.start))}" height="${H - 2 * pad}" fill="${i % 2 ? '#262626' : '#2f2f2f'}"/><text x="${x(s.start) + 4}" y="${pad + 14}" font-size="12" fill="#aaa" font-family="sans-serif">${s.id}</text>`).join('')
const poly = frames.map((f) => `${x(f.y).toFixed(1)},${yv(f.energy).toFixed(1)}`).join(' ')
const deadRects = longDead.map((z) => `<rect x="${x(z.from)}" y="${H - pad - 8}" width="${Math.max(2, x(z.to) - x(z.from))}" height="8" fill="#d9534f"/>`).join('')
const joltMarks = jolts.map((j) => `<line x1="${x(j.y)}" x2="${x(j.y)}" y1="${pad}" y2="${H - pad}" stroke="#f0ad4e" stroke-dasharray="3 3"/>`).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect width="100%" height="100%" fill="#1b1b1b"/>${band}${deadRects}${joltMarks}<polyline points="${poly}" fill="none" stroke="#7fd17f" stroke-width="1.5"/><text x="${pad}" y="${H - 8}" font-size="12" fill="#aaa" font-family="sans-serif">motion energy per ${step}px scroll step (${preset}) — red: dead zones ≥ 0.6vh, amber: jolts</text></svg>`
await sharp(Buffer.from(svg)).png().toFile(join(out, 'energy.png'))

// Filmstrips per scene (max 24 frames per sheet).
const sheets = []
for (const s of scenes) {
  const fs = frames.filter((f) => f.scene === s.id)
  for (let i = 0; i < fs.length; i += 24) {
    const file = join(out, `strip-${s.id}-${i / 24 + 1}.png`)
    await contactSheet(fs.slice(i, i + 24).map((f) => ({ file: f.file, label: `y=${f.y} Δ${f.energy.toFixed(1)}` })), file, { columns: preset.startsWith('mobile') ? 8 : 6, cellWidth: preset.startsWith('mobile') ? 150 : 230, title: `${s.id} (${preset})` })
    sheets.push(file)
  }
}

// Optional real-time pass.
let video = null
if (args.video) {
  const vdir = join(out, 'video')
  const rec = await openSite(browser, server.url, preset, { recordVideoDir: vdir, reducedMotion: !!args.reduced })
  const vp = rec.page
  const t0 = Date.now()
  const log = []
  if (preset.startsWith('mobile') || preset === 'tablet') {
    const cdp = await vp.context().newCDPSession(vp)
    let y = 0
    let stalls = 0
    while (y < max - 2 && stalls < 4 && Date.now() - t0 < 120_000) {
      await touchSwipe(vp, cdp, { distance: Math.round(vh * 0.45) })
      await vp.waitForTimeout(350)
      const next = await vp.evaluate(() => Math.round(scrollY))
      stalls = next === y ? stalls + 1 : 0
      y = next
      log.push({ t: Date.now() - t0, y })
    }
  } else {
    await vp.mouse.move(700, 450)
    while ((await vp.evaluate(() => scrollY)) < max - 2 && Date.now() - t0 < 120_000) {
      await vp.mouse.wheel(0, 120)
      await vp.waitForTimeout(90)
      log.push({ t: Date.now() - t0, y: Math.round(await vp.evaluate(() => scrollY)) })
    }
  }
  await vp.waitForTimeout(800)
  await rec.context.close()
  const webm = (await readdir(vdir)).find((f) => f.endsWith('.webm'))
  video = { file: join(vdir, webm), scrollLog: log }
  try {
    const fps = Number(args.fps ?? 6)
    const tdir = join(vdir, 'frames')
    await mkdir(tdir, { recursive: true })
    execFileSync('ffmpeg', ['-loglevel', 'error', '-i', video.file, '-vf', `fps=${fps},scale=360:-2`, join(tdir, '%04d.png')])
    const tf = (await readdir(tdir)).filter((f) => f.endsWith('.png')).sort()
    video.sheets = []
    for (let i = 0; i < tf.length; i += 30) {
      const file = join(out, `realtime-${i / 30 + 1}.png`)
      await contactSheet(tf.slice(i, i + 30).map((f, k) => ({ file: join(tdir, f), label: `t=${((i + k) / fps).toFixed(1)}s` })), file, { columns: 6, cellWidth: 220, title: `real-time ${preset.startsWith('mobile') || preset === 'tablet' ? 'touch' : 'wheel'} pass @${fps}fps (${preset})` })
      video.sheets.push(file)
    }
  } catch (e) {
    video.note = `ffmpeg unavailable or failed (${e.message.split('\n')[0]}); open the .webm directly.`
  }
}

await context.close()
await browser.close()
server.stop()

const report = { url: server.url, preset, stepPx: step, deadThreshold: DEAD, median: +median.toFixed(2), perScene, deadZones: longDead, jolts, sheets, video, issues, frames: frames.map(({ y, scene, energy }) => ({ y, scene, energy: +energy.toFixed(2) })) }
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2))
const md = [
  `# Motion strip (${preset})`, '',
  `Step: ${step}px (${stepVh} vh). Frames: ${frames.length}. Median energy/step: ${median.toFixed(2)}.`, '',
  `Energy chart: \`${join(out, 'energy.png')}\``, '',
  '## Per scene', '', '| scene | steps | mean energy | peak | share of still steps |', '|---|---|---|---|---|',
  ...perScene.map((s) => `| ${s.id} | ${s.steps} | ${s.meanEnergy} | ${s.peak} | ${Math.round(s.stillShare * 100)}% |`), '',
  `## Dead zones ≥ 0.6 viewport (${longDead.length})`, ...(longDead.length ? longDead.map((z) => `- ${z.scene}: y ${z.from}→${z.to} (${((z.to - z.from) / vh).toFixed(2)} vh of scroll with no visible change)`) : ['- none']), '',
  `## Jolts (${jolts.length})`, ...(jolts.length ? jolts.map((j) => `- ${j.scene} at y=${j.y}: Δ${j.energy} (${j.ratio}× median) — check for a hard cut or pop`) : ['- none']), '',
  '## Sheets', ...sheets.map((s) => `- \`${s}\``), ...(video?.sheets ?? []).map((s) => `- \`${s}\` (real-time)`), ...(video?.note ? [`- ${video.note}`] : []), '',
  '> Energy is evidence, not a verdict: a deliberate held beat is a "dead zone" too, and a designed hard cut is a "jolt". The reviewer decides.',
]
await writeFile(join(out, 'report.md'), md.join('\n'))
console.log(md.join('\n'))
console.log(`\nArtifacts: ${out}`)
