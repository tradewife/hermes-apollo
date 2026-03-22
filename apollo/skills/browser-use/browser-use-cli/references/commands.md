# Browser Use Commands

Installed binary:

`~/.hermes/bin/browser-use`

Local-first direct wrapper:

`~/.hermes/bin/browser-use-direct`

## Basic Flow

```bash
~/.hermes/bin/browser-use-direct open https://example.com
~/.hermes/bin/browser-use-direct state
~/.hermes/bin/browser-use-direct click 5
~/.hermes/bin/browser-use-direct input 3 "john@example.com"
~/.hermes/bin/browser-use-direct screenshot output.png
~/.hermes/bin/browser-use-direct close
```

## Useful Commands

- `open <url>`: navigate to a URL
- `state`: inspect current page and numbered elements
- `click <index>`: click element by index
- `input <index> "text"`: focus and type into an element
- `keys "Enter"`: send keyboard input
- `wait selector "css"`: wait for an element state
- `get html`: inspect page HTML
- `cookies get`: inspect cookies
- `python "..."`: run persistent Python inside the session

## Use The Official CLI For

- `doctor`
- `install`
- `setup`
- `run`
- `task`
- `session`
- `tunnel`
- `server`

## Browser Modes

```bash
~/.hermes/bin/browser-use open https://example.com
~/.hermes/bin/browser-use --headed open https://example.com
~/.hermes/bin/browser-use --profile "Default" open https://gmail.com
```
