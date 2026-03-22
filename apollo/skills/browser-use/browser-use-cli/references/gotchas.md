# Browser Use Gotchas

- The official `browser-use install` command tries to install Linux system dependencies with `sudo`. In restricted environments this can fail even when the CLI itself is installed correctly.
- On locked-down Linux environments, Chromium can often still be installed by running Playwright without the `--with-deps` step.
- The official CLI also starts a local session server. For Hermes local-only workflows, `browser-use-direct` is the safer entrypoint.
- `doctor` may still report missing API key or Cloudflared; that does not block local CLI browser control.
- If PATH differs inside a Hermes session, use the absolute binary path instead of plain `browser-use`.
- Use `state` before `click` or `input`; Browser Use is designed around numbered indices.
