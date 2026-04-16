---
name: programmatic-animation
description: Use when creating web animations, scroll-driven motion, parallax, SVG animation, shape morphing, draggable elements, spring physics, text splitting, timeline orchestration, staggered reveals, smooth scrolling, demo videos, or design quality review. Triggers on anime.js, GSAP, Lenis, Osmo, Remotion, impeccable, ffmpeg, programmatic video, motion design, easing curves, scroll triggers, anti-patterns, UI polish, or any web animation/design task.
keywords: [animation, anime.js, gsap, scrolltrigger, lenis, parallax, marquee, flip, scroll-animation, smooth-scroll, motion, svg, morph, draggable, spring, stagger, timeline, easing, remotion, webflow, programmatic-video]
---

# Programmatic Animation Skill

Unified reference for web animation: **Anime.js v4** (primary engine), **Osmo GSAP components** (scroll patterns), and **Remotion** (programmatic video). One skill, three tiers.

## Tier Decision Matrix

| Need | Use | Why |
|------|-----|-----|
| Animate DOM elements, SVG, timelines | **Anime.js** | Lightweight (24.5KB), tree-shakeable, spring physics, WAAPI support |
| Scroll-driven parallax/reveal effects | **Osmo GSAP components** | Production-tested Webflow patterns with data-attribute APIs |
| Generate MP4/video programmatically | **Remotion** | React → video pipeline, frame-perfect control |
| Smooth scroll base layer | **Lenis** | Used by both Anime.js and GSAP setups |

## Quick Starts

### Anime.js (the default choice)

```js
import { animate, stagger, onScroll } from 'animejs';

// Basic animation
animate('.box', { x: 100, rotate: 45, duration: 800, ease: 'outExpo' });

// Staggered grid
animate('.dot', {
  scale: [0, 1],
  delay: stagger(50, { grid: [7, 7], from: 'center' }),
  ease: 'outQuad',
});

// Timeline
import { createTimeline } from 'animejs';
createTimeline({ loop: true, alternate: true })
  .add('.box', { x: 100 }, 0)
  .add('.circle', { y: 50 }, '-=200')
  .add('.dot', { scale: [0, 1] }, '<');
```

### GSAP + Lenis (Osmo scroll effects)

```js
// Base: Lenis smooth scroll + GSAP bridge
const lenis = new Lenis();
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => { lenis.raf(time * 1000); });
gsap.ticker.lagSmoothing(0);
```

Full Osmo component code is in `references/` — each is a drop-in module with data-attribute APIs.

### Remotion (programmatic video)

See `templates/component-starter.html` for setup. Use the `remotion-video-generator` skill for full pipeline.

## Architecture: Anime.js v4 Modules

```
animejs (24.5KB total, tree-shakeable)
├── Timer          5.60KB   — base clock, playback controls
├── Animation      5.20KB   — animate(), tween engine
├── Timeline       0.55KB   — createTimeline(), orchestration
├── Draggable      6.41KB   — createDraggable(), springs
├── Scroll         4.30KB   — onScroll(), scroll observer
├── Scope          0.22KB   — createScope(), media queries
├── SVG            0.35KB   — createDrawable(), morphTo(), createMotionPath()
├── Stagger        0.48KB   — stagger()
├── Spring         0.52KB   — createSpring()
├── WAAPI          3.50KB   — native Web Animation API bridge
└── Text           —        — split()
```

**Install:** `npm i animejs` | **CDN:** `<script src="https://cdn.jsdelivr.net/npm/animejs@4.3.6/lib/anime.min.js"></script>`

## Full API Reference

See `references/animejs-api.md` for the complete Anime.js v4 API — every function, parameter, callback, and value type with code examples.

## Osmo GSAP Components (Scroll Effects)

11 production-ready scroll animation components scraped from [osmo.supply/free](https://www.osmo.supply/free). Each is in `references/`:

| File | Component | Key Data Attributes |
|------|-----------|-------------------|
| `scaling-system.css` | Fluid responsive CSS | `:root` custom properties |
| `lenis-setup.js` | Smooth scroll | None |
| `global-parallax.js` | Scroll parallax | `data-parallax="trigger\|target"` |
| `tab-system.js` | Animated tabs + autoplay | `data-tabs="wrapper\|content-item"` |
| `scaling-flip.js` | GSAP Flip scroll transitions | `data-flip-element="wrapper\|target"` |
| `marquee-scroll-direction.js` | Directional marquee | `data-marquee-scroll-direction-target` |
| `multilevel-navigation.js` | Full nav + ARIA + keyboard | `data-menu-button`, `data-dropdown-toggle` |
| `elements-reveal-scroll.js` | Staggered reveals | `data-reveal-group`, `data-reveal-group-nested` |
| `highlight-text-scroll.js` | Character highlight on scroll | `data-highlight-text` |
| `button-character-stagger.js` | CSS char stagger hover | `data-button-animate-chars` |
| `sticky-features.js` | Pin-to-viewport feature cycle | `data-sticky-feature-wrap\|item\|visual-wrap"` |

## When to Use What

### Anime.js over GSAP when:
- You need **spring physics** (no GSAP membership required)
- You want **tree-shaking** (import only what you need)
- You need **WAAPI hardware acceleration** for simple animations
- You want **text splitting** without GreenSock Club membership
- Bundle size matters (24.5KB vs GSAP 26KB+ for core + plugins)

### GSAP over Anime.js when:
- You need **Flip plugin** for layout transitions (Anime.js has no equivalent)
- You need **ScrollTrigger's pin** feature (Anime.js onScroll is simpler but less powerful)
- You're building for **Webflow** (Osmo patterns are GSAP-native)
- You need **SplitText** and have a GSAP membership

### Use both together when:
- Anime.js for interactive elements (draggable, springs, SVG)
- GSAP + Lenis for scroll-driven page animation (parallax, reveals)

## Google Fonts Download (for Pillow rendering)

Direct download links return HTML. Use the CSS endpoint with user-agent spoofing to get actual gstatic TTF URLs:

```bash
# Step 1: Get real TTF URLs from the CSS API
curl -sL "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;700&family=Figtree:wght@400;700" \
  -H "User-Agent: Mozilla/5.0" | grep -oP 'url\(\K[^)]+'

# Step 2: Download each URL
curl -sL -o BricolageGrotesque-Bold.ttf "<url_from_step_1>"
curl -sL -o Figtree-Regular.ttf "<url_from_step_2>"

# Verify (must be TrueType, not HTML)
file *.ttf  # Should say "TrueType Font data"
```

**Gotcha**: `https://fonts.google.com/download?family=...` and direct gstatic URLs without the CSS endpoint both return HTML redirects. The CSS endpoint with a browser user-agent is the only reliable way to get real font files programmatically.

## Pillow Frame-by-Frame Video Pipeline (Alternative to Remotion)

For programmatic video without Node.js/Remotion, use pure Python Pillow rendering:

```python
# Pattern: 1920×1080 @ 30fps, frame-by-frame → ffmpeg
from PIL import Image, ImageDraw, ImageFont
W, H, FPS = 1920, 1080, 30

def render_frame(f):
    img = Image.new("RGBA", (W, H), bg_rgb + (255,))
    draw = ImageDraw.Draw(img)
    # ... scene logic using draw primitives ...
    return img.convert("RGB")

# Render all frames
for f in range(total_frames):
    render_frame(f).save(f"/tmp/frames/frame_{f:05d}.png", "PNG")

# Encode
# ffmpeg -framerate 30 -i frame_%05d.png -c:v libx264 -crf 16 -pix_fmt yuv420p -movflags +faststart output.mp4
```

**Key primitives for motion design agency quality:**
- `glass_card()`: `draw.rounded_rectangle()` with `rgba(fill, 50)` + `rgba(border_color, 40)` outline
- `glow_dot()`: concentric circles with decreasing alpha (`alpha * (r/max_r)**0.5`)
- `animated_line()`: `lerp(p1, p2, progress)` for draw-from-start-to-end effect
- `spring(t, damp=12)`: `1 - exp(-damp*t) * cos(t*pi*2)` for natural motion
- `shutter_wipe()`: alternating strips sliding left/right with staggered delay
- `scramble_decode()`: replace unrevealed chars with random, advance char-by-char
- `ticker_bar()`: infinite scroll via `(frame * speed) % text_width` offset

**Performance**: 1800 frames (60s @ 30fps) renders in ~60s on a single core. Background grid dot rendering should be optimized (skip every 3rd frame or reduce density).

## skillui Design Extraction Workflow

```bash
npm install -g skillui
skillui --url https://target-site.com --mode ultra --out /tmp/design
# Output: DESIGN.md with colors, fonts, spacing, components, animations
# Plus: tokens/*.json, fonts/, screenshots/

# Gotcha: Ultra mode requires Playwright. Without it, still extracts CSS tokens.
# Gotcha: skillui detects "light theme" on dark sites if body bg isn't explicitly dark.
#         Always cross-reference with manual CSS curl:
curl -sL https://target-site.com/path/to/styles.css | head -200
```

## Gotchas

1. **Anime.js v4 is NOT backwards-compatible with v3** — The API changed from `anime({targets, ...})` to `animate(targets, {...})`. Migration guide: function names changed, parameters restructured.
2. **GSAP SplitText requires paid membership** — Free CDN URL works for demos but you need a Club GreenSock license for production. Anime.js `split()` is free.
3. **Lenis + GSAP ScrollTrigger MUST be bridged** — Without `gsap.ticker.add(...)` and `ScrollTrigger.update`, scroll-driven animations won't fire during Lenis-managed scroll.
4. **Anime.js `onScroll({ sync: true })` is NOT the same as GSAP ScrollTrigger** — It scrubs animation progress to scroll position but has no `pin` or `scrub` with duration. For pinned sections, use GSAP ScrollTrigger.
5. **`createDrawable()` returns a Proxy, not the element** — Don't pass the original element to `animate()` after wrapping. Use the proxy.
6. **`morphTo()` only works with `<path>`, `<polygon>`, `<polyline>`** — Not `<rect>`, `<circle>`, or `<ellipse>`. Convert with a path editor first.
7. **Spring easing can exceed target value** — That's the physics. Use higher damping (15-20) to reduce overshoot. Stiffness 100 + damping 10 = moderate bounce.
8. **GSAP Flip `invalidateOnRefresh`** — If using Flip for scroll animations, always recalculate on resize. Osmo's Flip examples include a debounced resize handler.
9. **Osmo Multilevel Navigation uses CSS `:has()`** — No fallback for IE/old browsers. Supported in Chrome 105+, Safari 15.4+, Firefox 121+.
10. **Osmo Scaling System overrides `:root` font-size** — Conflicts with Tailwind/Bootstrap. Apply `--size-font` on a wrapper div instead.
11. **`prefers-reduced-motion` is only checked at init** — Both Osmo components and Anime.js check once at load. No runtime media query listener.
12. **Anime.js `stagger()` can be used for both `delay` AND timeline positions** — `stagger(100, { grid: [7,7], from: 'center' })` works in `.add()` time position parameter too.
13. **Marquee scroll direction uses `timeScale` flip** — GSAP's `ScrollTrigger.direction` returns `1` for down, `-1` for up. The marquee flips `timeScale()` to reverse direction.
14. **Sticky Features uses `clip-path: inset()`** — No IE fallback. The `round` keyword in `inset()` adds border-radius to the clip region.
15. **Anime.js Timer is the base class** — Both `animate()` and `createTimeline()` return Timer instances. All playback controls (`play`, `pause`, `seek`, `reverse`) work on all of them.

## RTP Dark Bloom Theme

For the Resilient Token Protocol video/landing page:

```css
:root {
  --rtp-bg: #0a0a0f;
  --rtp-surface: #12121a;
  --rtp-purple: #7b61ff;
  --rtp-green: #00ff88;
  --rtp-cyan: #00d4ff;
  --rtp-glass: rgba(18, 18, 26, 0.7);
  --rtp-glass-border: rgba(123, 97, 255, 0.15);
}
```

Swap all light colors → RTP dark palette. Add `backdrop-filter: blur(20px)` on glass surfaces. Use `--rtp-purple` for glow accents, `--rtp-cyan` for connection lines, `--rtp-green` for PnL counters.

## Design Quality: Impeccable (Anti-Slop Shield)

[Impeccable v2.1](https://github.com/pbakaus/impeccable) is installed at `~/.hermes/skills/impeccable/` with 18 sub-skills. Use it BEFORE and AFTER animation work:

**Pre-animation:** `/impeccable shape` — plan the UX/UI before coding.
**During animation:** `/impeccable overdrive` — push past conventional limits with spring physics, scroll reveals, 60fps animations.
**Post-animation:** `/impeccable polish` — final quality pass on alignment, spacing, consistency.
**Audit:** `npx impeccable detect <file>` — scan HTML/CSS for UI anti-patterns.

### Key Impeccable Sub-Skills for Animation Work

| Skill | When to use | What it does |
|-------|-------------|-------------|
| `overdrive` | Push beyond conventional limits | Shaders, spring physics, scroll-driven reveals, 60fps |
| `animate` | Add motion to existing UI | Purposeful animations, micro-interactions, hover effects |
| `delight` | Make it memorable | Unexpected touches, personality, joy moments |
| `polish` | Pre-ship quality pass | Alignment, spacing, consistency, micro-details |
| `critique` | Evaluate design quality | Quantitative scoring, persona testing, anti-pattern detection |
| `shape` | Before any code | Structured discovery interview → design brief |
| `colorize` | Too monochromatic | Strategic color, vibrant palette |
| `layout` | Spacing/hierarchy issues | Visual rhythm, composition fixes |
| `typeset` | Font issues | Font choices, hierarchy, readability |
| `audit` | Technical quality check | Accessibility, performance, theming, anti-patterns |

### CLI: Anti-Pattern Detection

```bash
# Scan a single HTML file for design anti-patterns
npx impeccable detect index.html

# Scan a directory
npx impeccable detect ./src/components/

# Scan a live URL
npx impeccable detect https://your-demo.site

# Start live browser overlay (real-time detection)
npx impeccable live --port=3000
```

## Demo Video Pipeline: ffmpeg

ffmpeg 7.x is available with libx264, libvpx, libwebp, NVENC, drawtext, overlay. Two scripts in `scripts/`:

### scripts/demo-video.sh — Full HTML-to-Video Pipeline

```bash
# Record an HTML demo page as MP4
~/.hermes/skills/programmatic-animation/scripts/demo-video.sh demo.html output.mp4 15 30 1920 1080
#                                                            input        output  dur fps W     H
```

Pipeline: HTML → headless Chrome screenshots → ffmpeg H.264 encode → GIF preview.

### scripts/ffmpeg-quick.sh — Recipe Reference

Source it for instant access to 12 ffmpeg recipes:
```bash
source ~/.hermes/skills/programmatic-animation/scripts/ffmpeg-quick.sh
```

Recipes: screen record, image sequence → MP4, MP4 → GIF, WebM, text overlay (scene titles), concat clips, fade in/out, add audio, picture-in-picture, speed up/slow down, thumbnail extraction, animated WebP.

### Quick Demo Video Workflow

```bash
# 1. Build your animated HTML page (using anime.js + impeccable design)
# 2. Record it
~/.hermes/skills/programmatic-animation/scripts/demo-video.sh demo.html demo.mp4

# 3. Add title overlay
ffmpeg -i demo.mp4 \
  -vf "drawtext=text='Resilient Token Protocol':fontcolor=white:fontsize=48:\
       x=(w-text_w)/2:y=h-th-30:box=1:boxcolor=black@0.5:boxborderw=10" \
  -c:a copy demo-titled.mp4

# 4. Add fade in/out
ffmpeg -i demo-titled.mp4 \
  -vf "fade=t=in:st=0:d=1,fade=t=out:st=14:d=1" -c:a copy final.mp4

# 5. Generate social GIF
ffmpeg -i final.mp4 \
  -vf "fps=10,scale=480:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" \
  preview.gif
```

## File Index

```
references/
├── animejs-api.md                    # Complete Anime.js v4 API reference
├── scaling-system.css                # Osmo fluid responsive CSS
├── lenis-setup.js                    # Lenis smooth scroll init
├── global-parallax.js                # GSAP parallax with responsive breakpoints
├── tab-system.js                     # Animated tabs + autoplay + progress bar
├── scaling-flip.js                   # GSAP Flip scroll-driven layout transitions
├── marquee-scroll-direction.js       # Directional marquee with scroll velocity
├── multilevel-navigation.js          # Full nav with ARIA + keyboard + CSS animation
├── elements-reveal-scroll.js         # Staggered reveal groups with nesting
├── highlight-text-scroll.js          # SplitText character opacity reveal
├── button-character-stagger.js       # Pure CSS+JS character hover stagger
└── sticky-features.js                # Pin-to-viewport feature card cycling
scripts/
├── demo-video.sh                     # HTML → Chrome → ffmpeg MP4 pipeline
└── ffmpeg-quick.sh                   # 12 ffmpeg recipes for demo video work
templates/
└── component-starter.html            # HTML boilerplate with dependency comments
```
