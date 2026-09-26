#!/usr/bin/env bash
# Prepares a fresh container: installs npm deps if missing/stale and reports media tooling.
set -euo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}"

if [[ ! -d node_modules ]] || [[ package-lock.json -nt node_modules/.package-lock.json ]]; then
  PLAYWRIGHT_SKIP_BROWSER_DOWNLOAD=1 npm ci --no-audit --no-fund --loglevel=error >/dev/null 2>&1 \
    && echo "onam: npm dependencies installed" \
    || echo "onam: npm ci failed — run it manually"
fi

command -v ffmpeg >/dev/null 2>&1 \
  || echo "onam: ffmpeg not installed (only needed for npm run assets:video/assets:sequence and qa:motion --video). Install: apt-get update && apt-get install -y ffmpeg"
exit 0
