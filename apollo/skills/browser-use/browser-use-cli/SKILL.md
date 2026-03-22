---
name: browser-use-cli
description: Use when direct browser automation is needed from the terminal: opening pages, inspecting DOM elements by index, clicking, typing, screenshots, cookies, waits, local browser sessions, or Browser Use agent runs.
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [browser-use, browser-automation, cli, web, scraping]
---

# Browser Use CLI

Use this skill when Hermes needs Browser Use specifically rather than the built-in browser tool.

Installed binaries:

`~/.hermes/bin/browser-use`
`~/.hermes/bin/browser-use-direct`

## Use Cases

- persistent local browser sessions from the terminal
- DOM inspection with numbered element indices
- scripted browser actions like `open`, `state`, `click`, `input`, `screenshot`, `cookies`, and `wait`
- Browser Use specific features such as `run`, `task`, `session`, `tunnel`, or `--mcp`

## Core Rules

- Prefer the built-in Hermes browser tool for ordinary browsing unless Browser Use is specifically needed.
- For local-only browser control, prefer `~/.hermes/bin/browser-use-direct`.
- Use `~/.hermes/bin/browser-use` for official setup, doctor, install, cloud, or non-direct commands.
- Read `references/commands.md` for command patterns.
- Read `references/setup.md` before using `run`, remote mode, or cloud features.
- Read `references/gotchas.md` before assuming Browser Use is broken.

## Default Workflow

1. For local-only browser control, start with `~/.hermes/bin/browser-use-direct open <url>`.
2. Use `state` to inspect the current page and get actionable element indices.
3. Interact with the page using index-based commands.
4. Use `wait` and `screenshot` for verification instead of guessing.
5. Use `run` only when model-backed Browser Use behavior is actually needed.
