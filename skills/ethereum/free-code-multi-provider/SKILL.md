---
name: free-code-multi-provider
description: Use when patching, building, or switching providers on the free-code Claude Code fork (paoloanzn/free-code). Covers multi-provider support via Anthropic-compatible endpoints, env var injection, and custom model picker entries.
---

# Free-Code Multi-Provider Support

## What It Does
Routes the Claude Code fork through non-Anthropic providers (z.ai, OpenRouter) using their Anthropic-compatible API endpoints. Adds custom models to the `/model` picker.

## Architecture

### Key Discovery: No Client Patches Needed for Routing
The Anthropic SDK constructor reads `ANTHROPIC_BASE_URL` from env automatically:
```js
constructor({baseURL = env("ANTHROPIC_BASE_URL"), apiKey = env("ANTHROPIC_API_KEY")})
```
Just set these env vars in the wrapper — no source changes required for basic provider routing.

### Two Anthropic-Compatible Endpoints
1. **z.ai** — `https://api.z.ai/api/anthropic` (NOT `/api/coding/paas/v4` which is OpenAI-compatible only)
2. **OpenRouter** — `https://openrouter.ai/api/v1` (proxies to GPT, Gemini, DeepSeek, Claude, etc.)

### The One Source Patch Required (for /model picker)
`src/utils/model/modelOptions.ts` — `getModelOptions()` function.
Patch after the `additionalModelOptionsCache` loop to read `FREE_CODE_MODELS` env var (JSON array of `{value, label, description}`):

```typescript
  // Free-code: add multiple custom models from FREE_CODE_MODELS env var
  const freeCodeModels = process.env.FREE_CODE_MODELS
  if (freeCodeModels) {
    try {
      const parsed = JSON.parse(freeCodeModels)
      if (Array.isArray(parsed)) {
        for (const opt of parsed) {
          if (opt.value && !options.some(existing => existing.value === opt.value)) {
            options.push({
              value: opt.value,
              label: opt.label ?? opt.value,
              description: opt.description ?? `Custom model (${opt.value})`,
            })
          }
        }
      }
    } catch { /* ignore bad JSON */ }
  }
```

## Files
- **Wrapper**: `~/free-code/fc-env.sh` (symlinked as `~/.local/bin/free-code`)
- **Source patch**: `~/free-code/src/utils/model/modelOptions.ts`
- **Binary**: `~/free-code/cli-dev`
- **Config isolation**: `~/.freecode/` (CLAUDE_CONFIG_DIR)
- **Keys**: sourced from `~/.hermes/.env`

## Env Vars Set by Wrapper
- `CLAUDE_CONFIG_DIR=~/.freecode` (isolated from real Claude Code)
- `ANTHROPIC_BASE_URL` → provider endpoint
- `ANTHROPIC_API_KEY` → provider API key
- `ANTHROPIC_MODEL` → model string
- `ANTHROPIC_SMALL_FAST_MODEL` → same model
- `ANTHROPIC_CUSTOM_MODEL_OPTION` → bypasses Anthropic model allowlist
- `FREE_CODE_MODELS` → JSON array for `/model` picker entries
- `DISABLE_TELEMETRY=1`
- `ANTHROPIC_DISABLE_NONESSENTIAL_TRAFFIC=1`

## Usage
```
free-code                              # zai GLM-5-Turbo (default)
free-code zai                          # same
free-code openrouter:anthropic/claude-sonnet-4-6
free-code openrouter:openai/gpt-4o
free-code openrouter:google/gemini-2.5-pro
free-code openrouter:deepseek/deepseek-chat-v3-0324
free-code list                         # show providers + key status + model picker
```

In-session: `/model` shows all custom models from `FREE_CODE_MODELS`.

## Rebuild After Source Changes
```bash
cd ~/free-code
bun run build          # produces ./cli
# Swap binary (can't overwrite running binary):
mv cli-dev cli-dev.old
mv cli cli-dev
chmod +x cli-dev
```

Requires **Bun >= 1.3.11** (`--bytecode --format esm` support).

## Gotchas
- z.ai Anthropic endpoint is `https://api.z.ai/api/anthropic` (discovered from user's `~/.claude/settings.json`)
- The `/api/coding/paas/v4` endpoint is OpenAI-compatible ONLY — won't work with Anthropic SDK
- `--bare` flag is critical: skips OAuth, keychain, all Anthropic auth flows
- `ANTHROPIC_CUSTOM_MODEL_OPTION` bypasses the Anthropic model allowlist validation in `validateModel.ts`
- Can't `cp` over a running binary — use `mv` to swap (old process keeps the deleted inode)
- When switching models via `/model` picker, the base URL doesn't change — pick provider at launch, model at runtime
- OpenRouter model IDs use slash notation: `openai/gpt-4o`, `anthropic/claude-sonnet-4-6`
- z.ai model casing matters: `GLM-5-Turbo` not `glm-5-turbo`
- The wrapper must `shift` after consuming the provider arg so remaining args pass through to cli-dev
