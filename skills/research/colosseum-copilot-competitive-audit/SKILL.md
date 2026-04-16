---
name: colosseum-copilot-competitive-audit
description: Execute Colosseum Copilot deep dive for competitive landscape research. Programmatic 8-step workflow using the Copilot API to search hackathon submissions, archive documents, and ecosystem products. Produces a gap classification (FULL/PARTIAL/FALSE) with evidence.
---

# Colosseum Copilot Competitive Audit

Use when the user asks to vet a hackathon idea, check for competitors, or run a "should I build this" analysis using Colosseum Copilot.

## Prerequisites

1. **Install the Copilot skill** (one-time):
   ```bash
   npx skills add ColosseumOrg/colosseum-copilot
   ```

2. **API token required.** User must provide a Colosseum Copilot PAT (Personal Access Token).
   - Scope: `colosseum_copilot:read`
   - Format: JWT
   - Verify by calling GET /status on the API base with Bearer token

## Constants

```
API_BASE = "https://copilot.colosseum.com/api/v1"
GRID_GRAPHQL = "https://beta.node.thegrid.id/graphql"
```

## 8-Step Deep Dive Workflow

### Step 1: Problem Decomposition
Break the idea into 2-3 semantic search queries + 1-2 problem-space queries.

### Step 2: Parallel Searches (run all concurrently)

**2a. Project searches** (5,400+ submission corpus):
```
POST /search/projects
Body: {"query": "<semantic>", "limit": 10}

POST /search/projects
Body: {"query": "<problem-space>", "limit": 10}

POST /search/projects
Body: {"query": "<semantic>", "limit": 10, "filters": {"acceleratorOnly": True}}
```

**2b. Archive searches** (84,000+ document corpus):
```
POST /search/archives
Body: {"query": "<topic>", "limit": 5, "maxChunksPerDoc": 1}
```

**2c. Tag-filtered follow-up** (if relevant):
```
POST /search/projects
Body: {"limit": 10, "filters": {"problemTags": ["AI agents"], "winnersOnly": False}}
```

**2d. Hackathon analysis** (cohort analysis):
```
POST /analyze
Body: {"cohort": {"hackathons": ["breakout", "cypherpunk"]},
       "dimensions": ["tracks", "problemTags", "techStack"],
       "topK": 8, "samplePerBucket": 1}
```

**2e. Grid ecosystem check** (6,300+ products):
```
POST https://beta.node.thegrid.id/graphql
Content-Type: application/json

# Category search — use the VerticalSearch query with variables for typeSlugs, chain, tag, dead, limit
# Keyword search — use the BroadKeyword query with variables for q, dead, limit
# dead filter: ["discontinued", "support_ended"]
```

### Step 3: Fetch Top Project Details
For slugs with similarity > 0.04:
```
GET /projects/by-slug/<slug>
```
Extract: name, description, problem, solution, techStack, prizePlacement, hackathon.

### Step 4: Web Search for External Signals
Search for academic papers, industry reports, blog posts, GitHub repos not in Copilot corpus.

### Step 5: Verification Checklist
- [ ] search/projects returned results
- [ ] search/archives returned results
- [ ] Accelerator portfolio checked
- [ ] Grid ecosystem check completed
- [ ] 2+ distinct project queries executed
- [ ] Cross-hackathon coverage confirmed

### Step 6: Gap Classification
- **FULL GAP**: Zero direct competitors across all sources
- **PARTIAL GAP**: Tangential competitors but none combine all key features
- **FALSE GAP**: Direct competitor exists — BLOCK, escalate to human

### Step 7: Differentiation Mapping
Score each competitor against your key differentiators (YES/NO per criterion).

### Step 8: Output
1. Gap classification + rationale
2. Named predecessor projects (tangential only)
3. Funded competitors (if any)
4. Recommended wedge/differentiation angle
5. Pre-emptive rebuttals

## API Reference

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/status` | Verify auth |
| POST | `/search/projects` | Search submissions |
| POST | `/search/archives` | Search documents |
| POST | `/analyze` | Cohort analysis |
| GET | `/projects/by-slug/{slug}` | Project details |
| GET | `/archives/{id}` | Archive document |
| GET | `/filters` | Available tags/tracks |

All endpoints: `Authorization: Bearer <PAT>` + `Content-Type: application/json`

## Key Response Fields (search/projects)

- `slug`, `name`, `description`, `summary`
- `hackathon` (object with name, slug)
- `score` / `similarity` (0-1 range; low = weak match, this is normal)
- `prizePlacement`, `problemTags`, `solutionTags`, `techStack`
- `problem`, `solution` (longer text)

## Pitfalls

1. **Low similarity scores are normal.** Best matches often score 0.05-0.09. This means the feature combination is novel, not that search failed.
2. **Grid keyword search returns null data for obscure queries.** Null data field = zero results = useful negative evidence.
3. **Archive document IDs are UUIDs.** Fetch with GET /archives/{uuid}?offset=0&maxChars=3000.
4. **Accelerator filter is exclusive.** Use as separate query.
5. **Grid GraphQL endpoint is beta.node.thegrid.id, NOT node.thegrid.id.**
6. **Store PAT securely.** Do not commit to git. Use environment variable or memory tool.
