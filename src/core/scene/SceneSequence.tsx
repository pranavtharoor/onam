import { useEffect } from 'react'
import { ScrollTrigger } from '../motion/gsap'
import type { SceneDefinition } from './types'

/**
 * Renders the ordered scene list. Order in the array is scroll order — adding,
 * removing or reordering scenes is a one-line change in src/scenes/registry.ts.
 *
 * Scenes mount top-to-bottom, so their ScrollTriggers are created in page order
 * (which is what ScrollTrigger's refresh logic expects).
 */
export function SceneSequence({ scenes }: { scenes: SceneDefinition[] }) {
  useEffect(() => {
    // Web fonts change line heights → re-measure pins once they are in.
    document.fonts?.ready.then(() => ScrollTrigger.refresh())
  }, [])

  return (
    <main className="sequence">
      {scenes.map(({ id, title, Component, entry = 'cut', ground }, index) => (
        <Component key={id} id={id} title={title} entry={entry} ground={ground} index={index} />
      ))}
    </main>
  )
}
