---
name: animation-review
description: Critique the rendered motion of the scroll film — pacing, easing, dead zones, abrupt transitions, repetition, over-movement, competing elements, scroll-speed mismatch and mobile motion — using dense scroll-position filmstrips, a motion-energy chart and real-time recordings from the repo's tooling. Identifies the weakest moments and proposes concrete choreography fixes. Use after building or changing any scene/transition, or when asked how the animation feels. Reviews rendered output, not source code alone.
---

# Animation review

Motion is judged by watching it, not by reading timelines. Source code tells
you what was *intended*; this review is about what *happens on screen* per unit
of scroll and per second.

## Evidence (always gather before judging)

1. **Position filmstrip + energy:** `npm run qa:motion` (desktop) and
   `npm run qa:motion -- --viewport mobile`. It steps the page every 4% of a
   viewport with scrubs settled and ambient motion frozen, and writes:
   - `energy.png` — pixel change per scroll step across the whole film, with scene
     bands, dead zones (red, ≥ 0.6 vh without visible change) and jolts (amber,
     a step ≥ 6× the median change);
   - `strip-<scene>-N.png` — frames in scroll order, labelled `y` and `Δ`;
   - `report.md/json` — per-scene mean/peak energy and share of still steps.
   Use `--scene <id> --step 0.02` to inspect one scene finely.
2. **Real time:** `npm run qa:motion -- --video` records a wheel-driven pass with
   Lenis smoothing, toggle-action tweens and ambient loops live, and (with ffmpeg)
   writes `realtime-N.png` sheets. Use it for easing, overshoot, lag, and
   anything time-based. Mobile: `--viewport mobile --video` uses touch gestures.
3. **Key frames** from `npm run qa:capture` for composition at rest.
4. Only then read the scene's source to map what you saw to labels/tweens.

Headless Chromium has no GPU: judge smoothness trends and choreography, not
absolute frame rates (that's `performance-review`).

## What to look for

| Problem | How it shows in evidence |
|---|---|
| **Dead zone** | flat energy for > ~0.5 vh that isn't a designed hold; identical consecutive frames |
| **Abrupt transition / pop** | jolt marker; a frame pair where a large region changes at once; element appears fully formed |
| **Awkward easing** | real-time sheet: movement bunched at start or end; bounce/overshoot on heavy objects (brass doesn't bounce) |
| **Repetition** | same device (fade-up, iris, stagger-from-bottom) in adjacent scenes or on every headline |
| **Excessive movement** | many elements moving in different directions in one frame; everything parallaxing; energy high everywhere with no rests |
| **Poor pacing** | energy chart has no rhythm (no alternation of peaks and rests); a scene's beats compressed into 20% of its scroll |
| **Flat scene** | low mean energy *and* no compositional change across its strip — the camera never really moves |
| **Over-engineered** | lots of simultaneous small motions that don't change what the frame says |
| **Transition that says nothing** | a wipe/iris whose origin/shape has no relation to either scene's content |
| **Competing for attention** | two focal motions at once in different screen regions |
| **Hierarchy problems** | the important element (invitation text, date) arrives with less emphasis than decoration |
| **Scroll-speed mismatch** | a small scroll produces a huge change (jolt cluster) or a long scroll barely moves anything; horizontal travel faster than the eye can read |
| **Mobile problems** | pins that trap the thumb for many swipes; horizontal pins on portrait; text moving while being read; too many layers |

Also check each moment against `cinematic-scroll` §3 (pacing budget) and §4
(no two adjacent transitions share a device), and `onam-design` (does the motion
mean something about Onam — a hand placing petals, a leaf being laid — or is it generic?).

## Output

```
## Animation review — <viewport(s)>, <commit>
Evidence: <artifact folders>
Overall rhythm: <one paragraph reading the energy chart like a film editor>

Weakest moments (worst first, max 5):
1. <scene-id> y≈<from>–<to> (<label if known>): <what the viewer experiences>
   Evidence: <strip file + frame y values / energy numbers>
   Why it fails: <principle>
   Fix: <concrete choreography change — e.g. "move title reveal from 0.35→0.55 of
   the timeline, add a 0.4 vh hold after 'leaf-lands', replace opacity fade with a
   mask wipe following the leaf edge; on mobile drop the mid layer">
Strong moments to protect: <list>
Mobile-specific: <list>
```
Prefer fewer, deeper findings. Every fix must be implementable and re-measurable
(say which metric or frame should change).
