/**
 * Whether this visitor gets the WebGL hero moments.
 *
 * Desktop only: phones and tablets (below 900px or a coarse pointer) and reduced
 * motion keep the 2D film. Without hardware WebGL2 the 2D scene stays too:
 * `failIfMajorPerformanceCaveat` refuses software renderers on real machines.
 * QA runs (`?qa`) accept software WebGL (SwiftShader in headless Chromium) so the
 * 3D path can be captured and measured.
 */
export const FINE_POINTER = '(pointer: fine)'

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
