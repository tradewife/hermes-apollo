#!/usr/bin/env bash
#
# ffmpeg-quick.sh — One-liner ffmpeg recipes for demo video work
#
# All recipes assume ffmpeg 7.x with libx264, libvpx, libwebp support.
# Run from any directory. Output files go to current directory.
#
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Screen recording → MP4 (X11, uses xdotool for scroll)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -f x11grab -video_size 1920x1080 -framerate 30 -i :0.0 \
#          -c:v libx264 -preset fast -crf 20 -pix_fmt yuv420p \
#          -movflags +faststart recording.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Image sequence → MP4
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -framerate 30 -i frames/frame_%05d.png \
#          -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p \
#          -movflags +faststart output.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: MP4 → GIF (optimized, for social/telegram)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 \
#          -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
#          output.gif
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: MP4 → WebM (for web embedding, smaller than MP4)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 -c:v libvpx-vp9 -crf 30 -b:v 0 output.webm
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Add text overlay (scene titles, metrics, branding)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 \
#          -vf "drawtext=text='Resilient Token Protocol':fontcolor=white:fontsize=48:\
#               x=(w-text_w)/2:y=h-th-30:box=1:boxcolor=black@0.5:boxborderw=10" \
#          -c:a copy output-titled.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Concatenate clips (scene transitions)
# ═══════════════════════════════════════════════════════════════════════
#
#   # Create concat file
#   echo "file 'scene1.mp4'" > concat.txt
#   echo "file 'scene2.mp4'" >> concat.txt
#   echo "file 'scene3.mp4'" >> concat.txt
#   ffmpeg -f concat -safe 0 -i concat.txt -c copy full-demo.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Fade in/out transitions
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 \
#          -vf "fade=t=in:st=0:d=1,fade=t=out:st=14:d=1" \
#          -c:a copy output-faded.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Add audio track (background music)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 -i music.mp3 \
#          -c:v copy -c:a aac -b:a 192k \
#          -shortest output-with-audio.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Picture-in-picture (demo + facecam)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i demo.mp4 -i facecam.mp4 \
#          -filter_complex "[1:v]scale=320:-1[face];[0:v][face]overlay=W-w-20:H-h-20" \
#          -c:a copy output-pip.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Speed up / slow down
# ═══════════════════════════════════════════════════════════════════════
#
#   # 2x speed
#   ffmpeg -i input.mp4 -filter:v "setpts=0.5*PTS" -an output-fast.mp4
#   # 0.5x speed (slowmo)
#   ffmpeg -i input.mp4 -filter:v "setpts=2*PTS" -an output-slow.mp4
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Extract single frame as thumbnail
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 -ss 00:00:05 -frames:v 1 thumbnail.png
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: HTML → screenshot (headless Chrome + ffmpeg overlay)
# ═══════════════════════════════════════════════════════════════════════
#
#   google-chrome --headless=new --disable-gpu --no-sandbox \
#       --screenshot=screenshot.png --window-size=1920,1080 \
#       file://$(pwd)/demo.html
#
# ═══════════════════════════════════════════════════════════════════════
# RECIPE: Generate animated WebP (modern GIF replacement)
# ═══════════════════════════════════════════════════════════════════════
#
#   ffmpeg -i input.mp4 -vcodec libwebp_anim -lossless 0 -q:v 75 \
#          -loop 0 -preset default -an -vf "fps=15,scale=640:-1" output.webp

echo "ffmpeg-quick.sh loaded. Source this file to use the recipes."
echo "Available: screen record, image sequence, gif, webm, text overlay,"
echo "           concat, fade, audio, pip, speed, thumbnail, screenshot, webp"
