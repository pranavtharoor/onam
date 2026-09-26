---
name: performance-review
description: Performance audit for the cinematic site — bundle and dependency weight, images/video/image-sequence sizes and formats, lazy loading, font loading, canvas resolution, GPU-heavy CSS, DOM size, layout shift, animation frame times and mobile CPU cost — using the repo's perf report (static + real-browser runtime) and giving concrete remediation. Use before merging scene work that adds assets or effects, when the site feels janky, or when asked about load time, bundle size or mobile performance.
---

# Performance review

Goal: keep the film cinematic *and* light. Don't strip what makes it special;
do refuse waste. Every recommendation names the saving and the visual cost.

## Evidence

`npm run perf:report` (builds, then serves the production build):
- **Static:** every dist file raw/gzip/brotli; initial critical path vs lazy chunks;
  media audit of `dist/assets` + `public/media` (image/video/font/sequence budgets,
  wrong formats); oversized SVG sources.
- **Runtime** (desktop 1×, mobile with 4× CPU throttle): LCP, CLS, long tasks,
  frame-time p50/p95/p99 and % > 33ms during a full scripted scroll, DOM nodes,
  JS heap, canvas backing-store vs CSS size, `<img>`/`<video>` attributes,
  count of `will-change` elements, transfer by type.
- Findings are ranked high/medium/low against budgets at the top of
  `scripts/perf/report.mjs`. Budgets are tripwires: change them deliberately
  and record why in the brief's decision log.

Headless, GPU-less Chromium makes absolute frame times pessimistic: compare
against the previous run (keep the last report path in your notes) and confirm
suspected jank on a real phone before large rewrites.

## Checklist and remedies

**JavaScript**
- Initial JS budget 150 KB br (React + GSAP core + ScrollTrigger + Lenis ≈ 103 KB). New dependencies need a reason in the brief; check `bundlephobia`-scale cost before adding.
- Heavy GSAP plugins registered per scene (not globally). Heavy scenes `React.lazy` + preload next scene on the previous scene's `onEnter`.
- No second animation runtime unless justified (Motion only for React micro-interactions, and only when used).

**Images**
- AVIF with WebP fallback via `npm run assets:images`; `srcset`/`sizes`; explicit `width`/`height`; `loading="lazy"` + `decoding="async"` below the first scene; `fetchpriority="high"` for the opening's key image only.
- No PNG/JPEG over ~60 KB; nothing over 350 KB. Textures tile at ≤ 512px.
- Pre-blur and pre-composite static depth layers instead of CSS filters.

**Video & sequences**
- `npm run assets:video` (AV1 + H.264, audio stripped, `faststart`); scrub videos use `--scrub` (short GOP). ≤ 4 MB per rendition; mobile rendition at 720p or less. `preload="none"` or `metadata` until the scene is near; posters always.
- Image sequences: mobile variant is half the frames at half width; ≤ 6 MB per variant, ≤ 60 KB/frame; progressive load (the component loads every 8th frame first).

**Fonts**
- woff2 only, subset to used glyphs (Latin + Malayalam separately with `unicode-range`), ≤ 60 KB per file, `font-display: swap`, preload only the opening display face. Check the first capture frame for FOUT/FOIT.

**Canvas**
- DPR capped (atmosphere ≤ 1.5, sequences ≤ 2) — report flags ratio > 2. Runs only when visible (`useCanvasStage` does this). Particle counts reduced on mobile; pre-rasterised sprites, no per-frame path building for hundreds of particles.

**CSS / GPU**
- Animate transform/opacity. Expensive when animated on large areas: `filter: blur`, `backdrop-filter`, `mix-blend-mode`, `box-shadow`, `clip-path` on full-viewport layers with complex content. `will-change` only on layers that animate (report flags > 40).
- Grain overlay is one composited layer; don't add more full-screen blend layers.

**Layout / DOM**
- CLS ≤ 0.05; reserve media boxes; no late-loading font shifting pinned heights (fonts ready → `ScrollTrigger.refresh()` is wired).
- DOM ≤ ~2,500 nodes; pookalam/sequence detail goes to canvas when SVG node count explodes.

**Animation**
- One rAF loop (`gsap.ticker`). No layout reads in `onUpdate`/per-frame code; cache measurements in `invalidateOnRefresh` functions. Kill/pause off-screen loops.

## Output

```
## Performance review — <commit>
Report: qa-artifacts/perf/<ts>/report.md   (previous: <path or none>)
Summary: initial JS <x> KB br · LCP d/m <x>/<y> ms · CLS <x> · p95 frame d/m <x>/<y> ms · media <total>
Findings (highest impact first):
1. <problem> — evidence: <metric/file> — fix: <concrete> — saving: <est.> — visual cost: <none/describe>
Accepted costs: <things that are heavy on purpose and why>
Not measured: <e.g. real-device GPU, Safari decode, network throttling>
```
