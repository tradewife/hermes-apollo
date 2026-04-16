# Remotion Composition Patterns

Battle-tested patterns from production Remotion work. Use these as starting points — adapt to your project's visual language.

## Multi-Scene Composition with Series

Structure long videos as sequential scenes using `<Series>`:

```tsx
const FPS = 30;
const SCENE_A_DUR = 150;  // 5s
const SCENE_B_DUR = 420;  // 14s
const TOTAL = SCENE_A_DUR + SCENE_B_DUR;

export const MyComposition: React.FC = () => (
  <AbsoluteFill>
    <Series>
      <Series.Sequence durationInFrames={SCENE_A_DUR}>
        <SceneA />
      </Series.Sequence>
      <Series.Sequence durationInFrames={SCENE_B_DUR}>
        <SceneB />
      </Series.Sequence>
    </Series>
  </AbsoluteFill>
);
```

Register total duration in Root.tsx:

```tsx
<Composition
  id="MyVideo"
  component={MyComposition}
  durationInFrames={TOTAL}
  fps={FPS}
  width={1920}
  height={1080}
/>
```

Keep timing constants at the top of the file. Name them semantically (`HOOK_DUR`, `PIPELINE_DUR`). Sum them to `TOTAL` so the composition and root stay in sync.

## Animation Primitives

### Interpolate (linear mapping)

```tsx
import { interpolate, Easing } from "remotion";

const frame = useCurrentFrame();

// Fade in: 0->1 over frames 10-30
const opacity = interpolate(frame, [10, 30], [0, 1], {
  extrapolateLeft: "clamp",   // don't go below 0 before frame 10
  extrapolateRight: "clamp",  // don't go above 1 after frame 30
});

// Slide up: 40px->0 with easing
const easeOut = Easing.out(Easing.cubic);
const y = interpolate(frame, [0, 20], [40, 0], { extrapolateRight: "clamp" });
// Apply easing to progress, NOT to the pixel value
const easedY = easeOut(y / 40) * 40;
```

### Spring (physics-based)

```tsx
import { spring, useVideoConfig } from "remotion";

const { fps } = useVideoConfig();

// Snap-in from below with bounce
const y = spring({
  frame,
  fps,
  from: 60,
  to: 0,
  durationInFrames: 18,
  config: { damping: 20, stiffness: 200 },
});

// Scale pop-in
const scale = spring({
  frame,
  fps,
  from: 0.95,
  to: 1,
  durationInFrames: 25,
  config: { damping: 15, stiffness: 120 },
});
```

Tune `damping` (lower = bouncier) and `stiffness` (higher = snappier). For UI cards: damping 15-20, stiffness 150-200. For gentle text: damping 20+, stiffness 100-150.

## FadeIn Reusable Wrapper

```tsx
const FadeIn: React.FC<React.PropsWithChildren<{
  delay: number;
  duration?: number;
  direction?: "up" | "down" | "left" | "none";
}>> = ({ delay, duration = 20, direction = "up", children }) => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [delay, delay + duration], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const eased = Easing.out(Easing.cubic)(progress);
  const translateY = direction === "up" ? (1 - eased) * 20 : direction === "down" ? (1 - eased) * -20 : 0;
  const translateX = direction === "left" ? (1 - eased) * 30 : 0;

  return (
    <div style={{ opacity: eased, transform: `translate(${translateX}px, ${translateY}px)` }}>
      {children}
    </div>
  );
};
```

Use everywhere. Keeps animation consistent. Stagger delays per element (`delay={30 + i * 15}`).

## Staggered List Animation

Animate a list of items appearing one-by-one:

```tsx
const ITEMS = ["first", "second", "third", "fourth"];

const SceneList: React.FC = () => {
  const frame = useCurrentFrame();

  return ITEMS.map((text, i) => {
    const start = 10 + i * 22;  // stagger: 22 frames between items
    const opacity = interpolate(frame, [start, start + 10], [0, 1], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
    const x = interpolate(frame, [start, start + 10], [-40, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });

    return (
      <div key={i} style={{ opacity, transform: `translateX(${x}px)` }}>
        <Mono size={22}>{text}</Mono>
      </div>
    );
  });
};
```

## Animated Progress Bar

```tsx
const barWidth = interpolate(progress, [0, 1], [0, 100], {
  extrapolateRight: "clamp",
});

<div style={{ width: 200, height: 4, backgroundColor: "#1a1a2e", borderRadius: 2 }}>
  <div style={{
    width: `${barWidth}%`,
    height: "100%",
    backgroundColor: "#4ade80",
    borderRadius: 2,
    boxShadow: "0 0 6px rgba(74, 222, 128, 0.4)",
  }} />
</div>
```

## OffthreadVideo (Embedding AI-Generated Clips)

Play a video file inside a composition:

```tsx
import { OffthreadVideo, staticFile, AbsoluteFill } from "remotion";

const SceneVideo: React.FC = () => {
  const frame = useCurrentFrame();

  const fadeIn = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });
  const fadeOut = interpolate(frame, [410, 450], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ opacity: fadeIn }}>
      <OffthreadVideo
        src={staticFile("shot.mp4")}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
      {/* Fade overlay at end */}
      <AbsoluteFill style={{
        backgroundColor: "#000",
        opacity: interpolate(frame, [410, 450], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        }),
      }} />
    </AbsoluteFill>
  );
};
```

Place video files in the `public/` directory. Reference with `staticFile("filename.mp4")`.

### Headless render flags for large video files

```bash
npx remotion render CompositionName out/video.mp4 --gl=angle --concurrency=1
```

Without `--gl=angle`, OffthreadVideo with large files can timeout in headless environments. `--concurrency=1` prevents memory issues with multiple video decoders.

## Film Grain / Noise Overlay

```tsx
const Grain: React.FC<{ opacity?: number }> = ({ opacity = 0.04 }) => {
  const frame = useCurrentFrame();
  const seed = frame * 7919 % 10000;
  return (
    <AbsoluteFill style={{
      opacity,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
      backgroundPosition: `${seed % 128}px ${seed * 3 % 128}px`,
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }} />
  );
};
```

Inline SVG data URI — no external assets needed. Changes every frame via the seed.

## Monospace Typography System

```tsx
const C = {
  bg: "#050505",
  text: "#e4e4e7",
  dim: "#71717a",
  green: "#4ade80",
  purple: "#c084fc",
  blue: "#38bdf8",
  orange: "#f97316",
  accent: "#a78bfa",
};

const Mono: React.FC<{
  children: React.ReactNode;
  color?: string;
  size?: number;
  weight?: number;
  opacity?: number;
}> = ({ children, color = C.text, size = 16, weight = 400, opacity }) => (
  <span style={{
    fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: size,
    color,
    fontWeight: weight,
    opacity,
    letterSpacing: "0.02em",
  }}>
    {children}
  </span>
);
```

JetBrains Mono is the gold standard for code/terminal aesthetics. Fall back through system monospace fonts.

## Scanline Effect

```tsx
const scanline = interpolate(frame, [0, 150], [0, 1080], {
  extrapolateRight: "clamp",
});

<div style={{
  position: "absolute",
  top: 0, left: 0, right: 0,
  height: 2,
  backgroundColor: `rgba(167, 139, 250, ${interpolate(frame, [60, 150], [0.6, 0], {
    extrapolateRight: "clamp",
  })})`,
  boxShadow: "0 0 20px 4px rgba(167, 139, 250, 0.3)",
  transform: `translateY(${scanline}px)`,
}} />
```

## Animated SVG Path (Curves/Charts)

```tsx
const curveProgress = interpolate(frame, [40, 200], [0, 1], {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp",
  easing: Easing.out(Easing.cubic),
});

<svg viewBox="0 0 760 440" style={{ width: "100%", height: "100%" }}>
  <path
    d={`M 0,420 Q ${curveProgress * 200},400 ${curveProgress * 400},280 Q ${curveProgress * 550},180 ${curveProgress * 750},40`}
    fill="none"
    stroke="#facc15"
    strokeWidth={2}
    strokeDasharray="4 4"
  />
  <path
    d={`M 0,420 Q ${curveProgress * 200},400 ${curveProgress * 400},280 Q ${curveProgress * 550},180 ${curveProgress * 750},40 L ${curveProgress * 750},420 Z`}
    fill="rgba(250, 204, 21, 0.03)"
    stroke="none"
  />
</svg>
```

## Scene-Fade Transition Wrapper

Wrap each scene in a crossfade to avoid hard cuts between `<Series.Sequence>` blocks:

```tsx
const SceneFade: React.FC<React.PropsWithChildren<{
  durationInFrames: number;
  fadeFrames?: number;
}>> = ({ durationInFrames, fadeFrames = 15, children }) => {
  const frame = useCurrentFrame();
  const fadeIn = interpolate(frame, [0, fadeFrames], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(frame, [durationInFrames - fadeFrames, durationInFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{ opacity: Math.min(fadeIn, fadeOut) }}>{children}</AbsoluteFill>
  );
};
```

Set `fadeFrames` to 15-20 for smooth transitions. Each scene wraps its content: `<SceneFade durationInFrames={DURATION}><SceneContent /></SceneFade>`.

## Duration Assertion for Multi-Scene Videos

Export duration constants from each scene file and assert the total at composition level:

```tsx
// scenes/Scene1.tsx
export const SCENE1_DUR = 240;  // 8s @ 30fps

// RTPVideo.tsx
import { Scene1, SCENE1_DUR } from "./scenes/Scene1";
// ... etc

console.assert(
  SCENE1_DUR + SCENE2_DUR + SCENE3_DUR + SCENE4_DUR + SCENE5_DUR === 1800,
  "Scene durations don't sum to 1800 frames!"
);
```

Catches off-by-one timing bugs before render time.

## Terminal Typing with Cursor Blink

Type characters sequentially with a blinking block cursor:

```tsx
const TypeLine: React.FC<{
  text: string;
  startFrame: number;
  charsPerSec?: number;
}> = ({ text, startFrame, charsPerSec = 50 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const elapsed = frame - startFrame;
  const charsToShow = Math.min(text.length, Math.floor((elapsed / fps) * charsPerSec));
  const isTyping = charsToShow > 0 && charsToShow < text.length;
  const visible = elapsed > 0 ? text.slice(0, charsToShow) : "";
  const cursorOn = isTyping && Math.floor(frame / Math.round(fps / 4)) % 2 === 0;

  return (
    <Mono>
      {visible}
      <span style={{ opacity: cursorOn ? 1 : 0, color: "#0aada8" }}>▌</span>
    </Mono>
  );
};
```

Tune `charsPerSec` (40-60 feels natural for terminal aesthetics). Cursor disappears once the line is fully typed.

## Config (remotion.config.ts)

```ts
import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
```

Place at project root. `jpeg` image format is faster than `png` for large compositions. `setOverwriteOutput(true)` prevents "file exists" errors on re-renders.
