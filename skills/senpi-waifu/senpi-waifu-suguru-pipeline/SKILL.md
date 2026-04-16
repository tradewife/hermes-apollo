---
name: senpi-waifu-suguru-pipeline
description: "Use when adding hermes-driven decision gating to any senpi-waifu scanner/cron job — scan → hermes approve/reject → execute. Covers pipeline architecture, hermes prompt templates, Telegram menu integration, Jido auto-execute integration, /set settings, fallback logic, and RISK_OFF gate bypassing."
metadata:
  hermes:
    requires_toolsets: [terminal, file]
---

# SUGURU Pipeline — Hermes Decision Layer

## When to Use
- Adding a **human-level judgment step** to any automated trading signal pipeline
- Replacing hard-coded gates (score thresholds, scanner confluence filters) with hermes evaluation
- Any cron job that needs **scan → decide → execute** architecture

## Architecture

```
Step 1: scan-only  →  candidates.json   (no gate, score all)
Step 2: suguru_decide.py  →  approved.json    (hermes APPROVE/REJECT/DEFER)
Step 3: --execute-approved  →  execute only hermes-approved trades
```

**CRITICAL ARCHITECTURE — TWO MODES**:

| Mode | Where | Flow |
|------|-------|------|
| **Manual** | `/suguru` command | scan → hermes recommends → **user approves/rejects/chats** |
| **Jido Auto** | Jido cron (opt-in) | scan → hermes decides → **auto-executes** using user's risk settings |

Worker.py `job_suguru()` runs scan + hermes decide (NOT execute). Auto-execute lives ONLY in `jido.py` `_run_suguru_pipeline()`.

## Key Files

| File | Purpose |
|------|---------|
| `scripts/vps/suguru.py` | Main scanner with `--scan-only` and `--execute-approved` modes |
| `scripts/vps/suguru_decide.py` | Calls hermes to evaluate candidates → writes recommendation/approved |
| `outputs/suguru-candidates.json` | All scored candidates (input to decide step) |
| `outputs/suguru-recommendation.json` | Hermes recommendation for manual approval (TRADE/REJECT + reasoning) |
| `outputs/suguru-approved.json` | Hermes-approved trades for Jido auto-execute |
| `dashboard/telegram_bot.py` | `/suguru` command + callback handlers |
| `waifu_cli/commands/jido.py` | `_run_suguru_pipeline()` for Jido auto-execute |

## Pattern: --scan-only Mode

The scanner must support **writing candidates to JSON without executing trades**:

```python
SCAN_ONLY = "--scan-only" in sys.argv

# ... scoring logic writes to suguru-candidates.json ...

if SCAN_ONLY:
    save_json(OUTPUTS_DIR / "suguru-candidates.json", output)
    log("scan-only mode — candidates written, exiting")
    return  # DO NOT execute trades
```

## Pattern: --execute-approved Mode

Read hermes-approved trades and execute:

```python
EXECUTE_APPROVED = "--execute-approved" in sys.argv

if EXECUTE_APPROVED:
    approved_data = load_json(OUTPUTS_DIR / "suguru-approved.json")
    if not approved_data or not approved_data.get("approved"):
        return
    for trade in approved_data["approved"]:
        # Rebuild full trade params and execute
        execute_trade(trade, strategy_id, strategy_key)
    return
```

## Pattern: Hermes Decision Layer

`suguru_decide.py` sends candidates to hermes via subprocess and writes results:

```python
prompt = build_prompt(candidates, regime, brain_mode, equity)
proc = subprocess.run(
    ["hermes", "agent", "chat", "--provider", "openrouter", "--model", "google/gemini-3.1-flash-lite-preview"],
    input=prompt, capture_output=True, text=True, timeout=90, env=env
)
response = proc.stdout.strip()
approved = parse_response(response)
save_json(OUTPUTS_DIR / "suguru-approved.json", {"approved": approved, ...})
```

### Prompt Template (what hermes sees)

```
You are SUGURU, a Hyperliquid perps trading decision engine.
...

CANDIDATES:
1. LONG BTC | GSS=0.50 | px=68131 | lev=9x | ...
2. SHORT ETH | GSS=0.45 | px=2107 | lev=8x | ...

For each candidate output one line:
APPROVE|REJECT|DEFER <ASSET> <DIRECTION> "<reason>"

Rules:
- APPROVE: high conviction, good timing, aligned with macro
- REJECT: clear risk, poor timing, conflicting signals  
- DEFER: borderline, need more data, watch for setup
```

### Fallback Logic

If hermes is unavailable (exit code ≠ 0), approve the top GSS candidate:

```python
if proc.returncode != 0:
    top = candidates[0]  # already sorted by GSS desc
    save_json(APPROVED_FILE, {
        "approved": [{"asset": top["asset"], ...}],
        "summary": "hermes unavailable, approved top GSS"
    })
```

## Pattern: RISK_OFF Gate Bypass

The `check_preconditions()` RISK_OFF gate must allow scan-only and execute-approved to bypass:

```python
# WRONG — blocks scan-only:
if risk_mode == "RISK_OFF" and not DRY_RUN:
    raise SystemExit("RISK_OFF")

# CORRECT — scan and execute-approved can run in RISK_OFF:
if risk_mode == "RISK_OFF" and not (DRY_RUN or SCAN_ONLY or EXECUTE_APPROVED):
    send_telegram("? SUGURU: RISK_OFF regime - no new entries.")
    raise SystemExit("RISK_OFF")
elif risk_mode == "RISK_OFF" and (DRY_RUN or SCAN_ONLY):
    log("RISK_OFF bypassed (scan/dry-run mode)")
    risk_mode = "BASELINE"  # Use BASELINE params for scan
elif risk_mode == "RISK_OFF" and EXECUTE_APPROVED:
    log("RISK_OFF — executing hermes-approved trades only")
```

## Pattern: Worker.py Pipeline (NO auto-execute)

```python
def job_suguru():
    """Suguru scan + hermes deliberation — writes recommendation for user approval."""
    # Step 1: Scan — write candidates to suguru-candidates.json
    print("[suguru] Step 1/2: scanning...")
    run_py("scripts/vps/suguru.py", ["--scan-only"])

    # Step 2: Decide — hermes evaluates candidates → suguru-recommendation.json
    print("[suguru] Step 2/2: hermes deliberating...")
    run_py("scripts/vps/suguru_decide.py")

    # NO Step 3 — execution happens either:
    #   - User approval via Telegram (/suguru → Hermes Scan → Approve)
    #   - Jido auto-execute when suguru_enabled=true
```

## Gotchas

1. **MANUAL vs AUTO must be architecturally separate**: Manual `/suguru` → user approves. Jido → auto-executes with user's risk settings. Do NOT put auto-execute in worker.py `job_suguru()` — it only runs scan + hermes decide.

2. **recommendation vs approved files**: Manual flow reads `suguru-recommendation.json`. Jido auto flow reads the same file but auto-executes. Don't confuse with `suguru-approved.json` (legacy, no longer used).

3. **SENPI_WAIFU_DIR path**: On Railway it defaults to `/app`. On local it defaults to `/app` too unless overridden. `suguru_decide.py` must use `STATE_DIR` (derived from env var) consistently. Local testing: `SENPI_WAIFU_DIR=/home/kt/senpi-waifu python3 scripts/vps/suguru_decide.py`

4. **RISK_OFF gate must allow pipeline modes**: Scan-only must ALWAYS be able to run (even in RISK_OFF) because hermes needs fresh data to make decisions. Only the actual trade execution should be gated. Check ALL gate conditions when adding new flags (`SCAN_ONLY`, `EXECUTE_APPROVED`).

5. **Hermes timeout**: The hermes binary can take 60-90s. Use `timeout=120` on subprocess and implement fallback for hermes-down scenarios (approve top GSS candidate with low confidence).

6. **JSON parsing from hermes**: Response format may vary. Parse with regex fallback: `re.search(r'\{[\s\S]*"recommendation"[\s\S]*\}', output)` then `json.loads()`.

7. **Heartbeat/stale key**: When renaming a cron job, update: worker.py function name + scheduler ID + print statements + `record_heartbeat()` key + `acquire_lock()` key + DSL file patterns + debug.py `VALID_SCANNERS` list + AGENTS.md docs.

8. **Hard gate removal**: When converting from hard gates to hermes evaluation, keep the scoring logic (it provides data for hermes) but remove `continue` statements that filter candidates. ALL candidates should be sent to hermes for evaluation.

9. **New command won't appear until bot restart**: The COMMANDS list registers with BotFather via `set_my_commands` on startup. After adding a new command, the bot MUST restart (redeploy on Railway). Users may need to re-open the chat or type `/` to refresh.

10. **Settings structure is FLAT, not nested**: RULES_KEY_MAP writes `rules[section][field]`. For suguru settings under jido: use field names like `suguru_enabled`, `suguru_max_leverage` directly under the `jido` section — NOT nested `jido.suguru.enabled`.

11. **Jido suguru is ADDITIVE**: Suguru in Jido runs alongside the existing scanner pipeline, not replacing it. Don't modify Jido's existing signal processing — suguru is an additional signal source.


## Checklist: Adding a New Command to Telegram Bot

When adding any new feature (command + button + callbacks), you MUST touch ALL of these places. Missing even one means it won't appear.

```
dashboard/telegram_bot.py:
  ① COMMANDS list (~line 57)        — add (cmd, short, description) tuple
                                      → BotFather registers this on bot restart
  ② cmd_start keyboard (~line 338)  — add InlineKeyboardButton in the grid
  ③ async def cmd_xxx()             — the command handler function (decorated @authorized)
  ④ app.add_handler(CommandHandler("xxx", cmd_xxx))  — register in bot setup (~line 2330)
  ⑤ _handle_action_callback         — add elif action == "xxx_..." handlers for inline buttons

worker.py (if cron-backed):
  ⑥ def job_xxx()                   — the cron job function

Gotchas:
  - COMMANDS list must come BEFORE the command handler registration
  - BotFather menu only refreshes on bot restart (set_my_commands on startup)
  - Users may need to clear Telegram cache (/start again or re-open chat)
  - Callback data format: "act:action_name" — prefix with "act:"
  - Long operations (>3s): use run_script_async + edit message with progress
  - @authorized decorator is REQUIRED — missing it = silent failure for non-admin users
```

## Pattern: Manual `/suguru` Command (user approves)

### User Flow

```
/suguru (or ⚡ Suguru button) → shows regime + Scan Only / Hermes Scan buttons
  ↓
Scan Only → suguru.py --scan-only → shows top 5 candidates (no execution)
  ↓
Hermes Scan → scan → suguru_decide.py → recommendation with Approve/Reject/Chat buttons
  ↓
Approve → suguru.py --execute-approved → trade executed
Reject → cancelled
Chat → next message goes to Strategic Brain for customization
```

### Implementation: `cmd_suguru` function + keyboard button

```python
@authorized
async def cmd_suguru(update: Update, context: ContextTypes.DEFAULT_TYPE):
    regime = load_json(CONFIG_DIR / "risk-regime.json")
    mode = regime.get("riskMode", "UNKNOWN")
    keyboard = InlineKeyboardMarkup([
        [
            InlineKeyboardButton("🔍 Scan Only", callback_data="act:suguru_scan_only"),
            InlineKeyboardButton("🧠 Hermes Scan", callback_data="act:suguru_hermes_scan"),
        ],
        [InlineKeyboardButton("❌ Cancel", callback_data="act:suguru_cancel")],
    ])
    await update.message.reply_text(
        f"⚡ *Suguru — Elite Scanner*\n\n"
        f"Regime: *{mode}*\n\n"
        f"🔍 *Scan Only* — show scored candidates\n"
        f"🧠 *Hermes Scan* — scan + AI deliberation → trade recommendation",
        parse_mode="Markdown", reply_markup=keyboard,
    )
```

Also add a button in `cmd_start` keyboard and a `suguru_scan_menu` callback for that button.

### Implementation: Callback handlers

Add these `elif` blocks in `_handle_action_callback`:

- `suguru_scan_menu` — shows Scan Only / Hermes Scan buttons (for the inline button click)
- `suguru_scan_only` — runs scan, shows top 5 candidates formatted
- `suguru_hermes_scan` — runs scan → hermes decides → shows recommendation with Approve/Reject/Chat buttons
- `suguru_approve` — runs `--execute-approved`, shows result
- `suguru_reject` — edits message to "rejected"
- `suguru_chat` — tells user next message goes to brain
- `suguru_cancel` — edits message to "cancelled"

### Implementation: `suguru_decide.py` recommendation output

For manual flow, writes `suguru-recommendation.json`:

```json
{
  "recommendation": "TRADE|REJECT",
  "asset": "BTC", "direction": "LONG", "leverage": 8,
  "trade_params": { "entry_price": 85000, "stop_price": 83500, "tp1_price": 87000, ... },
  "reasoning": "2-3 sentence explanation for the user",
  "confidence": 0.85,
  "source": "hermes",
  "candidates_count": 5
}
```

### Implementation: Main menu button

Add Suguru button to `cmd_start` keyboard grid (replace or add alongside existing buttons):

```python
[
    InlineKeyboardButton("⚡ Jido", callback_data="act:jido_prompt"),
    InlineKeyboardButton("⚡ Suguru", callback_data="act:suguru_scan_menu"),
    InlineKeyboardButton("🐋 Whale", callback_data="act:whale_run"),
],
```

### Implementation: BotFather command registration

Add to `COMMANDS` list (so BotFather registers it on restart):

```python
("suguru", "Elite scanner", "Scan markets + AI deliberation → trade recommendation."),
```

Register handler: `app.add_handler(CommandHandler("suguru", cmd_suguru))`


## Pattern: Jido Auto-Execute (opt-in, uses user's risk settings)

Suguru runs as an **optional mode within Jido** — it ADDS to the existing scanner pipeline, not replaces it.

### User Settings (`/set` commands)

Add to `RULES_KEY_MAP` in telegram_bot.py:

```python
"suguru_enabled": ("jido", "suguru_enabled", lambda v: v.lower() in ("true", "1", "on")),
"suguru_maxlev": ("jido", "suguru_max_leverage", int),
"suguru_maxmargin": ("jido", "suguru_max_margin_pct", float),
"suguru_minconf": ("jido", "suguru_min_confidence", float),
```

Add matching `RULES_CONFIRMATIONS` entries.
Add to `_build_set_help_text()` under "Suguru (in Jido)" section.

### Jido Pipeline (`jido.py` — `_run` function)

Add at end of `_run()`, after processing scanner decisions:

```python
suguru_enabled = bool(user_rules.get("jido", {}).get("suguru_enabled", False))
if suguru_enabled:
    _run_suguru_pipeline(dry_run, user_rules)
```

The `_run_suguru_pipeline(dry_run, user_rules)` function:
1. Runs `suguru.py --scan-only`
2. Runs `suguru_decide.py` (hermes deliberation)
3. Reads `suguru-recommendation.json`
4. If TRADE + confidence >= min_confidence: auto-executes using user's risk settings
5. Applies 7-10x leverage guardrails
6. Records trade with `entrySource="jido-suguru"`
7. Sends Telegram notification with hermes reasoning

### Key: Settings are FLAT under jido section

`rules["jido"]["suguru_enabled"]` (flat), NOT `rules["jido"]["suguru"]["enabled"]` (nested). This matches the existing RULES_KEY_MAP pattern.

## Gotchas

1. **SENPI_WAIFU_DIR path**: On Railway it defaults to `/app`. On local it defaults to `/app` too unless overridden. `suguru_decide.py` must use `STATE_DIR` (derived from env var) consistently. Local testing: `SENPI_WAIFU_DIR=/home/kt/senpi-waifu python3 scripts/vps/suguru_decide.py`

2. **RISK_OFF gate must allow pipeline modes**: Scan-only must ALWAYS be able to run (even in RISK_OFF) because hermes needs fresh data to make decisions. Only the actual trade execution (step 3) should be gated. Check ALL gate conditions when adding new flags (`SCAN_ONLY`, `EXECUTE_APPROVED`).

3. **Hermes timeout**: `hermes agent chat` can take 60-90s. Use `timeout=90` on subprocess and implement fallback for hermes-down scenarios.

4. **JSON parsing from hermes**: Response format may vary. Parse with regex fallback: `re.search(r'\{[\s\S]*"recommendation"[\s\S]*\}', output)` then `json.loads()`.

5. **Heartbeat/stale key**: When renaming a cron job, update: worker.py function name + scheduler ID + print statements + `record_heartbeat()` key + `acquire_lock()` key + DSL file patterns + debug.py `VALID_SCANNERS` list + AGENTS.md docs.

6. **Hard gate removal**: When converting from hard gates to hermes evaluation, keep the scoring logic (it provides data for hermes) but remove `continue` statements that filter candidates. ALL candidates should be sent to hermes for evaluation.

7. **recommendation vs approved**: Manual flow uses `suguru-recommendation.json` (human decides). Jido auto uses the same file but reads it programmatically and auto-executes. Don't confuse with old `suguru-approved.json`.

8. **Worker.py vs Jido**: `job_suguru()` in worker.py should ONLY scan + hermes decide (NOT execute). Auto-execute lives in `jido.py` `_run_suguru_pipeline()`. Don't put auto-execute in both places.

9. **New command won't appear until bot restart**: The COMMANDS list registers with BotFather via `set_my_commands` on startup. After adding a new command, the bot MUST restart. Users may need to re-open the chat or type `/` to refresh.

10. **Settings structure is flat, not nested**: RULES_KEY_MAP writes `rules[section][field]`. For suguru settings under jido: use field names like `suguru_enabled`, `suguru_max_leverage` directly under the `jido` section — NOT nested `jido.suguru.enabled`.

## Integration with Existing Jobs

To add hermes gating to an existing scanner (orca, mantis, etc.):
1. Add `--scan-only` mode that writes `*-candidates.json`
2. Create a `<scanner>_decide.py` script with hermes call
3. Wrap in `job_<scanner>()` with 3-step pipeline
4. Add RISK_OFF bypass for scan-only mode
