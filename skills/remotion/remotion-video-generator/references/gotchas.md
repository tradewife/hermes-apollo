# Remotion Gotchas

- Preview in Studio before a full render whenever possible.
- Keep fonts, images, audio, and other static assets in predictable paths.
- Prefer explicit composition props over hidden globals.
- When adding Remotion to an existing app, change as little of the surrounding app structure as possible.
- If output quality or render time becomes an issue, simplify the composition before adding more effects.
- If an API call or component name is uncertain, consult MCP or official docs instead of guessing.
- `npx create-video@latest` is interactive and will hang waiting for arrow-key input. For non-interactive scaffolding, create package.json, tsconfig.json, index.html, and src/ manually — it's faster and more reliable.
- If tsconfig.json sets `"rootDir": "./src"`, the root-level `remotion.config.ts` will fail TS6059. Remove `rootDir` or exclude the config file from the include array.
- `ffprobe` is not installed by default on all Linux environments. Don't assume it's available for post-render verification — trust Remotion's own frame count output instead.
- When using `spring()` for text animations, damping 22+ and stiffness 100-140 gives gentle, credible motion for technical/marketing content. Lower damping (15-18) is too bouncy for professional tone.
