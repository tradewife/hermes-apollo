---
name: senpi-auth-token-consistency-fix
description: Audit and fix Senpi authentication token consistency issues across worker and agent scripts to prevent 401 errors
category: senpi-waifu
---

# Senpi Auth Token Consistency Fix

## Description
This skill provides a process for auditing and resolving authentication token inconsistencies in Senpi codebases that lead to 401 Unauthorized errors from MCP API calls. It focuses on ensuring consistent environment variable usage across worker processes, agent initialization scripts, and configuration files.

## When to Use
- Encountering 401 errors when making Senpi MCP API calls
- Suspecting environment variable inconsistency between different system components
- Preparing for deployment or troubleshooting authentication issues in Senpi-based systems

## Audit Process

### 1. Token Read Inventory
- Systematically search the codebase for all instances where authentication tokens are read from environment variables
- Focus on identifying which specific variables are being checked (e.g., SENPIAUTHTOKEN, SENPI_API_KEY, SENPI_AUTH_TOKEN)
- Document the location and context of each read operation
- Note any fallback chains or default value handling

### 2. API Call Tracing
- Locate all outbound calls to the Senpi MCP endpoint in the codebase
- For each call site, identify:
  * The specific function or script making the call
  * How the Authorization header is constructed
  * Which token variable(s) are used in the header construction
- Verify consistency between the token reads identified in step 1 and the tokens used in API calls

### 3. Consistency Analysis
- Compare token usage patterns across different components:
  * Worker/daemon initialization processes
  * Agent initialization and configuration scripts
  * Child process environment propagation
  * Any direct HTTP client implementations
- Identify mismatches where:
  * Different components check different environment variables
  * Token reads don't match token usage in API calls
  * Warning/error conditions are incorrectly implemented
  * Fallback chains are inconsistent

## Resolution Strategy

### 1. Establish Token Precedence
Define a clear priority order for token environment variables (e.g., PRIMARY_TOKEN first, then SECONDARY_FALLBACK, then TERTIARY_FALLBACK).

### 2. Apply Uniform Pattern
Ensure all components follow the same token retrieval pattern:
- Check variables in the established precedence order
- Use the first non-empty value found
- Apply this consistently in:
  * Main process initialization
  * Agent startup scripts
  * Configuration loading routines
  * Child process environment setup

### 3. Fix Logic Errors
Correct any inverted logic in missing token detection:
- Ensure warning messages trigger when NO token is found (not when one IS found)
- Validate that error handling properly communicates missing credentials

### 4. Maintain Backward Compatibility
During transition periods:
- Consider setting multiple environment variables to the same value
- Keep fallback variables enabled for compatibility with legacy code paths
- Document the preferred variable for future reference

## Verification Steps
After implementing fixes:
1. Restart all services that depend on the token (workers, dashboards, agent systems)
2. Test token-dependent operations (e.g., API calls that previously returned 401)
3. Confirm absence of authentication errors in application logs
4. Verify that child processes inherit the correct token values
5. Monitor system behavior for consistency across deployments

## Key Principles
- Single source of truth: Establish one canonical method for token retrieval
- Consistent fallbacks: Use the same priority chain everywhere
- Clear messaging: Provide accurate diagnostics when tokens are missing
- Minimal changes: Focus fixes specifically on the inconsistency issues
- Deployment awareness: Consider how environment variables are set in target platforms

## Stale Bearer Token Scenario (Server-Side Revocation)

Senpi appears to **server-side revoke old bearer tokens** when a new one is issued (e.g., after re-login). The old JWT may not be expired (exp claim is months away), but the server returns `"User not authorized"`. This is a distinct failure mode from env var name mismatches.

### Symptoms
- Senpi MCP tools return `"User not authorized"` or `"INTERNAL"` errors
- JWT decode shows `expired: False` — token is still valid by its exp claim
- Different JTIs found when comparing tokens across config files

### Diagnostic Steps
1. Decode both tokens and compare JTIs and `iat` (issued-at) timestamps
2. The token with the higher `iat` is the newer one and likely still valid
3. Test the newer token with a direct MCP `initialize` request to confirm server acceptance
4. The canonical freshest source is the `SENPI_AUTH_TOKEN` value in the senpi-waifu project `.env` file

### Fix
Replace the stale Bearer token in the Hermes MCP config with the newer token from the senpi-waifu `.env` file. The fix takes effect on the **next session** — MCP connections initialized with the old token cannot be retroactively fixed.

### Quick Diagnostic (Python)
```python
import json, base64

def decode_jwt(token):
    parts = token.split(".")
    payload_b64 = parts[1] + "=" * (4 - len(parts[1]) % 4)
    return json.loads(base64.urlsafe_b64decode(payload_b64))

# Compare two tokens by JTI and issued-at
claims = decode_jwt(TOKEN_STRING)
print(f"jti={claims['jti']}, iat={claims['iat']}, user={claims.get('senpi_user_id')}")
```

## Example Resolution Path
In a Senpi deployment experiencing 401 errors:
1. Audit revealed worker.py checked SECONDARY/TERTIARY variables while documentation referenced PRIMARY as preferred
2. Tracing showed agent scripts only checked SECONDARY variable
3. Mismatch: PRIMARY variable set in environment but unused by workers and agents
4. Resolution: Updated all components to check PRIMARY first, then fall back to SECONDARY/TERTIARY
5. Outcome: Resolved 401 errors after ensuring PRIMARY variable was properly set in deployment environment

## Safety Guidelines
- Create backups before modifying any files
- Test changes in a non-production environment first
- Make incremental changes and verify after each modification
- Keep detailed records of what was changed for easy rollback if needed
- Ensure all team members understand the token variable convention being implemented