#!/usr/bin/env node
/**
 * Visual QA capture.
 *
 * For each viewport (and optionally reduced motion) it walks every scene at
 * fixed progress checkpoints — from the scene's entry (top enters viewport) to
 * the start of its exit — settles scrubbed animations, and records:
 *   - a viewport screenshot per checkpoint
 *   - a labelled contact sheet per viewport (read this first)
 *   - layout checks at each checkpoint (horizontal overflow, off-canvas text,
 *     tiny text and small touch targets on mobile, blank frames)
 *   - console errors/warnings, page errors, failed requests
 *
 * Usage:
 *   npm run qa:capture                              # desktop + mobile, 6 checkpoints/scene
 *   npm run qa:capture -- --viewports desktop,mobile,mobile-landscape --reduced
 *   npm run qa:capture -- --scene harness-travel --checkpoints 9
 *   npm run qa:capture -- --url http://localhost:4173/   # test a running preview build
 *
 * Output: qa-artifacts/capture/<timestamp>/{report.md,report.json,<viewport>/*.png,<viewport>-sheet.png}
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import sharp from 'sharp'
import { ensureServer } from '../lib/server.mjs'
import { launch, openSite, getScenes, jump, parseArgs, stamp } from '../lib/browser.mjs'
import { contactSheet } from '../lib/sheet.mjs'

const args = parseArgs()
const viewports = String(args.viewports ?? 'desktop,mobile').split(',')
const checkpoints = Number(args.checkpoints ?? 6)
const out = args.out ?? join('qa-artifacts', 'capture', stamp())
const passes = viewports.map((v) => ({ viewport: v, reduced: false }))
if (args.reduced) passes.push(...viewports.map((v) => ({ viewport: v, reduced: true })))

const server = await ensureServer({ url: args.url, mode: args.preview ? 'preview' : 'dev' })
const browser = await launch()
const report = { url: server.url, createdAt: new Date().toISOString(), passes: [] }

function layoutProbe(isMobile) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const findings = []
  if (document.documentElement.scrollWidth > vw + 1) findings.push(`horizontal overflow: document is ${document.documentElement.scrollWidth}px wide in a ${vw}px viewport`)
  const visible = (el) => {
    const r = el.getBoundingClientRect()
    const s = getComputedStyle(el)
    return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < vh && s.visibility !== 'hidden' && Number(s.opacity) > 0.05
  }
  for (const el of document.querySelectorAll('h1,h2,h3,h4,p,li,a,button,figcaption,span[data-text]')) {
    if (!visible(el) || !el.textContent?.trim()) continue
    const r = el.getBoundingClientRect()
    const label = `${el.tagName.toLowerCase()} "${el.textContent.trim().slice(0, 40)}"`
    if (r.left < -2 || r.right > vw + 2) {
      // Elements deliberately placed off-canvas inside a clipped stage (e.g. horizontal travel) are fine.
      const clipped = el.closest('.scene__stage') && getComputedStyle(el.closest('.scene__stage')).overflow !== 'visible'
      if (!clipped) findings.push(`text off-canvas: ${label} spans ${Math.round(r.left)}→${Math.round(r.right)}px`)
    }
    const size = parseFloat(getComputedStyle(el).fontSize)
    if (isMobile && size < 12) findings.push(`tiny text (${size}px) on mobile: ${label}`)
    if (isMobile && (el.tagName === 'A' || el.tagName === 'BUTTON') && (r.width < 44 || r.height < 44)) findings.push(`touch target ${Math.round(r.width)}×${Math.round(r.height)} < 44px: ${label}`)
  }
  return findings
}

for (const pass of passes) {
  const name = pass.viewport + (pass.reduced ? '-reduced' : '')
  const dir = join(out, name)
  await mkdir(dir, { recursive: true })
  const { context, page, issues } = await openSite(browser, server.url, pass.viewport, { reducedMotion: pass.reduced, still: true })
  const { scenes, max } = await getScenes(page)
  const isMobile = pass.viewport.startsWith('mobile') || pass.viewport === 'tablet'
  const shots = []
  const layout = []

  for (const scene of scenes) {
    if (args.scene && scene.id !== args.scene) continue
    // Sample from the moment the scene's top enters the viewport (its entry
    // transition) until its bottom meets the viewport bottom (its exit begins).
    const vh = await page.evaluate(() => innerHeight)
    const from = Math.max(0, scene.start - vh)
    const to = Math.min(Math.max(scene.end - vh, from), Math.round(max))
    for (let i = 0; i < checkpoints; i++) {
      const p = checkpoints === 1 ? 0 : i / (checkpoints - 1)
      const y = Math.round(from + (to - from) * p)
      await jump(page, y)
      const file = join(dir, `${scene.id}--${String(Math.round(p * 100)).padStart(3, '0')}.png`)
      await page.screenshot({ path: file })
      const stats = await sharp(file).stats()
      const blank = stats.channels.every((c) => c.stdev < 2)
      const findings = await page.evaluate(layoutProbe, isMobile)
      if (blank) findings.push('frame is a single flat colour — fine only at a designed seam (e.g. dawn sky, courtyard earth)')
      for (const f of new Set(findings)) layout.push({ scene: scene.id, progress: p, y, finding: f })
      shots.push({ file, label: `${scene.id} @${Math.round(p * 100)}% (y=${y})` })
    }
  }

  const sheet = join(out, `${name}-sheet.png`)
  await contactSheet(shots, sheet, { columns: isMobile ? 6 : 4, cellWidth: isMobile ? 200 : 360, title: `${name}: ${server.url}` })
  report.passes.push({ name, viewport: pass.viewport, reduced: pass.reduced, scenes, maxScroll: max, sheet, screenshots: shots.map((s) => s.file), layout, issues })
  await context.close()
}

await browser.close()
server.stop()

const md = [`# Visual QA capture`, ``, `URL: ${report.url}  `, `Created: ${report.createdAt}`, ``]
for (const p of report.passes) {
  md.push(`## ${p.name}`, ``, `Contact sheet: \`${p.sheet}\``, `Scroll height: ${Math.round(p.maxScroll)}px across ${p.scenes.length} scenes`, ``)
  md.push(`Scenes: ${p.scenes.map((s) => `${s.id} (${s.start}–${s.end})`).join(', ')}`, ``)
  const errs = [...p.issues.pageErrors, ...p.issues.console.map((c) => `${c.type}: ${c.text}`), ...p.issues.failedRequests]
  md.push(`### Console / network (${errs.length})`, ...(errs.length ? errs.map((e) => `- ${e}`) : ['- none']), ``)
  md.push(`### Layout findings (${p.layout.length})`, ...(p.layout.length ? p.layout.map((l) => `- [${l.scene} @${Math.round(l.progress * 100)}%] ${l.finding}`) : ['- none']), ``)
}
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2))
await writeFile(join(out, 'report.md'), md.join('\n'))
console.log(md.join('\n'))
console.log(`\nArtifacts: ${out}`)
