#!/usr/bin/env node
/**
 * Performance report: static (build output + media) and runtime (real browser).
 *
 * Static:  builds (unless --no-build), measures every file in dist with gzip and
 *          brotli sizes, separates the initial critical path (what index.html
 *          loads) from lazy chunks, audits media in public/media and dist/assets
 *          against budgets.
 * Runtime: serves the production build (vite preview), then per viewport
 *          (desktop, and mobile with 4× CPU throttling) collects LCP, CLS, long
 *          tasks, DOM size, JS heap, transferred bytes by type, canvas backing-
 *          store size vs CSS size, <video>/<img> loading attributes, and frame
 *          times during a scripted scroll through the whole experience.
 *
 * Usage:  npm run perf:report [-- --no-build] [-- --viewports desktop,mobile]
 * Output: qa-artifacts/perf/<timestamp>/{report.md,report.json}
 *
 * Headless software rendering makes absolute frame times pessimistic. Compare runs
 * against each other; treat budgets as tripwires, not truth.
 */
import { execSync } from 'node:child_process'
import { readFile, readdir, stat, mkdir, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, extname, relative } from 'node:path'
import { gzipSync, brotliCompressSync } from 'node:zlib'
import { ensureServer } from '../lib/server.mjs'
import { launch, openSite, parseArgs, stamp, touchSwipe } from '../lib/browser.mjs'

const args = parseArgs()
const out = args.out ?? join('qa-artifacts', 'perf', stamp())
await mkdir(out, { recursive: true })

// Budgets — tripwires. Adjust deliberately (and note why in the report) rather than silently.
const BUDGET = {
  initialJsBr: 150 * 1024,   // React + GSAP core + ScrollTrigger + Lenis + app shell
  initialCssBr: 20 * 1024,
  lazyChunkBr: 80 * 1024,
  image: 350 * 1024,         // any single still
  heroImage: 200 * 1024,
  video: 4 * 1024 * 1024,    // per rendition
  sequenceTotal: 6 * 1024 * 1024,
  sequenceFrame: 60 * 1024,
  font: 60 * 1024,           // per woff2 file (subset!)
  svgInline: 40 * 1024,
  lcpMs: 2500,
  cls: 0.05,
  domNodes: 2500,
}
const kb = (n) => `${(n / 1024).toFixed(1)} KB`
const findings = []
const flag = (level, msg) => findings.push({ level, msg })

async function walk(dir) {
  if (!existsSync(dir)) return []
  const entries = await readdir(dir, { withFileTypes: true })
  const files = await Promise.all(entries.map((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)])))
  return files.flat()
}

// ---------- static ----------
if (!args['no-build']) execSync('npm run build', { stdio: 'inherit' })
const dist = 'dist'
const html = await readFile(join(dist, 'index.html'), 'utf8')
const initialRefs = new Set([...html.matchAll(/(?:src|href)="(?:\.?\/)?([^"]+\.(?:js|css))"/g)].map((m) => m[1]))
const files = []
for (const f of await walk(dist)) {
  const buf = await readFile(f)
  const rel = relative(dist, f)
  const ext = extname(f)
  const text = ['.js', '.css', '.html', '.svg', '.json'].includes(ext)
  files.push({ file: rel, ext, raw: buf.length, gzip: text ? gzipSync(buf).length : null, br: text ? brotliCompressSync(buf).length : null, initial: initialRefs.has(rel) })
}
const sum = (list, k) => list.reduce((a, f) => a + (f[k] ?? f.raw), 0)
const initialJs = files.filter((f) => f.initial && f.ext === '.js')
const initialCss = files.filter((f) => f.initial && f.ext === '.css')
const lazyJs = files.filter((f) => !f.initial && f.ext === '.js')
if (sum(initialJs, 'br') > BUDGET.initialJsBr) flag('high', `initial JS ${kb(sum(initialJs, 'br'))} br > budget ${kb(BUDGET.initialJsBr)}`)
if (sum(initialCss, 'br') > BUDGET.initialCssBr) flag('medium', `initial CSS ${kb(sum(initialCss, 'br'))} br > budget ${kb(BUDGET.initialCssBr)}`)
for (const f of lazyJs) if (f.br > BUDGET.lazyChunkBr) flag('medium', `lazy chunk ${f.file} ${kb(f.br)} br > ${kb(BUDGET.lazyChunkBr)}`)

// Media (bundled assets + streamed public/media)
const media = [...(await walk(join(dist, 'assets'))), ...(await walk('public/media'))]
const imageExt = ['.png', '.jpg', '.jpeg', '.webp', '.avif', '.gif']
const sequences = new Map()
for (const f of media) {
  const ext = extname(f).toLowerCase()
  const size = (await stat(f)).size
  if (f.includes('/sequences/')) {
    const key = f.split('/sequences/')[1].split('/').slice(0, 2).join('/')
    const s = sequences.get(key) ?? { frames: 0, bytes: 0, max: 0 }
    s.frames++; s.bytes += size; s.max = Math.max(s.max, size)
    sequences.set(key, s)
    continue
  }
  if (imageExt.includes(ext)) {
    if (size > BUDGET.image) flag('high', `image ${f} is ${kb(size)} (> ${kb(BUDGET.image)})`)
    if (['.png', '.jpg', '.jpeg'].includes(ext) && size > 60 * 1024) flag('medium', `${f} (${kb(size)}) — ship AVIF/WebP instead (npm run assets:images)`)
    if (ext === '.gif') flag('high', `${f} — GIF; use video or an image sequence`)
  }
  if (['.mp4', '.webm', '.mov'].includes(ext)) {
    if (size > BUDGET.video) flag('high', `video ${f} is ${kb(size)} (> ${kb(BUDGET.video)})`)
    if (ext === '.mov') flag('high', `${f} — .mov is not a web delivery format`)
  }
  if (['.ttf', '.otf'].includes(ext)) flag('medium', `font ${f} — ship subset woff2 only`)
  if (ext === '.woff') flag('low', `font ${f} — woff fallback emitted (never fetched by browsers that support woff2)`)
  if (ext === '.woff2' && size > BUDGET.font) flag('medium', `font ${f} is ${kb(size)} — subset it`)
}
for (const [key, s] of sequences) {
  if (s.bytes > BUDGET.sequenceTotal) flag('high', `sequence ${key}: ${s.frames} frames, ${kb(s.bytes)} total (> ${kb(BUDGET.sequenceTotal)})`)
  if (s.max > BUDGET.sequenceFrame) flag('medium', `sequence ${key}: largest frame ${kb(s.max)} (> ${kb(BUDGET.sequenceFrame)})`)
}
// Large inline SVG in source (ends up in JS)
for (const f of await walk('src')) {
  if (extname(f) === '.svg' || f.endsWith('.tsx')) {
    const size = (await stat(f)).size
    if (extname(f) === '.svg' && size > BUDGET.svgInline) flag('medium', `SVG ${f} is ${kb(size)} — run npm run assets:svg, simplify paths, or split per scene`)
  }
}
// Dependencies
const pkg = JSON.parse(await readFile('package.json', 'utf8'))

// ---------- runtime ----------
const viewports = String(args.viewports ?? 'desktop,mobile').split(',')
const server = await ensureServer({ page: args.page, url: args.url, mode: 'preview' })
const browser = await launch({ webgl: !!args.page })
const runtime = []
for (const preset of viewports) {
  const { context, page, issues } = await openSite(browser, server.url, preset)
  const cdp = await context.newCDPSession(page)
  if (preset.startsWith('mobile')) await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })

  // Observers installed after load still receive buffered LCP/CLS/longtask entries.
  const vitals = await page.evaluate(() => new Promise((resolve) => {
    const r = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 }
    new PerformanceObserver((l) => { for (const e of l.getEntries()) r.lcp = e.startTime }).observe({ type: 'largest-contentful-paint', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) r.cls += e.value }).observe({ type: 'layout-shift', buffered: true })
    new PerformanceObserver((l) => { for (const e of l.getEntries()) { r.longTasks++; r.longTaskMs += e.duration } }).observe({ type: 'longtask', buffered: true })
    setTimeout(() => resolve(r), 1500)
  }))

  // Scripted scroll through the whole film, measuring frame times.
  const max = await page.evaluate(() => window.__onam.max())
  await page.evaluate(() => {
    window.__frames = []
    let last = performance.now()
    const loop = (t) => { window.__frames.push(t - last); last = t; if (!window.__stopFrames) requestAnimationFrame(loop) }
    requestAnimationFrame(loop)
  })
  if (preset.startsWith('mobile')) {
    // Touch gestures; stop when scroll stops advancing or after 60s.
    const t0 = Date.now()
    let y = 0
    let stalls = 0
    while (y < max - 2 && stalls < 4 && Date.now() - t0 < 60_000) {
      await touchSwipe(page, cdp, { distance: 450 })
      await page.waitForTimeout(300)
      const next = await page.evaluate(() => Math.round(scrollY))
      stalls = next === y ? stalls + 1 : 0
      y = next
    }
  } else {
    await page.mouse.move(600, 400)
    for (let y = 0; y < max + 400; y += 120) { await page.mouse.wheel(0, 120); await page.waitForTimeout(16) }
    await page.waitForTimeout(800)
  }
  const frames = await page.evaluate(() => { window.__stopFrames = true; return window.__frames.slice(2) })
  const sorted = [...frames].sort((a, b) => a - b)
  const pct = (p) => +(sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] ?? 0).toFixed(1)

  const dom = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect()
      return { css: `${Math.round(r.width)}×${Math.round(r.height)}`, backing: `${c.width}×${c.height}`, ratio: +(c.width / Math.max(r.width, 1)).toFixed(2) }
    })
    const videos = [...document.querySelectorAll('video')].map((v) => ({ src: v.currentSrc, preload: v.preload, autoplay: v.autoplay, muted: v.muted }))
    const images = [...document.querySelectorAll('img')].map((i) => ({ src: i.currentSrc, loading: i.loading, decoding: i.decoding, sized: i.hasAttribute('width') && i.hasAttribute('height'), natural: `${i.naturalWidth}×${i.naturalHeight}`, rendered: `${Math.round(i.getBoundingClientRect().width)}×${Math.round(i.getBoundingClientRect().height)}` }))
    const resources = performance.getEntriesByType('resource').reduce((acc, e) => { acc[e.initiatorType] = (acc[e.initiatorType] ?? 0) + (e.transferSize || 0); return acc }, {})
    return { nodes: document.getElementsByTagName('*').length, heapMB: performance.memory ? +(performance.memory.usedJSHeapSize / 1048576).toFixed(1) : null, canvases, videos, images, resources, willChange: [...document.querySelectorAll('*')].filter((el) => getComputedStyle(el).willChange !== 'auto').length }
  })

  const r = { preset, cpuThrottle: preset.startsWith('mobile') ? 4 : 1, vitals: { lcpMs: Math.round(vitals.lcp), cls: +vitals.cls.toFixed(3), longTasks: vitals.longTasks, longTaskMs: Math.round(vitals.longTaskMs) }, frames: { count: frames.length, p50: pct(0.5), p95: pct(0.95), p99: pct(0.99), over33ms: +(frames.filter((f) => f > 33.4).length / Math.max(frames.length, 1)).toFixed(3) }, dom, issues }
  if (r.vitals.lcpMs > BUDGET.lcpMs) flag('high', `[${preset}] LCP ${r.vitals.lcpMs}ms > ${BUDGET.lcpMs}ms`)
  if (r.vitals.cls > BUDGET.cls) flag('high', `[${preset}] CLS ${r.vitals.cls} > ${BUDGET.cls}`)
  if (dom.nodes > BUDGET.domNodes) flag('medium', `[${preset}] ${dom.nodes} DOM nodes > ${BUDGET.domNodes}`)
  if (r.frames.over33ms > 0.1) flag('high', `[${preset}] ${Math.round(r.frames.over33ms * 100)}% of scroll frames > 33ms (p95 ${r.frames.p95}ms)`)
  for (const c of dom.canvases) if (c.ratio > 2.01) flag('medium', `[${preset}] canvas ${c.css} has backing store ${c.backing} (${c.ratio}× CSS) — cap DPR`)
  for (const v of dom.videos) if (v.autoplay && !v.muted) flag('high', `[${preset}] video autoplays with sound: ${v.src}`)
  for (const i of dom.images) if (!i.sized) flag('low', `[${preset}] <img> without width/height (CLS risk): ${i.src}`)
  if (dom.willChange > 40) flag('medium', `[${preset}] ${dom.willChange} elements with will-change — promote only what animates`)
  if (issues.pageErrors.length) flag('high', `[${preset}] page errors: ${issues.pageErrors.join('; ')}`)
  runtime.push(r)
  await context.close()
}
await browser.close()
server.stop()

const report = { createdAt: new Date().toISOString(), budgets: BUDGET, dependencies: pkg.dependencies, static: { initialJs: { raw: sum(initialJs, 'raw'), gzip: sum(initialJs, 'gzip'), br: sum(initialJs, 'br') }, initialCss: { br: sum(initialCss, 'br') }, files, sequences: Object.fromEntries(sequences) }, runtime, findings }
await writeFile(join(out, 'report.json'), JSON.stringify(report, null, 2))
const md = [
  '# Performance report', '', `Created: ${report.createdAt}`, '',
  '## Bundle', '', '| file | raw | gzip | brotli | initial |', '|---|---|---|---|---|',
  ...files.filter((f) => ['.js', '.css', '.html'].includes(f.ext)).map((f) => `| ${f.file} | ${kb(f.raw)} | ${f.gzip ? kb(f.gzip) : '-'} | ${f.br ? kb(f.br) : '-'} | ${f.initial ? 'yes' : ''} |`),
  '', `Initial JS: **${kb(sum(initialJs, 'br'))} br** (budget ${kb(BUDGET.initialJsBr)}). Initial CSS: ${kb(sum(initialCss, 'br'))} br.`, '',
  `Dependencies: ${Object.keys(pkg.dependencies).join(', ')}`, '',
  '## Media', '', `Files audited: ${media.length}. Sequences: ${sequences.size ? [...sequences].map(([k, s]) => `${k} (${s.frames} frames, ${kb(s.bytes)})`).join(', ') : 'none'}`, '',
  '## Runtime', '', '| viewport | CPU | LCP | CLS | long tasks | frames p50/p95/p99 | >33ms | DOM | heap | canvases |', '|---|---|---|---|---|---|---|---|---|---|',
  ...runtime.map((r) => `| ${r.preset} | ${r.cpuThrottle}× | ${r.vitals.lcpMs}ms | ${r.vitals.cls} | ${r.vitals.longTasks} (${r.vitals.longTaskMs}ms) | ${r.frames.p50}/${r.frames.p95}/${r.frames.p99}ms | ${Math.round(r.frames.over33ms * 100)}% | ${r.dom.nodes} | ${r.dom.heapMB ?? '?'}MB | ${r.dom.canvases.map((c) => `${c.css}@${c.ratio}x`).join(', ') || '-'} |`),
  '', `## Findings (${findings.length})`, ...(findings.length ? ['high', 'medium', 'low'].flatMap((l) => findings.filter((f) => f.level === l).map((f) => `- **${l}** ${f.msg}`)) : ['- none against current budgets']), '',
  '> Headless Chromium without GPU: frame times are pessimistic. Compare runs; confirm suspected jank on a real device.',
]
await writeFile(join(out, 'report.md'), md.join('\n'))
console.log(md.join('\n'))
console.log(`\nArtifacts: ${out}`)
