# AI-Powered Testing & Debugging

## Overview

This demo shows how to use Claude Code and DevTools MCP to write comprehensive test suites, catch regressions, and debug runtime issues — turning AI from a code generator into a quality engineer.

**Three workflows**:
1. **Test Generation** — Claude writes tests from specs and existing code
2. **TDD with AI** — Write spec → agent writes tests → agent implements until green
3. **Runtime Debugging** — Use DevTools MCP to diagnose real browser issues

## The Demo App

A task management API with intentional gaps: missing edge cases, unhandled errors, and untested code paths. Your job is to use Claude to find and fix everything.

### Tech Stack
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Testing**: Jest + Supertest
- **Browser debugging**: Chrome DevTools MCP

## Workflow 1: Test Generation from Existing Code

### The Problem

You have working code but incomplete tests. Coverage is ~40%. You need to get to 90%+ without spending days writing tests manually.

### The Approach

Give Claude the source file and ask it to generate tests:

```
Look at src/tasks.ts and write comprehensive tests.
Cover: happy paths, edge cases, error handling, boundary conditions.
Put tests in tests/tasks.test.ts.
Run them and fix any failures.
```

### What Claude Does

1. Reads the source code to understand behavior
2. Identifies all code paths (including edge cases the developer missed)
3. Writes tests covering each path
4. Runs the tests
5. Fixes any that fail due to misunderstood behavior
6. Reports what it found

### Key Insight

Claude often discovers bugs during test generation — it writes a test for an edge case, the test fails, and that failure reveals a genuine bug in the source code.

## Workflow 2: TDD with AI

### The Approach

Instead of writing code first, write the spec first, then let Claude do TDD:

```
Read specs/new-feature.md.
First, write failing tests for every requirement.
Then implement the feature until all tests pass.
Do not modify the tests after writing them.
```

### The Cycle

```
Spec (human writes)
    ↓
Tests (Claude writes — these define "done")
    ↓
Implementation (Claude writes — until tests pass)
    ↓
Review (human reviews both tests and implementation)
```

### Why This Works

- Tests become the acceptance criteria — they encode exactly what "done" means
- Claude can't cheat by weakening tests to match broken implementation
- The human reviews tests first (are these the right requirements?) then implementation (does this meet them?)

## Workflow 3: Automated UX Testing with DevTools MCP

Module 3.2 showed how to use DevTools MCP for manual debugging — ask Claude to take a screenshot, check the console, spot issues one at a time. This workflow takes it further: turning DevTools MCP into a **repeatable, automated UX testing pipeline**.

### Setup

Ensure Chrome DevTools MCP is configured (covered in Module 3.2):

```bash
claude mcp add chrome-devtools -- npx @anthropic-ai/chrome-devtools-mcp@latest
```

### The Approach

Instead of manually asking Claude to check things, use the `/ux-audit` slash command that runs a full checklist automatically:

```
/ux-audit
```

Claude works through the entire pipeline on its own:

1. **Page inventory** — Screenshots of every key page, console errors logged on each navigation
2. **Interactive elements** — Clicks all buttons, links, and form inputs to verify they respond correctly
3. **Responsive layout** — Resizes viewport to desktop (1280px), tablet (768px), and mobile (375px), flags layout issues
4. **Loading & error states** — Validates loading indicators and error messages
5. **Performance** — Runs a trace, flags long tasks, layout thrashing, excessive re-renders

### Why This Matters

The difference from Module 3.2 is that this is **automated and repeatable**. Same checks every time, no matter who runs it. You can even wire it into a hook — a post-commit hook that triggers a UX audit on every commit, or a pre-PR hook that runs the full checklist before you push.

### What Claude Reports

```
PASS: All interactive elements responsive, no console errors on main pages
WARN: Task list layout overflows on mobile (375px) — horizontal scroll needed
FAIL: Create task form submits successfully with empty title — missing validation
```

FAIL issues get fixed automatically. WARN issues are described for the developer to decide.

## Demo Files

### Source Code (with intentional issues)

- `src/tasks.ts` — Task CRUD operations (missing validation, unhandled edge cases)
- `src/auth.ts` — Authentication middleware (has a subtle bypass bug)
- `src/server.ts` — Express server setup

### Existing Tests (incomplete)

- `tests/tasks.test.ts` — Only covers happy paths (~40% coverage)

### Specs for TDD

- `specs/new-feature.md` — A filtering/search feature spec for TDD practice

### Slash Commands

- `.claude/commands/test-coverage.md` — Generate tests for uncovered code paths
- `.claude/commands/debug-runtime.md` — Systematic runtime debugging checklist
- `.claude/commands/ux-audit.md` — Automated UX testing pipeline via DevTools MCP

## Suggested Demo Flow

1. **Start**: Run `npm test -- --coverage` to see the 40% baseline
2. **Generate tests**: Ask Claude to write comprehensive tests for `src/tasks.ts`
3. **Watch it find bugs**: Claude's edge-case tests reveal issues in the source
4. **Fix and iterate**: Claude fixes the bugs and re-runs until green
5. **TDD a new feature**: Use `specs/new-feature.md` to do spec-first TDD
6. **Automated UX audit**: Run `/ux-audit` to test the UI automatically via DevTools MCP
7. **Final coverage**: Run `npm test -- --coverage` again — should be 90%+

## Key Takeaway

AI-powered testing flips the traditional workflow: instead of writing tests as an afterthought, AI makes test generation cheap enough to do first and do thoroughly. For unit tests, Claude generates and runs them in the terminal. For UX tests, DevTools MCP lets Claude see and interact with your actual app as an automated QA pipeline. Combined, you get full-stack quality coverage from a single tool.
