import type { ComponentType } from 'react'
import type { SceneDefinition, SceneProps } from '../core/scene/types'
import { scenes } from '../scenes/registry'

/**
 * The 3D edition's film: the 2D registry (order, entries, skips, grounds all
 * inherited), with 3D variants swapped in by scene id.
 *
 * A variant is a scene component that renders the 2D scene and adds a WebGL layer
 * on desktop only; on phones, touch devices, reduced motion or without WebGL it
 * renders exactly the 2D scene. To grow toward a full 3D film, add entries here.
 */
const variants: Record<string, ComponentType<SceneProps>> = {}

export const scenes3d: SceneDefinition[] = scenes.map((s) => {
  const Component = variants[s.id]
  return Component ? { ...s, Component } : s
})
