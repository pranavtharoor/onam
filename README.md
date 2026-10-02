# Onam Sadhya — an invitation

A scroll-driven film that invites you to an Onam Sadhya. You arrive at a
Kerala backwater before dawn, cross the paddy, walk through the gatehouse, look up through the courtyard, walk the row of banana
leaves as the meal is served, and sit down at the one leaf left empty.

React + Vite + TypeScript, GSAP/ScrollTrigger, Lenis, hand-built SVG and a
little Canvas. Static site; no backend.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # → dist/
```

## Changing the words, date or venue

Everything a guest reads is in **`src/content.ts`**: event facts, every line of
copy, the ten day names, and the Sadhya dishes with their serving order.

- **The day:** `event.schedule` is the programme on the invitation card and in the calendar file; `event.startIST`/`endIST` set the calendar times.
- **RSVP:** set `event.rsvpUrl` to the Google Form link. Until then RSVP opens the site in a new tab.
- **Malayalam:** every Malayalam string is in an `ml` field. The current strings
  are proofread (`MALAYALAM_VERIFIED = true`); if you add or change one, set it to
  `false` until it has been checked, which marks them `data-verify="malayalam"` in the page.
- **Link preview:** `index.html` has the WhatsApp/iMessage preview text and an
  absolute `og:image` URL; update both if the date or URL changes. The preview image
  `public/og.jpg` is the hosts' poster (`public/invitation-poster.jpg`) letterboxed to
  1200×630 on its own cream; after replacing the poster, run `npm run assets:og`.

## Deploying to GitHub Pages

Push (or merge) to `main`. `.github/workflows/deploy.yml` builds the site and
publishes `dist/` to the `gh-pages` branch, which GitHub Pages serves at
`https://pranavtharoor.github.io/onam/` (Settings → Pages → Source: *Deploy from a
branch*, `gh-pages` / root). Changes are live a minute or two after the push.

The build uses a relative base, so it also works on any other static host.

## More

- Creative brief, storyboard, decision log: [`docs/creative/BRIEF.md`](docs/creative/BRIEF.md)
- How it's built and reviewed (skills, agents, QA tooling): [`CLAUDE.md`](CLAUDE.md)
