---
name: demo-video-stack
description: "Full-stack demo video production for hackathons, pitches, and product launches. Orchestrates five rendering tiers — web animation (Anime.js/GSAP), architecture diagrams (HTML/SVG), ASCII art video (Python/NumPy), Pillow frame-by-frame, and Remotion (React→video). Use when creating: pitch videos, hackathon demos, product walkthroughs, architecture explainer videos, animated system diagrams, ASCII art segments, programmatic video of any kind. Triggers on: demo video, pitch deck video, hackathon submission video, product demo, architecture explainer, ASCII art video, programmatic video, motion design pipeline."
version: 1.0.0
keywords: [demo, video, pitch, hackathon, animation, architecture-diagram, ascii-art, remotion, pillow, ffmpeg, animejs, gsap, programmatic-video, motion-design, explainer]
---

# Demo Video Stack

Orchestrated multi-tier pipeline for producing professional demo videos. One skill, five rendering engines, any combination.

## Architecture

```
                    ┌─────────────────────┐
                    │   demo-video-stack   │
                    │   (this skill)       │
                    └──────────┬──────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                     │
    ┌─────▼─────┐    ┌────────▼────────┐    ┌──────▼──────┐
    │   TIER 1  │    │     TIER 2      │    │   TIER 3    │
    │ Web Anim  │    │ Diagrams &      │    │ ASCII Art   │
    │           │    │ Explainers      │    │ Video       │
    │ Anime.js  │    │                 │    │             │
    │ GSAP/Lenis│    │ HTML/SVG dark   │    │ Python/NumPy│
    │           │    │ Architecture    │    │ Pillow+ffmpeg│
    └─────┬─────┘    │ Diagrams        │    └──────┬──────┘
          │          └────────┬────────┘           │
          │                   │                     │
          └────────────┬──────┘─────────────────────┘
                       │
                ┌──────▼──────┐
                │   TIER 4    │
                │ Compositor  │
                │             │
                │ Pillow      │
                │ frame-by-   │
                │ frame       │
                │ + ffmpeg    │
                └──────┬──────┘
                       │
                ┌──────▼──────┐
                │   TIER 5    │
                │ Remotion    │
                │             │
                │ React→video │
                │ data-driven │
                └─────────────┘
```

## Tier Decision Matrix

| Need | Tier | Engine | Output |
|------|------|--------|--------|
| Interactive web demo, landing page | 1 | Anime.js + GSAP/Lenis | HTML |
| System architecture diagram | 2 | HTML/SVG generator | HTML/PNG |
| Architecture diagram *animated into video* | 2→4 | SVG frames + Pillow/ffmpeg | MP4/GIF |
| Retro/generative video segments | 3 | Python ASCII pipeline | MP4/GIF |
| Custom motion design (titles, transitions) | 4 | Pillow frame-by-frame | MP4/GIF |
| Data-driven video with React components | 5 | Remotion | MP4 |
| Full hackathon pitch video | 1+2+3+4 | All tiers composed | MP4 |
| Live product walkthrough recording | 1 + ffmpeg | Screen record | MP4 |

## Workflow: Planning a Demo Video

### Step 1: Storyboard

Before any code, define the video structure:

```
0:00-0:03  Title card (Tier 4: Pillow animated text)
0:03-0:08  Problem statement (Tier 4: animated text + icons)
0:08-0:15  Architecture overview (Tier 2: animated SVG diagram)
0:15-0:25  Live product demo (Tier 1: web animation recorded, or Tier 4)
0:25-0:35  Technical deep dive (Tier 3: ASCII art code/data visualization)
0:35-0:45  Results/metrics (Tier 4: animated counters + charts)
0:45-0:50  Call to action (Tier 4: branded closing card)
```

### Step 2: Render Each Segment

Each tier produces standalone clips. Render independently, then compose:

```bash
# Render each segment
./render-segment.sh title 0 3       → clips/01-title.mp4
./render-segment.sh problem 3 8     → clips/02-problem.mp4
./render-segment.sh architecture 8 15 → clips/03-arch.mp4
./render-segment.sh demo 15 25      → clips/04-demo.mp4
./render-segment.sh deepdive 25 35  → clips/05-deepdive.mp4
./render-segment.sh results 35 45   → clips/06-results.mp4
./render-segment.sh cta 45 50       → clips/07-cta.mp4
```

### Step 3: Compose

```bash
# Concatenate all clips with crossfade transitions
ffmpeg -f concat -safe 0 -i clips.txt \
  -vf "fade=t=in:st=0:d=0.5,fade=t=out:st=49.5:d=0.5" \
  -c:v libx264 -crf 16 -preset slow -pix_fmt yuv420p \
  -movflags +faststart output.mp4

# Add audio track
ffmpeg -i output.mp4 -i background-music.mp3 \
  -c:v copy -c:a aac -shortest final.mp4
```

## Tier 1: Web Animation (Anime.js + GSAP)

**Skill:** `programmatic-animation`

**When:** Live interactive demos, landing page recordings, scroll-driven showcases.

**Key tools:**
- Anime.js v4 — spring physics, SVG morphing, timelines, WAAPI (24.5KB)
- GSAP + Lenis — scroll-driven parallax, reveals, pin sections
- Osmo components — 11 production scroll effects

**Output:** HTML page (record with `scripts/demo-video.sh` for MP4)

**Quick start:**
```js
import { animate, stagger, createTimeline } from 'animejs';
createTimeline()
  .add('.title', { opacity: [0, 1], y: [30, 0] }, 0)
  .add('.feature', { scale: [0, 1], delay: stagger(100) }, 500);
```

**Reference:** See `programmatic-animation/references/` for full Anime.js API, GSAP components.

## Tier 2: Architecture Diagrams

**Skill:** `creative/architecture-diagram`

**When:** System overviews, cloud infrastructure, service meshes, data flow diagrams.

**Key features:**
- Standalone HTML/SVG — no dependencies, works offline
- Dark theme design system with semantic color mapping
- Component types: frontend, backend, database, cloud, security, message bus, external
- Boundary boxes: security groups (dashed rose), regions (dashed amber)
- Auto-layout with legend placement

**Semantic Color Palette:**

| Type | Fill | Stroke |
|------|------|--------|
| Frontend | `rgba(8,51,68,0.4)` | `#22d3ee` (cyan) |
| Backend | `rgba(6,78,59,0.4)` | `#34d399` (emerald) |
| Database | `rgba(76,29,149,0.4)` | `#a78bfa` (violet) |
| Cloud | `rgba(120,53,15,0.3)` | `#fbbf24` (amber) |
| Security | `rgba(136,19,55,0.4)` | `#fb7185` (rose) |
| Message Bus | `rgba(251,146,60,0.3)` | `#fb923c` (orange) |
| External | `rgba(30,41,59,0.5)` | `#94a3b8` (slate) |

**Animating diagrams into video:** Render the SVG at multiple states (build-up animation showing components appearing one by one), capture each frame, encode to MP4.

```python
# Pattern: Animate diagram build-up
# 1. Generate diagram HTML with all components
# 2. Use headless Chrome to screenshot at each build stage
# 3. CSS opacity transitions control reveal timing
# 4. ffmpeg encodes frames → MP4
```

**Reference:** `creative/architecture-diagram/templates/template.html` for full template.

## Tier 3: ASCII Art Video

**Skill:** `creative/ascii-video`

**When:** Retro/generative segments, code visualization, "matrix" effects, tech-brand aesthetics, audio-reactive visualizers.

**Pipeline:** `INPUT → ANALYZE → SCENE_FN → TONEMAP → SHADE → ENCODE`

**Key capabilities:**
- 6 modes: video-to-ASCII, audio-reactive, generative, hybrid, lyrics/text, TTS narration
- Multi-density character grids (8px-40px) with bitmap cache
- 38 shader catalog (CRT, bloom, glitch, vignette, chromatic aberration...)
- Particle systems (sparks, rain, runes, boids, flow-field followers)
- Feedback buffers (zoom tunnel, rainbow trails, rotating mandala)
- Audio FFT analysis with beat-synced scene cutting
- 20+ blend modes for layer compositing

**Character palette options:** Density ramps, block elements, symbols, katakana, Greek, runes, braille, project-specific custom sets.

**Performance:** ~100-200ms/frame on single core. N-worker parallel rendering.

**Quick generative example:**
```python
# Minimal generative ASCII scene
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 1920, 1080, 30
CHARS = " .:-=+*#%@"
font = ImageFont.truetype("JetBrainsMono-Bold.ttf", 14)

def render_frame(f, t):
    canvas = np.zeros((H, W, 3), dtype=np.uint8)
    # Your generative logic here
    return canvas
```

**References:** 8 comprehensive reference files in `creative/ascii-video/references/`:
- `architecture.md` — Grid system, palettes (20+), color system (HSV + OKLAB + discrete RGB)
- `composition.md` — Blend modes (20), multi-grid, adaptive tonemap, feedback buffers
- `effects.md` — Effect building blocks, noise, voronoi, SDFs, particles, transforms
- `shaders.md` — ShaderChain, 38 shader catalog, transitions, audio-reactive scaling
- `scenes.md` — Scene protocol, parallel rendering, design patterns, examples
- `inputs.md` — Audio FFT, video sampling, TTS integration
- `optimization.md` — Hardware profiles, vectorization, memory management
- `troubleshooting.md` — Common pitfalls, ffmpeg issues, font problems

## Tier 4: Pillow Frame-by-Frame Compositor

**Skill:** `programmatic-animation` (Pillow pipeline section)

**When:** Custom motion design, title cards, animated text, data visualizations, hackathon pitch videos.

**This is the glue tier** — it composes output from all other tiers and adds:
- Animated text with scramble-decode reveal
- Counter animations for metrics/KPIs
- Glass card compositions with glow accents
- Spring-based easing curves
- Shutter wipe transitions between segments

**Key primitives:**
- `glass_card()`: rounded rect with `rgba(fill, 50)` + outline
- `glow_dot()`: concentric circles with decreasing alpha
- `animated_line()`: `lerp(p1, p2, progress)` draw-from-start effect
- `spring(t, damp=12)`: `1 - exp(-damp*t) * cos(t*pi*2)` natural motion
- `scramble_decode()`: random chars → reveal actual text char-by-char
- `ticker_bar()`: infinite scroll via `(frame * speed) % text_width`

**Resolution:** 1920x1080 @ 30fps (standard). 1800 frames (60s) renders in ~60s.

**Reference:** `programmatic-animation/SKILL.md` § Pillow Frame-by-Frame Video Pipeline.

## Tier 5: Remotion (React → Video)

**Skill:** `programmatic-animation` (Remotion section) + `remotion/remotion-video-generator`

**When:** Data-driven video with dynamic content, complex multi-scene projects, React component library.

**Key features:**
- Frame-perfect control with React components
- `<Composition>` wraps timeline, `<Sequence>` wraps scenes
- Data binding: fetch API data at render time
- Built-in `<Audio>`, `<Video>`, `<Img>` components
- Server-side rendering for batch generation

**When to choose over Pillow:** When your video needs dynamic data (API results, live metrics), reusable component library, or you're already in a React project.

## Cross-Tier Patterns

### Pattern: Architecture Build-Up Animation

```
Tier 2 (diagram) → Tier 4 (animate the build-up) → MP4
```

1. Generate architecture diagram HTML (Tier 2)
2. Add CSS animation classes for staggered component reveals
3. Record with headless Chrome at 30fps
4. Add glow/line-drawing effects with Pillow post-processing (Tier 4)
5. Encode to MP4

### Pattern: ASCII Deep-Dive Segment

```
Tier 3 (ASCII render) + Tier 2 (diagram overlay) → Tier 4 (composite) → MP4
```

1. Render ASCII art of code/data flow (Tier 3)
2. Overlay simplified architecture diagram as corner inset (Tier 2)
3. Composite with animated annotations (Tier 4)

### Pattern: Full Hackathon Pitch

```
Tier 4 (title) + Tier 2 (architecture) + Tier 1 (demo) + Tier 3 (ASCII deep-dive) + Tier 4 (metrics + CTA)
```

1. Title card with spring-animated text and project logo (Tier 4)
2. Architecture diagram builds up showing system design (Tier 2 → 4)
3. Screen recording of live product demo (Tier 1 recorded, or Tier 4 animated mock)
4. ASCII art segment showing data flow / algorithm visualization (Tier 3)
5. Metrics counters animate up showing results (Tier 4)
6. Closing card with team info and QR code (Tier 4)
7. ffmpeg concatenates with crossfade transitions

### Pattern: Audio-Reactive Demo

```
Tier 3 (ASCII audio-reactive) + Tier 1 (web animation) → sync via beat timestamps
```

1. Analyze audio for beats/bands (Tier 3 inputs pipeline)
2. Generate ASCII visualizer segments synced to beats
3. Overlay or interleave with web-animated product screenshots
4. Beat timestamps drive transition timing in ffmpeg

## Shared Resources

### ffmpeg Recipes

Source `scripts/ffmpeg-quick.sh` from the `programmatic-animation` skill for 12 instant recipes:
- Screen record, image sequence → MP4, MP4 → GIF/WebM
- Text overlay (scene titles), concat clips
- Fade in/out, picture-in-picture
- Speed up/slow down, animated WebP

### Demo Video Script

`scripts/demo-video.sh` records any HTML page to MP4 via headless Chrome:
```bash
scripts/demo-video.sh demo.html output.mp4 15 30 1920 1080
```

### Design Quality Integration

[Impeccable](https://github.com/pbakaus/impeccable) is installed at `~/.hermes/skills/impeccable/` with 18 sub-skills. Use it at every stage:

| Stage | Impeccable Skill | Purpose |
|-------|-----------------|---------|
| Before coding | `shape` | Plan UX/UI before building |
| During animation | `overdrive` | Push past conventional limits |
| Color decisions | `colorize` | Strategic color, vibrant palette |
| Typography | `typeset` | Font choices, hierarchy |
| Pre-ship | `polish` | Alignment, spacing, consistency |
| Quality audit | `audit` | Technical quality check |
| Design review | `critique` | Quantitative scoring |

## Theme Presets

### RTP Dark Bloom (Resilient Token Protocol)
```css
--rtp-bg: #0a0a0f;
--rtp-surface: #12121a;
--rtp-purple: #7b61ff;
--rtp-green: #00ff88;
--rtp-cyan: #00d4ff;
--rtp-glass: rgba(18, 18, 26, 0.7);
--rtp-glass-border: rgba(123, 97, 255, 0.15);
```

### Hackathon Default (Dark Tech)
```css
--hack-bg: #0a0a0f;
--hack-surface: #141420;
--hack-accent: #6366f1;  /* indigo */
--hack-green: #22c55e;
--hack-cyan: #06b6d4;
--hack-text: #e2e8f0;
```

### ASCII Terminal Retro
```css
--ascii-bg: #0c0c0c;
--ascii-green: #00ff41;
--ascii-amber: #ffb000;
--ascii-cyan: #00d4ff;
```

## Google Fonts (for Pillow Rendering)

```bash
# Get real TTF URLs from CSS API (direct download links return HTML)
curl -sL "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700&family=JetBrains+Mono:wght@400;700" \
  -H "User-Agent: Mozilla/5.0" | grep -oP 'url\(\K[^)]+'

# Download each URL
curl -sL -o BricolageGrotesque-Bold.ttf "<url>"
file *.ttf  # Must say "TrueType Font data", not HTML
```

## File Index

```
skills/demo-video-stack/
├── SKILL.md                              ← This file (orchestrator)
├── references/                           ← (reserved for cross-tier patterns)
├── scripts/                              ← (reserved for compose scripts)
└── templates/                            ← (reserved for storyboard templates)

Sister skills (loaded by reference):
├── skills/programmatic-animation/        ← Tier 1 (web anim) + Tier 4 (Pillow) + Tier 5 (Remotion)
├── skills/creative/architecture-diagram/ ← Tier 2 (SVG diagrams)
└── skills/creative/ascii-video/          ← Tier 3 (ASCII art video pipeline)
```

## Gotchas

1. **Tier 2 diagrams are HTML, not frames** — To animate them, record with headless Chrome or export SVG layers and composite with Pillow.
2. **ASCII video tonemap is critical** — Never use `canvas * N` multipliers. Use adaptive `tonemap()` with percentile normalization. See `ascii-video/references/composition.md`.
3. **Anime.js v4 ≠ v3 API** — `animate(targets, {...})` not `anime({targets, ...})`.
4. **Lenis + GSAP ScrollTrigger must be bridged** — Without `gsap.ticker.add()` bridge, scroll animations won't fire.
5. **ffmpeg pipe deadlock** — Never `stderr=subprocess.PIPE` with long-running ffmpeg. Redirect to file.
6. **Architecture diagram z-order** — Draw arrows BEFORE component boxes so they render behind.
7. **Cross-tier color consistency** — Define one color palette and apply it across all tiers. Use the theme presets above or create project-specific ones.
8. **Pillow font rendering** — macOS `textbbox()` returns wrong height. Use `font.getmetrics()`: `cell_height = ascent + descent`.
9. **ASCII character palette validation** — Not all Unicode chars render in all fonts. Validate at init by rendering each char and checking for blank output.
10. **Impeccable BEFORE and AFTER** — Run `shape` before building, `polish` before shipping. It's not optional for quality output.
