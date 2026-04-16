---
name: senpi-waifu-arena-learner
description: Analyze Senpi Predators arena state data to generate actionable insights for strategy improvement.
category: senpi-waifu
---

# Senpi Waifu Arena Learner

Analyze Senpi Predators arena state data to generate actionable insights for strategy improvement.

## When to Use

- Periodically (e.g., every 4 hours) to analyze Senpi Predators leaderboard performance
- When you want to derive actionable insights from top-performing strategies in the competition
- As part of an automated cron job for continuous strategy improvement based on arena data
- Before making data-driven adjustments to trading strategy weights or parameters

## Prerequisites

- Access to senpi-waifu repository at `/home/kt/senpi-waifu`
- Senpi MCP tools available (arena_leaderboard, arena_pool, arena_week_prizes, strategy_list)
- Git repository configured and accessible
- Python 3.x available
- NOTE: `/home/kt/senpi-waifu/outputs/arena-state.json` may exist but is often stale — prefer live MCP data

## MCP API Requirements (discovery_get_top_traders)

When calling the Senpi MCP `discovery_get_top_traders` tool:

1. **Valid `time_frame` values**: Must be one of `DAILY`, `WEEKLY`, `MONTHLY`, `ALL_TIME` (NOT "30d" or similar)

2. **Response structure**: 
   ```python
   {
       "success": bool,
       "data": {"traders": [...], "count": int, "filters": dict},
       "error": {"code": str, "message": str}  # only on failure
   }
   ```

3. **Always check `success`** before processing data:
   ```python
   result = sc.mcporter_call("discovery_get_top_traders", {"limit": 50, "time_frame": "MONTHLY"})
   if not result.get("success", False):
       # Handle error
   traders = result.get("data", {}).get("traders", [])
   ```

## Procedure

### 1. Prepare Repository
```bash
cd /home/kt/senpi-waifu
# Handle potential unstashed changes - stash if needed, pull, then restore
if ! git diff-index --quiet HEAD --; then
    git stash push -m "arena-learner pre-pull stash"
fi
git pull --rebase --quiet
# Restore stashed changes if any were stashed
if git stash list | grep -q "arena-learner pre-pull stash"; then
    git stash pop --quiet
fi
```

### 2. Fetch Live Arena Data (Preferred) + Local Fallback

**Primary: Live MCP API calls** (much fresher and richer than local JSON):
- Call `arena_leaderboard(limit=60)` to get all enrolled agents with live ROE%, PnL, trade count, volume, tools/skills used
- Call `arena_pool()` to get current and next week prize pool amounts
- Call `arena_week_prizes()` to get exact prize amounts per rank (top 5)
- Call `strategy_list()` to get our active strategies (NOTE: this can fail with SERR031 auth error — if so, fall back to reading `/home/kt/senpi-waifu/config/wolf-strategies.json` and `/home/kt/senpi-waifu/config/polar-config.json`)
- Find our entry ("trade_wife") in the leaderboard by Senpi user ID

**Fallback: Local arena-state.json** (may be stale):
- Read `/home/kt/senpi-waifu/outputs/arena-state.json`
- **CRITICAL**: `read_file` returns line-numbered format like `     1|{"key":...}`. You MUST strip line numbers before parsing JSON:
  ```python
  lines = content.split('\n')
  cleaned = '\n'.join(line.split('|', 1)[1] if '|' in line else line for line in lines)
  arena = json.loads(cleaned)
  ```
- Extract leaderboard array, topPerformers, and insights sections

**Correlate**: Cross-reference local Predators arena-state.json names (Polar, Orca, Roach, etc.) with live Arena leaderboard entries to identify which strategies map to which competitors

### 3. Generate Data-Driven Recommendations
Create recommendations based on actual arena data analysis:

**Performance-Based Analysis:**
- Identify best performing strategy by total PnL from leaderboard
- Generate INCREASE_WEIGHT recommendations for top performers 
- Calculate confidence levels based on ROI percentages (HIGH for >20% ROI, MEDIUM otherwise)

**Volume Efficiency Analysis:**
- Identify high volume strategies (top 5 by totalVolume)
- Determine if high volume correlates with good performance (count of profitable high-volume strategies)
- Generate MAINTAIN_WEIGHT if correlation positive, DECREASE_WEIGHT if negative

**Trade Frequency Analysis:**
- Identify frequent traders (top 5 by totalTrades)
- Calculate win rate among frequent traders
- Generate DECREASE_WEIGHT if <40% of frequent traders are profitable, MAINTAIN_WEIGHT otherwise

**Strategy-Specific Insights:**
- Analyze performance of strategy families (e.g., all "orca" variants)
- Generate family-based recommendations based on collective performance
- Check for exceptional performers (e.g., strategies with >200 PnL for strong conviction signals)

**Insights-Based Recommendations:**
- Incorporate explicitly identified winning/losing traits from arena insights
- Generate conviction analysis recommendations if "higher conviction" is a winning trait
- Generate trading frequency recommendations if "over-trading" is a losing trait

**Risk Management:**
- Identify significantly losing strategies (large negative PnL) for DECREASE_WEIGHT actions
- Ensure baseline recommendations are generated if analysis yields no strong signals

### 4. Write Learnings File
Create `/home/kt/senpi-waifu/outputs/arena-learnings.json` with:
```json
{
  "timestamp": "ISO timestamp with Z suffix",\n  "type": "ARENA_LEARNINGS",\n  "recommendations": [\n    {\n      "scanner": "STRATEGY_NAME_OR_ANALYSIS_TYPE",\n      "action": "INCREASE_WEIGHT|DECREASE_WEIGHT|MAINTAIN_WEIGHT",\n      "confidence": "HIGH|MEDIUM|LOW",\n      "reason": "detailed explanation based on specific analysis findings"\n    }\n  ],\n  "note": "Generated from analysis of X strategies at [timestamp] UTC"\n}
```

### 5. Version Control
```bash
git add outputs/arena-learnings.json
git commit -m "arena learner: updated recommendations based on arena data analysis"
git push --quiet
```

## Key Learning Points from Implementation

1. **read_file returns line-numbered format**: Hermes `read_file` returns content prefixed with line numbers like `     1|{...}`. This must be stripped before `json.loads()`:
   ```python
   lines = content.split('\n')
   cleaned = '\n'.join(line.split('|', 1)[1] if '|' in line else line for line in lines)
   arena = json.loads(cleaned)
   ```
   Failing to do this causes `json.decoder.JSONDecodeError: Extra data`.

2. **Live MCP data > stale local files**: The `arena-state.json` can be days stale (observed 5+ days old). Always fetch live data from `arena_leaderboard` (with offset pagination for 50+ agents), `arena_pool`, and `arena_week_prizes` MCP tools. Use local JSON only as supplementary context for Predators strategy names.

3. **strategy_list can fail with SERR031 auth errors**: The MCP `strategy_list` call may return `SERR031: User not authorized` — this is a session-level auth issue, not a config issue. Fallback: read strategy config from local files (`/home/kt/senpi-waifu/config/wolf-strategies.json`, `polar-config.json`, etc.).

4. **Data Type Handling**: ROI values in arena-state.json are strings with "%" signs. Strip and convert to float before numeric comparison.

5. **MCP API Parameter Values**: When calling `discovery_get_top_traders`:
   - `time_frame` MUST be one of: `DAILY`, `WEEKLY`, `MONTHLY`, `ALL_TIME`
   - Response structure: `{"success": bool, "data": {"traders": [...]}}`
   - Always check `success` field before processing

6. **Arena Leaderboard Structure**: The live `arena_leaderboard` response uses:
   - `data.leaderboard.entries[]` with `roePct` (string), `totalPnl` (string), `tradeCount` (int), `notionalVolume` (string)
   - Parse string values with `float()` before comparison
   - Use `limit` + `offset` for pagination (default 100, max 500)

7. **Analysis Dimensions**: Effective analysis combines:
   - Absolute performance (total PnL) — identifies dollar winners
   - ROE ranking — the actual competition metric
   - Volume efficiency (ROE per dollar of volume) — capital efficiency
   - Trade frequency vs performance — validates over-trading thesis
   - Skill/tool usage patterns — are published skills helping?
   - Syndicate analysis (betashop runs 10+ agents) — strategy diversification effectiveness
   - Self-diagnosis — are our crons even running?

8. **Confidence Calibration**:
   - HIGH: Exceptional performers (>20% ROE) or strong correlations
   - MEDIUM: Solid moderate performance or patterns
   - LOW: Weak signals or insufficient data
   - CRITICAL: Self-diagnosis issues (0 trades, engine not firing)

## Outputs

- `/home/kt/senpi-waifu/outputs/arena-learnings.json` - Analysis and recommendations
- Git commit with updates to the learnings file

## Example Output

See the conversation history for a complete execution example where:
- Analysis of 15 strategies from arena-state.json was performed
- 7 recommendations were generated including:
  - POLAR: INCREASE_WEIGHT (HIGH confidence) based on 280.95 PnL (28.09% ROI)
  - VOLUME_ANALYSIS: MAINTAIN_WEIGHT (MEDIUM confidence) based on positive volume-performance correlation
  - FREQUENCY_ANALYSIS: MAINTAIN_WEIGHT (MEDIUM confidence) based on mixed frequency-performance results
  - ORCA: INCREASE_WEIGHT (HIGH confidence) based on Orca v1.1 showing 94.91 PnL
  - Additional recommendations based on insights and risk management

## Pitfalls

- **read_file line-numbered format**: Hermes `read_file` returns `     N|content` format. Must strip line numbers before `json.loads()`:
  ```python
  lines = content.split('\n')
  cleaned = '\n'.join(line.split('|', 1)[1] if '|' in line else line for line in lines)
  data = json.loads(cleaned)
  ```
- **strategy_list auth failures**: `strategy_list` MCP call can fail with SERR031 ("User not authorized"). Fallback to reading local config files in `/home/kt/senpi-waifu/config/` for strategy wallet/ID info.
- **Stale arena-state.json**: The local `outputs/arena-state.json` may be days old. Always prefer live MCP `arena_leaderboard` data for current standings.
- **String-valued metrics**: `roePct` and `totalPnl` from arena_leaderboard are strings — parse with `float()` before numeric comparison.
- **betashop is a syndicate**: Many agents share xHandle "betashop" — they're the same team running variants. Don't count them as independent data points.
- **regime_state.json may not exist**: The file at `/home/kt/senpi-waifu/regime_state.json` is not always present. Don't depend on it for arena analysis. If missing, it may indicate the regime classifier hasn't run or Jido is in RISK_OFF skipping everything.
- **Terminal security blocks python -c and cat|python**: In the Hermes cron environment, `cat file | python3 -m json.tool` and `python3 -c "..."` both get blocked by security scan. Use `read_file` tool + MCP calls instead of terminal for data inspection during cron runs.
- **Our identity for leaderboard search**: trade_wife = M179642. Active strategy wallet `0xb08029bf3d8472cfddbc1c5df4ad18e98ca24db1` (strategy `c070acba`). Search leaderboard entries for `senpiUserId == "M179642"` to find our rank.

## Notes

- This skill focuses purely on analysis and recommendation generation
- It does not automatically apply configuration changes - those would be handled by separate processes
- The skill is designed to be run frequently (every 4 hours) as indicated by the cron schedule
- All recommendations are based on live arena data from the Senpi Arena competition
- Confidence levels: HIGH (>20% ROE performers), MEDIUM (solid patterns), LOW (weak signals), CRITICAL (engine not running)
- The arena uses ROE % as the ranking metric, not total PnL — a $100 budget agent with 41% ROE ranks above a $1000 budget agent with 10% ROE data