---
name: fix-python-deployment-syntax-and-logic-errors
category: software-development
description: A systematic approach to fixing Python deployment errors involving syntax and logic issues.
---
# Fix Python Deployment Syntax and Logic Errors

## Overview
This skill provides a systematic approach to fixing Python deployment errors that involve both syntax issues (SyntaxError, IndentationError) and logic errors (AttributeError, NameError) that surface after initial syntax fixes. It is particularly useful for deployed applications where logs reveal errors iteratively.

## When to Use
- You encounter a SyntaxError in a Python file during deployment or testing.
- After fixing syntax, new runtime errors appear (e.g., AttributeError, NameError).
- The application is deployed in a remote environment (e.g., Railway, Docker) and you can only observe logs.
- You need to fix errors without introducing new ones.

## Steps

### 1. Capture the Initial Error
- Retrieve the error from logs (e.g., `railway logs`, `docker logs`, or local console).
- Identify the error type (SyntaxError, IndentationError, etc.) and the file/line number.

### 2. Fix Syntax Errors
- Navigate to the offending file.
- Use Python's `ast` module to verify syntax:
  ```python
  import ast
  with open('file.py', 'r') as f:
      ast.parse(f.read())  # Will raise SyntaxError if invalid
  ```
- Examine the context around the reported line (usually 2-3 lines before and after).
- Common fixes:
  - **Malformed f-strings**: Ensure proper quoting (e.g., `f"string"` not `f\"string\"`).
  - **Indentation**: Ensure consistent indentation (4 spaces per level) and that statements under `if`, `for`, `def`, etc., are indented.
  - **Line continuation**: Check for stray backslashes or missing newline characters.
  - **Missing colons**: Ensure `if`, `else`, `for`, `while`, `def`, `class` end with `:`.
- Edit the file to correct the syntax.
- Verify syntax again with `ast.parse`.

### 3. Redeploy and Check for Runtime Errors
- Redeploy the application (e.g., `git push` to trigger Railway rebuild).
- Monitor logs for new errors.
- If no errors appear, the deployment is successful.

### 4. Fix Logic Errors (AttributeError, NameError, etc.)
- If a runtime error appears, note the error type and location.
  - **AttributeError**: `'list' object has no attribute 'get'` — indicates you called `.get()` on a list.
  - **NameError**: `name 'variable' is not defined` — indicates a variable is used before assignment or out of scope.
- Examine the code at the error location:
  - For AttributeError: Check the type of the object before calling the method. Use `isinstance()` or `hasattr()` to handle different types.
    Example fix:
    ```python
    data = load_json(...)
    if isinstance(data, list):
        history = data
    else:
        history = data.get("scans", [])
    ```
  - For NameError: Trace where the variable should be defined. Ensure it is defined in the same scope (e.g., inside the same function or block) and that the definition executes before use.
- Make the fix, ensuring you handle edge cases (e.g., empty data, missing keys).
- Verify syntax again.

### 5. Iterate Until Clean
- Repeat steps 3-4 until the application runs without errors in the logs.
- After each fix, verify syntax and redeploy.
- Keep changes minimal and focused on the error at hand.

## Verification
- After deployment succeeds, check that the application performs its intended function (e.g., workers scan, trade evaluator processes signals).
- Look for expected log messages indicating healthy operation (e.g., "[startup] Senpi auth token found", scanner heartbeats).

## Pitfalls
- **Over-fixing**: Making unnecessary changes that introduce new errors. Stick to the error at hand.
- **Assuming data types**: Always validate assumptions about what functions return (e.g., `load_json` might return a list or dict).
- **Indentation issues**: Mixing tabs and spaces can cause IndentationError. Use spaces exclusively (4 spaces per level).
- **Scope errors**: Defining a variable inside a block and using it outside. Ensure variables are defined in the correct scope.

## Example Workflow from senpi-waifu Deployment
1. Initial error: `SyntaxError` in worker.py line 75 due to malformed f-string.
   - Fixed: Changed `print(f\"[startup] ...\")` to `print("[startup] ...")` and corrected indentation.
2. After fix, deployment failed with `AttributeError: 'list' object has no attribute 'get'` in orca-scanner-cron.py.
   - Fixed: Modified `load_json` handling to check if returned data is a list or dict before accessing `.get("scans")`.
3. After fix, deployment failed with `NameError: name 'striker_signals' is not defined`.
   - Fixed: Ensured `stalker_signals` and `striker_signals` were defined before use by placing the detection calls in the correct location.
4. After fixes, deployment succeeded and worker ran without errors.

## Tools Used
- `read_file`: To examine file contents.
- `execute_code`: To run syntax checks with `ast.parse`.
- `patch` or `write_file`: To edit files.
- `terminal`: For git operations (add, commit, push) and deployment commands (railway logs).
- `session_search`: To recall past error fixes if needed.

## Memory Notes
- Save the exact error messages and fixes to memory if they recur in similar projects.
- Note any project-specific quirks (e.g., in senpi-waifu, `load_json` returns a list for scan history files but a dict for other files).