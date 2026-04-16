---
name: senpi-waifu-risk-pipeline-fix
description: "Fix critical risk management pipeline bugs in senpi-waifu — arbiter spam, regime race conditions, MCP candle parsing failures, catastrophic drawdown cascade, config threshold mismatches, and elite trader MCP API errors. Use when system enters DD >20%, arbiter spams Telegram, regime flips BASELINE/RISK_OFF in a loop, candles are always empty, or elite_trader.py fails with MCP errors."
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [senpi-waifu, risk-management, arbiter, regime, telegram, railway]
    related_skills: [senpi-waifu-railway-fix, senpi-waifu-regime-classifier, systematic-debugging]
---

# Senpi Waifu Risk Pipeline Fix

## When to Use
When the senpi-waifu system exhibits any of these symptoms:
1. Telegram flooded with "🚨🚨 CATASTROPHIC FLATTEN 🚨🚨" every 30 seconds
2. Regime classifier resets to BASELINE despite catastrophic drawdown (arbiter overrides it repeatedly)
3. `risk-arbiter.py` logs "All candles empty! Regime DEFAULTED to RISK_OFF" — candles from MCP always return `[]`
4. Trade journal is empty despite closed positions (`[]` in `memory/trade-journal.json`)
5. `peak_equity` in `outputs/arbiter-state.json` never updates or holds a stale high value
6. Arbiter logs "FLATTENING ALL" repeatedly without dedup or cooldown

## Root Causes & Fixes

### Fix 1: Arbiter Telegram Spam (every 30s)
**File:** `risk-arbiter.py`, function `send_telegram_alert()`

**Root cause:** Arbiter calls `send_telegram_alert()` on EVERY 30-second cycle when DD > threshold. No cooldown, no dedup.

**Fix:** Add Telegram dedup with cooldown inside `send_telegram_alert()`:
```python
# At module level
_last_alert_msg = None
_last_alert_time = 0

def send_telegram_alert(bot_token, chat_id, message):
    global _last_alert_msg, _last_alert_time
    now = time.time()
    if message == _last_alert_msg and now - _last_alert_time < 300:
        return  # Dedup + 5 min cooldown
    # ... existing send logic ...
    _last_alert_msg = message
    _last_alert_time = now
```

### Fix 2: Arbiter FLATTEN Spam (every 30s)
**File:** `risk-arbiter.py`, main loop

**Root cause:** `flat_positions` runs every 30 seconds while DD stays above threshold. No persistent state tracking "already flattened today."

**Fix:** Add flatten-once-per-day tracking in arbiter loop:
```python
_flat_date = None

# In main loop, after flatten check:
if dd_pct > CATASTROPHIC_DD:
    today = utc_now().strftime("%Y-%m-%d")
    if _flat_date != today:
        # Run flatten
        _flat_date = today
    else:
        # Already flattened today, just log
        log.debug("Already flattened today, skipping")
```

Also add to `send_telegram_alert()` to skip duplicate CATASTROPHIC alerts.

### Fix 3: MCP Candle Parsing Failure
**Files:** `risk-arbiter.py`, `waifu-regime.py`

**Root cause:** Senpi MCP `market_get_asset_data` returns `{"data": {"candles": {...}}}` — the `data` envelope must be unwrapped. Both files have their own `_candles()` function that didn't unwrap the envelope, so candles were always `[]`.

**Fix:** In both `_candles()` functions, unwrap the MCP response:
```python
data = resp.get("data", resp)  # Unwrap MCP data envelope
raw_candles = data.get("candles", {})
```

The working version exists in other scripts (e.g., the regime classifier's main section). Copy that pattern everywhere candles are fetched from MCP.

### Fix 4: Regime Race Condition (BASELINE → RISK_OFF flip loop)
**File:** `waifu-regime.py`

**Root cause:** Regime classifier runs every 15 min. It reads BTC candles, classifies regime as BASELINE/RISK_ON based on slope/ATR. But it doesn't check `outputs/arbiter-state.json` before setting regime. So when arbiter forces RISK_OFF due to DD > 20%, the regime cron overrides it back to BASELINE 15 minutes later. This creates a flip loop.

**Fix:** At the TOP of the regime classifier, before any candle analysis:
```python
arbiter_state = read_json("outputs/arbiter-state.json")
if arbiter_state.get("consecutive_stopouts", 0) >= 3:
    write_regime("RISK_OFF", "consecutive stopouts threshold")
    sys.exit(0)
peak = arbiter_state.get("peak_equity", 0)
current = get_equity()
if peak > 0 and current / peak < 0.8:
    write_regime("RISK_OFF", f"catastrophic DD {round((1-current/peak)*100,1)}%")
    sys.exit(0)
```

### Fix 5: Trade Journal for Arbiter-Closed Positions
**File:** `risk-arbiter.py`, flatten function

**Root cause:** Arbiter uses direct Senpi MCP calls to close positions, not the CLI pipeline. The CLI normally logs to `memory/trade-journal.json`. Arbiter closes bypass this, leaving the journal empty.

**Fix:** After each flatten close, append to the trade journal:
```python
journal = read_json("memory/trade-journal.json") or []
journal.append({
    "timestamp": utc_now().isoformat(),
    "coin": pos["coin"],
    "direction": pos["direction"],
    "action": "FLATTEN",
    "reason": "catastrophic_dd",
    "realized_pnl": resp.get("realizedPnl", 0)
})
write_json("memory/trade-journal.json", journal)
```

### Fix 6: Peak Equity Reset
**File:** `risk-arbiter.py`

**Root cause:** When system is manually reset or equity drops below a stale peak, `peak_equity` may hold an inflated value (e.g., $100) while current equity is $49.

**Fix:** Add peak validation to arbiter:
```python
current_equity = get_equity()
peak = state.get("peak_equity", current_equity)
if current_equity < peak * 0.5:
    # System has been reset or significantly depleted — reset peak
    peak = current_equity
    state["peak_equity"] = peak
```

## Fix 7: Config vs Defaults DD Threshold Mismatch (Alert Spam)

**Symptom:** Telegram floods with "🚨🚨 CATASTROPHIC FLATTEN 🚨🚨" even after flatten runs. Alert fires every cycle because DD exceeds both hardcoded (30%) and config (20%) thresholds, but only one threshold is checked.

**Root cause:** `risk-arbiter.py` may hardcode `CATASTROPHIC_DD = 30` while `config/risk-regime.json` declares 20%. When peak equity is stale ($100 from initial deposit) but equity is $49, DD = 51% which exceeds both — but the alert message references only one threshold, confusing debugging.

**Fix:**
1. Reset peak equity to current: `s['peak_equity'] = get_equity()`
2. Make arbiter read threshold from config:
   ```python
   regime_cfg = read_json("config/risk-regime.json") or {}
   catastrophic_dd = regime_cfg.get("catastrophicDD", 20)
   ```
3. Auto-reset peak when equity < 50% of peak (system likely reset):
   ```python
   if current_equity < peak * 0.5:
       peak = current_equity
       state["peak_equity"] = peak
   ```

## Fix 8: Elite Trader MCP API Mismatches

**Symptom:** `elite_trader.py` fails at startup or produces empty scans despite active markets. `MCP FAILED` or `[E]` in logs for market calls.

**Root cause:** Script calls MCP tools that don't exist (`market_get_prices`, `market_get_candles`, `market_get_orderbook`, `market_get_instrument_specs`) and uses wrong response field names.

**Fix:** Rewrite `build_trade()` to use single `market_get_asset_data` call:
```python
ad = mcporter_call("market_get_asset_data", {
    "asset": asset,
    "candle_intervals": ["1h", "4h"],
    "include_order_book": True,
    "include_funding": False,
})
candles_map = ad["data"]["candles"]  # {"1h": [...], "4h": [...]}
mark = ad["data"]["asset_context"]["markPx"]
```

For instrument data (OI, volume, funding, max leverage), use `market_list_instruments` — not the non-existent `market_get_instrument_specs` or `market_get_prices`.

## Fix 9: Elite Trader --dry-run Mode

**Purpose:** Test scan pipeline without executing trades or requiring ACTIVE regime.

**Usage:** `python3 scripts/vps/elite_trader.py --dry-run`

Bypasses RISK_OFF gate and skips order placement. Still runs full scan, computes GSS, selects candidates — outputs `DRY-RUN: would open DIRECTION COIN @ Nx` instead of calling `mcp_senpi_create_position`.

---

## Deployment Steps

1. Make all code changes locally in `/home/kt/senpi-waifu/`
2. Reconstruct trade journal:
   ```bash
   cd /home/kt/senpi-waifu && python3 -c "
   import json
   journal = [{
       'timestamp': '2026-03-26T00:00:00Z',
       'coin': 'AVAX', 'direction': 'LONG', 'action': 'FLATTEN',
       'reason': 'catastrophic_dd', 'realized_pnl': 0
   }]
   with open('memory/trade-journal.json','w') as f: json.dump(journal,f,indent=2)
   print('Trade journal reconstructed')
   "
   ```
3. Reset arbiter state (peak to current equity):
   ```bash
   python3 -c "
   import json
   with open('outputs/arbiter-state.json') as f: s = json.load(f)
   s['peak_equity'] = 49.41
   with open('outputs/arbiter-state.json','w') as f: json.dump(s,f,indent=2)
   print('Peak reset')
   "
   ```
4. Set regime to RISK_OFF manually:
   ```bash
   python3 -c "
   import json
   with open('config/risk-regime.json','w') as f:
       json.dump({'regime':'RISK_OFF','reason':'manual reset - catastrophic DD recovery','updated':'2026-04-01T00:00:00Z'}, f, indent=2)
   print('Regime set to RISK_OFF')
   "
   ```
5. Commit + push + deploy to Railway:
   ```bash
   git add -A && git commit -m "fix: arbiter spam, regime race, candle parsing, trade journal, peak equity"
   git push origin main
   railway up --service senpi-waifu
   ```

## Verification

After deploy, check Railway logs:
```bash
railway logs --service senpi-waifu -n 100
```

**Look for:**
- ✅ `Arbiter: day start equity=$X` (appears once, no spam)
- ✅ `jido] regime: RISK_OFF` (no BASELINE flips)
- ✅ `[jido] RISK_OFF — skipping all entries`
- ✅ Zero `FLATTENING ALL` messages
- ✅ Zero `CATASTROPHIC FLATTEN` Telegram alerts
- ✅ `Reconciled CLOSE: AVAX in wolf-primary reason=risk_arbiter_flatten`

**Red flags:**
- ❌ Any `FLATTENING ALL` in logs
- ❌ Regime setting to BASELINE while DD > 20%
- ❌ "All candles empty" in arbiter

## Gotchas

1. **MCP data envelope**: ALL calls to Senpi MCP tools return `{"data": {...}}`. Always unwrap with `resp.get("data", resp)` before accessing inner fields. Different scripts may have different conventions — grep for working examples before implementing.

2. **Regime interval is 20min, not 15**: The scheduler adds `seconds=300` as offset, so `minutes=15, seconds=300` = 1200s total. First run after deploy is ~20min, not 15min.

3. **Arbiter runs every 30 seconds**: Any side effect (Telegram alerts, position closes, log messages) in the arbiter loop fires 120x/hour. ALL side effects need dedup/cooldown.

4. **Direct MCP calls bypass CLI logging**: When scripts use raw MCP HTTP calls (not the `waifu` CLI), trade actions don't auto-populate the trade journal. Always append manually after direct MCP calls.

5. **Peak equity persists across deploys**: Railway may redeploy but `outputs/arbiter-state.json` is in git. A stale peak makes DD calculations wrong forever until manually reset or auto-detected.

6. **Telegram message dedup is fragile**: The bot has its own internal dedup that checks `last_3_messages`. If the same alert text is sent 8x in 1 minute, 7 will be suppressed, but the arbiter still calls `send_telegram_alert()` and logs warnings about dedup.

7. **Watchdog may flag itself as stale**: During deploy, the watchdog cron can detect itself as stale (gap in execution). This is transient — resolves after first watchdog cycle completes.

8. **Config vs defaults DD threshold mismatch**: The regime config (`config/risk-regime.json`) declares `catastrophicDD: 20` (20%), but `risk-arbiter.py` may hardcode `CATASTROPHIC_DD = 30` (30%). When DD is between 20-30%, the regime config says "breached" but the arbiter code doesn't trigger flatten. Always grep for the actual threshold used in `risk-arbiter.py` and compare against `config/risk-regime.json`. Fix: make arbiter read threshold from config instead of hardcoding.

9. **Elite trader MCP tool names are WRONG**: The `scripts/vps/elite_trader.py` script calls Senpi MCP tools that don't exist. Before editing elite trader, always verify tool names against `mcp_senpi_*` tool definitions. Known mismatches: `market_get_prices` (doesn't exist → use `market_list_instruments`), `market_get_candles` (doesn't exist → use `market_get_asset_data`), `market_get_orderbook` (doesn't exist → embedded in `market_get_asset_data`), `market_get_instrument_specs` (doesn't exist → data in `market_list_instruments`). Response field names also differ: `token`→`name`, `fundingRate`→`funding`, `markPrice`→`markPx`, candle `close`→`c`.

10. **Elite trader produces 0 trades is normal**: When `pending-entries.json` is empty and SM whale bias is weak, the hard gate blocks all candidates. This is correct safety behavior — the elite trader won't trade without scanner signals OR strong SM whale bias. Run with `--dry-run` to confirm the scan logic is working (should show universe, signal scores, and trade decisions).
