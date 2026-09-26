import type { SceneDefinition } from '../core/scene/types'
import { BackwaterScene } from './01-backwater/BackwaterScene'
import { PaddyScene } from './02-paddy/PaddyScene'
import { PadippuraScene } from './03-padippura/PadippuraScene'
import { PookalamScene } from './04-pookalam/PookalamScene'
import { NadumuttamScene } from './05-nadumuttam/NadumuttamScene'
import { SadhyaRowScene } from './06-sadhya-row/SadhyaRowScene'
import { YourLeafScene } from './07-your-leaf/YourLeafScene'

/**
 * The film, in scroll order (Direction B, "Maveli Comes Home" — docs/creative/BRIEF.md §6).
 * Seams: each scene's last frame is designed to meet the next scene's first frame.
 */
export const scenes: SceneDefinition[] = [
  { id: 'backwater', title: 'Backwater before dawn', Component: BackwaterScene, ground: 'var(--c-indigo-deep)' },
  { id: 'paddy', title: 'Dawn over paddy and coconut trees', Component: PaddyScene, ground: 'var(--c-dawn)' },
  { id: 'padippura', title: 'The gatehouse', Component: PadippuraScene, entry: { desktop: 'overlap', mobile: 'overlap', reduced: 'cut' } },
  { id: 'pookalam', title: 'Ten mornings of the pookalam', Component: PookalamScene, ground: 'var(--c-earth)' },
  { id: 'nadumuttam', title: 'The courtyard open to the sky', Component: NadumuttamScene, entry: { desktop: 'overlap', mobile: 'overlap', reduced: 'cut' } },
  { id: 'sadhya-row', title: 'The row of leaves', Component: SadhyaRowScene, entry: { desktop: 'overlap', mobile: 'overlap', reduced: 'cut' } },
  { id: 'your-leaf', title: 'Your leaf and the invitation', Component: YourLeafScene, ground: 'var(--c-oxide)' },
]
