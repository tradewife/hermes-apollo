---
name: free-code-provider-config
description: Use when adding, removing, or debugging providers in free-code, configuring CLAUDE_CONFIG_DIR for isolation, or bypassing Anthropic OAuth login with --bare mode.
---

# Free-Code Provider Configuration

## Overview
`free-code` is a telemetry-stripped fork of Claude Code installed at `~/free-code/`.
The wrapper `fc-env.sh` isolates config and loads provider keys automatically.

## Key Files

| File | Purpose |
|---|---|
| `~/free-code/cli-dev` | Compiled binary (entrypoint) |
| `~/free-code/fc-env.sh` | Wrapper script — sets env vars, execs cli-dev |
| `~/.local/bin/free-code` | Symlink → `~/free-code/fc-env.sh` |

## Wrapper (fc-env.sh)

The wrapper handles two things every invocation:
1. **Config isolation** — sets `CLAUDE_CONFIG_DIR=~/.freecode` so free-code doesn't touch `~/.claude/`
2. **Provider keys** — loads `~/.hermes/.env` for API keys (GLM, OpenRouter, etc.)

```bash
#!/usr/bin/env bash
export CLAUDE_CONFIG_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.freecode}"
if [[ -f "$HOME/.hermes/.env" ]]; then
    set -a; source "$HOME/.hermes/.env"; set +a
fi
SCRIPT_DIR="$(cd "$(dirname "$(readlink -f "${BASH_SOURCE[0]}")")" && pwd)"
exec "$SCRIPT_DIR/cli-dev" "$@"
```

## Bypassing Anthropic OAuth Login

The login screen ("Claude account with subscription / Anthropic Console / 3rd-party") can be skipped entirely:

- **`--bare` flag** — skips OAuth, keychain, and hooks. Auth is strictly `ANTHROPIC_API_KEY` or `apiKeyHelper` via `--settings`. 3P providers use their own credentials.
- **`--model <model>`** — use a non-Anthropic model to avoid needing Anthropic creds at all
- **Combined**: `free-code --bare --model claude-sonnet-4-6` or point to any provider model

**Important**: Never set `ANTHROPIC_API_KEY` if you're not using Anthropic. The wrapper loads provider keys from `~/.hermes/.env` — just ensure the correct env var for your provider is set there.

## Config Isolation

free-code reads `~/.claude/` by default (same as Claude Code). The wrapper sets:

```bash
export CLAUDE_CONFIG_DIR="$HOME/.freecode"
```

## Current Providers

| ID | Alias | Base URL | Key Env |
|---|---|---|---|
| anthropic | — | `api.anthropic.com` | `ANTHROPIC_API_KEY` |
| openrouter | — | `openrouter.ai/api/v1` | `OPENROUTER_API_KEY` |
| openai | — | `api.openai.com/v1` | `OPENAI_API_KEY` |
| glm | zai, z-ai, zhipu | `api.z.ai/api/coding/paas/v4` | `GLM_API_KEY` |
| opencode-zen | zen, opencode | `opencode.ai/zen/v1` | `OPENCODE_ZEN_API_KEY` |
| kilocode | kilo, kilo-code | `api.kilo.ai/api/gateway` | `KILOCODE_API_KEY` |

## Build & Run

```bash
cd ~/free-code
bun run build:dev:full   # builds ./cli-dev
# Symlink is already set up:
ln -sf ~/free-code/fc-env.sh ~/.local/bin/free-code
free-code
```

## Gotchas

- **Command name is `free-code`** (hyphenated), NOT `freecode` — symlink points to `fc-env.sh` wrapper
- `--bare` mode is the cleanest way to skip Anthropic login — no API key hacks needed
- The wrapper MUST use `readlink -f` to resolve the script directory for the binary path — relative paths break when called from other dirs
- Hermes source of truth for providers is `hermes_cli/auth.py` (ProviderConfig) and `hermes_cli/models.py` (_PROVIDER_MODEL_IDS)
- `fc-model.sh` no longer exists — model switching is done via `--model` flag directly
- If the binary says "cannot execute binary file", run it via the wrapper (bash), not directly
