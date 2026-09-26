# Onam Sadhya — an invitation

A scroll-driven film that invites you to an Onam Sadhya. You arrive at a
Kerala backwater before dawn, cross the paddy, walk through the gatehouse, watch
ten mornings of pookalam, look up through the courtyard, walk the row of banana
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

- **RSVP:** set `event.rsvpUrl` to the Google Form link. Until then RSVP opens the site in a new tab.
- **Malayalam:** every Malayalam string is in an `ml` field and is marked
  `data-verify="malayalam"` in the page. Once proofread, set `MALAYALAM_VERIFIED = true`.
- **Link preview:** `index.html` has the WhatsApp/iMessage preview text and an
  absolute `og:image` URL; update both if the date or URL changes.

## Deploying to GitHub Pages

1. In the repo on GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
2. Merge to `main`. `.github/workflows/deploy.yml` builds and publishes to
   `https://pranavtharoor.github.io/onam/`.

The build uses a relative base, so it also works on any other static host.

## More

- Creative brief, storyboard, decision log: [`docs/creative/BRIEF.md`](docs/creative/BRIEF.md)
- How it's built and reviewed (skills, agents, QA tooling): [`CLAUDE.md`](CLAUDE.md)
