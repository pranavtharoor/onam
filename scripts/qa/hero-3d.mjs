#!/usr/bin/env node
/**
 * Captures a 3D hero moment on the 3D edition at chosen points of its scene's
 * timeline, with a zoomed crop around a point of interest.
 *
 *   node scripts/qa/hero-3d.mjs [--scene nadumuttam] [--at 0.4,0.5,0.62,0.7] [--viewports desktop,laptop]
 *                               [--focus 0.5,0.8] [--url http://localhost:5183/]
 *
 * `--at` is the scene's pinned-timeline progress (the same numbers as its labels),
 * converted to scroll via the pin's start/end. `--focus` is the crop centre as
 * viewport fractions (default: FLAME_AT). Output: qa-artifacts/hero-3d/<ts>/.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ensureServer } from '../lib/server.mjs'
import { launch, openSite, jump, parseArgs, stamp } from '../lib/browser.mjs'

const args = parseArgs()
const sceneId = args.scene ?? 'nadumuttam'
const ats = String(args.at ?? '0.36,0.42,0.5,0.56,0.62,0.7').split(',').map(Number)
const viewports = String(args.viewports ?? 'desktop,laptop').split(',')
const [fx, fy] = String(args.focus ?? '0.5,0.8').split(',').map(Number)
const out = args.out ?? join('qa-artifacts', 'hero-3d', stamp())
await mkdir(out, { recursive: true })

const server = await ensureServer({ page: args.page ?? '3d', url: args.url, mode: args.preview ? 'preview' : 'dev' })
const browser = await launch({ webgl: true })
const report = { url: server.url, scene: sceneId, shots: [] }

for (const vp of viewports) {
  const { context, page, issues } = await openSite(browser, server.url, vp, { still: !args.live })
  // Wait for the 3D layer to draw (it hides the painted lamp when it does).
  const range = await page.evaluate((id) => {
    const st = window.ScrollTrigger ?? null
    const el = document.querySelector(`[data-scene="${id}"]`)
    const box = el.parentElement.classList.contains('pin-spacer') ? el.parentElement : el
    const top = box.getBoundingClientRect().top + scrollY
    return { start: top, end: top + box.offsetHeight - innerHeight, st: !!st }
  }, sceneId)
  const { width, height } = page.viewportSize()
  for (const at of ats) {
    const y = Math.round(range.start + (range.end - range.start) * at)
    await jump(page, y)
    await page.waitForFunction((id) => document.querySelector(`[data-scene="${id}"]`)?.dataset.lamp === '3d', sceneId, { timeout: 30_000 }).catch(() => {})
    await page.waitForTimeout(args.live ? 1200 : 500)
    const name = `${vp}-${String(Math.round(at * 100)).padStart(3, '0')}`
    const file = join(out, `${name}.png`)
    await page.screenshot({ path: file })
    const cw = Math.round(width * 0.22), ch = Math.round(height * 0.34)
    const left = Math.max(0, Math.min(width - cw, Math.round(width * fx - cw / 2)))
    const top = Math.max(0, Math.min(height - ch, Math.round(height * fy - ch * 0.45)))
    await sharp(file).extract({ left, top, width: cw, height: ch }).resize(cw * 3, ch * 3, { kernel: 'lanczos3' }).toFile(join(out, `${name}-zoom.png`))
    const lamp3d = await page.evaluate((id) => document.querySelector(`[data-scene="${id}"]`)?.dataset.lamp ?? '2d', sceneId)
    report.shots.push({ viewport: vp, at, y, file, lamp: lamp3d })
    console.log(`${name}: y=${y} lamp=${lamp3d}`)
  }
  report[vp] = issues
  console.log(`${vp} console/network issues: ${issues.console.length + issues.pageErrors.length + issues.failedRequests.length}`, JSON.stringify(issues).slice(0, 600))
  await context.close()
}
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2))
await browser.close()
server.stop()
console.log(`Artifacts: ${out}`)
