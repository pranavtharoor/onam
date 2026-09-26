# Creative brief & storyboard

**Status: DIRECTION CHOSEN (2026-09-26) — B, "Maveli Comes Home", with A's
pookalam growth and C's leaf fold. Built; see §6 for the storyboard as implemented
and §11 for decisions made during the build.** Directions A and C are kept below
as the record of the exploration.

Context from the hosts: the celebration is **after** Onam (Saturday, 10 October),
so the copy leans into that: "Onam came and went… This year, we waited a little
longer. For you." Guests come from all over India: English first, Malayalam as
sparkle (proofread by the host's father before launch).

Cultural facts referenced here are documented in
`.claude/skills/onam-design/references/kerala-onam.md`.

---

## 0. The job

**What:** a static website that is an invitation to a Sadhya on Thiruvonam,
told as a short scroll-driven film.

**Who it's for:** family and friends — Malayalis who will notice every cultural
detail, and non-Malayali friends who should come away understanding why this
meal matters. Mostly opened on phones, from a WhatsApp link.

**It succeeds if:** a guest finishes it feeling personally expected at a
particular table, knows exactly when/where to come, and forwards it because it
moved them — not because it was flashy.

**Emotional arc (any direction):** anticipation → gathering → abundance → belonging.

## 1. Fixed ingredients (true for every direction)

- Scroll is a camera moving through a story; transitions are designed pairs.
- The Sadhya is shown correctly: leaf tip to the diner's left, items in their places, served in order.
- Pookalam is petals laid by hand, growing over ten days — never rangoli.
- Malayalam is meaning, verified by a native reader, never texture.
- Desktop and mobile are separate compositions; reduced motion is a designed still film.
- The invitation facts are unmissable and plain: what, when, where, RSVP, dietary note, dress, how to find the door.
- The film is silent: no sound layer.

---

## 2. Three directions

### Direction A — "Ten Mornings" (പത്ത് പുലരികൾ)

**Concept.** Onam told as time. The camera looks down on the front courtyard
(*muttam*) for ten mornings, from Atham to Thiruvonam. Each scroll "day", unseen
hands add a ring to the pookalam, and the edges of the frame fill with the
evidence of a household getting ready: a swing tied to the mango tree, baskets of
nendran bananas, a polished lamp, and **sandals at the verandah step that multiply
as relatives arrive**. On Thiruvonam the camera finally lifts, and the finished
pookalam becomes the invitation.

**Emotional tone.** Quiet, patient, affectionate; the pleasure of watching something beautiful being made.

**Visual language.** Strict overhead view, flat graphic cut-paper with real petal
textures; precise, almost Swiss composition around a circle; generous negative
space of swept earth.

**Typography.** A calendar spine: day names (Atham, Chithira, Chodhi … Thiruvonam)
in Malayalam and English run down the margin like a wall calendar. Candidates:
**Gayathri** (SMC, geometric Malayalam) with a characterful grotesk (to test:
Hanken Grotesk, Familjen Grotesk).

**Palette.** Swept laterite earth `#4A2E22` ground; flower pigments as the only
colour: thumba white `#F3EFE4`, mukkutti yellow `#EDBE2E`, chethi red `#C5302A`,
vadamalli magenta `#A3346C`, shankhupushpam blue `#2C3F99`, leaf `#3D6A2E`.

**Illustration.** Procedural SVG pookalam from hand-drawn petal symbols per
flower; cut-paper objects with soft contact shadows; hands only as shadows.

**Animation language.** Placement, not motion: petals land with tiny settling
eases, staggered randomly like hands; light rakes across the frame and turns
each day (a single warm gradient overlay rotating); rare, precise camera moves.

**Scroll narrative.** Opening (a single thumba flower on dark earth) → days 2–9
(ring by ring, frame edges filling) → Uthradam evening (lamp lit) → Thiruvonam
(complete; Thrikkakara Appan placed) → crane up, pookalam becomes the rim of the
leaf rows → your empty leaf → invitation.

**Signature moment.** The pookalam growing under your thumb while the sandals at
the step multiply — you see the family arrive without seeing anyone.

**Technical approach.** One long pinned overhead stage with state per day
(SVG + a canvas layer for petals being placed), CSS/SVG for light, one crane move
(scale + perspective) at the end. Very light; excellent on mobile (circle crops
beautifully to portrait).

**Risks.** Monotony — one camera angle for most of the film; feels more like a
beautiful time-lapse than "moving a camera through a story". Less Kerala
landscape and architecture.

---

### Direction B — "Maveli Comes Home" (മാവേലി വരുന്നു)

**Concept.** Every Onam, Kerala gets ready for one guest: Mahabali, returning
for a day to the people he loved. **This year, that guest is you.** The camera
is the returning guest, travelling from the edge of the land at pre-dawn, through
paddy and coconut trees, through the gatehouse of a house, past the pookalam, through the
open courtyard, to a row of banana leaves where one place is still empty.
Mahabali is never drawn: the only trace is the **shadow of a palm-leaf umbrella
(*olakkuda*)** on the water in the first frame.

**Emotional tone.** Warm, cinematic, quietly moving; the feeling of being awaited.

**Visual language.** Layered diorama planes with real depth, painted in a
contemporary take on **Kerala mural painting's *panchavarna*** (five-colour)
palette and its confident black line — not copying temple murals, but borrowing
their colour discipline and line. Architecture is laterite, red-oxide floors,
tiled roofs, carved wood.

**Typography.** Key words as custom lettering in the idiom of **Kerala's
hand-painted signboards** (bold, rounded Malayalam with inline shadows) —
painted onto the gatehouse lintel, the verandah beam, a steel tiffin carrier.
Running text in **Manjari** (SMC) with a sturdy Latin wedge/slab serif (to test:
Young Serif, Gloock, Zilla Slab).

**Palette.** Lamp black `#17130F`, verdigris green `#2E5B48`, red ochre `#A33B1F`,
yellow ochre `#D39A2C`, lime white `#ECE5D2`, plus pre-dawn indigo `#243452` for
the opening. Grounds are black/green/indigo; lime-white is line and highlight
(guards against the cream + terracotta tell).

**Illustration.** Painted planes (SVG with texture masks), bold black
contour lines, mural-style ornament used only on architecture; people as
mural-line figures, never realistic.

**Animation language.** True camera moves: crane, truck, and **fly-throughs**
of openings (gatehouse door, courtyard sky) as the scene transitions; foreground
occluders (coconut trunks, pillars) wiping the frame; holds on arrivals.

**Scroll narrative.** Backwater before dawn (umbrella shadow) → dawn over paddy
and coconut trees → the gatehouse (fly-through) → the pookalam (grows as you approach:
ten days compressed into ten steps) → the courtyard open to sky (invitation
painted on the beam) → the dining hall row (leaves fill in serving order as you
pass) → the empty leaf with your name.

**Signature moment.** Walking the row of leaves: each leaf you pass is one step
further in the serving sequence — salt and chips, pickles, curries, rice and
parippu, payasam — so crossing the room *is* the meal being served, ending at
your empty leaf.

**Technical approach.** SVG planes + masks for dioramas, `containerAnimation`
horizontal travel for the dining row (vertical on mobile), clip-path/scale
fly-throughs, canvas for last night's rain falling through the courtyard, optional
image sequence for the gatehouse fly-through. Heaviest art production of the three.

**Risks.** "First-person walk through a house" is a familiar award-site trope;
Maveli-as-you could tip into kitsch; many painted planes to produce well.

---

### Direction C — "Ila" (ഇല, The Leaf)

**Concept.** The whole film happens on one banana leaf. It opens in extreme
close-up — a drop of water running down a leaf vein — and pulls back as the leaf
is washed and laid, tip to the left. The Sadhya arrives in its true order; each
dish is a tiny chapter with who made it ("Ammamma's olan, the recipe she won't
write down"). Payasam steams. Then the leaf is **folded towards you** — the
gesture that says *I was satisfied* — and the fold becomes an envelope that
opens into the invitation.

**Emotional tone.** Sensory, intimate, playful, appetite-first; a love letter to a meal.

**Visual language.** Tactile macro: gouache and ink on textured paper over real
leaf and rice texture scans, food-film lighting (raking daylight on dark wood).

**Typography.** The leaf as a map: dishes labelled where they sit, like a
cartographic legend, Malayalam and English. **Rachana** (SMC, traditional
orthography) with a warm text serif (to test: Newsreader, Literata).

**Palette.** Leaf green `#2D5C29`, young leaf `#8CB23A`, rice `#F4EFE3`, matta
fleck `#9D4F2B`, turmeric `#DFA425`, jaggery `#78481D`, brass `#AE8B3B` on dark
wood `#291C13`.

**Illustration.** Painted dishes with visible brushwork; or, if the hosts can
shoot it, real stop-motion photography of the leaf being served (image sequence).

**Animation language.** Macro-to-wide camera zooms, dishes landing with weight
(ladles, spoons), steam and ghee as canvas effects, the fold as a morph.

**Scroll narrative.** Water drop on vein → leaf laid → salt, chips, pickles →
curries (each a close-up chapter) → rice + parippu + ghee → payasam → pull back:
a row of right hands eating (the celebration shown only through hands) → fold →
envelope → invitation.

**Signature moment.** The leaf folding toward you and becoming the envelope.

**Technical approach.** Persistent SVG leaf as the stage; dishes as painted SVG
or an image sequence; MorphSVG fold; canvas steam and rice grains. On mobile the
leaf is never rotated (its orientation is meaningful): the camera travels along it instead.

**Risks.** Illustrated food easily looks like clip-art, and real food photography
needs a shoot; one surface for the whole film risks monotony; little of Kerala
beyond the table.

---

## 3. Critical evaluation

Scores 1–5 (5 best). "Distinctiveness" = unlike other award sites and other festival pages.

| Criterion | A · Ten Mornings | B · Maveli Comes Home | C · Ila |
|---|---|---|---|
| Emotional core | 4 — patience, making | **5** — being awaited | 4 — appetite, care |
| Cultural specificity | **5** — pookalam days, sandals | **5** — Maveli, nalukettu, serving order | 4 — the leaf, order, fold |
| Distinctiveness | 4 | 4 (trope risk) | 3 (food-film risk) |
| Cinematic camera / variety | 2 — mostly one angle | **5** | 3 — one surface, many scales |
| Invitation clarity | 4 | 4 | **5** — ends in an envelope |
| Mobile suitability | **5** | 3 — many planes, needs recomposition | 4 |
| Production risk (art) | **Low** | High | Medium–High |
| Performance risk | Low | Medium | Medium |
| Scales to 6–8 scenes | 3 | **5** | 3 |

Reading: B is the strongest *foundation* — it is the only one that genuinely
satisfies "scroll is a camera moving through a story", it has the deepest
emotional hook, and it has room for the best ideas of the other two. A is the
safest and most elegant but risks being a beautiful screensaver. C has the best
ending and the most intimate texture but the narrowest world.

## 4. Skeptical creative-director pass

Weak ideas found and what replaced them:

| Weak idea (where) | Why it's weak | Replacement |
|---|---|---|
| Petals drifting across every scene (all) | Confetti cliché; decoration without meaning | Petals move only when hands place them; canvas is used for rain in the courtyard (B) and steam (C) — things that happen in the story |
| Letter-by-letter split-text headline flying in (all) | Award-site default; says nothing about Kerala | Type that is **painted on things** (B: lintel, beam), **placed on a calendar** (A), or **mapped on the leaf** (C); reveals by occlusion as the camera passes |
| A tour through a beautiful house (B) | Generic "parallax house" trope | The house journey is only three beats, and each is an Onam act: crossing the gatehouse (arrival), the pookalam growing as you approach (ten days in ten steps), the courtyard sky (the household's welcome) |
| Showing Mahabali (B) | Crown-and-belly mascot; kitsch | Never drawn. One umbrella shadow in frame one; one line of copy: "Every year, Kerala waits for one guest." |
| Macro food porn (C) | Default for any food brand | Order and people: who made each dish; the celebration shown as a row of hands |
| Gold everywhere, gold gradient text (all) | Generic "Indian festival" | Kasavu rule: gold only as one precise band per frame |
| Cream paper + serif + terracotta (A/C tendency) | `frontend-design` tell #1 | Dark, green, indigo or earth grounds; cream only as rice/lime-white highlights |
| Preloader counting to 100%, custom cursor | Award-site clichés, no meaning | None. The first frame paints immediately (dark water / dark earth is cheap). |
| Horizontal-scroll gallery (B dining row) | Common pattern | Justified only because it's a real row of leaves and crossing it *is* the serving sequence; on mobile it becomes walking down the row (vertical) |
| Kathakali, houseboats, elephants | Tourist brochure | Excluded |

Open questions for the critique to keep asking: does the umbrella shadow read to
non-Malayali guests (answer: the copy carries it; for Malayalis it's a gift)?
Is B's art budget realistic (answer: planes are few, procedural where possible —
coconut trees, paddy, pookalam, leaf rows are generated; only the gatehouse, courtyard and
hall need bespoke drawing)?

## 5. Recommendation

**Direction B, "Maveli Comes Home", as the spine** — strengthened with the best
idea of each other direction:
- from **A**: the pookalam grows ten rings as you approach it (and the sandals at the verandah step multiply);
- from **C**: the finale is your own leaf, which folds toward you into the invitation envelope.

If the hosts prefer lower production risk or a quieter piece, **A** is the
fallback and can adopt C's fold as its ending.

This is a recommendation, not a decision — see §9.

## 6. Provisional storyboard (recommended direction; rewrite after choice)

Budget ≈ 22 vh desktop / 17 vh mobile. "vh" = viewport heights of scroll.

| # | Scene (id) | Beat | Camera | Medium | Out-transition → | Mobile | Reduced motion |
|---|---|---|---|---|---|---|---|
| 1 | `backwater` 2.5 vh | Pre-dawn water; one lamp on the far bank; the olakkuda shadow slides across the water. Line: "Every year, Kerala waits for one guest." | Slow push toward the lamp; water reflections parallax | SVG planes + canvas water shimmer (subtle) | Dawn light change: the sky ground warms into scene 2 (no cut) | Portrait crop centred on the lamp; fewer water planes | Still: lamp, shadow, line |
| 2 | `paddy` 3 vh | Dawn over paddy and coconut trees; path along the bund | Crane down a coconut trunk, then truck right along the bund; coconut trunks as foreground occluders | SVG procedural coconut trees/paddy, 5 depth planes | Occlusion wipe: a coconut trunk passes the lens and reveals the gatehouse | Vertical descent instead of truck; 3 planes | Still: path and gatehouse in distance |
| 3 | `padippura` 2 vh | The gatehouse; painted lettering on its lintel: the family name | Push in; the doorway grows until it fills the frame (fly-through) | SVG + mask | Fly-through: doorway becomes the frame of scene 4 | Same move (it's vertical-friendly) | Still: gatehouse with lettering |
| 4 | `pookalam` 3.5 vh | The courtyard; the pookalam grows one ring per step as you walk toward it (Atham → Thiruvonam); sandals multiply at the verandah step | Slow approach + slight crane up to reveal the whole circle | Procedural SVG + canvas for petals being placed | Match cut: the outer ring becomes the square of sky above the nadumuttam (circle → square mask) | Overhead-leaning composition; fewer petals per ring | Complete pookalam, day names listed |
| 5 | `nadumuttam` 2.5 vh | Inside, the courtyard open to sky; last night's rain drips from the eaves; **the invitation is painted on the beam**: date, time, place | Tilt up to the sky square, hold, tilt down to the beam text | SVG + canvas rain | Iris from the sky square down into the hall (per-mode overlap) | Tilt only; text recomposed to portrait | Still: beam with the invitation text |
| 6 | `sadhya-row` 5 vh | The hall: a row of leaves; passing each leaf advances the serving sequence; people seated as mural-line figures | Horizontal truck along the row (desktop); walk down the row (mobile) | SVG leaves/dishes, `containerAnimation` | Hold on the last, empty leaf | Vertical row, 6 leaves instead of 10 | A single fully-served leaf with labels + the row as a still |
| 7 | `your-leaf` 2.5 vh | Your empty leaf with your name; RSVP; then the leaf folds toward you into an envelope; lamp flame | Top-down, slow push; fold | SVG MorphSVG fold; DOM for RSVP (real links, accessible) | End | Same, larger type | Static invitation with RSVP |

Signature moments: (4) ten days in ten steps; (6) crossing the room = the meal
being served; (7) the leaf folding into the invitation.

Transitions in order: light change → occlusion wipe → fly-through → match cut
(circle→square) → iris → hold. No device repeats.

**As shipped (2026-09-26): scene 4 `pookalam` is skipped** (`skip: true` in
`src/scenes/registry.ts`; code, art and copy kept). The gatehouse fly-through now
holds its courtyard-earth frame for one viewport, and the nadumuttam enters over it
as a square of sky growing from the courtyard centre: light change → occlusion
wipe → fly-through → square opening → iris → hold.

Sound hooks (explored, later dropped — the film is silent; see decision log): water at 1, birds at 2, gate creak at 3,
chenda far away at 4, rain drip at 5, the clatter and murmur of a Sadhya hall at 6,
silence at 7.

## 7. Motion language (shared)

- Scroll-scrubbed camera, `ease: 'none'` on the camera track, `scrub: 1`.
- Beats inside scenes use two named eases only: *breath* (in/out, for camera
  settles and light) and *settle* (fast-out, for things placed by hands). Nothing bounces.
- Holds of 0.3–0.6 vh at every arrival.
- Parallax depth ratios consistent across the film (far 0.2, mid 0.5, near 1, foreground 1.6).
- Type never flies; it is revealed by occlusion, masks following real edges, or light.

## 8. Typography exploration (to do after direction choice)

Build a specimen page (`/type-lab`, dev-only) testing 2–3 Latin candidates against
the chosen SMC Malayalam face at display and text sizes, on the direction's grounds,
including Malayalam conjunct rendering in Chromium and WebKit. Record the decision
and licences in §10.

## 9. Atmosphere

Global paper grain (on), per-scene material textures (fibre, laterite, leaf),
directional warm light from story sources (dawn, lamp), no neon, no glow, no
lens flares, no animated blur.

## 10. Performance considerations

- First frame must paint fast: scene 1 is dark water + one lamp (tiny SVG); fonts
  preloaded for the opening line only.
- Heavy scenes (`pookalam`, `sadhya-row`) lazy-loaded and preloaded one scene ahead.
- Budgets in `scripts/perf/report.mjs`; initial JS today is 103 KB br of a 150 KB budget.
- Canvas only for rain/water/petal placement, DPR ≤ 1.5, paused off-screen.
- Mobile: fewer planes, shorter pins, lighter pookalam rings.

## 11. Decision log

| Date | Decision | Why |
|---|---|---|
| 2026-09-26 | Stack: React + Vite + TS, GSAP/ScrollTrigger, Lenis; Motion deferred; no WebGL yet | Simplest stack that supports scroll-as-camera; Motion added only when a micro-interaction needs it |
| 2026-09-26 | Three directions explored; B recommended (with A's pookalam growth and C's fold) | See §3–§5 |
| 2026-09-26 | **Host chose B + A's pookalam + C's fold** | — |
| 2026-09-26 | Type: Young Serif (display) + Manjari (SMC; Latin text + Malayalam) | Rendered specimen vs Gloock: Young Serif's weight matches hand-painted signboards; Manjari's rounded Malayalam shapes conjuncts correctly and its Latin is warm |
| 2026-09-26 | Seams by design: backwater ends on pure dawn = paddy's sky; the gatehouse fly-through ends on pure courtyard earth = pookalam's first frame; the row ends on the empty leaf = the finale's first frame | Transitions are invisible cuts, not fades |
| 2026-09-26 | Diners drawn as waist-down laps (shirt, kasavu mundu over crossed knees); no hands or faces | Hands read as a face/moustache in review; faces invite caricature |
| 2026-09-26 | Row pacing: places 96svh wide, truck at 1.25× scroll speed | Motion review: the row took ~30% of the film |
| 2026-09-26 | Static texture (fronds, laterite, stalks, specks, flecks) merged into single paths; pookalam petal density 0.75 desktop / 0.4 mobile | DOM 9.1k → 2.8k nodes; mobile slow frames 37% → 10% (4× CPU, headless) |
| 2026-09-26 | Accepted cost: Manjari Malayalam 400 + 700, 61 KB each | Fetched only when Malayalam renders (unicode-range). Subsetting risks breaking conjunct shaping before proofreading; revisit after the text is final |
| 2026-09-26 | Sound is procedural WebAudio (water, birds, distant chenda, rain drips, hall murmur), opt-in, per-scene mix | No audio files to download or license; nothing plays without a tap |
| 2026-09-26 | Malayalam on the site proofread and approved by the host's father; `MALAYALAM_VERIFIED = true` | Any new Malayalam string needs the same review before shipping |
| 2026-09-26 | RSVP points to the site itself (new tab) until the Google Form exists | Host request; change `event.rsvpUrl` in `src/content.ts` |
| 2026-09-26 | Sound removed at the host's request: no toggle, no WebAudio code | The film is silent; supersedes the procedural-sound decision above |
| 2026-09-26 | Venue is "Clubhouse, Confident Bellatrix" (matches the hosts' poster); the hero still addresses "our neighbours at Confident Bellatrix" (`event.community`) | Maps query stays on the community |
| 2026-09-26 | Link preview (`og.jpg`) is the hosts' printed poster, whole and uncropped, letterboxed to 1200×630 on its own cream (`npm run assets:og`); original kept at `/invitation-poster.jpg` | Guests recognise the poster; a portrait image would otherwise be centre-cropped, losing date and venue |
| 2026-09-26 | iPhone performance pass. Phones and touch devices: the grain is static, viewport-sized and not blend-moded (opacity 0.045); the backwater ripples don't drift. The backwater camera and the pookalam pull-back move whole composited SVG layers; the rain is drawn at 1× with half the drops; pinned scenes scrub at 0.6 (desktop 1) with `anticipatePin` | A moving full-screen `mix-blend-mode` layer and transforms inside SVGs make iOS Safari re-composite or re-rasterise the page every frame. Headless mobile at 4× CPU: frames over 33ms 7% → 2–3%, p99 50 → 33.4ms; idle repaint on the opening frame gone |
| 2026-09-26 | **Pookalam scene skipped** at the hosts' request (`skip: true`; set `skip: false` to restore). The gatehouse holds its all-earth last frame for 1 viewport (only when the next scene overlaps it); the nadumuttam enters as a square of sky growing from 0 at the courtyard centre instead of the pookalam match cut | A circle growing on flat earth would repeat the lamp-flame iris that follows; the square is the nadumuttam's own shape. Restoring the pookalam restores the match cut automatically |

## 12. What we need from the hosts

1. **Choose a direction** (A, B, C, or the recommended B hybrid) — or react to parts.
2. Invitation facts: date & time, address + map link, RSVP method, host names, dietary notes (onion/garlic-free?), dress suggestion.
3. Language balance: mostly English with Malayalam moments, or fully bilingual? Who can proofread Malayalam?
4. Personal material: family names for the lettering, dish "authors" (C-style chapters work in any direction), photos we could translate into line portraits?
5. Sound: wanted as an opt-in layer, or silent? (Answered: silent — see decision log.)
6. Hosting target (e.g. GitHub Pages, Netlify, Vercel) and the link format guests will receive.
