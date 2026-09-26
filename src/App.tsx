import { SmoothScroll } from './core/motion/SmoothScroll'
import { SceneSequence } from './core/scene/SceneSequence'
import { Grain } from './core/atmosphere/Grain'
import { scenes } from './scenes/registry'

export function App() {
  return (
    <SmoothScroll>
      <SceneSequence scenes={scenes} />
      <Grain />
    </SmoothScroll>
  )
}
