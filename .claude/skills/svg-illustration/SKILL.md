---
name: svg-illustration
description: Authoring and animating the project's custom SVG illustration — pookalam construction, banana leaves, flowers, Kerala architecture, brass vessels, kasavu borders, line art — with a hand-made (not clip-art) quality, and structuring it for GSAP path drawing, morphing, masking and parallax layers. Use when drawing or editing any SVG artwork, building procedural motifs, or animating SVG. For DrawSVG/MorphSVG/MotionPath API details defer to gsap-plugins.
---

# SVG illustration

Illustration is this project's primary visual material. It must read as made by
a person with a point of view, from observation of real objects — never as icon
packs, mandala clip art, or "flower-shaped" generics.

## 1. Where SVG lives and how it's structured

- Scene art: `src/assets/illustrations/<scene-id>/<layer>.svg`, one file per depth
  plane (`sky`, `far`, `mid`, `near`, `foreground`) so each can be a parallax layer.
- Shared motifs: `src/assets/svg/motif-*.svg`, `pattern-*.svg`.
- Small, animated or data-driven art (pookalam rings, a drawing line, a leaf that
  unfolds) is written as **React components** returning `<svg>` so geometry can be
  generated and targeted; large static art is imported as a file (`?url` into
  `<img>` if it doesn't animate; inline only what animates).
- Run `npm run assets:svg` after exporting from a design tool. The config keeps
  ids and path structure (GSAP targets them) and never merges paths.

File conventions:
- `viewBox` always; no fixed `width/height`; size by CSS.
- Group by what moves together: `<g id="leaf-left" data-depth="0.6">`.
- ids are kebab-case, meaningful (`ring-3`, `thumba-cluster-a`), unique per document.
- Decorative art: `aria-hidden="true"` on the `<svg>`. Meaningful art (e.g. the
  finished pookalam): `role="img"` + `<title>`.
- Colours via CSS custom properties from `tokens.css` (`fill="var(--c-leaf)"`) so
  a direction change is a token change.

## 2. Hand-made quality

- **Filled shapes over strokes** for anything calligraphic: a leaf vein drawn as
  a tapered filled shape feels brushed; a uniform stroke feels like a diagram.
  Keep true strokes for line-drawing moments (animated outlines) and vary
  `stroke-width` between paths.
- **Seeded irregularity.** Use a seeded PRNG (`gsap.utils.random` with a fixed seed
  table, or a tiny mulberry32) so jitter is stable between renders and QA runs:
  petal rotation ±6°, scale ±8%, position ±1.5% of ring radius.
- **Observed silhouettes.** Draw from reference: a banana leaf has a thick midrib,
  parallel veins at ~60° to it, and wind-torn slits between veins; a coconut frond
  is a curved rachis with drooping leaflets that thin toward the tip; an uruli is
  shallow and wide with two ring handles; a nilavilakku has a tiered stem and a
  shallow wick dish; laterite has pitted texture; a nalukettu roof slopes steeply with deep eaves.
- Avoid: perfect bezier symmetry, identical repeated petals, gradients standing
  in for form, generic "leaf" teardrop icons, rangoli-style dotted outlines.
- Texture: overlay a tiling material texture (`src/assets/textures/`) via CSS
  `mask-image`/`background` on the layer, or `<pattern>` fills — not SVG filters
  animating per frame.

## 3. Pookalam construction (procedural)

Build it in code, not as one flat drawing — its ten-day growth is the animation.

```tsx
// Ring = N petals (or flower heads) of one flower type around radius r.
// Day d adds ring d. Colours are named flowers, not hues.
type Ring = { r: number; width: number; count: number; flower: 'thumba' | 'chethi' | 'mukkutti' | 'chendumalli' | 'vadamalli' | 'shankhupushpam'; shape: 'petal' | 'floret' | 'fill' }
```
- Petal shapes are a small set of hand-drawn `<symbol>`s per flower, placed with
  `<use href="#petal-chethi" transform="rotate(a) translate(r) rotate(jitter) scale(s)">`.
- Fill rings (solid petal carpet) are a thick arc path with a *petal-edged* outline
  (small scallops, irregular), plus a scatter of individual petals on top for texture.
- Centre: often a lamp or a single flower; grows last or first depending on the story.
- Animate by ring: petals of a ring scale from 0 with a stagger `from: 'random'`
  (hands placing flowers), never a uniform radial wipe.
- Keep total element count sane: ~1,500 `<use>` is fine on desktop; on mobile,
  render inner rings as SVG and pre-render outer dense rings to a raster layer if
  `perf:report` shows frame drops.

## 4. Animation techniques (with the right tool)

| Effect | Technique |
|---|---|
| Line drawing | `DrawSVGPlugin` (`drawSVG: '0% 0%' → '0% 100%'`). Path direction = draw direction; fix it in the source. For fill-based brush lines, animate a stroked mask path instead. |
| Shape morph (bud → flower, leaf closed → open) | `MorphSVGPlugin`; give both shapes similar point counts and start points; `shapeIndex` to fix twisting. |
| Reveal inside a shape | `<clipPath>` / `<mask>` with an animated child; organic edge from a hand-drawn path, not a rect. |
| Text on a curve (pookalam ring, leaf edge) | `<textPath>`; animate `startOffset`. Keep Malayalam in HTML when possible (better shaping); if on a path, test rendering in Chromium + Safari. |
| Parallax planes | Each depth file is a `.layer`; the scene timeline moves them (see `cinematic-scroll`). |
| Many petals falling/drifting | Not SVG — Canvas via `useCanvasStage`, using petal shapes rasterised once to offscreen canvases. |
| Following a path (a boat, a butterfly) | `MotionPathPlugin`. |

Register plugins in the scene file that uses them:
```ts
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin'
gsap.registerPlugin(DrawSVGPlugin)
```

## 5. Performance

- Animate transforms/opacity of `<g>` groups; avoid animating `d`, filters,
  `stroke-dasharray` on hundreds of paths simultaneously (DrawSVG on a handful is fine).
- No SVG filters (`feTurbulence`, `feGaussianBlur`) in animated layers; bake them.
- Inline SVG counts toward JS size: keep a scene's inline art under ~40 KB
  (`perf:report` flags larger); big static art goes in as `<img src>`.
- `vector-effect: non-scaling-stroke` when a camera push would otherwise fatten lines.
- Check DOM node count after adding art (`perf:report` reports it).

## 6. Review

Render it and look (`npm run qa:capture -- --scene <id> --checkpoints 9`). Zoom
into a crop at 2× device scale: do edges, joins and petal placement look placed
by hand, or stamped? Compare against `onam-design` §2 facts.
