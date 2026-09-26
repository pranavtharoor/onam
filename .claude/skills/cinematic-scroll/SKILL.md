---
name: cinematic-scroll
description: How to build scroll-as-camera scenes in this repo — the scene contract (useScene, SceneDefinition, per-mode entries, registry), camera vocabulary, pacing budgets, scene-to-scene transitions, mobile and reduced-motion choreography, medium selection (DOM/SVG/Canvas/video/image sequence/optional WebGL), and Lenis + ScrollTrigger integration rules. Use whenever creating, editing, reordering or debugging a scene or transition. For raw GSAP/ScrollTrigger API details defer to the gsap-* skills.
---

# Cinematic scroll

**Principle: the visitor is holding a camera and moving it through a story.**
Scroll distance is time on a film strip. Nothing "appears": the camera arrives
at it, the light changes on it, or it is uncovered by something moving past.

API reference lives in the vendored official skills — use them, don't restate them:
`gsap-scrolltrigger` (pin, scrub, containerAnimation, refresh), `gsap-timeline`
(position parameter, labels), `gsap-react` (useGSAP, contextSafe), `gsap-plugins`
(SplitText, DrawSVG, MorphSVG, CustomEase), `gsap-performance`.

## 1. The scene contract (this repo)

```
src/scenes/registry.ts          ordered SceneDefinition[] — scroll order; add/remove/reorder here
src/scenes/<nn-id>/             one folder per scene: <Name>Scene.tsx, <name>.css, local assets
src/core/scene/useScene.ts      useGSAP + gsap.matchMedia → choreography(ctx) per mode
src/core/scene/Scene.tsx        <Scene> frame: section[data-scene] + per-mode data-entry-*
src/core/motion/                gsap.ts (registration), media.ts (modes), SmoothScroll (Lenis), ambient.ts
src/core/media/                 useCanvasStage, ScrollVideo, ImageSequence
src/core/audio/ambience.ts      opt-in procedural ambience; Chrome.tsx calls ambience.setScene(id) per active scene
```

A scene:

```tsx
export function PookalamScene(props: SceneProps) {
  const root = useRef<HTMLElement>(null)
  useScene(root, ({ root, mode, conditions, q }) => {
    if (mode === 'reduced') { /* set the designed still state, maybe one gentle fade */ return }
    const tl = gsap.timeline({ defaults: { ease: 'none' }, scrollTrigger: {
      trigger: root, start: 'top top', end: mode === 'desktop' ? '+=300%' : '+=220%', pin: true, scrub: 1 } })
    tl.addLabel('ring-1') /* … */
    // return () => {...} only for non-GSAP cleanup
  })
  return <Scene ref={root} {...props}><div className="scene__stage">…layers…</div></Scene>
}
```

Guarantees you get from `useScene`: scoped selectors (`q`), automatic revert of
every tween/ScrollTrigger/inline style on unmount **and** whenever the mode
changes (resize across 900px, reduced-motion toggle), so each mode's branch starts clean.

Rules:
- Author **three branches**: `desktop`, `mobile`, `reduced`. Mobile is a different
  choreography (fewer layers, shorter pins, vertical instead of horizontal travel,
  portrait compositions), not a scaled desktop. `conditions.short` flags
  landscape phones/short windows: shorten or drop pins there.
- One scene = one idea. If a scene needs a second idea, it's two scenes.
- Put the ScrollTrigger on the **timeline**, never on child tweens. Pin the scene
  root; animate its children (never the pinned element itself).
- Timelines use `ease: 'none'` for the camera track (scroll *is* the easing);
  use eases only inside beats (e.g. a petal settling) via nested tweens.
- Use labels for beats (`tl.addLabel('leaf-lands')`) — reviews refer to them.
- Layers are `.layer` elements inside `.scene__stage` (100svh, overflow clip).
  Depth order in DOM = depth order on screen.
- Heavy plugins (SplitText, DrawSVG, MorphSVG) are imported and registered in the
  scene file that uses them, never globally.
- A scene that is heavy (big SVG, canvas, video) should be `React.lazy`-loaded
  in the registry and preloaded one scene ahead; keep the first scene light.

## 2. Camera vocabulary

Translate every idea into camera language before writing tweens:

| Move | Implementation |
|---|---|
| **Push in / dolly** | scale layers around a focal point, near layers scale most (parallax ratio ≈ 1 / depth). Set `transformOrigin` on the subject, not the centre. |
| **Truck / pan** | translate layers horizontally at depth-proportional rates; horizontal travel scenes use `containerAnimation`. |
| **Crane / tilt** | vertical translation with the sky/far layers moving least; good for arriving (sky → courtyard). |
| **Fly-through** | scale an opening (doorway, gatehouse, leaf gap) past the viewport so its interior becomes the next scene — the best scene transition we have. |
| **Rack focus** | cross-fade a pre-blurred and a sharp copy of a layer (never animate `filter: blur` on large layers). |
| **Reveal by occlusion** | a foreground element (leaf, pillar, palm trunk) passes the lens and uncovers the next state. |
| **Hold** | a deliberate beat of scroll where the frame rests (~0.3–0.6 viewport). Holds make arrivals land; without them everything feels rushed. |
| **Match cut** | the last shape of one scene becomes the first of the next (pookalam ring → rim of the leaf → rim of the uruli). |

## 3. Pacing budget

Plan scroll length in viewport heights (vh) with a beat sheet before building.

- Whole film: ~18–28 vh on desktop, ~14–22 vh on mobile. Longer feels like work.
- A pinned scene: 1.5–4 vh. Beyond 4 vh it must have multiple distinct beats.
- Every beat must produce a visible change within ~0.25 vh of scroll, or it is a
  dead zone (unless it is a designed hold). `npm run qa:motion` measures this.
- Alternate intensity: big move → quiet hold → detail → big move. Two big moves
  back to back cancel each other out.
- `scrub: 1` (≈1s catch-up) is the default camera feel; use `scrub: true` only
  when elements must track the finger exactly (e.g. a drawing line).
- Snap only at genuine rest points (e.g. the invitation card), never mid-motion.

## 4. Transitions (the part that makes it a film)

Each scene's exit/entry is designed as a pair. The **incoming scene owns the
transition** using per-mode `entry` in the registry:

- `entry: 'cut'` — normal flow; the next scene scrolls in. Make the seam itself
  meaningful (a horizon line continues, a colour carries over).
- `entry: { desktop: 'overlap', mobile: 'cut', reduced: 'cut' }` — the incoming
  scene is pulled up one viewport and layers over the outgoing scene's held final
  frame; animate its `clip-path`/mask in the range `start: 'top bottom' → end: 'top top'`.
  **The outgoing scene must hold its final frame for ≥ 1 viewport in that mode**
  (extend its pin `end` by `window.innerHeight`), otherwise the overlap covers live content.
  Overlap only in modes where the previous scene holds.

Catalogue (no two adjacent transitions may use the same device):
clip-path iris from a meaningful origin (lamp flame, flower centre) · mask wipe
with an organic SVG edge (leaf edge, petal) · fly-through an opening · match cut
on a shared shape · occlusion wipe by a foreground object · colour-field carry
(ground colour of scene A becomes an object in scene B) · light change (dawn → noon via
ground/overlay colour tween, no cut).

Clip-path on a full-viewport layer repaints each frame: keep the revealed layer's
content simple during the transition or reveal a pre-rendered still.

## 5. Choosing the medium

| Need | Medium |
|---|---|
| Text, layout, simple shapes, anything accessible | DOM + CSS |
| Illustration, line drawing, morphs, masks, patterns | SVG (see `svg-illustration`) |
| Hundreds of moving things (petals, rice grains, dust, light motes) | Canvas via `useCanvasStage` |
| Filmed / rendered motion that must be cinematic | `<ScrollVideo>` (scroll → currentTime) |
| Frame-exact scroll control (esp. mobile Safari) | `<ImageSequence>` |
| Simple, self-contained scroll effects | native CSS `animation-timeline: view()` / `scroll()` inside `@supports` with a static fallback |
| Real 3D, lighting, shaders | **Not yet.** See §7. |

## 6. Lenis + ScrollTrigger rules

- One Lenis instance (`SmoothScroll`), driven by `gsap.ticker`; Lenis emits →
  `ScrollTrigger.update`. Never create another rAF loop; canvas uses `gsap.ticker` via `useCanvasStage`.
- Touch scrolling stays native (`syncTouch: false`). Don't fight mobile momentum.
- Under reduced motion Lenis isn't created: scroll is native.
- Use `useLenis()` for `scrollTo` (e.g. "skip to invitation"), never `window.scrollTo` while Lenis is active.
- Refresh after layout-affecting loads (fonts are handled in `SceneSequence`;
  call `ScrollTrigger.refresh()` after a lazy scene or big image changes height).
- Use `svh`/`lvh` for stage heights, never `vh` (mobile URL bar).
- `ScrollTrigger.config({ ignoreMobileResize: true })` is set; don't undo it.

## 7. Reduced motion is a designed cut, not "off"

In `reduced` mode each scene renders its **key frame** (the most meaningful
composition, usually the end state), no pins, no scrubbed camera, native scroll.
Allowed: short opacity cross-fades (≤ 300ms) on entering, colour changes.
Not allowed: parallax, scale, large translations, auto-playing loops, video
autoplay. Layout must be complete and legible with every animation removed.
Verify with `npm run qa:capture -- --reduced`.

## 8. Optional WebGL later

Architecture is ready but nothing is installed. If a scene genuinely needs it
(e.g. real light on brass, water caustics in the uruli): mount a `<canvas>` layer
inside that scene's stage from a `React.lazy` chunk, drive its uniforms from the
scene timeline (`tl.to(uniforms.uProgress, { value: 1 })`), render from
`gsap.ticker`, provide a still-image fallback for reduced motion and low-power
devices, and justify the dependency (three / ogl) in the brief's decision log.

## 9. Sound hook

Each scene's sound is a mix of procedural beds declared in `MIX` in
`src/core/audio/ambience.ts`, keyed by scene id; `Chrome` switches the mix as
scenes become active. Add a bed there rather than shipping audio files. Sound is
only ever enabled by an explicit visitor action; the film must be complete without it.

## 10. Pitfalls

- Pinning inside a transformed/`will-change` ancestor breaks `position: fixed` pins.
- Creating ScrollTriggers out of page order without `refreshPriority`.
- Animating the pinned element; `scrub` + `toggleActions` on the same trigger.
- Mobile: long horizontal pins, many layered full-screen PNGs, `background-attachment: fixed`.
- Measuring layout inside `onUpdate`; cache sizes in `invalidateOnRefresh` functions.
- Forgetting the QA bridge: scenes must render `<Scene>` so `data-scene` exists.
