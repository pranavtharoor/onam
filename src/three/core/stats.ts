import { gsap } from '../../core/motion/gsap'

/**
 * `?fps` on the 3D edition: a small corner readout for testing on real devices.
 * fps is the page's frame rate (gsap.ticker, the one loop everything runs on);
 * draw is the CPU time of the WebGL layer's render call (GPU work is asynchronous,
 * so a heavy GPU shows up as low fps rather than high draw ms); DPR is the WebGL
 * canvas's current pixel ratio (after any adaptive downscale); then which lamp is
 * showing and why.
 */
export const glStats = {
  lamp: '2D' as '2D' | '3D',
  reason: 'starting',
  profile: '',
  dpr: 0,
  msaa: false,
  drawMs: 0,
  /** Stage calls this after each draw. */
  draw(ms: number) { this.drawMs = this.drawMs ? this.drawMs * 0.9 + ms * 0.1 : ms },
}

export const statsEnabled = () => typeof location !== 'undefined' && new URLSearchParams(location.search).has('fps')

let mounted = false

export function mountStats() {
  if (mounted || !statsEnabled()) return
  mounted = true
  const el = document.createElement('div')
  el.setAttribute('aria-hidden', 'true')
  el.style.cssText = [
    'position:fixed', 'right:max(8px, env(safe-area-inset-right))', 'top:max(8px, env(safe-area-inset-top))', 'z-index:2147483647',
    'font:600 11px/1.35 ui-monospace,SFMono-Regular,Menlo,monospace', 'color:#f4efe3', 'background:rgb(23 19 15 / 0.82)',
    'padding:6px 8px', 'border-radius:4px', 'pointer-events:none', 'white-space:pre', 'font-variant-numeric:tabular-nums',
  ].join(';')
  document.body.appendChild(el)
  let frames = 0
  let worst = 0
  let lastT = 0
  let since = performance.now()
  gsap.ticker.add(() => {
    const now = performance.now()
    if (lastT) worst = Math.max(worst, now - lastT)
    lastT = now
    frames++
    if (now - since < 500) return
    const fps = (frames * 1000) / (now - since)
    el.textContent = [
      `${fps.toFixed(0).padStart(3)} fps  worst ${worst.toFixed(0)}ms`,
      `lamp ${glStats.lamp}${glStats.profile ? ` · ${glStats.profile}` : ''}`,
      glStats.lamp === '3D' ? `draw ${glStats.drawMs.toFixed(1)}ms · dpr ${glStats.dpr.toFixed(2)}${glStats.msaa ? ' · msaa' : ''}` : glStats.reason,
    ].join('\n')
    frames = 0
    worst = 0
    since = now
  })
}
