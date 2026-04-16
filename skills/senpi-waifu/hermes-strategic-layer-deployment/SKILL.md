---
name: hermes-strategic-layer-deployment
category: senpi-waifu
description: Deploy and configure Hermes strategic layer for senpi-waifu hybrid trading system
---

# Hermes Strategic Layer Deployment for senpi-waifu

## Overview
This skill outlines the process for deploying and configuring the Hermes strategic layer for the senpi-waifu hybrid trading system. It covers creating agent scripts, fixing worker issues, configuring MCP authentication, and setting up cron jobs.

## When to Use
- Initial deployment of Hermes strategic layer
- Updating or rebuilding the strategic layer components
- After making significant changes to agent logic or configuration
- When setting up a new environment for senpi-waifu

## Prerequisites
- Access to senpi-waifu repository (typically at `/home/kt/senpi-waifu`)
- GitHub access with push permissions
- Valid Senpi MCP authentication token
- Python 3.x environment
- Cron job capability (via Hermes cronjob tool or system cron)

## Step-by-Step Process

### 1. Configure MCP Authentication
Create the MCP configuration file with Senpi credentials following the format:
```yaml
# ~/.hermes/mcp/config.yaml
mcpServers:
  senpi:
    url: https://mcp.prod.senpi.ai/mcp
    headers:
      Authorization: YOUR_SENPI_AUTH_TOKEN_HERE
```

### 2. Create Agent Scripts
Create the following scripts in `/home/kt/senpi-waifu/hermes_agents/`:
- trade_evaluator.py (every 15 minutes)
- regime_classifier.py (hourly) 
- portfolio_review.py (every 6 hours)
- howl_review.py (daily at 23:55)
- whale_index.py (daily at 01:00)
- arena_learner.py (every 4 hours)

### 3. Fix Worker Issues
Update `/home/kt/senpi-waifu/worker.py` to:
1. Create required directories (outputs, state, memory) on startup
2. Handle MCP authentication token appropriately
3. Use direct HTTP MCP calls when credentials are available

### 4. Update Cron Jobs
Use the Hermes cronjob tool to update each strategic agent role with appropriate prompts and schedules.

### 5. Deploy Changes
1. Make all changes locally in the repository
2. Commit with descriptive message
3. Ensure git remote is configured for SSH access to avoid permission issues
4. Push changes to the main branch

### 6. Verification
After deployment, verify:
- Worker starts successfully and creates required directories
- No MCP connection errors in logs
- Agent scripts execute according to their schedules
- Git history shows regular agent executions

## Key Learnings

### Directory Management
Ensuring required directories exist before any file operations prevents FileNotFoundError in cron operations. This was critical for fixing the heartbeat file crash where record_heartbeat() was failing to rename temp files.

### Authentication Handling
Using environment variable fallbacks (checking multiple possible names) increases reliability across different deployment environments. The solution was to prefer SENPIAUTHTOKEN (matching upstream Senpi skills) with fallback to SENPI_API_KEY.

### Deployment Safety
Using SSH for git operations avoids HTTP 403 permission issues common with HTTPS remotes. The initial push failed due to HTTPS authentication issues, requiring a switch to SSH remote.

### Risk Management
The strategic layer should only make risk-neutral or risk-reducing changes autonomously, respecting hard constraints enforced by the mechanical layer. This was demonstrated by autonomously applying risk-reducing changes (blockNewEntries: true, allowAutoEntry: false) from the autonomous-brain.json.

### Iterative Development
The deployment required multiple iterations:
1. Initial script creation and testing
2. Identifying and fixing directory creation issues in worker.py
3. Resolving MCP authentication problems
4. Fixing git permission errors
5. Verifying each component works in isolation and together

## Risk Management Notes
- Respect the autonomous-brain.json policy (blockNewEntries, allowAutoEntry flags)
- Only make risk-reducing changes autonomously; risk increases require human confirmation
- Hard constraints (max positions, leverage limits, banned assets) are enforced by mechanical layer and cannot be overridden by the strategic layer
- The strategic layer influences the system through config updates, signal evaluation, and trade execution via the same mcporter interface as the mechanical layer

## Verification Checklist
- MCP configuration properly formatted and secured in ~/.hermes/mcp/config.yaml
- All agent scripts present and executable in /home/kt/senpi-waifu/hermes_agents/
- Worker fixes applied for directory creation (outputs, state, memory) and token handling (SENPIAUTHTOKEN preference)
- Cron jobs updated and running on schedule via Hermes cronjob tool
- Changes committed and pushed successfully to github.com:tradewife/senpi-waifu.git
- System logs show clean startup with directory creation messages and regular agent execution without MCP connection errors