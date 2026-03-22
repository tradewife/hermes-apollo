# Browser Use Setup Notes

## Installed Paths

- CLI: `~/.hermes/bin/browser-use`
- TUI: `~/.hermes/bin/browser-use-tui`
- Local direct wrapper: `~/.hermes/bin/browser-use-direct`

## Expected Machine State

- Browser Use CLI is installed separately, typically with `uv tool install browser-use`.
- `browser-use doctor` should pass the package and browser checks for local use.
- `BROWSER_USE_API_KEY` is optional for local-only workflows.

## What Works Without Extra Keys

- local browser commands like `open`, `state`, `click`, `input`, `wait`, `get`, and `screenshot`

For local-only Hermes usage, prefer the direct wrapper for browser interaction:

`~/.hermes/bin/browser-use-direct`

## What Needs More Setup

- remote browser mode
- cloud tasks and sessions
- some agent-style `run` workflows depending on model/provider configuration

## Relevant Env Vars

- `BROWSER_USE_API_KEY`: Browser Use cloud and remote features
- model/provider keys: required for model-backed Browser Use flows when not using direct manual CLI commands
