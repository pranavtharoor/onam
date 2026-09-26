/**
 * Single registration point for the always-on GSAP runtime.
 *
 * Heavier plugins (SplitText, DrawSVGPlugin, MorphSVGPlugin, CustomEase, …) are
 * NOT registered here. The scene that needs one imports and registers it, so the
 * cost lands in that scene's chunk rather than the initial bundle.
 */
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'

gsap.registerPlugin(ScrollTrigger, useGSAP)

// Scrubbed scenes should never jump when the tab regains focus.
gsap.ticker.lagSmoothing(0)

ScrollTrigger.config({
  // Mobile browsers resize the viewport when the URL bar shows/hides; refreshing on
  // that would re-measure every pin mid-gesture and cause visible jumps.
  ignoreMobileResize: true,
})

export { gsap, ScrollTrigger, useGSAP }
