---
name: remotion-video-generator
description: Use when creating programmatic video, motion graphics, short films, social clips, explainer animations, or render pipelines with Remotion. Triggers on requests to animate, render mp4 output, build compositions, or generate code-driven video instead of editing by hand.
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [remotion, video, animation, rendering, react]
required_environment_variables: []
---

# Video Generator (Remotion)

Use this skill when the user wants a code-driven video workflow rather than manual editing.

## Core Rules

- Prefer Remotion for reproducible, code-driven video output.
- Keep compositions small, inspectable, and renderable.
- Use the Remotion MCP server or official docs before guessing APIs.
- Render only when the user asks for an export or when verification requires it.
- Use `references/quickstart.md` for setup and `references/rendering.md` for export commands.
- Check `references/gotchas.md` before making structural choices in a new video project.

## Default Workflow

1. Decide whether this is a new Remotion project or an existing app.
2. If new, scaffold a project with the commands in `references/quickstart.md`.
3. If existing, add Remotion incrementally instead of restructuring the whole app.
4. Build compositions first, then assets, then render/export.
5. Keep scene structure explicit and durations readable.
6. Verify with local preview before a full render when possible.

## Implementation Guidance

- Use React components for scenes and shared visual systems.
- Keep composition props explicit.
- Store public assets under `public/`.
- Prefer a few strong animated moments over many weak transitions.
- Keep typography and layout intentional; avoid slideshow aesthetics.

## Gotchas

- Treating Remotion like a slide deck instead of a timed composition system.
- Starting a full render before previewing the composition in Studio.
- Guessing component or CLI APIs instead of checking docs.
- Hiding assets or fonts in ad hoc locations that make the render non-reproducible.
- Overbuilding the scene graph when a smaller composition would be easier to debug and render.

## Deliverables

- Source composition code
- Clear render command
- Output path for rendered artifacts
- Any notes about assets, fonts, or API keys needed to reproduce the render
