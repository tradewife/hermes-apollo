---
name: reverse-engineer-from-samples
description: "Use when the problem statement is garbled or missing and you must deduce the algorithm from sample inputs and outputs. Trigger on corrupted LaTeX, truncated problems, missing constraints, or ambiguous problem text."
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [competitive-programming, reverse-engineering, hypothesis-testing, samples]
    related_skills: [competitive-programmer, systematic-debugging]
---

# Reverse-Engineer From Samples

## When To Use

Use this skill when the problem statement is unreadable (corrupted LaTeX, truncated input, missing context) and you must deduce the correct algorithm purely from sample I/O pairs.

## Procedure

1. **Enumerate all sample cases** with their expected outputs. Note grid dimensions, free/blocked cell counts, and structural properties (components, adjacencies).

2. **Generate candidate theories** — list every plausible counting/decision problem:
   - Proper k-colorings (various adjacency models)
   - Independent sets, matchings, Hamiltonian paths
   - Domino tilings, component counts
   - Simple formulas: f^2, 2^f, Fibonacci, Catalan, factorial
   - Modular arithmetic variants

3. **Brute-force each theory** against ALL samples using Python `itertools`. Automate the check — never eyeball it. A theory must match every sample, not just most.

4. **Test multiple adjacency models** — they produce wildly different answers:
   - 4-directional (up/down/left/right)
   - 8-directional (includes diagonals)
   - Horizontal-only, vertical-only, diagonal-only
   - Torus (wrapping edges)

5. **Eliminate theories that fail ANY sample**. A theory matching 3/4 is not "close enough."

6. **For the winning theory**, sanity-check edge cases: empty grid, all blocked, all free, single cell, single row, single column.

7. **Submit and iterate**. If WA, the judge feedback reveals which case failed, narrowing the search space dramatically.

## Key Pattern: f^2 with Adjacency Constraint

A recurring grid counting pattern: `answer = (free_cells)^2 if no two free cells satisfy adjacency_condition else 0`. The adjacency type must be inferred from samples. Brute-force all adjacency variants before committing.

## Gotchas

- Don't assume the adjacency model — horizontal vs 8-connectivity gives different answers for grids with vertically stacked cells.
- If the problem mentions mod M but samples don't reveal it, try common mods: 10^9+7, 998244353, or the stated M value.
- Garbled problem text may contain TWO problems mixed together — focus on what the samples actually test.
- Don't overfit to samples: verify your theory makes structural sense before submitting.
- f^2 mod 2^k can produce 0 for specific values — check if the "0" in samples comes from a modular artifact rather than a structural impossibility.
