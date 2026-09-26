// Browser + viewport presets shared by the QA and perf scripts.
import { chromium } from 'playwright'

export const VIEWPORTS = {
  desktop: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
  laptop: { viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 },
  mobile: { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'mobile-small': { viewport: { width: 360, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  'mobile-landscape': { viewport: { width: 844, height: 390 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
  tablet: { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true },
}

export function parseArgs(argv = process.argv.slice(2)) {
  const out = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) continue
    const [k, v] = a.slice(2).split('=')
    out[k] = v ?? (argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : true)
  }
  return out
}

/** Software WebGL (SwiftShader) for the 3D page. Only passed when a script tests /3d/. */
export const WEBGL_ARGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader']

export async function launch({ webgl = false } = {}) {
  // Headless Chromium with GPU rasterisation off is what we have in CI/cloud;
  // timings are therefore pessimistic — treat them as relative, not absolute.
  return chromium.launch({ args: ['--hide-scrollbars', '--autoplay-policy=user-gesture-required', ...(webgl ? WEBGL_ARGS : [])] })
}

/**
 * Opens the site in a fresh context for a viewport preset and wires up error collection.
 * @returns {Promise<{ context, page, issues: { console: any[], pageErrors: string[], failedRequests: string[] } }>}
 */
export async function openSite(browser, url, preset, { reducedMotion = false, recordVideoDir, still = false } = {}) {
  const context = await browser.newContext({
    ...VIEWPORTS[preset],
    reducedMotion: reducedMotion ? 'reduce' : 'no-preference',
    ...(recordVideoDir ? { recordVideo: { dir: recordVideoDir, size: VIEWPORTS[preset].viewport } } : {}),
  })
  const page = await context.newPage()
  const issues = { console: [], pageErrors: [], failedRequests: [] }
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') issues.console.push({ type: m.type(), text: m.text() }) })
  page.on('pageerror', (e) => issues.pageErrors.push(String(e)))
  page.on('requestfailed', (r) => issues.failedRequests.push(`${r.failure()?.errorText} ${r.url()}`))
  page.on('response', (r) => { if (r.status() >= 400) issues.failedRequests.push(`${r.status()} ${r.url()}`) })

  const target = new URL(url)
  target.searchParams.set('qa', '1')
  await page.goto(target.href, { waitUntil: 'networkidle' })
  await page.waitForFunction(() => !!window.__onam, null, { timeout: 10_000 })
  await page.evaluate(() => document.fonts.ready)
  if (still) await page.evaluate(() => window.__onam.still(true))
  return { context, page, issues }
}

/** Scene bounds + total scroll as reported by the in-page QA bridge. */
export const getScenes = (page) => page.evaluate(() => ({ scenes: window.__onam.scenes(), max: window.__onam.max() }))
export const jump = (page, y) => page.evaluate((y) => window.__onam.jump(y), y)

export function stamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
}

/**
 * A real finger swipe via raw CDP touch events (native touch scrolling + momentum).
 * Note: Input.synthesizeScrollGesture with gestureSourceType 'touch' silently does
 * nothing in headless Chromium 1194 — don't use it.
 */
export async function touchSwipe(page, cdp, { distance = 400, steps = 12, x, y0 } = {}) {
  const { width, height } = page.viewportSize()
  x ??= Math.round(width / 2)
  y0 ??= Math.round(height * 0.78)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y: y0 }] })
  for (let i = 1; i <= steps; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y0 - (distance * i) / steps }] })
    await page.waitForTimeout(16)
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
}
