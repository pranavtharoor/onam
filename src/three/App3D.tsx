import { SmoothScroll } from '../core/motion/SmoothScroll'
import { SceneSequence } from '../core/scene/SceneSequence'
import { Grain } from '../core/atmosphere/Grain'
import { scenes3d } from './registry3d'

/** The 3D edition's shell: identical to App, with the 3D scene list. */
export function App3D() {
  return (
    <SmoothScroll>
      <SceneSequence scenes={scenes3d} />
      <Grain />
    </SmoothScroll>
  )
}
