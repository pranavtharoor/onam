import { useEffect, useRef } from 'react'
import { ScrollTrigger } from '../motion/gsap'

export interface ScrollVideoProps {
  /** Sources in preference order, e.g. AV1/WebM first, H.264/MP4 last. Encode with `npm run assets:video -- --scrub`. */
  sources: { src: string; type: string }[]
  poster: string
  /** Element whose scroll range drives the video (usually the pinned scene root). */
  trigger: () => Element | null
  start?: string
  end?: string
  /** Seconds of smoothing between scroll and playhead. Seeking is expensive; keep ≥ 0.3. */
  scrub?: number
  className?: string
  /** Rendered instead of the video (e.g. under reduced motion): a still poster. */
  still?: boolean
}

/**
 * Scroll position → video.currentTime.
 *
 * Only use for genuinely filmed/cinematic motion. Requirements for smooth seeking:
 * short GOP / all-intra encode (see scripts/assets/encode-video.sh --scrub), muted,
 * playsInline, preload="auto". For moments needing frame-exact control on mobile,
 * prefer <ImageSequence>.
 */
export function ScrollVideo({ sources, poster, trigger, start = 'top top', end = 'bottom bottom', scrub = 0.5, className, still }: ScrollVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    const triggerEl = trigger()
    if (still || !video || !triggerEl) return

    let target = 0
    let raf = 0
    const seek = () => {
      raf = 0
      if (!video.duration) return
      const t = target * (video.duration - 0.04)
      // Skip micro-seeks: each seek decodes from the previous keyframe.
      if (Math.abs(video.currentTime - t) > 1 / 60) video.currentTime = t
    }

    // iOS will not decode frames until the element has been "played" once.
    const prime = () => {
      video.play().then(() => video.pause()).catch(() => {})
      window.removeEventListener('touchstart', prime)
    }
    window.addEventListener('touchstart', prime, { passive: true, once: true })

    const st = ScrollTrigger.create({
      trigger: triggerEl,
      start,
      end,
      scrub,
      onUpdate: (self) => {
        target = self.progress
        if (!raf) raf = requestAnimationFrame(seek)
      },
    })
    return () => {
      st.kill()
      cancelAnimationFrame(raf)
      window.removeEventListener('touchstart', prime)
    }
  }, [trigger, start, end, scrub, still])

  if (still) return <img className={className} src={poster} alt="" decoding="async" />

  return (
    <video ref={videoRef} className={className} poster={poster} muted playsInline preload="auto" disablePictureInPicture aria-hidden="true">
      {sources.map((s) => (
        <source key={s.src} src={s.src} type={s.type} />
      ))}
    </video>
  )
}
