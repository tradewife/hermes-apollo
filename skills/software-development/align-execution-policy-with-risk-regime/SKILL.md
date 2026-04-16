---
name: align-execution-policy-with-risk-regime
description: Ensure execution policy in autonomous-brain.json aligns with risk regime settings
version: 1.0
---
# Align Execution Policy with Risk Regime

## Purpose
Ensure that the execution policy in autonomous-brain.json aligns with the current risk regime settings in config/risk-regime.json, making risk-reducing adjustments when needed.

## When to Use
- During regular system checks (Trade Evaluator agent)
- When autonomous-brain.json shows more permissive settings than risk-regime.json
- As part of risk management to ensure consistency between strategic layer outputs

## Steps

1. **Read current state**
   ```bash
   cd /home/kt/senpi-waifu
   # Check risk regime
   cat config/risk-regime.json | python3 -m json.tool | grep -A 20 '"BASELINE"' || grep -A 20 '"RISK_ON"' || grep -A 20 '"RISK_OFF"'
   
   # Check autonomous brain execution policy
   cat outputs/autonomous-brain.json | python3 -m json.tool | grep -A 10 '"executionPolicy"'
   ```

2. **Identify misalignment**
   - If risk-regime.json shows `newEntriesAllowed: false` but autonomous-brain.json executionPolicy has `blockNewEntries: false`
   - If risk-regime.json shows `autoEntryEnabled: false` but autonomous-brain.json executionPolicy has `allowAutoEntry: true`
   - If risk-regime.json shows lower maxSlots/allocPct than autonomous-brain.json caps

3. **Make risk-reducing adjustments to autonomous-brain.json**
   ```python
   import json
   from pathlib import Path
   from datetime import datetime, timezone
   
   ab_path = Path('/home/kt/senpi-waifu/outputs/autonomous-brain.json')
   with ab_path.open('r') as f:
       data = json.load(f)
   
   # Apply risk-reducing changes as needed
   # Example: block new entries if regime doesn't allow them
   data['executionPolicy']['blockNewEntries'] = True
   data['executionPolicy']['allowAutoEntry'] = False
   # Update timestamps
   now = datetime.now(timezone.utc).isoformat()
   data['executionPolicy']['generatedAt'] = now
   data['generatedAt'] = now
   
   with ab_path.open('w') as f:
       json.dump(data, f, indent=2)
   ```

4. **Verify changes**
   ```bash
   cat outputs/autonomous-brain.json | python3 -m json.tool | grep -A 5 '"blockNewEntries"\|\"allowAutoEntry\"'
   ```

5. **Commit changes** (if making autonomous adjustments)
   ```bash
   git add outputs/autonomous-brain.json
   git commit -m "risk: tighten execution policy to align with risk regime"
   git push
   ```

## Risk Considerations
- Only make risk-neutral or risk-reducing changes autonomously
- Never increase leverage, slots, or allocation limits without human approval
- Always verify that changes align with the current risk regime
- Keep git audit trail of all changes

## Verification
- Check that autonomous-brain.json execution policy is not more permissive than risk-regime.json
- Confirm that blockNewEntries and allowAutoEntry settings are appropriate for the regime
- Validate that maxSlotsCap and allocPctCap don't exceed regime limits

## Examples
- When regime is BASELINE (newEntriesAllowed: false), ensure blockNewEntries: true
- When regime is BASELINE (autoEntryEnabled: false), ensure allowAutoEntry: false
- When regime is RISK_OFF, ensure all entry mechanisms are disabled