# Onam Sadhya invitation — project guide

A static, scroll-driven film that invites guests to a Sadhya on Thiruvonam.
Quality bar: an interactive digital art piece / award-level editorial site —
never a landing page, template, card grid or "AI-looking" page.

**Current phase: Direction B ("Maveli Comes Home") is built** — seven scenes in
`src/scenes/01-…07-*`. Read `docs/creative/BRIEF.md` (§6 storyboard, §11 decision
log) before changing anything. All words live in `src/content.ts`. Hosted on
GitHub Pages: `.github/workflows/deploy.yml` builds on push to `main` and publishes
`dist/` to the `gh-pages` branch (served at https://pranavtharoor.github.io/onam/).

Pending from the hosts: the Google Form URL (`event.rsvpUrl`) and any date/venue
changes. The site's Malayalam was proofread by the host's father (2026-09-26);
any NEW Malayalam string needs the same review — set `MALAYALAM_VERIFIED = false`
until it has had one.
If the site URL changes, update the absolute `og:image`/`og:url` in `index.html`
`public/og.jpg` (1200×630) is the hosts' portrait poster (`public/invitation-poster.jpg`),
uncropped and letterboxed on its own sampled cream: `npm run assets:og` rebuilds it.

## Commands

```bash
npm run dev            # Vite dev server on :5173 (QA bridge enabled)
npm run build          # tsc --noEmit && vite build → dist/
npm run preview        # serve dist/ on :4173 (add ?qa to enable the QA bridge)
npm run typecheck

npm run qa:capture     # screenshots of every scene at checkpoints, desktop+mobile → qa-artifacts/capture/<ts>/
                       #   --reduced  --viewports desktop,mobile,mobile-small,mobile-landscape,tablet
                       #   --scene <id> --checkpoints 12   --preview (test prod build)   --url <running server>
npm run qa:motion      # dense scroll filmstrips + motion-energy chart (dead zones, jolts) → qa-artifacts/motion/<ts>/
                       #   --viewport mobile  --scene <id> --step 0.02  --video [--fps 8] (real-time pass, needs ffmpeg)
npm run perf:report    # build + bundle/media budgets + runtime vitals/frame times (desktop, mobile 4× CPU) → qa-artifacts/perf/<ts>/

npm run assets:images  # media-src/images/** → AVIF+WebP renditions
npm run assets:svg     # SVGO (keeps ids/paths for GSAP)
npm run assets:video -- <in> <name> [--scrub]        # AV1 + H.264 + posters → public/media/video/<name>/
npm run assets:sequence -- <in> <name> [--fps 24]    # WebP frames desktop/mobile → public/media/sequences/<name>/
```

QA/perf scripts start their own server if none is running. "Single flat colour"
findings at the backwater→paddy and padippura→pookalam seams are by design. Artifacts are
gitignored. Environment: Playwright 1.56 is pinned to match the pre-installed
Chromium (`/opt/pw-browsers`) — don't upgrade it or run `playwright install`
in the cloud container. `ffmpeg` may be missing in a fresh container
(`apt-get update && apt-get install -y ffmpeg`); only video/sequence tooling needs it.

## Architecture

```
src/
  main.tsx, App.tsx          SmoothScroll(Lenis) → SceneSequence(registry) + Grain
  core/motion/               gsap.ts (the only global plugin registration), media.ts (desktop/mobile/reduced
                             modes, breakpoint 900px), SmoothScroll.tsx (Lenis on gsap.ticker), useMotionMode, ambient.ts
  core/scene/                types.ts (SceneDefinition, per-mode entry), useScene.ts (useGSAP + gsap.matchMedia),
                             Scene.tsx (<Scene> frame with data-scene), SceneSequence.tsx
  core/media/                useCanvasStage (DPR-capped, visible-only, gsap.ticker), ScrollVideo, ImageSequence
  core/qa/qaBridge.ts        window.__onam for Playwright tooling (dev or ?qa)
  core/atmosphere/           Grain
  scenes/registry.ts         THE ORDER OF THE FILM — add/remove/reorder scenes here
  scenes/<nn-id>/            one folder per scene (component, css); scenes/shared/ for cross-scene geometry
  art/                       procedural illustration: coconut trees, banana plant, pookalam, leaf + dishes, nilavilakku
  components/                DetailsJump (opening-frame tag → invitation card), Ml (Malayalam with data-verify)
  content.ts                 EVERY WORD ON THE SITE + event facts + the Sadhya (serving order, leaf positions)
  lib/calendar.ts            .ics data URL + RSVP link
  styles/                    reset, tokens (material-named design tokens), global
  assets/                    imported assets by category — see src/assets/README.md
public/media/                streamed video / image sequences
scripts/{qa,perf,assets,lib} tooling (Node + Playwright + sharp + ffmpeg)
docs/creative/BRIEF.md       creative brief, directions, storyboard, decision log
docs/tooling/skills-evaluation.md
```

Scene rules (details in the `cinematic-scroll` skill):
- Every scene renders `<Scene>` and builds its choreography in `useScene(root, ctx => …)`
  with explicit `desktop` / `mobile` / `reduced` branches.
- ScrollTriggers live on timelines, created inside `useScene` (auto-reverted).
  Pin the scene root, animate children. Camera tracks use `ease: 'none'`.
- Overlap transitions are declared per mode in the registry and require the
  previous scene to hold its last frame in that mode.
- One rAF loop: Lenis and canvases run on `gsap.ticker`.
- Heavy GSAP plugins are registered in the scene that uses them; heavy scenes are lazy-loaded.

## Skills and agents

Project skills (`.claude/skills/`):
- `onam-design` — design system + Kerala/Onam/Sadhya reference + self-critique. **Load before any design, copy or cultural depiction.**
- `cinematic-scroll` — scene contract, camera vocabulary, pacing, transitions, medium choice, Lenis rules.
- `svg-illustration` — hand-made SVG, procedural pookalam, SVG animation.
- `visual-qa`, `animation-review`, `performance-review` — rendered-output review workflows.
- Vendored (see `.claude/skills/VENDORED.md`): `frontend-design` (Anthropic), `gsap-*` (GreenSock official). Don't edit; re-sync with `scripts/sync-vendored-skills.sh`.

Agents (`.claude/agents/`, review-only, never edit): `creative-director`,
`animation-critic`, `visual-qa`, `performance-reviewer`, `mobile-reviewer`.
Use them as independent reviewers after a scene is built — they gather their
own rendered evidence.

## Definition of done (any visual change)

1. `npm run typecheck` and `npm run build` pass.
2. `npm run qa:capture -- --reduced` — no console errors/failed requests/layout
   findings, and you have **looked at** the desktop, mobile and reduced sheets.
3. For motion changes: `npm run qa:motion` (desktop + mobile) reviewed; no
   unintended dead zones or jolts.
4. For assets/effects/dependencies: `npm run perf:report` within budget, or the
   budget change recorded in the brief's decision log.
5. Cultural details checked against `onam-design/references/kerala-onam.md`;
   Malayalam strings marked `data-verify="malayalam"` until a native reader confirms.

A green build is never evidence that something looks or moves right.

## Non-negotiables

- No SaaS hero/CTA layouts, card grids, glassmorphism, purple/blue gradients,
  fade-up-on-every-section, stock imagery, generic mandalas, gold gradient text.
- Pookalam ≠ rangoli; nilavilakku ≠ diya; leaf tip to the diner's left; serving order respected.
- Every animation has a purpose in the story; transitions never repeat back to back.
- Mobile gets its own choreography; reduced motion gets a designed still film.
- Keep dependencies intentional: no UI kits, no Next.js/backend, no WebGL until a scene justifies it in the brief.
