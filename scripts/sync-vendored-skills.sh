#!/usr/bin/env bash
# Re-sync vendored third-party skills from upstream. Review the diff before committing.
set -euo pipefail
TMP=$(mktemp -d); trap 'rm -rf "$TMP"' EXIT
git clone -q --depth 1 https://github.com/anthropics/claude-plugins-official.git "$TMP/official"
git clone -q --depth 1 https://github.com/greensock/gsap-skills.git "$TMP/gsap"
rm -rf .claude/skills/frontend-design && cp -r "$TMP/official/plugins/frontend-design/skills/frontend-design" .claude/skills/
for s in gsap-core gsap-timeline gsap-scrolltrigger gsap-react gsap-plugins gsap-performance gsap-utils; do
  rm -rf ".claude/skills/$s" && cp -r "$TMP/gsap/skills/$s" .claude/skills/ && cp "$TMP/gsap/LICENSE" ".claude/skills/$s/LICENSE"
done
sed -i -E "s/(frontend-design\` \| .*\| \`)[0-9a-f]{40}/\1$(git -C "$TMP/official" rev-parse HEAD)/; s/(gsap-utils\` \| .*\| \`)[0-9a-f]{40}/\1$(git -C "$TMP/gsap" rev-parse HEAD)/" .claude/skills/VENDORED.md
git status --short .claude/skills
