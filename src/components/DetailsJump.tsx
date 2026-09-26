import { useLenis } from '../core/motion/SmoothScroll'
import { copy } from '../content'

/**
 * A kasavu-ochre tag in the opening frame that goes straight to the invitation
 * card: smooth scroll via Lenis, then focus on the card title.
 */
export function DetailsJump({ className = '' }: { className?: string }) {
  const lenis = useLenis()

  const toDetails = () => {
    const target = document.getElementById('invitation')
    if (!target) return
    if (lenis) lenis.scrollTo(target, { offset: -24, duration: 2.2 })
    else target.scrollIntoView({ behavior: 'auto' })
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  return (
    <button type="button" className={`details-jump ${className}`} onClick={toDetails}>
      <span className="details-jump__label">{copy.details.label}</span>
      <span className="details-jump__date">{copy.details.date}</span>
    </button>
  )
}
