/**
 * Ambient (time-driven, not scroll-driven) motion: grain, drifting particles,
 * idle loops. QA tooling freezes it so position-sampled screenshots only change
 * when scroll-driven choreography changes. Canvas loops check `ambient.paused`.
 */
export const ambient = { paused: false }

export function setAmbientPaused(paused: boolean) {
  ambient.paused = paused
  document.documentElement.classList.toggle('qa-still', paused)
}
