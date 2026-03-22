#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APOLLO_ROOT="$REPO_ROOT/apollo"
TARGET_HOME="${HERMES_HOME:-$HOME/.hermes}"

mkdir -p "$TARGET_HOME" "$TARGET_HOME/skills" "$TARGET_HOME/bin"

cp "$APOLLO_ROOT/defaults/SOUL.md" "$TARGET_HOME/SOUL.md"
cp "$APOLLO_ROOT/defaults/bin/browser-use-direct" "$TARGET_HOME/bin/browser-use-direct"
chmod +x "$TARGET_HOME/bin/browser-use-direct"
cp -R "$APOLLO_ROOT/skills/." "$TARGET_HOME/skills/"

python3 - "$TARGET_HOME/config.yaml" "$APOLLO_ROOT/defaults/config-overrides.yaml" <<'PY'
from __future__ import annotations

import sys
from pathlib import Path

import yaml


def deep_merge(base, override):
    if isinstance(base, dict) and isinstance(override, dict):
        merged = dict(base)
        for key, value in override.items():
            if key in merged:
                merged[key] = deep_merge(merged[key], value)
            else:
                merged[key] = value
        return merged
    return override


config_path = Path(sys.argv[1])
override_path = Path(sys.argv[2])

current = {}
if config_path.exists():
    current = yaml.safe_load(config_path.read_text()) or {}

overrides = yaml.safe_load(override_path.read_text()) or {}
merged = deep_merge(current, overrides)

config_path.write_text(yaml.safe_dump(merged, sort_keys=False), encoding="utf-8")
PY

cat <<EOF
Apollo defaults installed into:
  $TARGET_HOME

Applied:
  - SOUL.md
  - config overrides
  - Apollo skills
  - browser-use-direct wrapper

Not touched:
  - .env
  - auth.json
  - runtime state files
EOF
