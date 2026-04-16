---
name: senpi-waifu-standup
description: Stand up the Hermes strategic layer for senpi-waifu — create Senpi strategy, register in config, bootstrap state, and enable 6 cron jobs. Use when initializing or re-initializing the trading system.
version: 1.0.0
author: Hermes Agent
license: MIT
metadata:
  hermes:
    tags: [senpi, trading, hyperliquid, cron, strategy]
---

# Senpi-Waifu Strategic Layer Standup

Complete workflow to get the Hermes autonomous trading supervisor running against a live Senpi/Hyperliquid strategy.

## When to Use

- Fresh deployment of senpi-waifu strategic layer
- After strategy close — need to create a new one
- Re-onboarding after extended downtime

## Prerequisites

- Senpi account with USDC in embedded wallet (Base chain or Hyperliquid)
- `/home/kt/senpi-waifu` git repo cloned and up to date
- Hermes native MCP connection to Senpi (not mcporter — see pitfall #4)

## Step 1: Sync Repo

```bash
cd /home/kt/senpi-waifu
git pull --rebase
```

If divergent branches: use `git pull --rebase` (preferred over merge).

## Step 2: Create Strategy

Use `mcp_senpi_strategy_create_custom_strategy` with:
- `initialBudget`: dollar amount
- `positions`: `[]` (empty — scanners feed entries)
- `strategyName`: NO SPACES (e.g. "WOLF-Primary" not "WOLF Primary")
- `stopLossPercentage`: 10 (recommended)

Poll `mcp_senpi_strategy_get` until status = ACTIVE (~30s, goes through FUND_WALLET stage).

## Step 3: Register in Config

Update `config/wolf-strategies.json` with values from step 2:
- wallet (strategyWalletAddress)
- strategyId
- budget
- telegramChatId (from the .env file)

Commit: `git commit -m "config: register live strategy"`

## Step 4: Bootstrap State Files

Create these files if missing with sane defaults:
- `memory/trade-journal.json` → `[]`
- `state/pending-entries.json` → `[]`
- `outputs/arbiter-state.json` → `{"peakEquity":0,"dayStartEquity":0,"consecutiveStopOuts":0}`
- `outputs/autonomous-brain.json` → `{}`
- `outputs/playbook-state.json` → `{}`
- `outputs/latest-report.json` → `{}`
- `outputs/arena-state.json` → `{"predators":[],"insights":{}}`
- `outputs/arena-learnings.json` → `{}`
- `outputs/health-state.json` → `{}`
- `outputs/cron-heartbeats.json` → `{}`
- `outputs/whale-index-state.json` → `{"slots":[],"watchlist":{},"notes":[]}`

## Step 5: Set Initial Regime

Verify `config/risk-regime.json` has `riskMode: "BASELINE"`.

## Step 6: Create Hermes Cron Jobs

Create 6 cron jobs using `cronjob(action="create", deliver="local")`.

| Agent | Schedule | Key behavior |
|-------|----------|-------------|
| Regime Classifier | `0 * * * *` | BTC/ETH candles → RISK_ON/BASELINE/RISK_OFF |
| Portfolio Review | `0 */6 * * *` | Guardrail check, report, auto RISK_OFF if breached |
| Trade Evaluator | `*/15 * * * *` | Validate entries, execute via create_position |
| Arena Learner | `0 */4 * * *` | Leaderboard study, recommendations |
| HOWL Nightly | `55 23 * * *` | 10-pillar self-improvement |
| Whale Index | `0 1 * * *` | Copy-trade slot management |

Each prompt MUST be self-contained (fresh session, no prior context):
- Start with `cd /home/kt/senpi-waifu && git pull --rebase --quiet`
- Include strategy ID + wallet address directly in the prompt text
- Specify leverage band (7-10x), max positions (3), and XYZ ban in each prompt
- End with `git commit && git push`

## Step 7: Verify Railway Mechanical Layer

Railway must populate `state/pending-entries.json` with scanner signals. Without it, Trade Evaluator has nothing to process.

### Link Railway project

```bash
cd /home/kt/senpi-waifu
railway project link -p senpi-waifu
```

### Check deployment status

```bash
railway service status --all
```

### Link service (required for logs + env vars)

```bash
railway service link senpi-waifu
```

### Check if worker is actually producing state

```bash
railway logs --lines 50 --since 1h
```

Look for `mcporter error` lines — if all calls fail, see Pitfall #7.

### Check Railway env vars

```bash
railway variable list
```

**CRITICAL:** If no custom vars are listed (only RAILWAY_* defaults), the worker has no auth. See Pitfall #7.

### Set required env vars on Railway

```bash
railway variable set SENPI_API_KEY=<value>
railway variable set GITHUB_TOKEN=<value>
railway variable set GITHUB_REPO=tradewife/senpi-waifu
railway variable set SENPI_WAIFU_DIR=/app
railway variable set TELEGRAM_BOT_TOKEN=<value>
railway variable set TELEGRAM_CHAT_ID=<value>
```

After setting vars, redeploy: `railway service redeploy`

### Verify state is flowing

After redeploy, wait 5 min then check:

```bash
# Railway should be writing brain state
git pull --rebase
cat outputs/autonomous-brain.json | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('generatedAt','STALE'))"

# Check health state is non-empty
cat outputs/health-state.json

# Check for pending entries
cat state/pending-entries.json
```

### Diagnosis timeline

- If brain timestamp is stale (> 1 hour old) after redeploy: Railway env vars are wrong or mcporter config is broken.
- If no `mcporter error` in logs but no state written: check GITHUB_TOKEN (git push may be failing).
- If mcporter errors say "Unable to load tool metadata": auth issue — see Pitfall #7.

## Pitfalls

1. **Strategy name spaces** — SERR058 error. Use hyphens/underscores only.
2. **Railway CLI link** — `railway link` is interactive. Use `railway project link -p <name>`.
3. **Strategy creation async** — Poll until ACTIVE (~30s).
4. **mcporter vs native MCP** — Shell scripts use mcporter CLI (separate auth). Hermes cron jobs must use native `mcp_senpi_*` tools directly. Never shell out to mcporter from cron prompts.
5. **Cron prompts are stateless** — Fresh session each run. Strategy ID, wallet, paths, and constraints must all be in prompt text.
6. **Git conflicts** — Both Railway and Hermes write to same repo. Always pull-rebase before read, push after write. Push failures are non-fatal.
7. **Railway env vars are separate from repo** — The `.env` file in the repo is for LOCAL use only. Railway worker gets its env vars from `railway variable list/set`. If no custom vars are set, the worker runs but every mcporter call silently fails with "Unable to load tool metadata; name positional arguments explicitly." The worker appears healthy (deployment status = SUCCESS) but produces no state. **Always verify Railway has SENPI_API_KEY and GITHUB_TOKEN set.**
7a. **Railway project shared variables are invisible to CLI** — `railway variable list` only shows service-scoped variables. Project-level shared variables (set in dashboard → Settings → Variables) are inherited at deploy time but the CLI cannot see them. Don't be fooled by an empty `railway variable list` — check the Railway dashboard Settings → Variables page too. If vars are there but worker still fails, the issue is mcporter itself (see pitfall #10).
8. **Railway service must be linked for logs** — `railway logs -s <name>` fails unless you first run `railway service link <name>`. Use `railway service status --all` to find service names.
9. **mcporter config/mcporter.json has embedded auth** — The Railway worker uses this file's `SENPI_AUTH_TOKEN` for mcporter calls. If it's truncated or stale, all calls fail even if Railway env vars are correct.
10. **mcporter + Senpi MCP is fundamentally broken** — Confirmed from Railway production logs: `mcporter call senpi <tool> --json '<args>'` fails with "Unable to load tool metadata; name positional arguments explicitly" on EVERY tool call, even with valid auth. The cause is that Senpi MCP tools have complex nested schemas (objects with optional fields, arrays, enums) that mcporter's positional argument hydration cannot parse. **The Railway mechanical layer (scanners, brain, arbiter) will not work via mcporter.** Fix: rewrite `senpi_common.py:mcporter_call()` to call the Senpi MCP endpoint directly via HTTP (POST to `https://mcp.prod.senpi.ai/mcp` with Bearer auth header and JSON-RPC `tools/call` payload), bypassing mcporter entirely. This is the same approach Hermes cron jobs already use natively.

## Emergency Stop

Set RISK_OFF in `config/risk-regime.json`, commit, push, then pause all cron jobs.

## File Map

| Path | Purpose |
|------|---------|
| `config/risk-regime.json` | Active regime + guardrails |
| `config/wolf-strategies.json` | Strategy registry |
| `state/pending-entries.json` | Scanner signal queue |
| `memory/trade-journal.json` | All trades with source tags |
| `outputs/autonomous-brain.json` | Brain policy from Railway |
| `outputs/arbiter-state.json` | Peak equity tracking |
| `outputs/latest-report.json` | Last portfolio review |
| `outputs/arena-state.json` | Leaderboard snapshot |
| `outputs/arena-learnings.json` | Arena recommendations |
| `outputs/whale-index-state.json` | Copy-trade state |
