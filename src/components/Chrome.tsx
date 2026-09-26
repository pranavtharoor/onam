import { useEffect, useState } from 'react'
import { ScrollTrigger } from '../core/motion/gsap'
import { useLenis } from '../core/motion/SmoothScroll'
import { ambience } from '../core/audio/ambience'
import { copy } from '../content'

/**
 * The only persistent UI: a way straight to the invitation details, and the
 * optional sound toggle. Also tells the ambience which scene is on screen.
 */
export function Chrome() {
  const lenis = useLenis()
  const [soundOn, setSoundOn] = useState(false)

  const [atCard, setAtCard] = useState(false)

  useEffect(() => ambience.subscribe(setSoundOn), [])

  // Once the invitation card is on screen, the shortcut to it has done its job.
  useEffect(() => {
    const card = document.getElementById('invitation')
    if (!card) return
    const io = new IntersectionObserver(([e]) => setAtCard(!!e?.isIntersecting), { threshold: 0.15 })
    io.observe(card)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    const triggers = [...document.querySelectorAll<HTMLElement>('[data-scene]')].map((el) =>
      ScrollTrigger.create({
        trigger: el, start: 'top center', end: 'bottom center',
        onToggle: (self) => { if (self.isActive) ambience.setScene(el.dataset.scene!) },
      }),
    )
    return () => triggers.forEach((t) => t.kill())
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
      <button
        type="button" className="chrome-btn chrome-sound" aria-pressed={soundOn}
        onClick={() => (soundOn ? ambience.disable() : void ambience.enable())}
      >
        <span className={`chrome-wave${soundOn ? ' is-on' : ''}`} aria-hidden="true"><i /><i /><i /></span>
        {soundOn ? copy.chrome.soundOff : copy.chrome.soundOn}
      </button>
    </div>
  )
}
