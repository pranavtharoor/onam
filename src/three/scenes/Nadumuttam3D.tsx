import { lazy, Suspense, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import type { SceneProps } from '../../core/scene/types'
import { useMotionMode } from '../../core/motion/useMotionMode'
import { NadumuttamScene } from '../../scenes/05-nadumuttam/NadumuttamScene'
import { FINE_POINTER, hasWebGL2 } from '../core/capability'
import './nadumuttam-3d.css'

const LampLayer = lazy(() => import('../nilavilakku/LampLayer'))

const finePointer = typeof window === 'undefined' ? null : window.matchMedia(FINE_POINTER)
const subscribe = (cb: () => void) => { finePointer?.addEventListener('change', cb); return () => finePointer?.removeEventListener('change', cb) }
const useFinePointer = () => useSyncExternalStore(subscribe, () => !!finePointer?.matches, () => false)

/**
 * The courtyard, with the brass nilavilakku under the beam in WebGL.
 *
 * Renders the 2D NadumuttamScene unchanged (its choreography, beam, pillars and
 * floor), and on desktop with a fine pointer and WebGL2 mounts the 3D lamp inside
 * its wall. The 2D scene's painted lamp is hidden only once the 3D one has drawn.
 */
export function Nadumuttam3D(props: SceneProps) {
  const mode = useMotionMode()
  const fine = useFinePointer()
  const [host, setHost] = useState<{ section: HTMLElement; wall: HTMLElement } | null>(null)
  const eligible = mode === 'desktop' && fine && hasWebGL2()

  useLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>(`[data-scene="${props.id}"]`)
    const wall = section?.querySelector<HTMLElement>('.nm-wall')
    setHost(section && wall ? { section, wall } : null)
  }, [props.id])

  return (
    <>
      <NadumuttamScene {...props} />
      {eligible && host && <Suspense fallback={null}><LampLayer section={host.section} wall={host.wall} /></Suspense>}
    </>
  )
}
