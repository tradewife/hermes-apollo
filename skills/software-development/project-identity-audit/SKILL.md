---
name: project-identity-audit
description: Perform a complete identity audit and produce rewrite drafts for all project identity files. Read all branding-bearing files, classify what to keep/modify/delete, draft replacement content inline, and output a structured change manifest for human review — no commits.
---

# Project Identity Audit

Perform a complete identity audit and produce rewrite drafts so project
identity files reflect a new brand/protocol, not the original.

## When to Use

- Rebranding a project (e.g., migrating from one organization to another)
- Forking a project and replacing upstream identity
- Any task requiring systematic replacement of branding across identity files

## Constraints

- DO NOT commit anything. Produce a change manifest for human review.
- DO NOT remove build system, crate structure, or operational config.
- DO NOT invent APIs or capabilities — flag uncertainty explicitly.
- Keep binary names, ports, and config paths unless explicitly told to change.

## Methodology

### Step 1 — Read the Operating Manual

Read the project's agent instructions file (the swarm manual that defines
build workflow, architecture, and what NOT to touch) first.

### Step 2 — Parallel File Reading (Use Subagents)

Dispatch 2-3 parallel subagents to read all identity-bearing files
simultaneously. Group by domain:

- **Subagent 1**: Core docs (architecture, templates, design docs)
- **Subagent 2**: Agent/module TOML or config files (read all, return full contents)
- **Subagent 3**: Identity sweep (search for brand strings across all
  files, inventory directories, check README/provenance files)

This cuts read time from sequential minutes to ~30 seconds.

### Step 3 — Inventory and Classify

For directories of templates/agents/modules:

1. List ALL subdirectories.
2. Classify each as KEEP, DELETE, or MERGE.
3. State the rationale for every classification.
4. Present the full list to the reviewer before drafting changes.

### Step 4 — Draft Replacements

For each file to modify, use TARGETED PATCHES not full rewrites:

- Show the OLD string (enough context for uniqueness).
- Show the NEW string.
- Explain the rationale.

For files to CREATE (like a constitution or soul document),
provide the FULL proposed content inline.

### Step 5 — Handle Uncertainty

If the mission references a document, skill list, or artifact that
isn't found in the project repo:

1. Search BROADLY first — check sibling directories under the user's
   home, session history (`session_search`), and memory before giving up.
   Artifacts often live in a related project directory (e.g., a separate
   research repo, a design repo, or an `edash-projects/` sibling).
2. If still not found after broad search, FLAG IT EXPLICITLY in the
   manifest as a BLOCKER.
3. Use a placeholder in the draft.
4. Do NOT invent content to fill the gap.

### Step 6 — Structure the Change Manifest

Output format:

```
[CREATE] path/to/new-file.md
  Rationale: ...
  PROPOSED CONTENT: ...

[MODIFY] path/to/existing-file.md
  Rationale: ...
  OLD: ...
  NEW: ...

[DELETE] path/to/dir-or-file/
  Rationale: ...

[NO CHANGE] path/to/preserved-file
  Rationale: ...

[FLAGGED FOR FUTURE] path/to/out-of-scope-file
  Rationale: ...
```

End with a SUMMARY counting CREATE/MODIFY/DELETE/FLAGGED totals
and any BLOCKERS.

### Step 7 — Execution Phase (After Manifest Approval)

When the reviewer approves and says to execute:

1. Use the same parallel subagent pattern for writing. Group files
   by type and dispatch 2-3 subagents:
   - One for DELETE operations plus CREATE new files
   - One for targeted patches on core identity files
   - One for rewrites of agent/module config files
2. After all writes complete, stage and verify the full diff matches
   the manifest.
3. Commit with a structured message. If push is rejected, rebase
   then retry with a generous timeout (network can be slow).

### Step 8 — Scope Separation

Always separate:
- **High-identity files** (agent instructions, constitution doc, agent prompts,
  README header, provenance metadata) — in the manifest
- **Mechanical rebrand sweep** (40+ files needing find-and-replace) —
  flagged for follow-up, not in this manifest
- **Operational files** (build system, Dockerfile, CI config) — explicitly
  marked NO CHANGE

## Common Patterns

### Agent Prompt Rewrites

When rewriting agent system_prompts for a new identity:

1. Open with the CORE INVARIANT (the one-line thesis).
2. Name the agent's ROLE in the new framework.
3. List responsibilities specific to that role.
4. Define the methodology as numbered steps.
5. Add explicit CONSTRAINTS section.
6. Add DELEGATION RULES referencing other kept agents by role.

### Keep vs Delete Criteria

Keep agents/templates that:
- Have a clear role in the new framework
- Cannot be subsumed by another agent
- Are referenced by other kept agents

Delete agents/templates that:
- Have no relevance to the new framework
- Are subsumed by a more capable kept agent
- Are demo/tutorial templates not needed in production

## Pitfalls

- The referenced skill list or research artifact may not exist. Always
  search for it before assuming it's available.
- Config files often have redacted fields. Don't try to read actual
  values — focus on system_prompt and structural fields.
- README is usually 500+ lines. Don't rewrite it entirely — use
  targeted patches for identity sections only.
- Some files are historical records (CHANGELOG, MIGRATION).
  Don't rewrite history — add new entries instead.
