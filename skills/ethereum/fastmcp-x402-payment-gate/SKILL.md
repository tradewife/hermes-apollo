---
name: fastmcp-x402-payment-gate
description: Add x402 payment middleware to any FastMCP server. Covers ASGI wrapping, EIP-712 verification, nonce replay protection, and onchain settlement.
---

# FastMCP x402 Payment Gate

Add HTTP 402 payment enforcement to any FastMCP MCP server.

## Key Insight: FastMCP Middleware Wrapping

FastMCP does NOT natively support ASGI middleware. To wrap it:

```python
from fastmcp import FastMCP

mcp = FastMCP("MyServer")
# ... register tools/resources/prompts ...

inner_app = mcp.http_app()  # Returns StarletteWithLifespan

# Wrap with custom ASGI middleware
class PaymentMiddleware:
    def __init__(self, app):
        self.app = app
    async def __call__(self, scope, receive, send):
        # Only intercept http POST requests
        if scope["type"] != "http" or scope["method"] != "POST":
            await self.app(scope, receive, send)
            return
        # ... check X-Payment header, return 402 or pass through ...

app = PaymentMiddleware(inner_app)
```

Serve with uvicorn directly — NOT `fastmcp run`:
```dockerfile
CMD ["python", "-m", "my_package.start"]
```

## Architecture (3 files)

1. **verify.py** — Decodes base64 X-Payment header, validates payload (amount, chain, asset, recipient, expiry), nonce replay check, ECDSA signer recovery via `eth_account.Account.recover_message()`. EIP-712 with personal_sign fallback.

2. **middleware.py** — Raw ASGI middleware. Returns 402 JSON body on missing/invalid payment. Headers from `scope["headers"]` as `[bytes, bytes]` tuples.

3. **settle.py** — Post-generation onchain settlement. Uses `eth_abi` for calldata, `Account.sign_transaction()` for signing, `httpx` for JSON-RPC. Polls for receipt.

## EIP-712 Schema

Types: `Payment(amount uint256, asset string, recipient address, nonce uint256, expiry uint256)`
Domain: name=Service, version=1, chainId=target, verifyingContract=recipient

Fallback personal_sign format:
```
Service Payment
Amount: <wei>
Asset: ETH
Recipient: 0x...
Nonce: <int>
Expiry: <unix_ts>
```

## Config Pattern

```python
x402_enabled: bool = False     # Dev mode bypass when false
auteur_wallet: str = ""        # Recipient address
shot_price_usdc: str = "..."   # Min amount in wei
```

## Pitfalls

- `m.http_app()` is undocumented in most FastMCP versions — verify with `hasattr(m, 'http_app')`
- Must handle both `http` and `websocket` scope types — only intercept `http` POST
- `eth-account` package must be explicitly added to Dockerfile pip install
- Use raw ASGI class wrapping, NOT `app.add_middleware()` (Starlette wrapper won't work)
- Nonce cache must be bounded with eviction to prevent memory leak
- Railway CMD must be `python -m pkg.start`, never `fastmcp run ...`
- ASGI 402 response: send `http.response.start` with status 402, then `http.response.body` with JSON bytes
