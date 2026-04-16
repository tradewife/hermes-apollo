# Remotion Quickstart

## New Project

```bash
npx create-video@latest
cd my-video
npm install
npm run dev
```

## Existing Project

```bash
npm install remotion @remotion/cli
npx remotion studio
```

## Optional Project-Local Skills

Inside a Remotion project, you can install the official Remotion agent skills:

```bash
npx skills add remotion-dev/skills
```

## MCP

Hermes Apollo can use the configured `remotion-documentation` MCP server for live documentation lookups.
