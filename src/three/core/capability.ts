import type { MotionMode } from '../../core/motion/media'

/**
 * Who gets the WebGL hero moments on the 3D edition, and with which settings.
 *
 * - Reduced motion: never (the designed still film, with the painted lamp).
 * - No WebGL2 (three.js needs it; iOS has it from 15): the painted lamp.
 *   `failIfMajorPerformanceCaveat` refuses software renderers on real machines;
 *   QA runs (`?qa`) accept them (SwiftShader in headless Chromium).
 * - Desktop with a fine pointer: the desktop profile. Everything else (phones,
 *   tablets, touch laptops): the phone profile.
 */
export const FINE_POINTER = '(pointer: fine)'

export interface GLProfile {
  name: 'desktop' | 'phone'
  /** Device pixel ratio cap before adaptive downscaling. */
  maxDpr: number
  antialias: boolean
  /** Model file in public/models/ (the phone set has 512² colour, 256² data textures). */
  model: string
  /** The lamp's foot as a fraction of the wall's height (> 1 = cropped by the frame). */
  foot: number
}

export const PROFILES: Record<GLProfile['name'], GLProfile> = {
  desktop: { name: 'desktop', maxDpr: 1.5, antialias: true, model: 'nilavilakku.glb', foot: 1.5 },
  // Phones: DPR ≤ 1.25 and no MSAA keep the fill cost of a 3×-density screen near a laptop's.
  phone: { name: 'phone', maxDpr: 1.25, antialias: false, model: 'nilavilakku-mobile.glb', foot: 1.3 },
}

/**
 * Test overrides for comparing settings on a real device: `?msaa` (or `?msaa=0`) and `?dpr=1.5`.
 * Resolved once per page load.
 */
function withOverrides(p: GLProfile): GLProfile {
  const q = new URLSearchParams(location.search)
  const out = { ...p }
  if (q.has('msaa')) out.antialias = q.get('msaa') !== '0'
  const dpr = Number(q.get('dpr'))
  if (dpr > 0 && dpr <= 3) out.maxDpr = dpr
  return out
}

const resolved = {
  desktop: typeof location === 'undefined' ? PROFILES.desktop : withOverrides(PROFILES.desktop),
  phone: typeof location === 'undefined' ? PROFILES.phone : withOverrides(PROFILES.phone),
}

export function profileFor(mode: MotionMode, finePointer: boolean): GLProfile | null {
  if (mode === 'reduced') return null
  return mode === 'desktop' && finePointer ? resolved.desktop : resolved.phone
}

let cached: boolean | undefined

export function allowSoftwareGL(): boolean {
  return new URLSearchParams(location.search).has('qa')
}

export function hasWebGL2(): boolean {
  if (cached !== undefined) return cached
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2', { failIfMajorPerformanceCaveat: !allowSoftwareGL() })
    cached = !!gl
    gl?.getExtension('WEBGL_lose_context')?.loseContext()
  } catch {
    cached = false
  }
  return cached
}
