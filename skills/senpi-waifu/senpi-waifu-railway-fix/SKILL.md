---
name: senpi-waifu-railway-fix
description: Fixes common Railway deployment issues in senpi-waifu worker (directory creation and SENPI API key handling)
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [senpi-waifu, railway, deployment, fix]
    related_skills: [competitive-programmer, systematic-debugging]
---

# Senpi Waifu Railway Worker Fix

## When to Use
When deploying the senpi-waifu system to Railway and encountering:
1. FileNotFoundError for cron-heartbeats.tmp -> cron-heartbeats.json
2. "Risk arbiter: could not fetch equity — skipping" messages in logs
3. General MCP authentication or directory-related errors in the worker

## Approach
This skill provides a systematic way to fix common Railway deployment issues in the senpi-waifu worker by ensuring proper directory structure and correct environment variable handling.

## Steps

### 1. Fix Directory Creation Issues
Modify `/home/kt/senpi-waifu/worker.py` to create required directories on startup:

Add after printing startup info but before setup_git():
- Ensure required directories exist: outputs, state, memory
- Print confirmation

This prevents FileNotFoundError when scripts try to write to these directories.

### 2. Fix Environment Variable Handling
Update the SENPI API key reading to prefer SENPIAUTHTOKEN (matching upstream Senpi skills):

Change the line that reads SENPI_API_KEY to first try SENPIAUTHTOKEN, then fall back to SENPI_API_KEY.
Update the docstring to reflect both variables.
Update startup messages in setup_mcporter() to indicate which token is being used.

### 3. Verify Changes
After making changes:
1. Commit the worker.py changes
2. Push to repository (ensure GitHub authentication is configured)
3. Update Railway environment variables:
   - SENPIAUTHTOKEN: Your Senpi MCP authentication token (single line, no quotes)
   - SENPI_API_KEY: Same token as fallback (optional)
   - GITHUB_TOKEN: For git operations (if needed)
4. Restart the Railway service
5. Check logs for:
   - [startup] Ensured directories: outputs, state, memory under /app
   - [startup] SENPIAUTHTOKEN/SENPI_API_KEY found — using direct MCP HTTP calls
   - Absence of FileNotFoundError for cron-heartbeats
   - Absence of "Risk arbiter: could not fetch equity — skipping"

## Key Insights
- The upstream Senpi skills expect SENPIAUTHTOKEN, not SENPI_API_KEY
- Railway workers need explicit directory creation as the filesystem may not persist directories between restarts
- Making minimal, focused changes reduces risk of introducing new bugs
- Always verify fixes by checking specific log messages

## Verification
Successful fix is indicated by:
1. No more heartbeat file errors in logs
2. No more "could not fetch equity" messages from risk arbiter
3. Successful MCP calls for account_get_portfolio, leaderboard_get_markets, etc.
4. Proper directory structure in /app/outputs, /app/state, /app/memory

## Related Skills
- `senpi-waifu-risk-pipeline-fix` — deeper fix for arbiter spam, regime race conditions, MCP candle parsing failures, and catastrophic drawdown cascading

## Related Files
- /home/kt/senpi-waifu/worker.py
- /home/kt/senpi-waifu/risk-arbiter.py
- /home/kt/senpi-waifu/waifu-regime.py
- Environment variables in Railway dashboard
- Local git repository for committing changes