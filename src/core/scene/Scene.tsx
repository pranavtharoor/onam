import { forwardRef, type CSSProperties, type ReactNode } from 'react'
import type { SceneEntry, SceneProps } from './types'
import type { MotionMode } from '../motion/media'

const MODES: MotionMode[] = ['desktop', 'mobile', 'reduced']

interface SceneFrameProps extends SceneProps {
  children: ReactNode
  className?: string
  /** Extra length of scroll owned by this scene, in viewport heights (for pinned scenes this is set by the ScrollTrigger `end` instead). */
  style?: CSSProperties
}

/**
 * The outer frame every scene renders. Carries the data attributes the QA
 * tooling uses to find scenes and measure their scroll range.
 *
 * Structure:
 *   section.scene[data-scene]      ← trigger (and pin target for pinned scenes)
 *     div.scene__stage             ← 100svh viewport-sized stage; layers live here
 */
export const Scene = forwardRef<HTMLElement, SceneFrameProps>(function Scene(
  { id, title, entry, ground, index, className, style, children },
  ref,
) {
  const entryFor = (mode: MotionMode): SceneEntry => (typeof entry === 'string' ? entry : entry[mode] ?? 'cut')
  const entryAttrs = Object.fromEntries(MODES.map((m) => [`data-entry-${m}`, entryFor(m)]))

  return (
    <section
      ref={ref}
      id={id}
      data-scene={id}
      data-scene-title={title}
      {...entryAttrs}
      aria-label={title}
      className={['scene', className].filter(Boolean).join(' ')}
      style={{ '--scene-ground': ground, '--scene-z': index + 1, ...style } as CSSProperties}
    >
      {children}
    </section>
  )
})
