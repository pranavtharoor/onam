# Assets

Two homes, chosen by how an asset is loaded:

| Home | What goes there | Why |
|---|---|---|
| `src/assets/<category>/` | Anything **imported** by code: SVG illustration, textures, fonts, stills | Vite fingerprints and tree-shakes it; unused assets never ship |
| `public/media/<category>/` | Anything **streamed by URL** at runtime: video, image sequences, audio | Large, lazily fetched, often range-requested; must not be inlined or hashed into JS |
| `media-src/` (gitignored) | Masters: layered source files, 4K renders, WAVs | Never shipped. Run the `npm run assets:*` scripts to produce web renditions |

## Categories

- `illustrations/` — scene artwork, one folder per scene: `illustrations/<scene-id>/<layer>.svg` (layers named by depth: `sky`, `far`, `mid`, `near`, `foreground`). Each depth layer is a separate file because each is a separate parallax plane.
- `svg/` — reusable motifs and patterns shared across scenes: `motif-<name>.svg` (e.g. `motif-thumba-flower.svg`), `pattern-<name>.svg` (e.g. `pattern-kasavu-border.svg`). Run `npm run assets:svg` after export (keeps ids for GSAP).
- `textures/` — tiling materials: `texture-<material>.webp` (paper, banana-fibre, laterite, brass-patina). Tiles ≤ 512px, produced with `npm run assets:images -- --tile`.
- `typography/` — self-hosted, subset `woff2` only: `<family>-<weight>[-italic].<script>.woff2` (e.g. `…-400.latin.woff2`, `…-400.malayalam.woff2`).
- `photography/` — only if the chosen direction uses photography. `<scene-id>-<subject>-<width>.{avif,webp}` via `npm run assets:images`.
- `video/`, `sequences/` — see the READMEs inside; the files themselves live in `public/media/`.

## Naming

kebab-case, scene id first when scene-specific, no version suffixes (`-final`, `-v2`) — git is the history.

## Placeholders

Until final artwork exists, a scene may draw placeholder geometry in code. Never commit stock imagery or generated filler "to be replaced later": an empty slot is easier to spot than a plausible fake.
