import type { ComponentType } from 'react'
import type { MotionMode, MotionConditions } from '../motion/media'

/**
 * How a scene meets the one before it.
 * - `cut`     : normal document flow; the scene starts after the previous one ends.
 * - `overlap` : the scene is pulled up one viewport so it layers over the previous
 *               scene's held final frame. The incoming scene owns the transition
 *               (clip-path iris, mask wipe, camera push…). The outgoing scene must
 *               hold its last frame for at least one viewport (see `holdEnd`).
 */
export type SceneEntry = 'cut' | 'overlap'

/**
 * Entry can differ per motion mode. An overlap is only valid in a mode where the
 * previous scene actually holds a pinned final frame — e.g. a desktop-only
 * horizontal pin followed by a mobile vertical stack must be
 * `{ desktop: 'overlap', mobile: 'cut', reduced: 'cut' }`.
 * A plain string applies to every mode.
 */
export type SceneEntryByMode = SceneEntry | Partial<Record<MotionMode, SceneEntry>>

export interface SceneDefinition {
  /** Stable kebab-case id. Used for data-scene, QA reports and deep links. */
  id: string
  /** Human name used in QA/animation-review reports. */
  title: string
  Component: ComponentType<SceneProps>
  entry?: SceneEntryByMode
  /** Background behind the scene before its own layers paint (avoids flashes). */
  ground?: string
}

export interface SceneProps {
  id: string
  title: string
  entry: SceneEntryByMode
  ground?: string
  /** Position in the sequence; lets a scene set z-order for overlap transitions. */
  index: number
}

/** Everything a scene's choreography receives. Rebuilt whenever the motion mode changes. */
export interface SceneContext {
  root: HTMLElement
  mode: MotionMode
  conditions: MotionConditions
  /** Selector scoped to the scene root, e.g. q('.layer--far'). */
  q: (selector: string) => Element[]
}

/**
 * A scene's choreography. Create timelines/ScrollTriggers inside; they are
 * collected and reverted automatically. Return a function only for non-GSAP
 * cleanup (listeners, canvases, video elements).
 */
export type SceneChoreography = (ctx: SceneContext) => void | (() => void)
