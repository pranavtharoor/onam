#!/usr/bin/env bash
# Video (or rendered animation) → frame sequence for <ImageSequence>.
#
#   npm run assets:sequence -- <input> <name> [--fps 24] [--width 1600] [--mobile-width 800] [--quality 62]
#
# Writes public/media/sequences/<name>/desktop/<name>_0001.webp … and
#        public/media/sequences/<name>/mobile/<name>_0001.webp (every 2nd frame, smaller).
# Budget: total per variant ≲ 6 MB, frames ≲ 60 KB (npm run perf:report checks this).
set -euo pipefail
command -v ffmpeg >/dev/null || { echo "ffmpeg not found. Install it (apt-get install ffmpeg / brew install ffmpeg)."; exit 1; }

IN="${1:?input}"; NAME="${2:?name}"; shift 2
FPS=24; W=1600; MW=800; Q=62
while [[ $# -gt 0 ]]; do case "$1" in
  --fps) FPS="$2"; shift ;; --width) W="$2"; shift ;; --mobile-width) MW="$2"; shift ;; --quality) Q="$2"; shift ;;
esac; shift; done

BASE="public/media/sequences/$NAME"; mkdir -p "$BASE/desktop" "$BASE/mobile"
ffmpeg -y -loglevel error -i "$IN" -vf "fps=$FPS,scale=$W:-2:flags=lanczos" -c:v libwebp -quality "$Q" -compression_level 6 "$BASE/desktop/${NAME}_%04d.webp"
ffmpeg -y -loglevel error -i "$IN" -vf "fps=$((FPS / 2)),scale=$MW:-2:flags=lanczos" -c:v libwebp -quality "$Q" -compression_level 6 "$BASE/mobile/${NAME}_%04d.webp"
for v in desktop mobile; do
  n=$(ls "$BASE/$v" | wc -l); size=$(du -sh "$BASE/$v" | cut -f1)
  echo "$v: $n frames, $size"
done
