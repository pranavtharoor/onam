import { useRef } from 'react'
import { gsap } from '../../core/motion/gsap'
import { Scene } from '../../core/scene/Scene'
import { useScene } from '../../core/scene/useScene'
import type { SceneProps } from '../../core/scene/types'
import { LeafShape, LEAF_PATH } from '../../art/Leaf'
import { Ml } from '../../components/Ml'
import { copy, event } from '../../content'
import { calendarHref, rsvpHref } from '../../lib/calendar'
import './your-leaf.css'

/** The leaf split at its middle so the far half can fold towards the diner. */
function LeafHalf({ part }: { part: 'far' | 'near' }) {
  return (
    <svg className={`yl-half-art yl-half-art--${part}`} viewBox={part === 'far' ? '0 0 1000 205' : '0 205 1000 205'} preserveAspectRatio="none" aria-hidden="true">
      <LeafShape seed={77} />
    </svg>
  )
}

/**
 * Your seat. The camera turns from the row (tip pointing away, to the diners
 * across) and sits down: now the tip points to YOUR left. Then the leaf folds
 * towards you — the Kerala gesture for "I ate well" — and the invitation card
 * rises out of the fold.
 */
export function YourLeafScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)

  useScene(root, ({ root, mode, q }) => {
    if (mode === 'reduced') return
    const tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: root, start: 'top top', end: mode === 'desktop' ? '+=190%' : '+=170%', pin: q('.yl-stage')[0], scrub: 1 },
    })
    tl.addLabel('sit-down')
      .fromTo(q('.yl-leaf'), { rotation: 180, scale: 0.78 }, { rotation: 0, scale: 1, ease: 'sine.inOut', duration: 0.35 }, 0)
      .fromTo(q('.yl-line'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.3)
      .addLabel('fold', 0.45)
      .fromTo(q('.yl-far'), { rotationX: 0 }, { rotationX: -178, ease: 'sine.inOut', duration: 0.35 }, 0.45)
      // The fold's shadow falls on the near half, deepest mid-fold, then the leaf lies flat again.
      .fromTo(q('.yl-near'), { '--fold-shade': 0 }, { '--fold-shade': 1, duration: 0.18 }, 0.45)
      .to(q('.yl-near'), { '--fold-shade': 0.25, duration: 0.17 }, 0.63)
      .fromTo(q('.yl-note'), { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.08 }, 0.78)
      .to({}, { duration: 0.1 })
  })

  const url = typeof location === 'undefined' ? '' : location.href.split('#')[0]!
  return (
    <Scene ref={root} {...props} className="s-your-leaf">
      <div className="scene__stage yl-stage">
        <p className="yl-line display">{copy.yourLeaf.line}</p>
        <div className="yl-leaf" role="img" aria-label="Your banana leaf, folded towards you">
          <div className="yl-far">
            <div className="yl-face yl-face--front"><LeafHalf part="far" /></div>
            <div className="yl-face yl-face--back">
              <svg viewBox="0 205 1000 205" preserveAspectRatio="none" aria-hidden="true"><path d={LEAF_PATH} fill="#6a9a4c" transform="translate(0 410) scale(1 -1)" /></svg>
            </div>
          </div>
          <div className="yl-near"><LeafHalf part="near" /></div>
        </div>
        <p className="yl-note">{copy.yourLeaf.foldNote}</p>
      </div>

      <div className="yl-card-wrap" id="invitation">
        <article className="yl-card" aria-labelledby="yl-card-title">
          <div className="yl-kasavu" aria-hidden="true" />
          <p className="yl-card-kicker">{copy.yourLeaf.cardKicker}</p>
          <h2 id="yl-card-title" className="display yl-card-title" tabIndex={-1}>{event.title}</h2>
          <dl className="yl-facts">
            <div><dt>When</dt><dd>{event.dayLabel}, {event.timeLabel}</dd></div>
            <div><dt>Where</dt><dd>{event.venue}<br />{event.addressLines.join(', ')}</dd></div>
            <div><dt>Food</dt><dd>{event.food}</dd></div>
            <div><dt>Dress</dt><dd>{event.dress}</dd></div>
          </dl>
          <div className="yl-actions">
            <a className="yl-rsvp" href={rsvpHref()} target="_blank" rel="noopener">{copy.yourLeaf.rsvp}</a>
            <a className="yl-link" href={event.mapsUrl} target="_blank" rel="noopener">{copy.yourLeaf.maps}</a>
            <a className="yl-link" href={calendarHref(url)} download="onam-sadhya.ics">{copy.yourLeaf.calendar}</a>
          </div>
          <p className="yl-signoff">
            <Ml className="yl-signoff-ml">{copy.yourLeaf.signoff.ml}</Ml>
            <span>{copy.yourLeaf.signoff.roman}. {copy.yourLeaf.signoff.en}</span>
          </p>
          <div className="yl-kasavu" aria-hidden="true" />
        </article>
      </div>
    </Scene>
  )
}
