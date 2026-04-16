---
name: senpi-waifu-telegram-command
description: Add a new interactive Telegram command to senpi-waifu with inline keyboard buttons, callback handlers, and optional Jido integration. Covers the full checklist — COMMANDS list, keyboard, callbacks, hermes subprocess calls.
tags: [senpi-waifu, telegram, command, callback, jido]
---

# Adding a New Telegram Command to Senpi-Waifu

## When to Use

Adding any new interactive command to the senpi-waifu Telegram bot —
especially commands with inline keyboard buttons, multi-step flows,
or integration with the Jido autonomous pipeline.

## Full Checklist (12 Steps)

Missing ANY step means the command won't appear or won't work.

### 1. `COMMANDS` list (`telegram_bot.py` ~line 57)

Add tuple: `("name", "Short desc", "Long desc for /help.")`

Without this, `/name` won't appear in Telegram's command menu.
BotFather registers these on bot startup via `set_my_commands`.

### 2. `cmd_*` function (`telegram_bot.py`)

```python
@authorized
async def cmd_suguru(update: Update, context: ContextTypes.DEFAULT_TYPE):
    """Suguru — Scan + Hermes decision layer."""
    if not update.message:
        return
    # ... build InlineKeyboardMarkup and reply
```

### 3. `CommandHandler` registration (`telegram_bot.py` startup)

```python
app.add_handler(CommandHandler("suguru", cmd_suguru))
```

### 4. Main menu `InlineKeyboardButton` (`cmd_start` keyboard)

If the command should be accessible from `/start` control panel,
add a button to the keyboard grid. Don't forget to remove/relocate
any existing button you're replacing.

### 5. Inline button callback handler (`_handle_action_callback`)

Every `callback_data="act:xxx"` needs a handler:
```python
elif action == "suguru_scan_menu":
    # show options
elif action == "suguru_scan_only":
    # run scan and display
```

### 6. `CallbackQueryHandler` routing

The central `CallbackQueryHandler(_handle_any_callback, pattern="^act:")`
already exists — just add `elif` branches in `_handle_action_callback`.

### 7. Settings in `RULES_KEY_MAP` (for `/set` integration)

```python
"suguru_enabled": ("jido", "suguru_enabled", lambda v: v.lower() in ("true", "1", "on")),
"suguru_maxlev": ("jido", "suguru_max_leverage", int),
```

### 8. Confirmation messages in `RULES_CONFIRM`

```python
"suguru_enabled": lambda v: f"Suguru in Jido {'enabled' if ... else 'disabled'}.",
```

### 9. Help text in `_build_set_help_text()`

Add the new keys to the `/set` help output.

### 10. Hermes subprocess calls — MUST pass model/provider

**CRITICAL:** The `hermes chat` subprocess does NOT use the bot's
configured model by default. You MUST pass `-m` and `--provider`:

```python
cmd = [hermes_bin, "chat", "-Q", "-q", prompt]
hermes_model = os.environ.get("HERMES_MODEL", "glm-5-turbo").strip()
hermes_provider = os.environ.get("HERMES_INFERENCE_PROVIDER", "zai").strip()
if hermes_model:
    cmd += ["-m", hermes_model]
if hermes_provider:
    cmd += ["--provider", hermes_provider]
```

Without this, hermes uses its default model which may be wrong
(e.g., `claude-opus-4.6` instead of `glm-5-turbo`), causing
HTTP 400 "Unknown Mode" errors.

### 11. Response deduplication

Hermes may repeat the first line of its output. The bot has a
Strategy 3 dedup that removes duplicate first non-empty lines.
If adding hermes output handling elsewhere, apply the same pattern:

```python
lines = output.split("\n")
non_empty = [(i, l.strip()) for i, l in enumerate(lines) if l.strip()]
if len(non_empty) >= 2 and non_empty[0][1] == non_empty[1][1]:
    lines.pop(non_empty[1][0])
    output = "\n".join(lines)
```

### 12. Jido integration (optional)

For features that can run autonomously in Jido mode:
- Add settings to `user-rules.json` under `jido` section (flat keys)
- Read from `user_rules.get("jido", {}).get("key", default)` 
- NOT nested `jido.suguru.key` (flat pattern)
- Gate execution with `suguru_enabled` check
- Auto-execute uses user's preconfigured risk settings

## Architecture: Manual vs Jido

```
MANUAL (/suguru):
  Scan Only → show candidates
  Hermes Scan → hermes decides → present to user → user approves/rejects

JIDO (suguru_enabled=true):
  Scan → hermes decides → auto-execute using user's risk settings
  (max_leverage, max_margin_pct, min_confidence)
```

## Gotchas

- **Railway CLI**: Must pass `cwd="/home/kt/senpi-waifu"` — no project link
  without it. Use `railway redeploy --service senpi-waifu --yes` to trigger.
- **BotFather cache**: After adding commands to COMMANDS list, users may
  need to type `/` to refresh the menu or re-open the chat.
- **`_answer_and_edit` vs `_safe_edit`**: Use `_answer_and_edit` for
  callback query responses (calls `query.answer()` then edits).
  Use `_safe_edit` for direct message edits without answering.
- **Hermes prompt**: End with "Return EXACTLY this JSON (no other text)"
  to minimize parsing issues. Also add "Return ONLY the JSON below."
