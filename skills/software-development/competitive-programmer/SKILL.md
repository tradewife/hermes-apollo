---
name: competitive-programmer
description: Use for algorithmic or correctness-sensitive coding tasks: competitive programming, coding challenges, debugging wrong answers or timeouts, choosing an algorithm under real input bounds, or shipping verified code under deadline pressure.
version: 1.0.0
author: Hermes Apollo
license: MIT
metadata:
  hermes:
    tags: [competitive-programming, algorithms, debugging, verification, execution]
    related_skills: [writing-plans, systematic-debugging, test-driven-development, requesting-code-review, verification-before-completion]
---

# Competitive Programmer

## When To Use

Use this skill when the task is algorithmic, time-sensitive, correctness-sensitive, or likely to fail on edge cases.

Examples:

- solving coding challenges
- selecting between brute force, greedy, DP, graph, or search strategies
- debugging wrong answers, timeouts, memory blowups, or off-by-one errors
- shipping a working implementation under deadline pressure

## Operating Rules

1. Read the full problem before coding.
2. Extract the actual constraints and let them drive the approach.
3. Choose the simplest strategy that fits the bounds.
4. Enumerate important edge cases before finalizing.
5. Verify claims with tests, examples, or a runnable command.

## Gotchas

- Misreading the actual bounds and solving the wrong problem.
- Reaching for a fancy algorithm when a simpler one already fits.
- Ignoring degenerate cases: empty input, one element, duplicates, disconnected graphs, overflow, indexing edges.
- Claiming a fix before rerunning the relevant test or example.
- Optimizing too early instead of first getting a correct baseline.

## Default Execution Loop

1. Restate the core problem in one or two lines.
2. Identify the key constraints, input shape, and failure risks.
3. Pick an approach with an explicit complexity claim.
4. Implement the smallest correct version first.
5. Run verification immediately.
6. Only optimize further if the constraints require it.

## Guardrails

- Do not over-engineer.
- Do not invent hidden requirements.
- Do not claim success without evidence.
- If the task needs repeatable local browser automation or terminal-driven web interaction, load `browser-use-cli`.
- If debugging, load `systematic-debugging`.
- If implementation is non-trivial, load `writing-plans`.
- Before declaring completion, load `verification-before-completion` when available.
