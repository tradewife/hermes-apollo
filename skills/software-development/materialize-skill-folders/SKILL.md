---
name: materialize-skill-folders
description: Materialize skill folders from a specification registry — audit existing, fix gaps in parallel, create stubs programmatically. For projects with structured skill-registry specs defining BUILD_NEW skills.
---

# Materialize Skill Folders from Spec

## When to Use

When a spec document (e.g., `skill-registry.md`) defines skill folders with required files (SKILL.md, config.json, scripts/, references/, assets/, templates/) and you need to:
1. Create new skill folders from scratch
2. Complete partially-built skill folders
3. Create stub placeholders for deferred skills

## Critical First Step: Audit Before Build

**NEVER assume folders are empty.** Always check what exists first.

```bash
find skills/ -type f | sort
```

If files exist, audit them before writing anything. Existing folders may be 60-85% complete with real content — rewriting from scratch wastes work and loses accumulated domain knowledge.

## Workflow

### Phase 1: Read Spec + Research Context

Read the spec document that defines what each skill folder should contain:
- SKILL.md outline (required sections)
- references/ (required files)
- scripts/ (required scripts with I/O specs)
- templates/ (config templates)
- assets/ (IDL fragments, schemas)
- config.json (parameters)
- composes_with (dependencies)

Also read any research docs that inform the skill content (primitives, architecture, constraints).

### Phase 2: Parallel Audit (3+ folders)

Dispatch parallel subagents to audit each folder. Each auditor reads every file and reports:
1. File sizes (detect stubs vs real content)
2. Content quality (placeholder vs production specs)
3. Missing sections per spec
4. Specific bugs (wrong category, wrong format, incomplete code)
5. Completion percentage estimate

```python
delegate_task(tasks=[
    {"goal": "Audit folder A...", "toolsets": ["file"]},
    {"goal": "Audit folder B...", "toolsets": ["file"]},
    {"goal": "Audit folder C...", "toolsets": ["file"]},
])
```

### Phase 3: Parallel Fix (3+ folders)

Dispatch parallel subagents to fix all issues found. Give each fixer the full audit report + the exact list of issues to resolve. Include:
- Research context (Anchor version, SDK version, protocol specifics)
- composes_with targets
- Exact file paths and what to write

Each fixer should:
1. Fix metadata bugs (category, composes_with)
2. Create missing required files (api.md is almost always missing)
3. Complete stub scripts with real implementations
4. Fix format issues (markdown-in-yaml, incomplete IDL)
5. Add missing sections to SKILL.md

### Phase 4: Programmatic Stub Creation (5+ stubs)

For folders that only need SKILL.md + config.json + scripts/.gitkeep:

```python
for skill in skills:
    write_file(path=f"{dir}/SKILL.md", content=skill_md)
    write_file(path=f"{dir}/config.json", content=json.dumps(config, indent=2))
    write_file(path=f"{dir}/scripts/.gitkeep", content="")
    write_file(path=f"{dir}/references/.gitkeep", content="")
    write_file(path=f"{dir}/assets/.gitkeep", content="")
```

Key fields for stub SKILL.md:
- `status: stub`
- `composes_with: [...]` (dependency graph)
- Sketch section with numbered bullet points from spec
- References listing expected files

### Phase 5: Verify + Commit

Run a completion check script that validates every required file exists for each folder. Then commit.

## Common Issues Found in Audits

| Issue | Frequency | Fix |
|-------|-----------|-----|
| `category: ethereum` instead of `solana` | High (copy-paste) | Patch frontmatter |
| Missing `references/api.md` | Very High | Create with instruction signatures, error codes |
| Scripts are TODO stubs with JSDoc only | High | Implement full TypeScript |
| IDL fragment missing instruction definitions | Medium | Add instructions + error enum |
| templates/*.yaml is markdown not YAML | Medium | Rewrite as structured YAML |
| Missing dedicated Security section in SKILL.md | Medium | Add threat model, invariants, blast radius |
| config.json missing program_id or mint fields | Medium | Add from research context |
| composes_with lists non-existent skills | Low | Align with actual skill names |

## Composition Graph

After all folders are created, verify the dependency graph is acyclic:

```
skill-a <--- skill-b <--- skill-c
    |            |
    +--- skill-d ---+
```

Document as a text diagram in the commit message.

## Pitfalls

- **Do NOT rewrite existing good content.** Audit first. Only fix gaps and bugs.
- **Subagents can't see each other's changes.** If two folders share a type definition (e.g., FloorState), ensure consistency by specifying the exact schema in each fixer's context.
- **Python `false` is not JSON false.** When building config dicts in execute_code, use Python `False`/`True`, not `false`/`true`.
- **IDL fragments should match Anchor structs exactly.** Field order, types, and sizes must be consistent across idl-fragment.rs, references/*.md, and scripts/*.ts.
