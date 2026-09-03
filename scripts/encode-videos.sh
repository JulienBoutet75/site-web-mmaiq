#!/bin/bash
# Ré-encode les vidéos du site depuis les rushes HD (1206x2622, captures iPhone).
#
# Pourquoi : les fichiers livrés étaient en 480x980 alors que le cadre téléphone
# les affiche à ~280 px CSS, soit 840 px physiques sur un écran DPR 3 -> upscale
# et flou. On repart donc des rushes et on sort du 768x1568.
#
# Les rushes vivent dans le projet Remotion du montage investisseurs :
#   ~/mmaiq-investor-video/public/clips/
# Le crop 1206x2462+0+160 retire la barre de statut iOS (cadrage historique).
#
# Usage : bash scripts/encode-videos.sh [nom-du-clip]
set -euo pipefail

CLIPS="${CLIPS_DIR:-$HOME/mmaiq-investor-video/public/clips}"
RENDER="${RENDER_MP4:-$HOME/mmaiq-investor-video/out/mmaiq-investor.mp4}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/app/videos"
CROP="crop=1206:2462:0:160"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

# nom | rush | début (s) | vitesse | durée de sortie (s)
CLIP_SPECS=(
  "hero-performance|performance.mp4|4.26|1.217|10"
  "tutoriels|tutorials.mp4|12.94|1.04|6"
  "onboarding|onboarding.mp4|42.2|1.8|10"
  "gameplan|scouting_bsd.mp4|60.06|0.96|10"
  "analyse-video|video_ia.mov|74.3|1.0|10"
  # Les deux plans ci-dessous n'existaient plus dans les rushes (écrans d'une
  # version antérieure de l'app) : segments équivalents rejoués depuis les rushes.
  "nutrition-scan|nutrition.mp4|6.0|4.0|9.7"
  "entrainement-live|training.mp4|16.0|1.1|10"
)

encode_phone () {
  local name="$1" rush="$2" start="$3" speed="$4" out_dur="$5"
  local src_dur; src_dur=$(echo "$out_dur * $speed" | bc -l)
  local vf="$CROP,setpts=PTS/$speed,scale=768:1568:flags=lanczos,fps=30"
  echo "→ $name  ($rush  ${start}s  ×$speed  → ${out_dur}s)"
  ffmpeg -v error -ss "$start" -t "$src_dur" -i "$CLIPS/$rush" -vf "$vf" -an \
    -c:v libx264 -crf 25 -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -y "$DEST/$name.mp4"
  ffmpeg -v error -ss "$start" -t "$src_dur" -i "$CLIPS/$rush" -vf "$vf" -an \
    -c:v libvpx-vp9 -crf 36 -b:v 0 -row-mt 1 -deadline good -cpu-used 2 \
    -y "$DEST/$name.webm"
  # Poster : première image, en WebP (ffmpeg n'encode pas le webp ici -> cwebp).
  ffmpeg -v error -ss "$start" -i "$CLIPS/$rush" -frames:v 1 \
    -vf "$CROP,scale=768:1568:flags=lanczos" -y "$TMP/$name.png"
  cwebp -quiet -q 80 "$TMP/$name.png" -o "$DEST/$name-poster.webp"
}

# Montage produit : re-encodé depuis le rendu Remotion 1920x1080 (le fichier livré
# était en 960x540 à 152 kb/s, affiché sur 1024 px de large).
encode_montage () {
  local start=15.0 dur=98.8
  local vf="scale=1280:720:flags=lanczos"
  echo "→ montage-full (rendu 1080p → 720p)"
  ffmpeg -v error -ss "$start" -t "$dur" -i "$RENDER" -vf "$vf" -an \
    -c:v libx264 -crf 26 -preset slow -profile:v high -pix_fmt yuv420p \
    -movflags +faststart -y "$DEST/montage-full.mp4"
  # Pas de VP9 pour le montage : sur ce contenu il ne gagnait que 7 % sur le H.264.
  ffmpeg -v error -ss "$start" -i "$RENDER" -frames:v 1 -vf "$vf" -y "$TMP/montage.png"
  cwebp -quiet -q 80 "$TMP/montage.png" -o "$DEST/montage-full-poster.webp"
}

only="${1:-}"
if [ "$only" = "montage" ] || [ -z "$only" ]; then encode_montage; fi
for spec in "${CLIP_SPECS[@]}"; do
  IFS='|' read -r name rush start speed dur <<< "$spec"
  if [ -z "$only" ] || [ "$only" = "$name" ]; then
    encode_phone "$name" "$rush" "$start" "$speed" "$dur"
  fi
done
echo "OK — $(du -sh "$DEST" | cut -f1) dans public/app/videos"
