import type { SceneDefinition } from '../core/scene/types'
import { HarnessOpening } from './_harness/HarnessOpening'
import { HarnessTravel } from './_harness/HarnessTravel'
import { HarnessReveal } from './_harness/HarnessReveal'

/**
 * The film, in scroll order. Add / remove / reorder scenes here.
 *
 * The `_harness` scenes are ARCHITECTURE PROOFS, not design. They exercise
 * pinning, depth-layer camera moves, horizontal travel, overlap transitions,
 * canvas layers and all three motion modes, so the QA tooling has something real
 * to measure. They are replaced by the real scenes once a creative direction is
 * chosen (see docs/creative/BRIEF.md).
 */
export const scenes: SceneDefinition[] = [
  { id: 'harness-opening', title: 'Harness: camera push through depth layers', Component: HarnessOpening, ground: 'var(--c-ink)' },
  { id: 'harness-travel', title: 'Harness: horizontal travel (desktop) / vertical stack (mobile)', Component: HarnessTravel, ground: 'var(--c-paper)' },
  { id: 'harness-reveal', title: 'Harness: overlap iris reveal + canvas layer', Component: HarnessReveal, entry: { desktop: 'overlap', mobile: 'cut', reduced: 'cut' }, ground: 'var(--c-leaf)' },
]
