---
name: visual-qa
description: Rendered-output QA for this site — start the app, capture every scene at meaningful scroll checkpoints on desktop, mobile and reduced motion with the repo's Playwright tooling, read the contact sheets, and report layout, typography, composition, console and consistency defects with evidence. Use after any visual change, before claiming a scene or fix is done, or when asked "does it look right". Never treat a passing build or type check as visual verification.
---

# Visual QA

**The rendered page is the source of truth.** Build success, types and DOM
structure prove nothing about what a visitor sees. A change is not done until
you have looked at it in a real browser at desktop and mobile sizes.

## Tooling available here

- Playwright 1.56 (repo devDependency) + pre-installed Chromium
  (`PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers` in the cloud container; locally,
  `npx playwright install chromium` once).
- The app exposes a QA bridge (`window.__onam`) in dev or with `?qa` in the URL:
  `scenes()` (scroll bounds per scene), `jump(y)` (scroll + settle all scrub tweens),
  `still(true)` (freeze clock-driven ambient motion), `max()`.
- `sharp` for contact sheets; `ffmpeg` for video frames (install if missing:
  `apt-get install -y ffmpeg` in the cloud container).

## Procedure

1. **Capture.** `npm run qa:capture` (desktop + mobile, 6 checkpoints per scene,
   each scene sampled from its entry transition to its exit). Add
   `--reduced` for reduced motion, `--viewports desktop,mobile,mobile-small,mobile-landscape,tablet`
   for the full matrix, `--scene <id> --checkpoints 12` to zoom into one scene,
   `--preview` to test the production build. It starts a dev server if none is running.
2. **Read `report.md`** in the printed artifacts folder: console errors,
   failed requests, automated layout findings (horizontal overflow, off-canvas
   text, text < 12px and touch targets < 44px on mobile, blank frames).
3. **Look at every contact sheet** (`<viewport>-sheet.png`) with the Read tool.
   Then open individual frames for anything suspicious — sheets are thumbnails.
4. **Judge against the checklist** below and the chosen direction in
   `docs/creative/BRIEF.md`.
5. For interaction (buttons, RSVP link, invitation-details jump, keyboard focus), write a
   throwaway script in the scratchpad that imports `scripts/lib/browser.mjs`
   (`launch`, `openSite`, `jump`) and drives the page; screenshot the result.
6. **Report** (format below). Fix, then re-capture and compare before/after
   frames at the same checkpoints.

## Checklist

Composition & hierarchy
- One clear subject per frame; the eye knows where to go. Nothing important under a fixed overlay or cropped by the stage.
- Mobile frames are recomposed for portrait (not letterboxed desktop art, not tiny subjects).
- Transitions: at the 0% and 20% checkpoints of each scene, the overlap/cut reads as intended — no bare page background showing through, no half-covered live content.

Typography
- No widows/orphans in display lines; balanced wraps; no text colliding with illustration unless intended.
- Malayalam renders with correct conjuncts (no dotted circles / tofu boxes); line-height adequate.
- Contrast: text over illustration stays legible at every checkpoint, not just the final one.

Consistency
- Same material palette and grain across scenes; no stray default blue links, default focus rings in wrong colour, or system fonts sneaking in (check for FOUT in first frame).
- Scale of recurring motifs is consistent (a thumba flower isn't bigger than a banana leaf).

Reduced motion
- Every scene has a complete, deliberate still composition; nothing stuck at opacity 0 or mid-transition; no pinned blank space.

Technical
- Zero console errors and failed requests. No horizontal overflow. No layout shift on load (check first two frames).

## Report format

```
## Visual QA — <date>, <commit>
Artifacts: qa-artifacts/capture/<ts>/
Verdict: ship / fix first / rethink
Defects (most severe first):
1. [scene-id @ 20%, mobile] <what is wrong, visibly> — evidence: <frame path> — likely cause: <file:line> — fix: <concrete>
Passes: <what was verified and looks right>
Not verified: <what the tooling could not check, e.g. real-device Safari, GPU timing>
```
Be concrete ("the headline's last word wraps alone under the uruli at 390px"),
never vague ("spacing feels off").
