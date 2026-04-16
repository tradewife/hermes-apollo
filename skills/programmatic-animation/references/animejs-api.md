# Anime.js v4.3 API Reference

Source: https://github.com/juliangarnier/anime | License: MIT | Bundle: 24.5KB

## Installation

```bash
npm i animejs
```

CDN: `<script src="https://cdn.jsdelivr.net/npm/animejs@4.3.6/lib/anime.min.js"></script>`

## Module Imports (tree-shakeable)

```js
// Full import
import { animate, createTimeline, createDraggable, stagger, onScroll } from 'animejs';

// Or individual modules for smaller bundles:
import { animate } from 'animejs';                    // Animation only (~5.2KB)
import { createTimeline } from 'animejs';              // Timeline (~0.55KB)
import { stagger } from 'animejs';                     // Stagger (~0.48KB)
import { createDrawable, morphTo, createMotionPath } from 'animejs'; // SVG (~0.35KB)
import { createSpring } from 'animejs';                // Spring physics (~0.52KB)
import { onScroll } from 'animejs';                    // Scroll observer (~4.3KB)
import { createDraggable } from 'animejs';             // Draggable (~6.41KB)
```

## Core API: animate()

The primary function. Animates CSS properties, SVG attributes, DOM attributes, and JS objects.

```js
animate('.target', {
  x: 100,                  // CSS transform x
  y: [0, 200],             // from-to array
  rotate: '+=45',          // relative value
  scale: [1, 1.5],         // scale from 1 to 1.5
  opacity: 0.5,
  borderRadius: ['0%', '50%'],
  duration: 1000,          // ms
  delay: 200,
  ease: 'inOutExpo',       // easing function
  loop: true,              // infinite loop
  alternate: true,         // ping-pong
  autoplay: true,
  onBegin: () => {},
  onUpdate: (anim) => {},
  onComplete: () => {},
});
```

### Tween Value Types

```js
// Absolute
x: 100

// From-to array
x: [0, 100]

// Relative
x: '+=100'
x: '-=50'

// Function-based (per-target)
x: ($el, i, total) => i * 50

// Keyframes array
x: [0, 100, 50, 200]

// Keyframes objects
x: [
  { to: 100, duration: 500, ease: 'outQuad' },
  { to: 50, duration: 300 },
]
```

### Composition Modes

```js
animate('.el', {
  x: 100,
  composition: 'blend',    // Blends with running animations (default)
  // 'none' — overwrites running animations
  // 'add' — adds to running animations (additive)
});
```

### Animatable Properties

| Category | Properties |
|----------|-----------|
| CSS Transforms | `x`, `y`, `z`, `rotate`, `rotateX/Y/Z`, `scale`, `scaleX/Y`, `skewX/Y`, `perspective` |
| CSS Properties | `opacity`, `width`, `height`, `borderRadius`, `backgroundColor`, `color`, etc. |
| SVG | `d` (path), `points`, `cx`, `cy`, `r`, etc. |
| DOM Attributes | Any attribute via `attr: { d: 'M0...' }` |
| JS Objects | Any numeric property on plain objects |
| Custom | Via `modifier` callback |

## Timeline API: createTimeline()

Orchestrate multiple animations with precise time positioning.

```js
const tl = createTimeline({
  loop: true,
  alternate: true,
  defaults: { ease: 'outQuad' }
});

tl.add('.box', {
  x: 100,
  duration: 800,
}, 0)                       // absolute position: 0ms

.add('.circle', {
  y: 50,
  duration: 600,
}, 200)                     // absolute: 200ms

.add('.square', {
  rotate: 180,
  duration: 400,
}, '-=200')                 // relative: 200ms before previous end

.add('.dot', {
  scale: [0, 1],
  duration: 300,
}, '<')                     // at the start of the previous animation

.add('.triangle', {
  opacity: [0, 1],
}, '+=100');                // 100ms after previous end
```

### Time Position Syntax

| Syntax | Meaning |
|--------|---------|
| `0` | Absolute position at 0ms |
| `500` | Absolute position at 500ms |
| `'+=200'` | 200ms after previous animation ends |
| `'-=100'` | 100ms before previous animation ends |
| `'<'` | At the start of the previous animation |
| `stagger(100)` | Staggered positions (100ms apart) |

### Timeline Controls

```js
tl.play();
tl.pause();
tl.restart();
tl.seek(500);     // seek to 500ms
tl.reverse();
tl.timeScale(2);  // 2x speed
```

## Scroll Observer: onScroll()

Trigger or sync animations to scroll position.

```js
// Sync animation to scroll position
animate('path', {
  draw: ['0 0', '0 1'],
  ease: 'linear',
  autoplay: onScroll({
    sync: true,             // scrub animation with scroll
  })
});

// Trigger animation on enter
animate('.reveal', {
  opacity: [0, 1],
  y: [30, 0],
  autoplay: onScroll({
    enter: 'bottom-=100',   // trigger when bottom of element is 100px above viewport bottom
  })
});

// Full options
onScroll({
  container: document.body,  // scroll container
  target: '.section',        // element to observe
  sync: false,               // false = trigger once
  threshold: 0.5,            // visibility percentage to trigger
  enter: 'bottom top',       // IntersectionObserver rootMargin syntax
  leave: 'top bottom',
  onEnter: () => {},
  onLeave: () => {},
  onSyncComplete: () => {},
});
```

### Sync Modes

```js
// Synchronous — animation progress tied to scroll
onScroll({ sync: true })

// Asynchronous — triggered once, plays independently
onScroll({ sync: false })

// With smooth interpolation
onScroll({ sync: true, smooth: 0.5 })
```

## Stagger: stagger()

Stagger animation delays, values, or timeline positions across multiple targets.

```js
// Time stagger
animate('.dot', {
  scale: [0, 1],
  delay: stagger(100),              // 100ms between each target
  ease: 'outQuad',
});

// Grid-based stagger
animate('.grid-item', {
  opacity: [0, 1],
  delay: stagger(50, {
    grid: [7, 7],                   // 7x7 grid
    from: 'center',                 // start from center
    // from: 'start' | 'end' | 'center' | [x, y] | 'first' | 'last'
  }),
});

// Value stagger
animate('.bar', {
  height: stagger([20, 100]),       // distributes 20-100 across targets
  ease: 'inOutQuad',
});

// With easing
stagger(100, { ease: 'inOutQuad' })

// From specific index
stagger(50, { from: 3 })
```

## SVG Utilities

### createMotionPath() — Follow SVG paths

```js
animate('.car', {
  ...createMotionPath('.road', {     // spread into animation
    pathProperty: 'translateX/Y',    // which transform to animate
    offset: 0,                       // offset along path (0-1)
  }),
  duration: 2000,
  ease: 'linear',
});
```

### createDrawable() — Line drawing

```js
const path = createDrawable('path');  // wrap element
animate(path, {
  draw: ['0 0', '0 1'],              // [start, end] as fraction of total length
  duration: 1500,
  ease: 'inOutQuad',
});

// Draw and erase
animate(path, {
  draw: ['0 0', '0 1', '1 1'],       // undrawn → drawn → erased
  duration: 2000,
});
```

### morphTo() — Shape morphing

```js
animate('.shape-a', {
  d: morphTo('.shape-b', 0.33),      // precision parameter
  duration: 800,
  ease: 'inOutQuad',
});
// Works with <path>, <polygon>, <polyline>
```

## Draggable: createDraggable()

```js
const draggable = createDraggable('.box', {
  container: '.container',           // constrain to container
  snap: 50,                          // snap to grid
  // snap: [0, 100, 200],           // snap to specific values
  padding: 20,                       // padding from container edges
  dragSpeed: 1,                      // drag sensitivity multiplier
  releaseEase: createSpring({         // spring physics on release
    stiffness: 100,
    damping: 10,
    mass: 1,
  }),
  onDrag: (self) => {},              // drag callback
  onRelease: (self) => {},           // release callback
  onSettle: () => {},                // after spring settles
});

// Methods
draggable.pause();
draggable.resume();
draggable.set(x, y);
draggable.destroy();
```

## Spring Physics: createSpring()

```js
const spring = createSpring({
  stiffness: 100,        // spring stiffness (default: 100)
  damping: 10,           // friction (default: 10)
  mass: 1,               // object mass (default: 1)
  // Higher stiffness = faster
  // Higher damping = less bounce
  // Higher mass = more inertia
});

// Use as easing
animate('.el', {
  x: 200,
  ease: spring,
});

// Use on draggable release
createDraggable('.el', {
  releaseEase: spring,
});
```

## Text Splitting: split()

```js
import { split } from 'animejs';

// Split text into chars
const chars = split('.heading', {
  type: 'char',           // 'char' | 'word' | 'line'
});

// Animate individual chars
animate(chars.chars, {
  opacity: [0, 1],
  translateY: [20, 0],
  delay: stagger(30),
  ease: 'outQuad',
});
```

## Scope: createScope()

Responsive animations that adapt to media queries.

```js
const scope = createScope({
  root: document.querySelector('.container'),
  mediaQueries: {
    isMobile: '(max-width: 767px)',
    isDesktop: '(min-width: 768px)',
  },
}).add(({ matches }) => {
  // Create animations conditionally
  animate('.box', {
    x: matches.isMobile ? 0 : 100,
    y: matches.isMobile ? 100 : 0,
  });
});

// Cleanup
scope.revert();
```

## Easing Functions

### Built-in Easings
```
'linear' | 'inQuad' | 'outQuad' | 'inOutQuad' |
'inCubic' | 'outCubic' | 'inOutCubic' |
'inQuart' | 'outQuart' | 'inOutQuart' |
'inExpo' | 'outExpo' | 'inOutExpo' |
'inBack' | 'outBack' | 'inOutBack' |
'inBounce' | 'outBounce' | 'inOutBounce' |
'inElastic' | 'outElastic' | 'inOutElastic' |
'inOut(3)'   // parameterized: inOut(n) for stronger ease
```

### Custom Cubic Bezier
```js
ease: 'cubicBezier(0.25, 0.1, 0.25, 1)'
```

### Steps
```js
ease: 'steps(10)'       // 10 discrete steps
ease: 'steps(5, end)'   // 5 steps, jump at end
```

### Linear with Keyframes
```js
ease: 'linear(0, 0.25, 0.75, 1)'   // custom linear curve
```

## Random: random()

```js
import { random } from 'animejs';

animate('.dot', {
  x: random(-100, 100),
  y: random(-100, 100),
  rotate: random(-180, 180),
  duration: random(500, 1500),
});
```

## WAAPI Integration

Anime.js v4 can output native Web Animation API objects for hardware-accelerated animations:

```js
import { animate as waapiAnimate } from 'animejs/waapi';

waapiAnimate('.box', {
  x: 100,
  duration: 1000,
  ease: 'outQuad',
});  // Returns native Animation object
```

## Callbacks

```js
animate('.el', {
  x: 100,
  onBegin: (self) => { console.log('started', self); },
  onUpdate: (self) => { console.log('progress', self.progress); },
  onRender: (self) => { console.log('render frame'); },
  onLoop: (self) => { console.log('loop complete'); },
  onComplete: (self) => { console.log('done', self); },
  onPause: (self) => { console.log('paused'); },
});
```

## Engine Defaults

```js
import { engine } from 'animejs';

engine.defaults = {
  duration: 1000,
  ease: 'outQuad',
  loop: false,
  // ...
};

engine.timeUnit = 'ms';  // 'ms' | 's'
engine.speed = 1;        // global playback speed
engine.fps = 60;         // target framerate
engine.precision = 4;    // decimal precision
```

## Playback Controls (Timer/Animation/Timeline)

```js
const anim = animate('.el', { x: 100, autoplay: false });
anim.play();
anim.pause();
anim.restart();
anim.seek(0.5);         // seek to 50% progress (0-1)
anim.reverse();
anim.timeScale(2);      // 2x speed
anim.commitStyles();    // write inline styles
anim.cancel();          // cancel and clean up

// Promise-based
anim.then(() => console.log('done'));
```

## Properties (read-only)

```js
anim.progress;    // 0-1 current progress
anim.duration;    // total duration in ms
anim.iterations;  // current iteration count
anim.currentTime; // current time in ms
anim.paused;      // boolean
anim.began;       // boolean
anim.completed;   // boolean
anim.reversed;    // boolean
```
