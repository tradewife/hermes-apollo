---
name: senpi-waifu-regime-classifier
description: Classify macro market regime for senpi-waifu and update config/risk-regime.json.
category: senpi-waifu
---

# senpi-waifu-regime-classifier

Classify macro market regime for senpi-waifu and update config/risk-regime.json.

## Procedure

1. Ensure you are in the senpi-waifu repository: `cd /home/kt/senpi-waifu`
2. Pull latest changes (handle unstaged changes if necessary): `git pull --rebase --quiet` or stash changes.
3. Fetch BTC and ETH market data using MCP tool `mcp_senpi_market_get_asset_data` with candle_intervals ["1h", "4h"] for both assets.
   - Always include funding history in the request (`include_funding: true`)
   - If data fetch fails for an asset, log the error and default to more conservative classification (BASELINE)
4. Extract data from the response:
   - Close prices from 1h and 4h candles for each asset
   - Funding rate history (most recent values)
5. Calculate indicators for each asset:
   - 4H MA Slope:
     * Extract 4h candle close prices
     * Calculate Simple Moving Average (SMA) over last 20 periods
     * Slope (%) = [(Current SMA - SMA 20 periods ago) / SMA 20 periods ago] × 100
     * Alternative: Linear regression slope on last 20 closes, annualized if needed
   - 1H ATR Percentage:
     * Extract 1h candle high, low, close prices
     * For each period: True Range = max(high - low, |high - previous close|, |low - previous close|)
     * ATR = SMA of True Range over last 14 periods
     * ATR Percentage = (ATR / current close price) × 100
   - Funding Rate Check:
     * Get most recent funding rate from history
     * Extreme if |fundingRate| > 0.05% (0.0005) or consistently > 0.01% over multiple periods
6. Classify regime requiring BOTH assets to meet criteria (unless otherwise specified):
   - RISK_ON (require clear, strong evidence):
       * 4H slope > 1.5% for BOTH assets (strong uptrend)
       * 1H ATR < 3% for BOTH assets (low volatility - tightened from 5% based on observation)
       * Both assets showing positive slope (upward alignment)
       * Only classify as RISK_ON when evidence is unambiguous and persistent
   - RISK_OFF (trigger on any of these):
       * 1H ATR > 4% for EITHER asset (elevated volatility) OR
       * 4H slope between -0.3% and +0.3% for BOTH assets with 1H ATR > 2.5% (choppy/low trend) OR
       * Extreme funding rates (|fundingRate| > 0.1% sustained) suggesting liquidation pressure
   - BASELINE: All other cases (default classification)
7. Update config/risk-regime.json:
   - Set `riskMode` to the determined regime
   - Set `updatedAt` to current ISO 8601 UTC timestamp (use `new Date().toISOString()` in JS or equivalent)
   - Set `updatedBy` to "hermes-regime"
   - Set `reason` to 1-2 sentences explaining key factors (e.g., "4H slope: X%, ATR: Y%")
   - Do NOT modify the `regimes` or `globalGuardrails` objects
8. Commit and push changes:
   - `git add config/risk-regime.json`
   - `git commit -m "regime-classifier: <mode>"`
   - `git push`
9. Log regime change if different from previous value

## Lessons Learned from Practice

- ATR thresholds need adjustment: In practice, ATR > 3% already indicates significant volatility; original 5% threshold was too high for timely RISK_ON detection
- Funding rates interpretation: Values are small decimals (0.0001 = 0.01%); extreme levels for liquidation risk start around 0.001 (0.1%)
- Choppy market detection: Low slope (< ±0.3%) combined with ATR > 2.5% is a reliable sideways/chop indicator
- Data validation is critical: Always check that sufficient candle data exists (minimum 20 periods for 4H slope, 14 for ATR)
- When uncertain between regimes, default to BASELINE rather than risking incorrect RISK_ON classification
- The classification should be conservative: better to miss a genuine RISK_ON opportunity than to falsely signal one
- In volatile markets, consider using exponential moving averages or smoothing to reduce whipsaws
- Always verify the JSON update was successful and only modified the intended top-level fields

### CRITICAL: Data Fetching — Use Hyperliquid API Directly

**Problem:** MCP `market_get_asset_data` responses are 140K+ chars and get truncated at 100K. The context window can't hold both full responses.

**Best Solution:** Skip MCP entirely and fetch directly from the Hyperliquid public API via `urllib.request` in `execute_code`. This avoids truncation, reduces context usage, and is more reliable:

```python
import json, urllib.request
from datetime import datetime, timezone

def fetch_candles(coin, interval, num_candles):
    interval_ms = {"1h": 3600000, "4h": 14400000}[interval]
    end_time = int(datetime.now(tz=timezone.utc).timestamp() * 1000)
    start_time = end_time - (num_candles + 5) * interval_ms
    url = "https://api.hyperliquid.xyz/info"
    payload = {"type": "candleSnapshot", "req": {"coin": coin, "interval": interval, "startTime": start_time}}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=15)
    candles = json.loads(resp.read())
    return candles[-num_candles:]

def fetch_funding(coin):
    url = "https://api.hyperliquid.xyz/info"
    start_ts = int((datetime.now(tz=timezone.utc).timestamp() - 86400*3) * 1000)
    payload = {"type": "fundingHistory", "coin": coin, "startTime": start_ts}
    data = json.dumps(payload).encode()
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    resp = urllib.request.urlopen(req, timeout=15)
    return json.loads(resp.read())
```

This keeps the entire flow inside one `execute_code` call — no MCP truncation, no context pollution. Fetch 45 4h candles (for SMA-20 slope) and 20 1h candles (for ATR-14) for each asset.

### Code Pitfalls (execute_code)
- `datetime.now(timezone.utc)` raises `TypeError: 'datetime.timezone' object is not callable` — must use `datetime.now(tz=timezone.utc)` with the keyword arg
- `json.dumps({...}).encode()` with nested dicts in one-liners causes brace/parens confusion — extract the dict to a `payload` variable first, then `json.dumps(payload).encode()`
- `}).encode()` vs `}}).encode()` — easy to miscount closing braces; using a payload variable eliminates this class of bug