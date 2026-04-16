---
name: rtp-weekly-video
description: Use when creating the weekly update video for Resilient Token Protocol (RTP). Covers Manim animated scenes + Remotion composition + Nothing Design visual system + ffmpeg final render. Triggers on "RTP video", "weekly update video", "week N video", or "RTP week update".
version: 1.0.0
metadata:
  hermes:
    tags: [rtp, video, manim, remotion, nothing-design, hackathon]
---

# RTP Weekly Update Video Pipeline

## Architecture

Three tools working together:
1. **Manim** (Python) — Render individual animated scene clips (.mp4)
2. **Remotion** (Node.js) — Compose scenes, add transitions, overlay text/data
3. **Nothing Design** — Visual language: monochrome, typographic hierarchy, dot-grid motifs, OLED black backgrounds, Space Grotesk/Mono fonts, single accent color (Solana green #00FF88)

## v1 Status (SHIPPED)
- `video/output/rtp-week1-update-v1.mp4` — 55.5s, 1920x1080, 30fps
- Generated with PIL frames + ffmpeg (not proper skills)
- Narration audio: `video/assets-wk-1/narration.mp3` (extracted from screen recording)

## v2 Build Plan (Manim + Remotion + Nothing Design)

### Prerequisites (VERIFIED)
- Manim Community v0.20.1 at ~/.local/bin/manim
- Node.js v20.20.2 + npx
- ffmpeg available
- Pillow installed

### Step 1: Analyze PowerPoint slides
- Slides are in `video/assets-wk-N/slide-0X.png` (3840x2160)
- Screen recording with narration: `video/assets-wk-N/audio.MP4`
- Extract narration: `ffmpeg -y -i audio.MP4 -vn -acodec libmp3lame -q:a 2 narration.mp3`
- Vision analyze each slide for content (resize to 640px wide first for API)

### Step 2: Design Nothing Design tokens for video
- Background: OLED black #000000
- Primary text: #FFFFFF (Space Grotesk Bold, 60-80px)
- Secondary: #999999 (Space Grotesk Regular, 24-38px)
- Labels: #666666 (Space Mono, ALL CAPS, 16-20px)
- Accent: #00FF88 (Solana green) — one per screen
- Dot grid: #141414 (spacing 80px)
- No gradients, no shadows, no bounce easing
- Percussive transitions, not fluid

### Step 3: Render Manim scenes (Python)
Each scene becomes a Manim class rendering to `.mp4`:

```python
from manim import *

class RTPTitle(Scene):
    def construct(self):
        # Dot grid background
        # Slide-in text from left/right with ease-out
        # Accent line draw animation
        # Fade subtitle
        pass
```

Render: `manim -pql scene.py SceneName` (low quality preview)
Final: `manim -pqh scene.py SceneName` (1080p)

Scenes for Week 1:
1. Title (0-8s) — RESILIENT TOKEN PROTOCOL
2. Problem (8-14s) — 99% tokens die stats
3. Architecture (14-23s) — 3-layer stack diagram
4. Wings (23-31s) — 6 wing cards
5. Yield (31-38s) — Results table with animated bars
6. Treasury (38-44s) — Fee flow diagram
7. Progress (44-50s) — Checklist with checkmarks
8. Closing (50-55s) — WEEK 1 COMPLETE

### Step 4: Remotion composition
Scaffold: `npx create-video@latest rtp-video`
Add scenes as React components in `src/scenes/`
Use `@remotion/player` for preview
Render: `npx remotion render src/index.ts RTPWeek1 out/video.mp4`

### Step 5: Final ffmpeg compose
```bash
ffmpeg -y -i rtp-video-scenes.mp4 -i narration.mp3 \
  -c:v libx264 -preset medium -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart \
  video/output/rtp-week1-update-v2.mp4
```

## Gotchas
- **Vision_analyze cannot access local file paths** — returns 404. Resize slides with ffmpeg first (`ffmpeg -i slide.png -vf "scale=640:-1" thumb.jpg`) then try browser upload. For this project we skipped slide analysis and reconstructed content from CLAUDE.md.
- **PIL frame gen is the pragmatic fallback** when Manim/Remotion setup is too slow. ~3min per 10s at 30fps. Save as JPEG not PNG (2x faster writes, smaller files).
- **Frame numbering MUST be contiguous** for ffmpeg `-i frame_%05d.jpg`. A single gap (e.g. missing frame 779) silently truncates the video at that point. Always verify: `for i in $(seq 0 MAX); do [ ! -f frame_$(printf '%05d' $i).jpg ] && echo "MISSING: $i"; done`
- **setpts=N*PTS trick** stretches video to match audio: `ffmpeg -filter_complex "[0:v]setpts=1.11*PTS[v]"` where N = audio_duration / video_duration. This avoids duplicating the last frame.
- **SVG recoloring via sed** — SVG fills can be bulk-replaced with `sed 's/fill="#OLDCOLOR"/fill="#NEWCOLOR"/g'`. Paths without explicit `fill` need `sed -i 's/<path d="/<path fill="#COLOR" d="/g'` (then fix doubles).
- **SVG overlay in PIL** — Use `Image.open().convert("RGBA")`, apply alpha for fade-in, then `img.paste(svg, pos, svg)` with RGBA mask. Keep SVG ≤600px.
- **PIL rotate() is very slow at 600px+** — at 30fps it WILL timeout. Prefer pulse (resize on sine wave) + drift (lissajous position offset) over rotation. Pulse: `scale = 0.95 + 0.10 * sin(t * 2π / period)`. Drift: `dx = 40*sin(t*2π/6), dy = 25*sin(t*2π/3)` for figure-8.
- **SVGs with dark fills are invisible on black** — replacing only light fills (`#EBEAEB`) leaves dark paths (`#100F11`) invisible. Replace ALL fills including dark ones: `sed 's/fill="#100F11"/fill="#00CC6E"/g'`
- **Split generation by scene** — Generate scenes in separate scripts (part1, part2, closing) to avoid timeout on long renders. Each script continues frame numbering from where the previous left off.
- **iPhone screen recordings** have HEVC video + AAC audio. Extract narration: `ffmpeg -i audio.MP4 -vn -acodec libmp3lame -q:a 2 narration.mp3`
- **PNG→JPEG batch conversion** — When mixing PNG and JPEG frames, convert all to JPEG before ffmpeg: `for f in *.png; do ffmpeg -y -i "$f" -q:v 2 "${f%.png}.jpg"; done`
- Fonts: DejaVu Sans/Mono are available. For Nothing Design fidelity, need Space Grotesk/Mono (Google Fonts)

### Multi-batch frame generation trap
When generating frames in separate scripts (e.g., scenes 1-4 then 5-8), the second batch MUST start at exactly `last_frame + 1`. If part1 ends at frame 779 and part2 starts at 780, verify frame 779 exists BEFORE starting part2. A single missing frame causes ffmpeg to stop reading the image sequence at the gap, silently producing a truncated video. Always run: `for i in $(seq 0 MAX); do [ ! -f frame_$(printf '%05d' $i).jpg ] && echo "GAP: $i"; done`

### Duration matching with setpts
If video content is shorter than narration, DO NOT duplicate the last slide/scene. Instead, stretch with ffmpeg:
```bash
ffmpeg -y -framerate 30 -i frame_%05d.jpg -i narration.mp3 \
  -filter_complex "[0:v]setpts=DURATION_RATIO*PTS[v]" \
  -map "[v]" -map 1:a -c:v libx264 -crf 18 -pix_fmt yuv420p \
  -c:a aac -b:a 192k -shortest -movflags +faststart output.mp4
```
Where `DURATION_RATIO = audio_duration / video_duration` (e.g., 55.5/50 = 1.11). A stretch under ~15% is imperceptible.

## SVG Overlay Pattern (reusable)

For adding animated logo/artwork overlays to PIL-generated frames:

```python
from PIL import Image

# 1. Prepare SVG: recolor with sed, convert to PNG
# sed 's/fill="#EBEAEB"/fill="#00FF88"/g' input.svg > green.svg
# ffmpeg -i green.svg -vf "scale=600:600" green.png

# 2. Load as RGBA
svg = Image.open("green.png").convert("RGBA")

# 3. Per-frame: rotate, fade, composite
angle = sec * 12  # slow rotation
svg_rot = svg.rotate(angle, resample=Image.BICUBIC, expand=False)

# Fade-in
alpha_val = ease(min(1, (sec - 0.8) / 2.5))
if alpha_val < 1.0:
    a = svg_rot.split()[3]
    svg_rot.putalpha(a.point(lambda p: int(p * alpha_val)))

# Paste with alpha mask
img.paste(svg_rot, (pos_x, pos_y), svg_rot)
```

## File Locations
- Assets: `video/assets-wk-N/`
- Output: `video/output/`
- Manim scenes: `video/manim-scenes/` (to be created)
- Remotion project: `video/rtp-remotion/` (to be created)
- Frame cache: `/tmp/rtp-frames/`
