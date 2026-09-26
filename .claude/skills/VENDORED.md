# Vendored third-party skills

These skills are copied verbatim from their upstream repositories and pinned, so
they load in every session (including fresh cloud containers where marketplace
plugins may not be installed). Do not edit them in place; re-sync instead:

    bash scripts/sync-vendored-skills.sh

| Skill(s) | Upstream | Commit | License |
|---|---|---|---|
| `frontend-design` | [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official/tree/main/plugins/frontend-design) (official Anthropic plugin) | `fa59bc9037741ecfa131aa27938272605710d7b2` | Apache-2.0 (`LICENSE.txt`) |
| `gsap-core`, `gsap-timeline`, `gsap-scrolltrigger`, `gsap-react`, `gsap-plugins`, `gsap-performance`, `gsap-utils` | [greensock/gsap-skills](https://github.com/greensock/gsap-skills) (official GreenSock) | `aed9cfd3277740755f6bfc1155c7aa645403b760` | MIT (`LICENSE`) |

`gsap-frameworks` (Vue/Svelte/Nuxt) was deliberately not vendored: this is a React project.

Equivalent plugin installs, if you prefer marketplace-managed updates on a local machine
(then delete the vendored copies to avoid duplicates):

    /plugin install frontend-design@claude-plugins-official
    /plugin marketplace add greensock/gsap-skills
    /plugin install gsap-skills@gsap-skills

Evaluation notes for every external skill considered (adopted and rejected) are in
`docs/tooling/skills-evaluation.md`.
