---
name: senpi-waifu-trade-evaluator
description: Run the senpi-waifu trade evaluator cron job safely, including git hygiene, signal validation, and trade execution via Senpi MCP.
category: ethereum
---

# Senpi-Waifu Trade Evaluator Cron Job

This skill outlines the procedure for running the senpi-waifu trade evaluator as a cron job, validating queued scanner signals, and executing approved trades via Senpi MCP.

**NOTE**: The original script path `hermes_agents/trade_evaluator.py` no longer exists. The current implementation is in `waifu_cli/commands/`.

## Quick Run (Cron Job)

There are TWO commands available:

### `waifu jido` — Autonomous Trade Executor (RECOMMENDED)
Full autonomous executor with tiered governance:
- If scanner ROI > 15%: auto-execute trade immediately
- If scanner ROI < 15%: send Telegram for manual approval
```bash
cd /home/kt/senpi-waifu && python3 -m waifu_cli jido
```

### `waifu evaluate` — Basic Trade Evaluator
Processes signals through 10-gate pipeline without ROI-based governance:
```bash
cd /home/kt/senpi-waifu && python3 -m waifu_cli evaluate
```

## Procedure

### 1. Prepare Environment
```bash
cd /home/kt/senpi-waifu
# Stash any local changes to ensure clean pull, then reset and pull
git stash push -u -m "stash before trade-evaluator"
git reset --hard HEAD && git pull --rebase --quiet
# Note: stash remains; for cron jobs we typically don't need to pop it
```
**Pitfall**: If git pull fails due to unstaged changes, stash them first. For cron jobs, preserving local changes across runs is usually not necessary.

### 2. Check Risk Regime
Read `config/risk-regime.json`:
- If `.riskMode` is `"RISK_OFF"`, exit immediately (no new entries allowed).
- Note `globalGuardrails.minLeverage` (7) and `maxLeverage` (10) for leverage clamping.
- Note `regimes[.riskMode].maxSlots` for maximum simultaneous positions.

### 3. Read Pending Entries
Read `state/pending-entries.json`:
- If the array is empty, skip to cleanup step (Section 9).

### 4. Read Brain Policy
Read `outputs/autonomous-brain.json`:
- Extract `executionPolicy.mode` (should be `"ACTIVE"` for auto-entry).
- Extract `signalPolicy.blockedScanners` (list of scanners to ignore).
- Extract `signalPolicy.priorityByScanner` for optional prioritization.

### 5. Read Wolf Strategies
Read `config/wolf-strategies.json`:
- Identify the target strategy (e.g., `wolf-primary`).
- Note `.wallet` (strategy wallet address) and `.strategyId`.

### 6. Check Current Open Positions
Call Senpi MCP:
```python
mcp_senpi_strategy_get_clearinghouse_state(strategy_wallet="<wallet from wolf-strategies>")
```
- Count open positions in `data.main.assetPositions` and `data.xyz.assetPositions`.
- If total open positions >= `maxSlots` from risk regime (or brain policy `executionPolicy.maxSlotsCap` if lower), skip all new entries.

### 7. Process Each Pending Signal
For each signal in `state/pending-entries.json`:

#### a. Validate Scanner and Score
Apply minimum score thresholds:
- `orca`: score >= 6
- `komodo`: score >= 10
- `condor`: score >= 10
- `barracuda`: score >= 8
- `bison`: score >= 8
- `shark`/`sentinel`/`rhino`: score >= 5

If score < minimum, **SKIP** with reason: `"score below minimum for <scanner>"`.

#### b. Check Brain Policy Blocklist
If scanner is in `signalPolicy.blockedScanners` from brain policy, **SKIP** with reason: `"scanner blocked by brain policy"`.

#### c. Check Cooldowns
Read `state/<scanner>-cooldowns.json` (e.g., `state/orca-cooldowns.json`):
- If the asset (coin) is currently in cooldown (based on last exit time + cooldown period), **SKIP** with reason: `"in cooldown for <asset>"`.

#### d. Determine Leverage
- Clamp leverage to `[minLeverage, maxLeverage]` from risk regime globalGuardrails (typically 7-10x).
- If brain policy specifies `executionPolicy.maxLeverageCap`, use the lower of that and regime maxLeverage.
- Resulting leverage must be an integer.

#### e. Check 4H Trend Alignment (HARD Gate)
- Obtain 4H trend data for the asset (external process).
- If signal direction is counter to the 4H trend, **SKIP** with reason: `"counter to 4H trend (HARD gate)"`.

#### f. Execute Approved Trade
If all checks pass, **APPROVE** and create position via Senpi MCP:
```python
mcp_senpi_create_position(
    strategyWalletAddress="<wallet from wolf-strategies>",
    orders=[{
        "coin": "<asset from signal>",
        "direction": "<LONG or SHORT from signal>",
        "leverage": <int leverage from step d>,
        "marginAmount": <calculated margin per slot>,
        "orderType": "MARKET",
        "stopLoss": {"percentage": <optional, e.g., 50 for 50% of margin>},
        "takeProfit": {"percentage": <optional, if brain policy suggests>}
    }]
)
```
**Margin Amount Calculation**:
- From risk regime: `allocPctPerSlot` (percentage of budget per slot).
- From wolf strategies: `budget` (total USDC for strategy).
- `marginAmount = budget * allocPctPerSlot / 100`
- Ensure `marginAmount` does not exceed available withdrawable balance (from clearinghouse state).

#### g. Record Trade
Append to `memory/trade-journal.json`:
```json
{
  "action": "open",
  "asset": "<coin>",
  "direction": "<LONG/SHORT>",
  "leverage": <leverage>,
  "marginAmount": <marginAmount>,
  "entrySource": "<scanner>",
  "recordedAt": "<ISO timestamp>",
  "realizedPnl": 0
}
```

### 8. Clear Processed Entries
After processing all signals:
```bash
echo '[]' > state/pending-entries.json
```

### 9. Git Commit Changes
```bash
git add state/ memory/
# Check if there are changes to commit
if ! git diff --cached --quiet; then
    git commit -m "trade-evaluator: process entries"
    git push
fi
```
**Note**: Avoid empty commits by checking for staged changes first.

## Key Rules (Non-Negotiable)
- Never enter XYZ equities (coin starts with `"xyz:"`).
- Leverage must be clamped to 7-10x band.
- Maximum 3 simultaneous positions (from globalGuardrails).
- 4H trend alignment is a HARD gate: counter-trend entries must be skipped.
- 2-hour per-asset cooldown after Phase 1 exit (managed in cooldown files).
- If score < minimum for scanner, SKIP.

## Key Lesson
**FEWER TRADES + HIGHER CONVICTION**. Example: FOX strategy achieved +13.93% with only 436 trades by exercising strict selectivity.

## Troubleshooting
- **Git pull fails due to uncommitted changes**: Use `git reset --hard HEAD && git pull` to force clean state.
- **No pending entries**: Normal; ensure `state/pending-entries.json` is an empty array.
- **Insufficient margin**: Check `withdrawable` in clearinghouse state before calculating marginAmount.
- **MCP call failures**: Verify Senpi API keys and network connectivity; retry with exponential backoff if needed.

## Validation
After execution, verify:
- New trades appear in `memory/trade-journal.json`.
- `state/pending-entries.json` is empty.
- Git commit created if changes were made.
- No trades executed when risk regime is RISK_OFF or maxSlots reached.