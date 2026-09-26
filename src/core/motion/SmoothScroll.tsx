import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './media'

const LenisContext = createContext<Lenis | null>(null)
let current: Lenis | null = null

/** Non-React access (QA bridge, one-off scrollTo calls). */
export const getLenis = () => current

/** The shared Lenis instance, or null when native scrolling is in use (reduced motion). */
export function useLenis(): Lenis | null {
  return useContext(LenisContext)
}

/**
 * Lenis smooth scrolling, driven by GSAP's ticker so that Lenis and every
 * ScrollTrigger read the same scroll value on the same frame.
 *
 * - Touch input stays native (Lenis' default `syncTouch: false`): hijacking touch
 *   momentum on phones feels wrong and costs battery.
 * - Under prefers-reduced-motion Lenis is not created at all; scroll is native.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    if (prefersReducedMotion()) return

    const instance = new Lenis({
      autoRaf: false,
      lerp: 0.085,
      wheelMultiplier: 0.9,
      anchors: true,
    })
    instance.on('scroll', ScrollTrigger.update)
    const tick = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(tick)
    current = instance
    setLenis(instance)

    return () => {
      gsap.ticker.remove(tick)
      instance.destroy()
      current = null
      setLenis(null)
    }
  }, [])

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>
}
