---
name: manim-nothing-video
description: |
  Use when creating Manim videos that apply the Nothing Design System (OLED black,
  monochrome hierarchy, Space Mono labels, data-as-beauty). Covers Manim installation
  on Debian/Ubuntu, design token integration, and the full script→build→render workflow.
  Trigger on "manim video", "nothing style video", "programmatic video", or "hackathon video".
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [manim, video, nothing-design, hackathon, animation]
---

# Manim Video with Nothing Design System

Produce clean, monochrome Manim videos using the Nothing Design System tokens.

## Prerequisites Installation (Debian/Ubuntu)

```bash
# System deps (required for manim + pycairo)
sudo apt-get install -y ffmpeg libpango1.0-dev libcairo2-dev libffi-dev python3-pip

# Python deps (global, not in a venv)
pip3 install --break-system-packages setuptools  # fixes srt build failure
pip3 install --break-system-packages manim
```

**Gotchas:**
- `srt` dependency fails without `setuptools` installed first
- `libpango1.0-dev` and `libcairo2-dev` are required for `manimpango` wheel build
- Do NOT install in project venvs -- install globally with `--break-system-packages`
- `ffmpeg` must be present for rendering

## Design Token Constants

Copy these into every Manim scene file as the color/size constants:

```python
# Nothing Design Tokens for Manim
BLACK_OLED = "#000000"
SURFACE = "#111111"
BORDER = "#222222"
BORDER_VISIBLE = "#333333"
TEXT_DISABLED = "#666666"
TEXT_SECONDARY = "#999999"
TEXT_PRIMARY = "#E8E8E8"
TEXT_DISPLAY = "#FFFFFF"
ACCENT = "#D71921"
SUCCESS = "#4A9E5C"

# Type scale (Manim font_size units, proportional to px at 1080p)
DISPLAY_XL = 72
DISPLAY_LG = 48
DISPLAY_MD = 36
HEADING = 24
SUBHEADING = 18
BODY = 16
LABEL = 11
```

## Nothing Design Rules for Video

1. **Background**: Always `BLACK_OLED` (`self.camera.background_color = BLACK_OLED`)
2. **Three-layer hierarchy**: TEXT_DISPLAY (hero), TEXT_PRIMARY (body), TEXT_SECONDARY (labels)
3. **Labels**: Always `font="monospace"`, ALL CAPS, LABEL size, TEXT_SECONDARY color
4. **Hero numbers**: DISPLAY_LG or DISPLAY_XL, TEXT_DISPLAY color, `font="monospace"`
5. **Accent red (#D71921)**: ONE moment per video. Never decorative.
6. **Success green (#4A9E5C)**: For positive metrics only. Applied to value, not label.
7. **No gradients, no shadows, no bounce easing**. Fade transitions only.
8. **One surprise moment**: Red dot, oversized number, single break in the pattern.
9. **Subtract, don't add**. If an element doesn't earn its pixel, remove it.
10. **Boxes/surfaces**: SURFACE fill, BORDER_VISIBLE stroke, 1.5px stroke width, corner_radius=0.1

## Workflow

1. **Script first** -- write voiceover script, get approval before building
2. **Load design skill** -- `skill_view("nothing-design")` for tokens/components
3. **Build scene class** -- one class per video, methods per scene section
4. **Preview render** -- `manim render file.py ClassName -pql` (480p15, fast)
5. **Check duration** -- `ffprobe -v quiet -print_format json -show_format output.mp4`
6. **Production render** -- `manim render file.py ClassName -pqh` (1080p60)
7. **Optional voiceover** -- add audio track with ffmpeg overlay

## Rendering Commands

```bash
# Low quality preview (~30s render)
manim render scene.py SceneName -pql

# Production 1080p60
manim render scene.py SceneName -pqh

# Check duration/size
ffprobe -v quiet -print_format json -show_format output.mp4 | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'{float(d[\"format\"][\"duration\"]):.1f}s {int(d[\"format\"][\"size\"])//1024//1024}MB')"
```

## Output Paths

Manim outputs to `media/videos/<script_name>/<quality>/` relative to the render directory.

## skills.sh Installation Gotchas

- Use `npx skills add <repo> --yes` to skip interactive agent selection
- Some repos (e.g., `nothing-design-skill`) have SKILL.md in a subdirectory, not root -- the skills.sh CLI fails on these. Manual install: `cp -R <repo>/<subdir> ~/.hermes/skills/`
- Clean up repo-local `.agents/skills/` after installing: `rm -rf <repo>/.agents/skills/`
- Install globally to `~/.hermes/skills/` for Hermes, NOT in project repos

## Gotchas

- Manim `Rectangle` with `fill_opacity` needs `fill_color` set (default is transparent)
- `SurroundingRectangle` creates box around content -- use `buff=0.2` for padding
- Arrow `max_tip_length_to_length_ratio=0.15` keeps arrowheads proportional on short arrows
- `VGroup.arrange(DOWN)` stacks vertically; use `aligned_edge=LEFT` for left-aligned columns
- `LaggedStart` creates staggered animations with `lag_ratio` (0.1-0.3 is sweet spot)
- Font availability: `"monospace"` maps to system mono. For specific fonts, install them first.
- Duration control: add `self.wait(N)` between scene transitions for pacing
