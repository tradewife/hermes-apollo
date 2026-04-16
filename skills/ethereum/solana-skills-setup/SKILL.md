---
name: solana-skills-setup
description: Install and audit Solana Foundation AI agent skills for development. Covers discovering community skills, correct install commands, and critical gotchas for DeFi protocol development. Use before starting any Solana project that needs AI agent coding assistance.
---

# Solana AI Agent Skills Setup

## Install the Foundation Skill

```bash
npx skills add --yes https://github.com/solana-foundation/solana-dev-skill
```

This installs `solana-dev` with embedded references covering:
- Security checklist (`references/security.md`)
- Testing strategy (`references/testing.md`) — LiteSVM, Mollusk, Surfpool
- Token-2022 (`references/kit/programs/token-2022.md`)
- Anchor (`references/programs/anchor.md`)
- Pinocchio (`references/programs/pinocchio.md`)
- Kit/Web3 interop (`references/kit-web3-interop.md`)
- IDL/Codegen (`references/idl-codegen.md`)
- Frontend framework-kit (`references/frontend-framework-kit.md`)
- Payments (`references/payments.md`)

## Install Community Skills

Community skills are NOT individual repos — they live in monorepos.

### Jupiter (DEX aggregator)
```bash
npx skills add --yes https://github.com/jup-ag/agent-skills
```
Installs: `integrating-jupiter`, `jupiter-lend`, `jupiter-swap-migration`

### SendAIfun monorepo (20+ skills)
```bash
npx skills add --yes https://github.com/sendaifun/skills
```
Installs: `squads`, `pyth`, `switchboard`, `kamino`, `sanctum`, `orca`, `helius`, `solana-kit`, `solana-kit-migration`, `surfpool`, `vulnhunter`, `metaplex`, `raydium`, `drift`, `pumpfun`, `marginfi`, `meteora`, `lulo`, `coingecko`, `debridge`, `light-protocol`, `dflow`, `ranger-finance`, `svm`, `pinocchio-development`, `zz-code-recon`

### Other community skills
```bash
npx skills add --yes https://github.com/itsahedge/helius-api
npx skills add --yes https://github.com/ylytdeng/solana-jupiter-swap
npx skills add --yes https://github.com/metaplex-foundation/skill
npx skills add --yes https://github.com/magicblock-labs/magicblock-dev-skill
```

## Discovering New Skills

The https://solana.com/skills page is **JS-rendered** — `browser_snapshot` truncates it and `browser_scroll` may not reveal community skills. Use HTML scraping instead:

```python
import urllib.request, re

url = "https://solana.com/skills"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
html = urllib.request.urlopen(req, timeout=15).read().decode("utf-8")

# Extract all GitHub URLs from Community Skills section
community_start = html.find("Community Skills")
if community_start >= 0:
    community = html[community_start:]
    urls = re.findall(r'github\.com/([^\s"<>]+)', community)
    seen = set()
    for u in urls:
        if u not in seen:
            seen.add(u)
            print(f"  https://github.com/{u}")
```

## Critical Gotchas for DeFi Protocol Development

### Jupiter Trigger API does NOT support Token-2022
If your token uses Token-2022 extensions, you CANNOT use Jupiter's Trigger (limit orders) or Recurring (DCA) APIs. Use Ultra Swap (order/execute) instead, which does support Token-2022.

### Pyth has NO native TWAP
Pyth provides spot prices + EMA (~1hr window), NOT time-weighted average price. If you need TWAP (e.g., for price floor mechanisms, manipulation resistance), you MUST build an on-chain accumulator:
- Store `price_cumulative: u128` and `last_update_timestamp: i64` in an account
- On each observation: `price_cumulative += pyth_price * elapsed`
- Read TWAP: `(current_cumulative - cumulative_N_ago) / window_seconds`
- Minimum 3 observations in window to prevent single-point manipulation

### Switchboard vs Pyth
- Pyth: 100+ data sources, native confidence intervals, better for manipulation resistance
- Switchboard: Permissionless custom feeds, TEE security, lower cost, fewer default sources
- Neither provides TWAP — on-chain accumulator required regardless of choice

### Squads V4 has NO PDA signer support
Squads multisig vaults cannot be CPI signers. Agents must hold actual keypairs to sign Squads proposals. For treasury-only ops, use a separate PDA-derived authority (not Squads).

### Surfpool cheatcodes enable adversarial testing
Use `setAccount` to manipulate oracle prices, `timeTravel` to test time-locks, `advanceClock` for slot-based cooldowns, `pauseClock` to test edge cases where agents are offline.

## Verification

After install, verify all skills are present:
```bash
ls .agents/skills/ | wc -l  # Should be 40+
```

Key skills to confirm:
- `solana-dev` (foundation)
- `squads` (multisig)
- `pyth` (oracle)
- `integrating-jupiter` (DEX)
- `switchboard` (alt oracle)
- `kamino` (yield)
- `sanctum` (LST)
- `orca` (CLMM)
- `helius` (RPC infra)
- `vulnhunter` (security audit)
- `surfpool` (testing)
