---
name: anime-intro-video
description: Create anime-style introduction videos with AI-generated art, TTS narration, and ffmpeg assembly. Produces multi-scene videos with crossfade transitions.
category: creative
---

# Anime Intro Video Creator

Create polished anime-style videos from a script with AI-generated scene art and TTS narration.

## When to Use
- Character introduction videos
- Anime-style explainers
- Cute animated presentations
- Any video combining AI art + narration

## Pipeline

### 1. Write Script
Create a detailed script with scenes, timing, visual descriptions, and narration text. Save to `~/project-name/script.md`.

### 2. Generate Scene Images
Use `image_generate` for each scene. Key tips:
- Use `aspect_ratio: landscape` for video scenes (1920x1080)
- Be descriptive about art style, color palette, character design
- Generate 1-2 extra scenes for options
- Download to `scenes/` directory with `curl`

### 3. Record Narration
Use `text_to_speech` for each scene's narration. Save as `.ogg` files in `audio/` directory.

### 4. Create Individual Clips
Use ffmpeg to merge each image+audio pair:
```bash
ffmpeg -y -loop 1 -i image.png -i audio.ogg \
  -c:v libx264 -tune stillimage -c:a aac -b:a 192k \
  -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x1a1a2e,format=yuv420p" \
  -t DURATION -shortest clip.mp4
```

### 5. Assemble with Crossfade Transitions
Build ffmpeg filter complex for xfade transitions:
- Video: `[v0][1:v]xfade=transition=fade:duration=0.8:offset=OFFSET[v1]`
- Audio: `[a0][1:a]acrossfade=d=0.8[a1]`
- Offset = cumulative previous durations minus cumulative fade durations

Write filter to file, then:
```bash
ffmpeg -y -i clip1.mp4 -i clip2.mp4 ... \
  -filter_complex_script filter.txt \
  -map "[v7]" -map "[a7]" \
  -c:v libx264 -crf 18 -preset medium \
  -c:a aac -b:a 192k -pix_fmt yuv420p \
  final.mp4
```

## Directory Structure
```
project-name/
├── script.md          # Full scene-by-scene script
├── scenes/            # Generated images
│   ├── scene1.png
│   └── scene2.png
├── audio/             # TTS narration files
│   ├── scene1.ogg
│   └── scene2.ogg
└── final/             # Clips and final video
    ├── clip1.mp4
    ├── clip2.mp4
    ├── filter.txt
    └── final.mp4
```

## Style Tips
- Color palette: Use consistent colors across all scenes
- Transition: 0.8s fade works well for narration pacing
- Add 1s buffer to each clip duration after audio
- Use dark background (#1a1a2e) for pad color when images don't fill 16:9
