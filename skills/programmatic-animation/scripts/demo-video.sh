#!/usr/bin/env bash
#
# demo-video.sh — HTML → Screenshot → Video pipeline for demo domination
#
# Usage:
#   demo-video.sh <url-or-html-file> [output.mp4] [duration] [fps] [width] [height]
#   demo-video.sh demo.html demo.mp4 15 30 1920 1080
#
# Requires: ffmpeg, google-chrome (or chromium-browser)
#
# The pipeline:
#   1. Open HTML in headless Chrome
#   2. Record screen at specified fps/duration
#   3. Encode to MP4 (H.264, faststart for web playback)
#
# Alternative modes:
#   SCROLL mode: Slowly scrolls the page during recording
#   INTERACTIVE mode: Records a Puppeteer/Playwright script
#
set -euo pipefail

INPUT="${1:?Usage: demo-video.sh <url-or-html-file> [output.mp4] [duration] [fps] [width] [height]}"
OUTPUT="${2:-demo-output.mp4}"
DURATION="${3:-15}"
FPS="${4:-30}"
WIDTH="${5:-1920}"
HEIGHT="${6:-1080}"

# Resolve input to URL
if [[ "$INPUT" == http* ]]; then
    URL="$INPUT"
elif [[ -f "$INPUT" ]]; then
    URL="file://$(realpath "$INPUT")"
else
    echo "Error: $INPUT not found"
    exit 1
fi

TMPDIR=$(mktemp -d)
FRAME_PATTERN="$TMPDIR/frame_%05d.png"

echo "=== Demo Video Pipeline ==="
echo "Input:    $URL"
echo "Output:   $OUTPUT"
echo "Duration: ${DURATION}s @ ${FPS}fps (${DURATION} frames × $(echo "$WIDTH * $HEIGHT" | bc)px)"
echo ""

# ─── Step 1: Capture frames via headless Chrome ─────────────────────────
echo "[1/3] Launching headless Chrome..."

CHROME=$(which google-chrome 2>/dev/null || which chromium-browser 2>/dev/null || which chromium 2>/dev/null)

if [[ -z "$CHROME" ]]; then
    echo "Error: No Chrome/Chromium found. Install google-chrome or chromium-browser."
    exit 1
fi

# Use Chrome's built-in screen recording via CDP
# Alternative: use Puppeteer/Playwright for more control
TOTAL_FRAMES=$((DURATION * FPS))

# Generate frames via screenshot loop (works without Puppeteer)
for i in $(seq 1 $TOTAL_FRAMES); do
    FRAME_NUM=$(printf "%05d" $i)
    # Calculate scroll position for smooth scroll effect
    PROGRESS=$(echo "scale=6; $i / $TOTAL_FRAMES" | bc)
    
    "$CHROME" \
        --headless=new \
        --disable-gpu \
        --no-sandbox \
        --screenshot="$TMPDIR/frame_${FRAME_NUM}.png" \
        --window-size="${WIDTH},${HEIGHT}" \
        --virtual-time-budget=$(( i * 1000 / FPS )) \
        "$URL" 2>/dev/null
    
    # Progress indicator
    if (( i % FPS == 0 )); then
        echo "  Frame $i/$TOTAL_FRAMES ($(echo "$PROGRESS * 100" | bc | cut -c1-5)%)"
    fi
done

echo "[1/3] Captured $TOTAL_FRAMES frames"

# ─── Step 2: Encode with ffmpeg ────────────────────────────────────────
echo "[2/3] Encoding video..."

ffmpeg -y \
    -framerate "$FPS" \
    -i "$FRAME_PATTERN" \
    -c:v libx264 \
    -preset slow \
    -crf 18 \
    -pix_fmt yuv420p \
    -movflags +faststart \
    -vf "pad=ceil(iw/2)*2:ceil(ih/2)*2" \
    "$OUTPUT" \
    2>/dev/null

echo "[2/3] Encoded: $OUTPUT"

# ─── Step 3: Generate thumbnails / GIF preview ─────────────────────────
GIF_OUTPUT="${OUTPUT%.mp4}-preview.gif"
echo "[3/3] Generating GIF preview..."

ffmpeg -y \
    -i "$OUTPUT" \
    -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
    "$GIF_OUTPUT" \
    2>/dev/null

echo "[3/3] Preview: $GIF_OUTPUT"

# Cleanup
rm -rf "$TMPDIR"

# Report
FILESIZE=$(du -h "$OUTPUT" | cut -f1)
GIFSIZE=$(du -h "$GIF_OUTPUT" | cut -f1)
echo ""
echo "=== Done ==="
echo "  Video: $OUTPUT ($FILESIZE)"
echo "  GIF:   $GIF_OUTPUT ($GIFSIZE)"
