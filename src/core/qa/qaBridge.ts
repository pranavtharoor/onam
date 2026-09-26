import type Lenis from 'lenis'
import { ScrollTrigger } from '../motion/gsap'
import { setAmbientPaused } from '../motion/ambient'

/**
 * Exposes a small, read-mostly hook on window for the Playwright QA scripts in
 * scripts/qa and scripts/perf. Enabled in dev, or in any build with `?qa` in the URL.
 */
export interface SceneBounds { id: string; title: string; start: number; end: number }

export interface OnamQA {
  scenes(): SceneBounds[]
  /** Jump to a scroll position and settle every scrubbed animation immediately. */
  jump(y: number): Promise<void>
  /** Freeze/unfreeze time-driven ambient motion (grain, particle loops) for position-sampled captures. */
  still(paused: boolean): void
  /** Total scrollable height. */
  max(): number
  lenis: Lenis | null
}

declare global {
  interface Window { __onam?: OnamQA }
}

const frames = (n: number) => new Promise<void>((resolve) => {
  const step = () => (n-- <= 0 ? resolve() : requestAnimationFrame(step))
  requestAnimationFrame(step)
})

export function installQABridge(getLenis: () => Lenis | null) {
  const enabled = import.meta.env.DEV || new URLSearchParams(location.search).has('qa')
  if (!enabled) return

  window.__onam = {
    get lenis() { return getLenis() },
    max: () => ScrollTrigger.maxScroll(window),
    still: setAmbientPaused,
    scenes() {
      return [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((el) => {
        // Pinned scenes are wrapped in a pin-spacer that owns the real scroll length.
        const box = el.parentElement?.classList.contains('pin-spacer') ? el.parentElement : el
        const top = box.getBoundingClientRect().top + window.scrollY
        return { id: el.dataset.scene!, title: el.dataset.sceneTitle ?? el.dataset.scene!, start: Math.round(top), end: Math.round(top + box.offsetHeight) }
      })
    },
    async jump(y) {
      const lenis = getLenis()
      if (lenis) lenis.scrollTo(y, { immediate: true, force: true })
      else window.scrollTo(0, y)
      ScrollTrigger.update()
      // Complete any scrub catch-up tweens so screenshots show the settled state.
      // Finish toggle-action tweens that were just triggered, so the frame shows their end state.
      ScrollTrigger.getAll().forEach((st) => {
        const tween = st.getTween?.()
        if (tween && typeof tween.progress === 'function') tween.progress(1)
        const anim = st.animation
        if (anim && !st.vars.scrub && anim.isActive()) anim.progress(anim.reversed() ? 0 : 1)
      })
      await frames(3)
    },
  }
}
