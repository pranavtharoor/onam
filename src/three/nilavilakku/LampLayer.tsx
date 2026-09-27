import { useEffect } from 'react'
import { ScrollTrigger } from '../../core/motion/gsap'
import { FLAME_AT } from '../../scenes/05-nadumuttam/NadumuttamScene'
import { createStage, type Stage } from '../core/stage'
import { createLampScene, type LampScene } from './lampScene'

/**
 * The lamp's foot, as a fraction of the wall's height (the painted floor band is 86–100%).
 * Below 1 the whole lamp stands on the floor, as the painted one did (≈ 20% of the frame tall);
 * above 1 it stands nearer the lens and the frame crops it through the stem.
 */
const FOOT_AT = 1.5

/**
 * The WebGL nilavilakku, mounted inside the nadumuttam's wall (so it rides the
 * tilt-down with the beam, pillars and floor). Lazy chunk: three.js loads only here.
 *
 * Driven by the scene's own pinned timeline: every frame it reads that timeline's
 * (scrubbed) progress, so the lamp's camera and lighting move exactly with the film.
 * The 2D lamp stays visible until the first 3D frame is drawn, and comes back if
 * WebGL fails or the context is lost.
 */
declare global { interface Window { __lampMs?: number[] } }
const qa = new URLSearchParams(location.search).has('lampms') // draw timer for scripts/perf/hold-3d.mjs
const px = new Uint8Array(4)

export default function LampLayer({ section, wall }: { section: HTMLElement; wall: HTMLElement }) {
  useEffect(() => {
    // A fresh canvas per mount: a canvas whose WebGL context was released can't be reused
    // (StrictMode mounts effects twice).
    const el = document.createElement('canvas')
    el.className = 'nm-lamp3d'
    el.setAttribute('aria-hidden', 'true')
    wall.appendChild(el)
    let disposed = false
    let lamp: LampScene | null = null
    let stage: Stage | null = null
    let shown = false

    const timeline = () => ScrollTrigger.getAll().find((st) => st.pin === section)?.animation
    const layout = (width: number, height: number) => {
      if (!lamp) return
      const w = wall.getBoundingClientRect()
      const c = el.getBoundingClientRect()
      const floor = wall.querySelector<HTMLElement>('.nm-floor')?.getBoundingClientRect()
      const at = (y: number) => (w.top + y * w.height - c.top) / c.height
      lamp.layout({
        width, height,
        flame: { x: (w.left + FLAME_AT.x * w.width - c.left) / c.width, y: at(FLAME_AT.y) },
        foot: at(FOOT_AT),
        floorLine: floor ? (floor.top - c.top) / c.height : at(0.86),
      })
    }

    try {
      stage = createStage(el, {
        maxDpr: 1.5,
        onResize: layout,
        frame: ({ time }) => (lamp ? lamp.update(timeline()?.progress() ?? 0, time) : false),
        render: () => {
          if (!lamp) return
          if (qa) {
            // QA: time the draw for scripts/perf/hold-3d.mjs (a 1-pixel read waits for the GPU).
            const gl = stage!.renderer.getContext()
            const t0 = performance.now()
            lamp.render()
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
            ;(window.__lampMs ??= []).push(performance.now() - t0)
          } else lamp.render()
          if (!shown) {
            shown = true
            section.dataset.lamp = '3d'
          }
        },
      })
    } catch {
      return // no WebGL: the painted lamp stays
    }
    const onLost = (e: Event) => { e.preventDefault(); delete section.dataset.lamp; shown = false }
    el.addEventListener('webglcontextlost', onLost)

    const url = new URL('../models/nilavilakku.glb', document.baseURI).href
    createLampScene(stage.renderer, url).then((l) => {
      if (disposed) { l.dispose(); return }
      lamp = l
      const r = el.getBoundingClientRect()
      layout(r.width, r.height)
      stage?.invalidate()
    }).catch(() => { /* the painted lamp stays */ })

    return () => {
      disposed = true
      el.removeEventListener('webglcontextlost', onLost)
      delete section.dataset.lamp
      lamp?.dispose()
      stage?.dispose()
      el.remove()
    }
  }, [section, wall])

  return null
}
