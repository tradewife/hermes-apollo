---
name: auth-mcp-connectivity-audit
category: senpi-waifu
description: Perform a targeted authentication and MCP connectivity audit on a codebase to identify environment variable usage, API call patterns, and consistency issues between configuration and implementation.
---

# Auth and MCP Connectivity Audit Skill

## Purpose
Perform a targeted authentication and MCP connectivity audit on a codebase to identify environment variable usage, API call patterns, and consistency issues between configuration and implementation.

## When to Use
- Before deploying changes that affect authentication
- When experiencing 401/403 errors from API calls
- During security reviews of credential handling
- When migrating between different auth mechanisms
- To verify consistency between documentation and code

## Steps

### 1. ENV VAR INVENTORY
Find every place in the codebase that reads an auth/token environment variable.

Approach:
- Search for environment variable reads related to authentication tokens
- Look for patterns involving SENPI, API_KEY, AUTH_TOKEN, or similar variable names
- For each match, record the variable name, file location, and whether fallbacks/defaults exist

### 2. MCP CALL TRACE
Find every place that makes an outbound HTTP call to the Senpi MCP endpoint.

Approach:
- Search for references to the Senpi MCP endpoint URL (mcp.prod.senpi.ai or equivalents)
- For each call site, identify:
  * The calling file and function
  * The variable used for the Authorization header
  * Whether this variable matches those found in step 1

### 3. MISMATCH DETECTION
Flag any inconsistencies including:
- Different variable names used across call paths
- Calls made without authorization headers
- Variables read but not configured in deployment environment
- Startup checks that read different variables than actual call paths use

### 4. OUTPUT FORMAT
Present findings in a table:

```
| File | Variable read | Used in MCP call? | Risk |
|------|--------------|-------------------|------|
```

Followed by a list of mismatches/gaps with one-line fix recommendations.

If all checks pass, output: "Auth path is consistent — single token source confirmed."

## Example Findings
In a recent audit of the senpi-waifu codebase:
- Environment variables read: SENPI_API_KEY and SENPI_AUTH_TOKEN (in shared utilities and worker configuration)
- MCP calls use: _SENPI_AUTH_TOKEN derived from SENPI_API_KEY or SENPI_AUTH_TOKEN
- Identified mismatch: Worker comments referenced SENPIAUTHTOKEN as preferred token source but implementation checked different variables
- Recommended fixes: 
  * Align worker environment variable reading with documented preference order
  * Correct inverted logic in missing-token warning condition

## Notes
- This audit traces the path from environment configuration to HTTP header construction
- Does not validate token correctness or expiration
- For Senpi systems, verify mcporter is bypassed when direct HTTP calls are used
- Focus on consistency between comments, documentation, and actual implementation
- Watch for logical errors in conditional checks (e.g., reversed true/false conditions)