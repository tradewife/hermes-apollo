---
name: foundry-workflow
description: Foundry toolchain setup and Solidity project workflow. Covers installation gotchas, config fixes, deployment patterns, and common compilation errors. Use before starting any Foundry/Solidity project.
---

# Foundry Workflow

## When To Use

Setting up a Foundry project, compiling Solidity, deploying to testnet/mainnet, or debugging compilation failures.

## Installation

Download foundryup to a file first, then execute it. Do NOT pipe curl directly to bash.

```bash
wget -qO /tmp/foundryup.sh https://foundry.paradigm.xyz
bash /tmp/foundryup.sh
```

Binaries install to `~/.foundry/bin/`. Prepend to PATH or use full paths.

## Conflicting `forge` binary

On some systems `/usr/bin/forge` is NOT Foundry -- it is a ZOE binary. Symptoms:

```
$ forge --version
ZOE ERROR (from forge): zoeParseOptions: unknown option (--version)
```

Fix: remove the conflicting binary, then install Foundry properly (see above).

## `forge init` flags

- `--no-commit` does NOT exist
- Use `--force` to init in non-empty directory
- Use `--empty` to skip example Counter.sol files
- Use `--no-git` to avoid git submodules for lib installs

```bash
forge init --no-git --force --empty /path/to/project
```

## Installing OpenZeppelin

```bash
forge install OpenZeppelin/openzeppelin-contracts --no-git
```

Then create `remappings.txt`:
```
@openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/
forge-std/=lib/forge-std/src/
```

## Compilation Gotchas

### via_ir required for nested calldata arrays in storage

Error:
```
Error (1834): Copying nested calldata dynamic arrays to storage is not implemented
```

Fix: add to `foundry.toml`:

```toml
[profile.default]
via_ir = true
optimizer = true
optimizer_runs = 200
```

Note: `via_ir` makes compilation slower (~10-30s) but handles complex storage patterns.

### SafeERC20 warnings

Always use `SafeERC20` for ERC-20 transfers:

```solidity
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MyContract {
    using SafeERC20 for IERC20;
    // Use .safeTransfer() and .safeTransferFrom() instead of .transfer()
}
```

## Deployment

```bash
forge create src/MyContract.sol:MyContract \
  --rpc-url $RPC_URL \
  --private-key $PRIVATE_KEY \
  --constructor-args $ARGS
```

### Base chain config in foundry.toml

```toml
[rpc_endpoints]
base_sepolia = "https://sepolia.base.org"
base = "https://mainnet.base.org"
```

### Check balance before deploy

```bash
cast balance $ADDRESS --rpc-url https://sepolia.base.org
```

### Verify on block explorer

```bash
forge verify-contract $ADDRESS src/MyContract.sol:MyContract \
  --rpc-url $RPC_URL \
  --verifier etherscan \
  --verifier-url https://api-sepolia.basescan.org/api \
  --constructor-args $ARGS
```

## Hermes `read_file` Redaction Artifact

The Hermes `read_file` tool redacts the `==` operator as `***` in displayed output. This makes Solidity files appear corrupted when they are actually fine.

Symptoms: `read_file` shows `if (job.token=*** address(0))` but the file actually contains `job.token == address(0)`. This is purely a display artifact.

Verification: Read the raw file bytes via Python to see actual content:
```python
lines = open('/path/to/file.sol').readlines()
print(lines[89])  # Line 90 (0-indexed)
```

Do NOT attempt to "fix" files that only appear corrupted via `read_file`. Always verify with raw Python I/O first.

## Deploying to Base Sepolia

### Use `--legacy` flag

Base Sepolia requires legacy transactions for simple account deployments:
```bash
forge create src/Contract.sol:Contract \
  --rpc-url https://sepolia.base.org \
  --private-key $PK \
  --legacy --broadcast
```

### Gas limits: use 500k minimum for string storage

Base is an L2 with L1 blob gas costs. Functions that store strings (like CID fields) need more gas than expected on L1. 200k is NOT enough for a `spend(string taskId, string cid)` call — it reverts with status 0 consuming all gas. Use 500k as safe default.

### Nonce management with `cast send` in scripts

When calling `cast send` from Python subprocesses, shell `source .env` does NOT propagate DEPLOYER_PRIVATE_KEY. Pass `--private-key $PK` explicitly. Failed TXs leave nonce gaps — use explicit `--nonce` by querying `cast nonce` first.

## IPFS Without External Pinning Services

Lighthouse, nft.storage, Pinata, web3.storage all require API keys or may be blocked from sandboxed networks. Fallback: install kubo (go-ipfs) directly via binary download, init with `--profile test`, run daemon `--offline`, and use `ipfs add -Q`. Produces deterministic CIDv0s that are cryptographically verifiable.

## Hermes Sandbox Filesystem Note

The `write_file` tool may write to a sandbox path that does NOT match the real filesystem. If a file does not appear at the expected path after `write_file`, write it directly via Python in `execute_code`:

```python
with open('/home/user/path/file.sol', 'w') as f:
    f.write(content)
```

Always verify the file exists after writing.
