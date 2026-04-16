---
name: senpi-waifu-telegram-config-gates
description: Add user-configurable parameters to senpi-waifu via Telegram commands. Three-command pattern (view/set/reset) with layered config, validation, and git sync.
tags: [senpi-waifu, telegram, config, safety-gates, user-sovereignty]
---

# Adding Telegram-Controllable Config to Senpi-Waifu

## When to Use

When adding user-configurable parameters that can be changed from Telegram
without going dev-mode. Used for safety gates, thresholds, scanner params, etc.

## Architecture: Three-Layer Config

```
Layer 1: Hardcoded defaults (DEFAULT_* constants in senpi_common.py)
Layer 2: System config (risk-regime.json globalGuardrails)
Layer 3: User overrides (user-rules.json, written by Telegram /cmd_set)
```

Last write wins. User overrides in `user-rules.json` are the user sovereignty layer.

## Three-Command Telegram Pattern

Mirror the existing `/rules` + `/rules_set` pattern:

1. **`/gates`** — View all params with current values + show overrides vs defaults
2. **`/gates_set <key> <value>`** — Modify with validation
3. **`/gates_reset`** — Remove all overrides, restore defaults

## Files to Touch (5)

### 1. `scripts/lib/senpi_common.py` — Config Layering

Add/update the loader to merge user overrides:

```python
def load_global_guardrails() -> dict:
    # Layer 1: defaults
    merged = dict(DEFAULT_GLOBAL_GUARDRAILS)
    # Layer 2: system config
    merged.update({k: v for k, v in guardrails.items() if v is not None})
    # Layer 3: user overrides from user-rules.json
    user_gates = load_json(CONFIG_DIR / "user-rules.json", default={}).get("safety_gates", {})
    for key in OVERRIDEABLE_FIELDS:
        if key in user_gates and user_gates[key] is not None:
            merged[key] = user_gates[key]
    return merged
```

For per-key overrides (like per-scanner scores):

```python
def load_user_min_scores() -> dict | None:
    """Returns None if no user overrides exist."""
    scores = user_gates.get("minScores")
    if scores and isinstance(scores, dict):
        return {k: int(v) for k, v in scores.items() if isinstance(v, (int, float))}
    return None
```

### 2. `waifu_cli/safety.py` — Gate Enforcement

Replace hardcoded values with merged config:

```python
# CORRECT: merge user overrides onto defaults
min_scores = dict(DEFAULT_MIN_SCORES)
user_scores = load_user_min_scores()
if user_scores:
    min_scores.update(user_scores)
```

### 3. `dashboard/telegram_bot.py` — Three Commands

Key structures:

```python
# Key map: telegram_key -> (json_section, json_field, type_converter)
GATES_KEY_MAP = {
    "max_positions":  ("safety_gates", "maxPositionsTotal", int),
    "score_orca":     ("safety_gates:minScores", "orca", int),  # nested path
}

# Bounds validation
GATES_BOUNDS = {"maxPositionsTotal": (1, 10, "1-10 positions")}
```

Nested path handling for writes:

```python
if ":" in section_path:
    parts = section_path.split(":")
    target = rules
    for part in parts:
        if part not in target or not isinstance(target[part], dict):
            target[part] = {}
        target = target[part]
    target[field] = converted
```

Each command must:
- Be decorated with `@authorized`
- Write to `user-rules.json` atomically (write .tmp, rename)
- Git sync after write
- Register handler: `app.add_handler(CommandHandler("gates", cmd_gates))`
- Add to `COMMANDS` list for BotFather menu + `/help`

### 4. `waifu_cli/commands/evaluate.py` — Consistency

If evaluator has secondary checks, ensure they read from the same merged source.
Use `sc.DEFAULT_MIN_SCORES` instead of duplicating dicts.

### 5. Bot Registration

```python
app.add_handler(CommandHandler("gates", cmd_gates))
app.add_handler(CommandHandler("gates_set", cmd_gates_set))
app.add_handler(CommandHandler("gates_reset", cmd_gates_reset))
```

## Critical Pitfalls

### BUG: `or` Does Not Merge

**WRONG:**
```python
min_scores = load_user_min_scores() or dict(DEFAULT_MIN_SCORES)
# If user sets {orca: 8}, this returns ONLY {orca: 8} — loses mantis, fox, komodo, etc!
```

**CORRECT:**
```python
min_scores = dict(DEFAULT_MIN_SCORES)
user_scores = load_user_min_scores()
if user_scores:
    min_scores.update(user_scores)  # user overrides on top of defaults
```

The `or` operator returns the first truthy value. A partial dict is truthy,
so defaults never fire. Always use explicit merge.

### Validation: Cross-Field Checks

When fields reference each other (min/max leverage), validate against current
values and reject if inconsistent with error message telling user which to set first.

### Storage: Reuse user-rules.json

Don't create new config files. `user-rules.json` is already git-synced, already
has the write+sync plumbing in telegram_bot.py. Add a new top-level section
(e.g. `"safety_gates": {...}`).

### Testing: Verify Cleanup

Tests that write to `user-rules.json` must clean up afterward. Verify the file
is in original state after tests pass.
