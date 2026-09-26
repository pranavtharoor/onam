# Video

Files live in `public/media/video/<name>/` (streamed, never bundled). Produce them from a master with:

    npm run assets:video -- media-src/video/<master>.mov <name> [--scrub]

This writes AV1 + H.264 renditions at desktop and mobile heights plus AVIF/JPEG posters. Use `--scrub` only for videos driven by scroll through `<ScrollVideo>` (short GOP for cheap seeking). Audio is always stripped.

Budgets (checked by `npm run perf:report`): ≤ 4 MB per rendition. Use video only for genuinely filmed or rendered cinematic motion, never as decoration.
