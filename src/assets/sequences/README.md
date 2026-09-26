# Image sequences

Frames live in `public/media/sequences/<name>/{desktop,mobile}/<name>_0001.webp` and are drawn to canvas by `<ImageSequence>`. Produce them with:

    npm run assets:sequence -- media-src/sequences/<render>.mov <name> --fps 24

The mobile variant has half the frames at half the width. Budgets: ≤ 6 MB per variant, ≤ 60 KB per frame. Use a sequence when a moment needs frame-exact scroll control that video seeking can't give (mobile Safari especially).
