import { SmoothScroll } from './core/motion/SmoothScroll'
import { SceneSequence } from './core/scene/SceneSequence'
import { Grain } from './core/atmosphere/Grain'
import { scenes } from './scenes/registry'
import { Chrome } from './components/Chrome'

export function App() {
  return (
    <SmoothScroll>
      <SceneSequence scenes={scenes} />
      <Chrome />
      <Grain />
    </SmoothScroll>
  )
}
