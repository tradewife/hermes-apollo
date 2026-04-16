---
name: senpi-waifu-trade-evaluator-git-safe-pull
description: Safely pull updates for the senpi-waifu repository without overwriting unstaged changes in the outputs/ directory (which are managed by other cron jobs).
category: senpi-waifu
---

# Senpi Waifu Trade Evaluator: Safe Git Pull

This skill provides a procedure to safely update the senpi-waifu repository in a cron job environment where the `outputs/` directory contains frequently changing files managed by other cron jobs (e.g., arbitrator, brain, heartbeats). The goal is to pull the latest code without overwriting these volatile files.

## Procedure

1. **Change to the senpi-waifu directory**:
   ```bash
   cd /home/kt/senpi-waifu
   ```

2. **Stash any unstaged changes** to allow a clean pull:
   ```bash
   git stash push -m "cron stash" --quiet
   ```

3. **Pull with rebase** to get the latest changes from the remote:
   ```bash
   git pull --rebase --quiet
   ```

4. **Drop the stash** to leave the unstaged changes (e.g., in `outputs/`) as they were:
   ```bash
   git stash drop --quiet
   ```
   > **Note**: This assumes the stash can be cleanly dropped. If there are conflicts, the stash drop will fail and the stash will be retained for manual resolution. In the context of the trade evaluator cron job, we accept the risk of dropping the stash because the `outputs/` directory is not managed by this job and we do not want to overwrite its contents.

5. **Proceed with the rest of the trade evaluator procedure** (checking risk regime, pending entries, open positions, etc.).

## Why This Works

- The `outputs/` directory is modified by other cron jobs (e.g., `outputs/arbiter-state.json`, `outputs/cron-heartbeats.json`). These files are not part of the repository's source code and should not be overwritten by the trade evaluator's pull.
- By stashing before the pull and dropping after, we ensure that the repository's source code is updated while leaving the working tree changes (in `outputs/`) intact.
- The trade evaluator only cares about the `state/` and `memory/` directories (and the `config/` directory for reading). These are either not affected by the stash or are explicitly reset by the trade evaluator (e.g., `state/pending-entries.json`).

## Caveats

- If the stash contains changes that conflict with the pulled commits, the `git pull --rebase` may fail. In that case, the stash remains and the trade evaluator should abort (or handle the conflict manually). However, in practice, the `outputs/` directory changes are unlikely to conflict with source code updates.
- This skill is intended for use in the senpi-waifu trade evaluator cron job. It may not be suitable for other contexts where preserving unstaged changes is not desired.

## Verification

After running this skill, you can verify that:
- The repository is up to date with the remote (check `git log`).
- The `outputs/` directory still contains its previous content (or at least, it hasn't been overwritten by the pull).
- The `state/` and `memory/` directories are in the expected state for the trade evaluator to proceed.
