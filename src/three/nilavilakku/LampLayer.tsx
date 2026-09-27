import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../../core/motion/gsap'
import { FLAME_AT } from '../../scenes/05-nadumuttam/NadumuttamScene'
import type { GLProfile } from '../core/capability'
import { createStage, type Stage } from '../core/stage'
import { glStats } from '../core/stats'
import { createLampScene, type LampScene } from './lampScene'

declare global { interface Window { __lampMs?: number[] } }
const timed = new URLSearchParams(location.search).has('lampms') // GPU-synced draw timer for scripts/perf/hold-3d.mjs
const px = new Uint8Array(4)

/**
 * The WebGL nilavilakku, mounted inside the nadumuttam's wall (so it rides the
 * tilt-down with the beam, pillars and floor). Lazy chunk: three.js loads only here.
 *
 * Driven by the scene's own pinned timeline: every frame it reads that timeline's
 * (scrubbed) progress, so the lamp's camera and lighting move exactly with the film.
 * The painted lamp stays visible until the first 3D frame is drawn, and comes back
 * whenever WebGL fails or the context is lost; a restored context rebuilds the layer.
 */
export default function LampLayer({ section, wall, profile }: { section: HTMLElement; wall: HTMLElement; profile: GLProfile }) {
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    // A fresh canvas per mount: a canvas whose context was released can't be reused
    // (StrictMode mounts effects twice; a restored context remounts).
    const el = document.createElement('canvas')
    el.className = 'nm-lamp3d'
    el.setAttribute('aria-hidden', 'true')
    wall.appendChild(el)
    let disposed = false
    let lamp: LampScene | null = null
    let stage: Stage | null = null
    let shown = false
    const fallBack = (reason: string) => {
      delete section.dataset.lamp
      shown = false
      glStats.lamp = '2D'
      glStats.reason = reason
    }
    glStats.profile = profile.name
    glStats.msaa = profile.antialias

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
        foot: at(profile.foot),
        floorLine: floor ? (floor.top - c.top) / c.height : at(0.86),
      })
    }

    try {
      stage = createStage(el, {
        maxDpr: profile.maxDpr,
        antialias: profile.antialias,
        onResize: layout,
        onLost: () => fallBack('context lost'),
        onRestored: () => setGeneration((g) => g + 1),
        frame: ({ time }) => (lamp ? lamp.update(timeline()?.progress() ?? 0, time) : false),
        render: () => {
          if (!lamp) return
          if (timed) {
            const gl = stage!.renderer.getContext()
            const t0 = performance.now()
            lamp.render()
            gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px)
            ;(window.__lampMs ??= []).push(performance.now() - t0)
          } else lamp.render()
          if (!shown) {
            shown = true
            section.dataset.lamp = '3d'
            glStats.lamp = '3D'
            glStats.reason = ''
          }
        },
      })
    } catch {
      fallBack('WebGL failed to start')
      el.remove()
      return
    }

    const url = new URL(`../models/${profile.model}`, document.baseURI).href
    createLampScene(stage.renderer, url).then((l) => {
      if (disposed) { l.dispose(); return }
      lamp = l
      const r = el.getBoundingClientRect()
      layout(r.width, r.height)
      // First frame now, off screen: the swap from the painted lamp happens before the wall arrives.
      stage?.renderNow()
    }).catch(() => fallBack('model failed to load'))

    return () => {
      disposed = true
      fallBack('unmounted')
      lamp?.dispose()
      stage?.dispose()
      el.remove()
    }
  }, [section, wall, profile, generation])

  return null
}
