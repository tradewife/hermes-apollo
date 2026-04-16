---
name: rtp-skill-audit
description: Audit skills in a skill registry against a canonical schema. Produces compliance report with verdicts, dead references, and gap analysis.
---

# Skill Registry Audit

Audit all skills in a registry against a canonical schema. The auditor role is Verifier — validate, do not build.

## When to Use

- Before a hackathon to assess skill readiness
- After adding or modifying skills to re-check compliance
- When the canonical schema changes
- To identify dead composition references or missing dependency skills

## Overview

Given a repo with skills under a standard directory structure, each containing a SKILL.md and config.json, verify every skill conforms to the canonical schema defined in the repo's governing document.

## Audit Steps

### Step 1: Read the source of truth

Read the governing document first. It defines the canonical schema, valid categories, integration rules, and conventions.

### Step 2: Read all skill files

Use parallel subagents (3 batches) to read all SKILL.md and config.json files efficiently:
1. Batch 1: First half of SKILL.md files (full raw content)
2. Batch 2: Second half of SKILL.md files (full raw content)
3. Batch 3: All config.json files (full raw content)

### Step 3: Check each skill against required fields

For each skill, verify every required field is present AND has non-empty content. A heading with no body text counts as missing.

### Step 4: Check config.json

Verify required fields exist. Note any naming conventions that differ from the spec (e.g. skill_name vs name).

### Step 5: Check cross-skill composition consistency

Collect all composes_with references across all skills. Any reference to a skill not present in the registry is a dead reference and should be flagged.

### Step 6: Check integration pattern compliance

Verify no skill references deprecated or prohibited APIs or tools as defined in the repo's integration table.

### Step 7: Check agent-agnostic compliance

Flag prescriptive framework bindings. Illustrative pseudocode is acceptable. On-chain program specs in the target framework are acceptable.

### Step 8: Compute verdicts

- VERIFIED: All fields present, valid category, no dead refs, no pattern violations
- RESTRICTED: Missing 1-3 fields, or invalid category but otherwise complete
- REJECTED: Missing 4 or more fields, or explicitly a stub, or pattern violations

### Step 9: Identify skill gaps

Check dead composition references since they often reveal missing skills. Also check if any skill describes a downstream dependency that does not exist.

### Step 10: Write report

Output as AUDIT_REPORT.md in repo root. Include executive summary, compliance table, detailed findings, cross-skill issues, integration pattern compliance matrix, top 3 skill gaps, and remediation priority matrix.

## Gotchas

1. Substantially implemented skills can still fail schema checks if content is not structured under the required headings. Restructure rather than rewrite.

2. Stub skills are auto-REJECTED regardless of other checks.

3. Dead references are a hard composition failure for the referencing skill.

4. Config naming conventions may differ from spec. Flag the discrepancy but do not treat consistent convention as a failure.

5. Description often lives in frontmatter not in config.json.

6. Content existing in code blocks or gotchas does not satisfy the requirement for a dedicated heading for each required field.
