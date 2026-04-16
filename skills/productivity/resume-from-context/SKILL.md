---
name: resume-from-context
description: Resume work from a past conversation by validating historical context against current system state and synthesizing informed output
category: productivity
---

# Resume from Previous Conversation with Context Validation

## When to Use
When you need to:
1. Resume work from a specific past conversation referenced by ID
2. Validate that historical context against current system state
3. Fetch current data to inform decisions
4. Provide structured output based on both historical and current information

## Approach
1. Use `session_search` with the specific conversation ID to find the past conversation
2. If needed, use `session_search` again on the found session ID to get full context
3. Validate current system state by checking relevant files, git status, etc.
4. Fetch any necessary current data (market data, API calls, etc.)
5. Synthesize historical context with current state to provide informed output
6. Deliver response in the expected format/style for the current task

## Steps
1. **Find past conversation**: 
   - `session_search(query="<conversation_id>")`
   - Note the session_id from results

2. **Get full context** (if needed):
   - `session_search(query="<session_id_from_step1>")`

3. **Validate current state**:
   - Check relevant directories/files with `read_file`, `terminal`, etc.
   - Run `git pull` to ensure repo is current
   - Check key state files mentioned in the historical context

4. **Fetch current data**:
   - Use appropriate MCP tools or API calls based on task domain
   - For trading systems: market data, account info, etc.
   - For other domains: relevant current data sources

5. **Synthesize and respond**:
   - Combine insights from historical context with current state
   - Provide actionable output in expected format
   - Include both what was found in history and what's current

## Example Usage (Hermes Trading System)
```bash
# 1. Find conversation
session_search(query="20260324_053746_0a8cac")

# 2. Get session details  
session_search(query="20260324_093654_8121bb")

# 3. Validate trading system state
read_file(path="/home/kt/senpi-waifu/config/risk-regime.json")
read_file(path="/home/kt/senpi-waifu/outputs/autonomous-brain.json")
terminal(command="cd /home/kt/senpi-waifu && git pull")
terminal(command="cd /home/kt/senpi-waifu && ls -la state/")

# 4. Fetch current market data
mcp_senpi_market_get_asset_data(asset="BTC", candle_intervals=["4h", "1h"])
mcp_senpi_market_get_asset_data(asset="ETH", candle_intervals=["4h", "1h"])

# 5. Provide Hermes-style output based on synthesis
```

## Validation Checklist
- [ ] Past conversation located and understood
- [ ] Current system state checked for drift from historical context
- [ ] Relevant current data fetched
- [ ] Output addresses both historical instructions and current reality
- [ ] Response format matches expected style for current task domain

## Pitfalls to Avoid
- Assuming historical context is still current - always validate
- Missing critical state files that may have changed
- Forgetting to sync repo before checking files
- Providing output based solely on history without current validation
- Not adapting response format to current task requirements