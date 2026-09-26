import { useEffect, useState } from 'react'
import { useLenis } from '../core/motion/SmoothScroll'
import { copy } from '../content'

/**
 * The only persistent UI: a way straight to the invitation details.
 */
export function Chrome() {
  const lenis = useLenis()
  const [atCard, setAtCard] = useState(false)

  // Once the invitation card is on screen, the shortcut to it has done its job.
  useEffect(() => {
    const card = document.getElementById('invitation')
    if (!card) return
    const io = new IntersectionObserver(([e]) => setAtCard(!!e?.isIntersecting), { threshold: 0.15 })
    io.observe(card)
    return () => io.disconnect()
  }, [])

  const toDetails = () => {
    const target = document.getElementById('invitation')
    if (!target) return
    if (lenis) lenis.scrollTo(target, { offset: -24, duration: 2.2 })
    else target.scrollIntoView({ behavior: 'auto' })
    target.querySelector<HTMLElement>('h2')?.focus({ preventScroll: true })
  }

  return (
    <div className="chrome">
      <button type="button" className={`chrome-btn chrome-details${atCard ? ' is-hidden' : ''}`} onClick={toDetails} tabIndex={atCard ? -1 : 0} aria-hidden={atCard}>
        {copy.chrome.details}
      </button>
    </div>
  )
}
