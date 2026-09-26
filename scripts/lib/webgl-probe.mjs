// Prints which WebGL renderer headless Chromium exposes, with and without the SwiftShader flags.
import { chromium } from 'playwright'
import { WEBGL_ARGS } from './browser.mjs'

for (const args of [[], WEBGL_ARGS]) {
  const b = await chromium.launch({ args })
  const p = await b.newPage()
  const r = await p.evaluate(() => {
    const g = document.createElement('canvas').getContext('webgl2')
    if (!g) return 'no webgl2'
    const e = g.getExtension('WEBGL_debug_renderer_info')
    return e ? g.getParameter(e.UNMASKED_RENDERER_WEBGL) : 'webgl2 (renderer hidden)'
  })
  console.log(JSON.stringify(args), '→', r)
  await b.close()
}
