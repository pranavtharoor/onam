/**
 * Fixed paper-fibre grain over the whole experience. The noise is rendered once
 * (SVG feTurbulence → background image) and moved with a stepped CSS animation,
 * so it costs a composited layer and nothing per frame in JS.
 */
export function Grain() {
  return <div className="grain" aria-hidden="true" />
}
