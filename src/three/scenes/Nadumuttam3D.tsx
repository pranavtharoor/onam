import { lazy, Suspense, useEffect, useLayoutEffect, useState, useSyncExternalStore } from 'react'
import type { SceneProps } from '../../core/scene/types'
import { useMotionMode } from '../../core/motion/useMotionMode'
import { NadumuttamScene } from '../../scenes/05-nadumuttam/NadumuttamScene'
import { FINE_POINTER, hasWebGL2, profileFor } from '../core/capability'
import { glStats, mountStats } from '../core/stats'
import './nadumuttam-3d.css'

const LampLayer = lazy(() => import('../nilavilakku/LampLayer'))

const finePointer = typeof window === 'undefined' ? null : window.matchMedia(FINE_POINTER)
const subscribe = (cb: () => void) => { finePointer?.addEventListener('change', cb); return () => finePointer?.removeEventListener('change', cb) }
const useFinePointer = () => useSyncExternalStore(subscribe, () => !!finePointer?.matches, () => false)

/**
 * The courtyard, with the brass nilavilakku under the beam in WebGL.
 *
 * Renders the 2D NadumuttamScene unchanged (its choreography, beam, pillars and
 * floor) and mounts the 3D lamp inside its wall, with the desktop or the phone
 * profile (see capability.ts). Reduced motion and devices without WebGL2 keep the
 * painted lamp, which is also what shows until the 3D one has drawn.
 */
export function Nadumuttam3D(props: SceneProps) {
  const mode = useMotionMode()
  const fine = useFinePointer()
  const [host, setHost] = useState<{ section: HTMLElement; wall: HTMLElement } | null>(null)
  const webgl = hasWebGL2()
  const profile = webgl ? profileFor(mode, fine) : null

  useLayoutEffect(() => {
    const section = document.querySelector<HTMLElement>(`[data-scene="${props.id}"]`)
    const wall = section?.querySelector<HTMLElement>('.nm-wall')
    setHost(section && wall ? { section, wall } : null)
  }, [props.id])

  useEffect(() => {
    mountStats()
    if (!profile) {
      glStats.lamp = '2D'
      glStats.profile = ''
      glStats.reason = mode === 'reduced' ? 'reduced motion' : 'no WebGL2'
    }
  }, [profile, mode])

  return (
    <>
      <NadumuttamScene {...props} />
      {profile && host && <Suspense fallback={null}><LampLayer section={host.section} wall={host.wall} profile={profile} /></Suspense>}
    </>
  )
}
