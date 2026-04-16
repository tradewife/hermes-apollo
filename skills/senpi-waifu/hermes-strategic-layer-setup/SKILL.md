---
name: hermes-strategic-layer-setup
description: Set up and configure the Hermes strategic layer for senpi-waifu hybrid trading system
category: senpi-waifu
---

# Hermes Strategic Layer Setup for senpi-waifu

## Overview
This skill documents the process of setting up and configuring the Hermes strategic layer for the senpi-waifu hybrid trading system, replacing the Oz cloud agents with local Hermes cron jobs.

## Prerequisites
- Access to senpi-waifu repository
- Senpi MCP authentication token
- GitHub access (SSH recommended)
- Python 3.x environment
- Access to Railway deployment (for verification)

## Step-by-Step Process

### 1. Initial Repository Setup
- Clone or pull the senpi-waifu repository
- Ensure you have the latest version of the codebase

### 2. Fix Worker Script Issues
Address two critical issues in the worker script:

**Directory Creation Fix**
- Add code near startup to ensure required directories exist
- Create outputs, state, and memory directories if they don't exist
- This prevents FileNotFoundError when agents try to write files

**MCP Token Handling Fix**
- Configure the script to properly access Senpi authentication tokens
- Use the standard environment variable name expected by Senpi skills
- Implement fallback logic for compatibility

### 3. Create Hermes Agent Scripts
Create specialized Python scripts for each Hermes agent role:

**Trade Evaluator** (every 15 minutes)
- Validates queued scanner signals from mechanical layer
- Executes approved trades via mcporter interface
- Maintains trade journal for performance tracking

**Regime Classifier** (hourly)
- Analyzes market conditions to determine risk regime
- Updates risk-regime.json with RISK_ON/BASELINE/RISK_OFF classification

**Portfolio Review** (every 6 hours)
- Checks risk rails and reviews open positions
- Generates structured portfolio reports

**HOWL Nightly Review** (daily at 23:55)
- Performs comprehensive self-improvement analysis
- Generates nightly reports and updates distilled memory

**Whale Index Manager** (daily at 01:00)
- Manages copy-trade slot/watch/rebalance state
- Tracks performance of top traders for potential copying

**Arena Strategy Learner** (every 4 hours)
- Analyzes Senpi Predators leaderboard data
- Generates actionable recommendations with confidence levels

### 4. Configure MCP Authentication
Set up proper authentication for Senpi MCP server access:
- Create configuration file with MCP server details
- Include authentication headers using your Senpi token
- Ensure secure storage of credentials

### 5. Update Cron Jobs
Configure all 6 Hermes cron jobs to execute the corresponding agent scripts:
- Map each scheduled job to its respective Python script
- Ensure proper working directory and environment
- Verify scripts have executable permissions

### 6. Git Authentication Setup
If experiencing authentication issues with GitHub:
- Configure SSH keys for secure, passwordless authentication
- Update remote URL to use SSH protocol
- Verify access rights to the repository

### 7. Deployment and Verification
Deploy the changes and verify proper operation:
- Commit all modifications to the repository
- Push changes to the remote repository
- Monitor logs for successful execution of all components
- Check for resolution of previously observed errors

## Key Principles Applied

1. **Defensive Directory Management**: Always verify required directories exist before attempting file operations
2. **Environment Variable Standards**: Follow established naming conventions for Senpi integrations
3. **Secure Authentication Practices**: Use SSH for git operations and proper MCP token handling
4. **Incremental Deployment Strategy**: Test components individually before enabling full automation
5. **Risk-Aware Configuration Changes**: Limit autonomous changes to risk-reducing actions only

## Verification Checklist

After implementation, confirm:
- Startup logs show directory initialization messages
- MCP authentication succeeds without errors
- Cron heartbeats update regularly indicating agent execution
- Git operations complete successfully
- Risk regime updates reflect market conditions appropriately
- Trade journal accumulates entries when valid signals are processed
- All agent scripts complete without unhandled exceptions

## Troubleshooting Guidance

For common issues:
- **Missing directories**: Verify startup code creates outputs/, state/, memory/ folders
- **MCP authentication failures**: Check environment variable configuration and token validity
- **Git permission errors**: Confirm SSH key setup and remote URL configuration
- **Script execution errors**: Validate Python dependencies and file paths
- **Cron job failures**: Examine agent logs and return codes

This methodology provides a reliable framework for deploying the Hermes strategic layer in senpi-waifu and similar algorithmic trading systems requiring coordinated mechanical and strategic components.