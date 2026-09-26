# External skills & plugins — evaluation (2026-09-26)

Method: searched the Claude plugin directory, the web and GitHub; cloned each
candidate and read its actual SKILL.md / plugin manifest before deciding.
Criteria: provenance (official > framework vendor > widely used > community),
maintenance, fit with this stack (React + Vite + GSAP + Lenis, Node Playwright,
cloud container), overlap with other skills, and whether it *materially* improves
this project.

## Adopted (vendored in `.claude/skills/`, see `VENDORED.md`)

| Skill | Source | What it provides | Why adopted |
|---|---|---|---|
| `frontend-design` | Anthropic official (`anthropics/claude-plugins-official`, also `anthropics/skills`) | Studio-grade design discipline: ground design in subject matter, deliberate type/colour tokens, a catalogue of "AI-generated" tells to avoid, plan→review→build→critique loop, restraint | Directly targets this project's biggest risk (looking generic/AI-made). Generic by design, so `onam-design` layers project/cultural specifics on top instead of duplicating it. |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-plugins`, `gsap-performance`, `gsap-utils` | GreenSock official (`greensock/gsap-skills`, MIT, active, Apr 2026) | Correct, current GSAP API usage: timelines/position params, ScrollTrigger (pin, scrub, containerAnimation, refresh order), `useGSAP` cleanup, SplitText/DrawSVG/MorphSVG (now free), performance rules | Authoritative API knowledge from the library authors. Our `cinematic-scroll` skill therefore contains *no* API reference — only this repo's architecture and camera/pacing craft. |

Not vendored from the same repo: `gsap-frameworks` (Vue/Svelte/Nuxt; irrelevant).

## Considered and not adopted

| Candidate | Source | What it provides | Decision |
|---|---|---|---|
| Playwright MCP plugin | Microsoft, in Anthropic directory | Interactive browser control via MCP (`npx @playwright/mcp@latest`) | **Not now.** Unpinned `@latest` pulls a newer Playwright than the container's pre-installed Chromium 1194 (downloads are blocked here). Our QA needs deterministic, scripted scroll sampling, which a Node Playwright script does better. Reconsider for ad-hoc interactive debugging on a local machine. |
| `playwright-cli` skill | Microsoft (`microsoft/playwright-cli`) | Shell commands for snapshot/click/screenshot/video, reduced-motion emulation | **Not now.** Same browser-version mismatch; overlaps with our scripts. Good option locally. |
| `webapp-testing` | Anthropic (`anthropics/skills`) | Python Playwright recipes + server lifecycle helper | Python Playwright isn't installed and the project is Node; the server helper duplicates `scripts/lib/server.mjs`. Patterns (reconnaissance-then-action, wait for load) are adopted into `visual-qa`. |
| `web-design-guidelines` | Vercel | Fetches Vercel's UI guidelines at runtime and audits files | Checklist is SaaS/app-UI oriented and fetched live (moving target). Accessibility items are covered in `visual-qa`. |
| `react-best-practices` | Vercel | 70 React/Next.js perf rules | Mostly server/data-fetching/Next.js; the relevant client rules are in `performance-review`. High context cost for little gain. |
| Motion AI Kit | Motion (motion.dev) | Motion docs MCP + examples | Motion isn't installed yet (deferred until a micro-interaction needs it); site unreachable from this container to verify terms. Revisit if Motion is added. |
| Community Motion skills (e.g. `199-biotechnologies/motion-dev-animations-skill`) | Community | Motion.dev patterns | Community, overlapping the official kit, and Motion isn't a primary runtime here. |
| Darkroom `cc-settings` (Lenis authors) | darkroom.engineering | Full opinionated Claude config: agents, QA via Chrome DevTools MCP, Lighthouse loop, React perf rules | Whole-config replacement, depends on Chrome DevTools MCP. Useful ideas (no layout reads in frame loops; screenshot-first QA) absorbed into our skills. No standalone Lenis skill exists there any more. |
| Anthropic Design plugin | Anthropic | Design critique, design-system, UX copy + many SaaS MCP connectors | Built for product-design teams (Figma, Linear, Slack…). `creative-director` + `onam-design` cover critique for this project. |
| `algorithmic-art`, `canvas-design` | Anthropic | p5.js generative art, static poster design | Produce standalone artefacts, not runtime scene code. |
| Three.js/WebGL skills | Various community | 3D scene recipes | WebGL deliberately deferred (see `cinematic-scroll` §8). |

## Custom skills (only for what nothing above covers)

`onam-design` (cultural + visual system), `cinematic-scroll` (this repo's scene
architecture + camera/pacing/transition craft), `svg-illustration` (hand-made SVG
authoring + procedural pookalam), `animation-review`, `visual-qa`,
`performance-review` (workflows around this repo's rendered-output tooling).
