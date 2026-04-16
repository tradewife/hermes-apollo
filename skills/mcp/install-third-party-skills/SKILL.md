---
name: install-third-party-skills
description: Use when installing skills from GitHub repos, skills.sh registry, or raw skill folders into Hermes global skills (~/.hermes/skills/). Covers npx skills add, manual git clone, and proper folder structure.
version: 1.0.0
metadata:
  hermes:
    tags: [skills, install, setup, github, npx]
---

# Install Third-Party Skills to Hermes

Two installation paths depending on whether the repo is a skills.sh package or a raw skill folder.

## Path 1: skills.sh Package (has SKILL.md at repo root or uses skills.sh format)

```bash
# Install to .agents/skills/ in current directory (requires --yes to skip interactive prompts)
npx skills add <github-url> --yes

# Then copy to Hermes global
cp -R .agents/skills/<skill-name> ~/.hermes/skills/
```

**Gotcha**: Without `--yes`, the installer enters interactive TTY mode (agent selection menu) that hangs in non-interactive shells.

**Gotcha**: `npx skills add` always installs to `.agents/skills/` in the CWD, not to `~/.hermes/skills/`. You MUST copy afterward for Hermes global access.

## Path 2: Raw GitHub Skill Repo (skill folder inside repo, not at root)

Some repos have the skill in a subfolder (e.g., `nothing-design/nothing-design/SKILL.md`). For these:

```bash
# Clone and inspect structure
cd /tmp && git clone --depth 1 <github-url>
ls <repo-name>/

# Copy the SKILL.md-containing subfolder to Hermes global
cp -R /tmp/<repo-name>/<skill-subfolder> ~/.hermes/skills/<skill-name>

# Clean up
rm -rf /tmp/<repo-name>
```

**Gotcha**: If `npx skills add` says "No skills found" / "No valid skills found", the repo is NOT a skills.sh package. Use Path 2 instead.

## Path 3: Multiple skills from one repo

Some repos contain multiple skills (e.g., manim_skill has manim-composer, manimce-best-practices, manimgl-best-practices). `npx skills add --yes` installs all of them at once. Copy each individually or bulk:

```bash
cp -R .agents/skills/manim-composer ~/.hermes/skills/
cp -R .agents/skills/manimce-best-practices ~/.hermes/skills/
cp -R .agents/skills/manimgl-best-practices ~/.hermes/skills/
```

## Verification

```bash
# Check the skill is loadable by Hermes
ls ~/.hermes/skills/<skill-name>/SKILL.md
```

Then use `skill_view(name="<skill-name>")` to confirm Hermes can load it.

## Bulk Install Pattern

For installing multiple skills in parallel:

```bash
cd /path/to/project  # pick a dir with .agents/skills/ or create it
npx skills add <repo1> --yes &
npx skills add <repo2> --yes &
npx skills add <repo3> --yes &
wait

# Copy all at once
cp -R .agents/skills/* ~/.hermes/skills/
```

## Gotchas

- `npx skills add` requires Node.js and will download the `skills` npm package on first run
- The `--yes` flag is NOT optional in non-interactive environments
- Skills installed via `npx skills add` are ALSO installed to agent-specific dirs (Claude Code, Codex, etc.) as symlinks -- only the `.agents/skills/` copy matters for Hermes
- Security assessments (Gen, Socket, Snyk) are shown during install -- review Medium/High risk skills before using
- Always `skill_view(name=...)` after installing to verify it loads correctly in Hermes
