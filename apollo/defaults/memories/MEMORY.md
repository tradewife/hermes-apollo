# Environment & Technical Facts
- OS: Linux/Unix. Toolchain: g++ (C++20), Python 3.12, Rust.
- Detect package manager from repo files ONLY (lockfiles/manifests).
- Never edit lockfiles by hand.
- Complexity Baseline: O(N log N) for N=10^5.
- Fast I/O: `ios_base::sync_with_stdio(false); cin.tie(NULL);`
- Type Safety: Use `int64_t` / `long long` for sums to avoid 32-bit overflows.

# Learned Algorithmic Quirks
- Recursion: Use iterative DFS or `sys.setrecursionlimit`.
- Precision: Epsilon (1e-9) for floating-point comparisons.
- Tool Workaround: Persistent shell is enabled for SSH; state survives across calls.
- Trace only symbols being modified; avoid unnecessary transitive context expansion.

# Memory Standards (Skill Creation Procedural Facts)
- Use memory for "what" (facts/context), skills for "how" (procedures).
- Skill folders must include: `SKILL.md` (entrypoint), `references/api.md` (API docs), and `assets/` (templates).
- Description frontmatter must be a trigger-condition phrase with the activation context in the first 60 chars.
- Skills live at `~/.hermes/skills/<name>/`. Persistent data (logs, accumulated gotchas) stays in the skill folder — Hermes does not wipe on upgrade.
- Use `metadata.hermes.requires_toolsets` or `metadata.hermes.fallback_for_toolsets` for conditional activation instead of manual gating.
- "Gotchas" sections are mandatory for every created skill folder.
- Before creating any skill, use `skills_list` to search for duplicates first.
- Consolidate memory entries once usage reaches 80% (1,760 chars).
