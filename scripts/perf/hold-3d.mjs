#!/usr/bin/env node
/**
 * Frame times while a 3D hero moment holds on screen (flames animating, nothing scrolling),
 * on the 3D page vs the same moment on the 2D page. Needs a running preview (npm run preview).
 *   node scripts/perf/hold-3d.mjs [--url http://localhost:4173/] [--scene nadumuttam] [--at 0.6] [--seconds 4]
 */
import { launch, openSite, getScenes, jump, parseArgs } from '../lib/browser.mjs'

const args = parseArgs()
const base = args.url ?? 'http://localhost:4173/'
const scene = args.scene ?? 'nadumuttam'
const at = Number(args.at ?? 0.6)
const seconds = Number(args.seconds ?? 4)
const browser = await launch({ webgl: true })
for (const [label, url] of [['2D', base], ['3D', new URL('3d/', base).href]]) {
  for (const vp of String(args.viewports ?? 'desktop,laptop').split(',')) {
    const { context, page } = await openSite(browser, url, vp)
    const { scenes } = await getScenes(page)
    const s = scenes.find((x) => x.id === scene)
    await jump(page, Math.round(s.start + (s.end - s.start) * at))
    await page.waitForTimeout(2500) // model load, shader compile, first frames
    const frames = await page.evaluate((ms) => new Promise((resolve) => {
      const out = []
      let last = performance.now()
      const t0 = last
      const loop = (t) => { out.push(t - last); last = t; if (t - t0 < ms) requestAnimationFrame(loop); else resolve(out.slice(2)) }
      requestAnimationFrame(loop)
    }), seconds * 1000)
    const sorted = [...frames].sort((a, b) => a - b)
    const p = (q) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * q))].toFixed(1)
    const drawMs = await page.evaluate(() => { const a = (window.__lampMs ?? []).slice(-20).sort((x, y) => x - y); return a.length ? a[a.length >> 1].toFixed(1) : '-' })
    const mode = await page.evaluate((id) => document.querySelector(`[data-scene="${id}"]`)?.dataset.lamp ?? '2d', scene)
    console.log(`${label} ${vp} (lamp ${mode}): ${frames.length} frames in ${seconds}s, p50 ${p(0.5)} / p95 ${p(0.95)} / max ${sorted.at(-1).toFixed(1)} ms; lamp draw (median) ${drawMs} ms`)
    await context.close()
  }
}
await browser.close()
