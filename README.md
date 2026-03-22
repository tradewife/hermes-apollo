

# Hermes Apollo

Hermes Apollo is an opinionated distribution of [NousResearch/hermes-agent](https://github.com/NousResearch/hermes-agent) tuned for competitive programming, rigorous software work, Remotion-based video generation, and local Browser Use workflows.

This repo is not a dump of a live `~/.hermes` directory. It keeps upstream Hermes intact and layers Apollo defaults on top through versioned files and a small installer.

## What Apollo Adds

- A global Apollo identity via `SOUL.md`
- Config overrides for a more technical default setup
- Apollo skills for:
  - competitive programming
  - Remotion video generation
  - Browser Use CLI workflows
- A local Browser Use wrapper for direct, local-first usage

## What This Repo Is

- Upstream Hermes source code plus an Apollo distribution layer
- A reproducible way to apply Apollo defaults into `~/.hermes`
- A cleaner upgrade path than hand-editing a live install

## What This Repo Is Not

- A snapshot of your runtime sessions, memories, or secrets
- A replacement for upstream Hermes documentation
- A custom fork that rewrites core Hermes behavior everywhere

## Apollo Layer

The Apollo-specific files live here:

```text
apollo/
  defaults/
    SOUL.md
    config-overrides.yaml
    bin/browser-use-direct
  skills/
    software-development/competitive-programmer/
    remotion/remotion-video-generator/
    browser-use/browser-use-cli/
scripts/
  install-apollo.sh
```

## Install Apollo Over An Existing Hermes Setup

If you already have Hermes installed and just want the Apollo behavior:

```bash
git clone https://github.com/tradewife/hermes-apollo.git
cd hermes-apollo
bash scripts/install-apollo.sh
```

That installs Apollo defaults into `~/.hermes`.

## What The Installer Changes

`scripts/install-apollo.sh` does the following:

- writes `~/.hermes/SOUL.md`
- deep-merges Apollo config overrides into `~/.hermes/config.yaml`
- copies Apollo skills into `~/.hermes/skills`
- installs `~/.hermes/bin/browser-use-direct`

## What The Installer Does Not Touch

- `~/.hermes/.env`
- `~/.hermes/auth.json`
- sessions
- memories
- runtime state files

## Fresh Install

If you do not have Hermes installed yet, install Hermes first, then apply Apollo:

```bash
git clone https://github.com/tradewife/hermes-apollo.git
cd hermes-apollo
bash setup-hermes.sh
bash scripts/install-apollo.sh
```

If you already manage Hermes another way, that is fine too. Apollo only needs a working Hermes install plus a writable `~/.hermes`.

## Browser Use

Apollo includes a Browser Use skill and a local wrapper entrypoint:

```bash
~/.hermes/bin/browser-use-direct
```

For local-only Browser Use workflows, Apollo prefers that wrapper over the standard Browser Use session-server flow.

Browser Use itself is still installed separately. A typical setup is:

```bash
uv tool install browser-use
~/.hermes/bin/browser-use doctor
```

In restricted Linux environments, the official `browser-use install` command may fail on the `sudo` dependency step. In those cases, Playwright-only browser installation may still work.

## Remotion

Apollo includes the `remotion-video-generator` skill and a configured `remotion-documentation` MCP server entry in the Apollo config overrides.

Apollo does not install Remotion into every project automatically. Remotion remains a per-project dependency when you actually build video pipelines.

## Updating Apollo

To reapply Apollo defaults after changing the Apollo layer:

```bash
bash scripts/install-apollo.sh
```

This is safe to rerun. It reapplies Apollo defaults without replacing your `.env`, auth, or runtime state.

## Tracking Upstream Hermes

Apollo is designed to keep upstream Hermes easy to update.

Safe pattern:

```bash
git pull --rebase upstream main
bash scripts/install-apollo.sh
```

The important distinction is:

- upstream Hermes code lives in the repo
- Apollo customization lives in `apollo/`
- live runtime state lives in `~/.hermes`

That separation is the whole point of this fork.

## Upstream Docs

For Hermes core features, commands, and architecture, use the upstream documentation:

- https://hermes-agent.nousresearch.com/docs/
- https://github.com/NousResearch/hermes-agent

## License

This repo inherits the upstream Hermes Agent license. See [LICENSE](LICENSE).
