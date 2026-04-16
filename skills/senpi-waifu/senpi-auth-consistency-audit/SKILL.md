---
name: senpi-auth-consistency-audit
description: Audit and fix environment variable consistency for API authentication in Senpi codebase to prevent 401 errors.
category: senpi-waifu
---

# Senpi Auth Consistency Audit

## Description
Audit and fix inconsistencies in how authentication tokens are read from environment variables and used in API calls within the Senpi codebase. This prevents 401 Unauthorized errors caused by token mismatches.

## When to Use
- Experiencing 401 errors from Senpi MCP API calls
- Suspecting environment variable inconsistency issues
- Preparing for deployment to ensure auth reliability

## Steps

### 1. Environment Variable Inventory
Search for all reads of authentication-related environment variables.

```bash
grep -r "SENPIAUTHTOKEN\|SENPI_API_KEY\|SENPI_AUTH_TOKEN" --include="*.py" --include="*.sh" .
```

Document each finding with:
- Variable name
- File location
- Fallback/default behavior

### 2. API Call Tracing
Locate all outbound calls to the Senpi MCP endpoint.

```bash
grep -r "mcp\.prod\.senpi\.ai" --include="*.py" .
```

For each call, identify:
- Calling function
- Token source used for Authorization header
- Consistency with inventory findings

### 3. Mismatch Detection
Flag these problematic patterns:
- Different variables used for reading vs. API calls
- Missing Authorization headers
- Variables read but not configured in deployment
- Startup checks using different variables than runtime paths

### 4. Resolution Strategy
Establish a consistent token reading precedence:
1. Primary variable (e.g., SENPIAUTHTOKEN)
2. Secondary fallback (e.g., SENPI_API_KEY)  
3. Tertiary fallback (e.g., SENPI_AUTH_TOKEN)

Apply this pattern uniformly across:
- Worker/daemon initialization
- Agent initialization scripts
- Configuration/setup scripts
- Child process environment propagation

### 5. Verification
After implementing changes:
1. Restart all relevant services
2. Test authentication-dependent operations
3. Confirm absence of 401 errors in logs
4. Verify token propagation to child processes

## Key Principles
- Single source of truth for token retrieval
- Consistent fallback chain across all code paths
- Explicit handling of missing token scenarios
- Minimal, focused changes to reduce risk
- Preserve existing functionality while fixing consistency

## Example Application
In a Senpi deployment experiencing intermittent 401s:
1. Inventory revealed worker.py read SENPI_API_KEY/SENPI_AUTH_TOKEN but documentation referenced SENPIAUTHTOKEN
2. Tracing showed Oz agent scripts only checked SENPI_API_KEY
3. Mismatch: SENPIAUTHTOKEN set in Railway but unused by worker and Oz agents
4. Fix: Updated all components to check SENPIAUTHTOKEN first, then fallbacks
5. Result: Resolved 401 errors after setting SENPIAUTHTOKEN in environment

## Safety Considerations
- Maintain backward compatibility during transition
- Test changes in staging before production
- Keep backups of modified files
- Monitor logs closely after deployment