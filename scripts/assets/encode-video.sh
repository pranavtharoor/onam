#!/usr/bin/env bash
# Master video → web renditions.
#
#   npm run assets:video -- <input> <name> [--scrub] [--height 1080] [--mobile-height 720]
#
# Writes public/media/video/<name>/:
#   <name>-<h>.av1.mp4   AV1 (smallest; modern browsers)
#   <name>-<h>.h264.mp4  H.264 fallback (Safari < 17, older Android)
#   <name>-<mh>.*        mobile renditions
#   <name>-poster.avif / .jpg   first frame poster
#
# --scrub  encodes for scroll-controlled playback (ScrollVideo): keyframe every
#          6 frames so seeking in either direction is cheap. Larger files — only
#          use for videos driven by scroll. Normal playback uses long GOPs.
# Audio is always stripped (the film is silent).
set -euo pipefail
command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Install it (apt-get install ffmpeg / brew install ffmpeg)."; exit 1; }

IN="${1:?input file}"; NAME="${2:?output name}"; shift 2
SCRUB=0; H=1080; MH=720
while [[ $# -gt 0 ]]; do case "$1" in
  --scrub) SCRUB=1 ;; --height) H="$2"; shift ;; --mobile-height) MH="$2"; shift ;;
esac; shift; done

OUT="public/media/video/$NAME"; mkdir -p "$OUT"
GOP=$([[ $SCRUB == 1 ]] && echo 6 || echo 120)

for h in "$H" "$MH"; do
  ffmpeg -y -loglevel error -i "$IN" -an -vf "scale=-2:$h:flags=lanczos,format=yuv420p" \
    -c:v libsvtav1 -preset 6 -crf 38 -g "$GOP" -movflags +faststart "$OUT/$NAME-$h.av1.mp4"
  ffmpeg -y -loglevel error -i "$IN" -an -vf "scale=-2:$h:flags=lanczos,format=yuv420p" \
    -c:v libx264 -preset slow -crf 26 -profile:v high -g "$GOP" -keyint_min "$GOP" -sc_threshold 0 -movflags +faststart "$OUT/$NAME-$h.h264.mp4"
done
ffmpeg -y -loglevel error -i "$IN" -vframes 1 -vf "scale=-2:$H" "$OUT/$NAME-poster.png"
node -e "const s=require('sharp');s('$OUT/$NAME-poster.png').avif({quality:50}).toFile('$OUT/$NAME-poster.avif').then(()=>s('$OUT/$NAME-poster.png').jpeg({quality:72,mozjpeg:true}).toFile('$OUT/$NAME-poster.jpg')).then(()=>require('fs').unlinkSync('$OUT/$NAME-poster.png'))"
ls -lh "$OUT"
