---
name: onam-design
description: The Onam / Sadhya invitation's design system and cultural grounding — palette, typography, composition, texture, copy voice, and the Kerala/Onam reference knowledge needed to design without cliché. Use before designing or restyling any scene, choosing colours or fonts, writing copy, drawing Kerala/Onam subjects, or judging whether something looks generic or culturally shallow.
---

# Onam design system

This skill is the project's taste and cultural memory. It sits on top of the
vendored `frontend-design` skill (general anti-template design discipline) and
adds what that skill cannot know: what Onam, Sadhya and Kerala actually look,
feel and sound like, and how this particular piece should use them.

**Status:** the creative direction is being chosen in `docs/creative/BRIEF.md`.
Sections marked *(direction-dependent)* are filled from the chosen direction;
everything else holds for any direction.

## 1. What this piece is

An invitation to a Sadhya, told as a short film you scroll through. The visitor
should finish feeling *invited*: to a specific meal, at a specific table, with
specific people. Spectacle serves that feeling or it gets cut.

The emotional arc: anticipation (a household waking before the feast) →
gathering (flowers, family, preparation) → abundance (the leaf filling) →
belonging (you have a place at it).

## 2. Cultural grounding — get these right

Read `references/kerala-onam.md` before drawing or writing any cultural subject.
It covers the pookalam's ten-day growth, flowers by name, the order and placement
of a Sadhya on the leaf, vessels, architecture, landscape, dress, script and the
myth of Mahabali. The non-negotiables:

- **Pookalam is not rangoli.** It is loose flower petals (no powder, no chalk),
  made fresh each morning from Atham to Thiruvonam, growing one ring per day.
  Thumba (small white Leucas flowers) is its most Onam-specific flower.
- **The Sadhya has an order and a geography.** Leaf tip points to the diner's
  left. Small items (salt, pickles, chips, sharkara varatti) at the top-left;
  curries across the top; rice lands last, lower centre, with parippu and ghee.
  Payasam comes late. Animating the leaf filling is only moving if the order is right.
- **Nilavilakku, not diya.** Kerala's brass lamp is a tall standing lamp with
  wicks facing east/west, not a clay cup lamp.
- **Kasavu is off-white handloom with a gold zari border**, not gold fabric.
  Its restraint (mostly cream, one precise band of gold) is a lesson for the whole palette.
- **Malayalam must be correct.** Never use Malayalam glyphs as texture or
  decoration; every Malayalam string needs a verified source and should be
  checked by a native reader before launch. Flag unverified strings with
  `data-verify="malayalam"`.
- **Avoid the tourist brochure:** no Kathakali face as a logo, no houseboat
  postcard, no "God's Own Country" slogans, no elephants unless the story needs one.
- **Don't blend festivals:** no diyas, rangoli, marigold torans, Diwali-style
  sparkles, or generic "Indian festival" gold-on-maroon.
- **Mahabali is a beloved king returning home**, remembered with affection.
  Depict him with dignity or not at all; avoid the pot-bellied mascot unless the
  direction consciously chooses warm, folk-toy humour.

## 3. Visual principles

1. **Material before colour.** Every colour is a material you could touch:
   banana leaf, laterite, brass, rice, zari, thumba petal, lamp soot, backwater.
   If a colour can't name its material, it doesn't belong.
2. **One luxurious thing per frame.** Like the kasavu border: large calm fields,
   one precise, rich detail. Gold is used in lines, never floods.
3. **Hand-made, not hand-drawn-effect.** Imperfection comes from process (cut
   paper edges, uneven petal placement, visible fibre), not from a "sketchy" filter.
4. **Depth through layering, not shadows.** Separate planes (sky, far, mid, near,
   foreground) with real parallax; avoid drop shadows and glows as the depth cue.
5. **Compositions, not layouts.** Each scene is designed as a frame — asymmetric,
   with a clear subject and negative space — at both 16:10 and 9:19.5. There is no grid of cards anywhere.
6. **Type is image.** Headlines are part of the illustration: masked by leaves,
   revealed by petals, set on a curve along a pookalam ring. Body text is rare and calm.

## 4. Palette *(direction-dependent values; rules fixed)*

The token names in `src/styles/tokens.css` are material names and are the
contract; values change with the chosen direction.

Rules:
- Base field: one dominant ground per scene (paper, leaf, night, laterite).
  Scenes change ground as the story moves through the day.
- Accent budget: ≤ 2 saturated accents on screen at once (e.g. marigold + thetti red).
- Gold (`--c-kasavu`, `--c-brass`) is a line or small surface; never a gradient
  wash, never a background.
- **Tell check:** `frontend-design` lists "warm cream + high-contrast serif +
  terracotta accent" as the #1 AI-generated look. Our natural material palette
  (rice/paper cream, laterite, a serif) sits right on top of it. Guard against it:
  - lead scenes with leaf-green, night-indigo or water-teal grounds, not cream;
  - when a cream/paper ground is used, it must carry visible texture (fibre, grain)
    and its accent should be leaf, thumba-white or zari, not laterite orange;
  - never pair cream ground + laterite accent + serif headline in the same frame.

## 5. Typography *(direction-dependent choices; criteria fixed)*

Selection criteria (write the rationale into the brief when choosing):
- Latin display face with a real point of view that can sit next to Malayalam
  without looking colonial or corporate. Avoid the currently over-used "tasteful"
  defaults: Inter, Fraunces, Playfair Display, Cormorant, Instrument Serif, DM Serif.
- Malayalam from Swathanthra Malayalam Computing (SMC), the community that built
  most free Malayalam type: **Rachana** (traditional orthography, bookish),
  **Manjari** (rounded, contemporary), **Gayathri** (clean, geometric),
  **Chilanka** (handwriting), **Karumbi** (brush), **Uroob**, **Keraleeyam**.
  Choose by what the scene is saying, and check licence (most are OFL).
- Maximum two families (plus Malayalam). Subset to used glyphs, woff2 only,
  `font-display: swap` for text, preloaded display face for the opening.
- Malayalam line-height needs ~1.6–1.8; never set it at Latin display tightness.

Treatments to explore (and not default to fade-up): line masks revealed by
scroll, tracking that opens as the camera pulls back, words set along a pookalam
ring, letters that are cut from leaf, type that is occluded by a foreground layer
then walked past, a headline that becomes a horizon line.

## 6. Texture & atmosphere

- Global grain is on (`<Grain />`, ~9% multiply). Scenes add material textures
  (paper fibre, leaf vein, laterite pitting) as tiling WebP from `src/assets/textures/`.
- Light is warm and directional (morning sun, lamp flame), never neon.
- Blur is expensive and cheap-looking when animated; pre-blur far layers as assets.
- Filters (`backdrop-filter`, big `mix-blend-mode` layers) only when a scene's
  idea depends on them, and only on small areas.

## 7. Copy voice

Warm host, not marketing. First-person-plural household voice ("We're laying the
leaves on Thiruvonam. Come hungry."). Specific over grand: name the dishes, the
time, the house. Sentence case. Bilingual moments are deliberate (one Malayalam
phrase that is felt, with its meaning available), not sprinkled.

The invitation must state plainly: what, when (date and time), where (address +
map link), RSVP method, dietary note (Sadhya is vegetarian; mention whether onion/garlic-free),
dress suggestion (kasavu welcome), and how to find the door.

## 8. Anti-patterns (reject on sight)

SaaS hero + CTA button; card grids; rounded-rectangle everything; purple/blue
gradients; glassmorphism; floating decorative blobs; fade-up on every section;
stock photos of plated food; emoji flowers; generic mandala clip-art passed off as
pookalam; gold gradient text; "Happy Onam!!" in a script font; confetti.

## 9. Before you ship a scene

Run the self-check in `references/self-critique.md` and the `visual-qa` skill.
