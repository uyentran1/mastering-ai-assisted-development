# Tasks — Dependency Tracking & Cross-Session Persistence

## Overview

**Tasks** are Claude Code's built-in system for tracking multi-step work. Claude creates tasks with dependency metadata, works through them in order, and updates their status as it goes. Tasks are stored on the filesystem (`~/.claude/tasks/`), so they persist across sessions and can be shared between subagents.

A **task spec** is a project description you write — it tells Claude what to build. Claude reads the spec, creates Tasks from it, and uses the native task system to track progress. The spec describes the work; Tasks track the execution.

## Why Tasks Over Monolithic Prompts

### Monolithic Approach (fragile)
```
"Implement a user import system that:
  1. Parses CSV
  2. Validates emails
  3. Deduplicates users
  4. Logs results
  5. Commits to database"
```

Problems:
- Agent gets lost in complexity
- Hard to know which step failed
- No dependency tracking
- Can't resume across sessions

### Task Spec + Native Tasks (structured)

Write a spec describing four tasks with dependencies. Claude creates Tasks from the spec:
- T1: CSV Parser — no dependencies
- T2: Validator — depends on T1
- T3: Deduplicator — depends on T2
- T4: Report Generator — no dependencies (can run alongside T1)

Benefits:
- Dependencies are stored in task metadata — Claude respects the ordering automatically
- Tasks show status (pending / in progress / completed) in your terminal via `Ctrl+T`
- Tasks persist in `~/.claude/tasks/` — next session picks up where you left off
- Multiple sessions or subagents can share a task list via `CLAUDE_CODE_TASK_LIST_ID`
- Acceptance criteria (test commands) let Claude self-verify before marking a task complete

## How It Works

### Step 1: Write a Task Spec

Create a `tasks-spec.md` file describing:
- What each task should do (inputs, outputs, requirements)
- Which tasks depend on others
- Acceptance criteria (test commands, expected outputs)

### Step 2: Ask Claude to Execute

```
Read tasks-spec.md and create tasks for each step with the right dependencies.
Implement them in order, running tests after each one.
```

Claude will:
1. Read the spec and create Tasks with dependency metadata
2. Identify unblocked tasks (T1 and T4 are both immediately available)
3. Implement the first unblocked task, run its tests
4. Mark the task complete — this unblocks downstream tasks
5. Continue until all tasks are complete

Press `Ctrl+T` at any time to see the task list with status indicators.

### Step 3: Resume Across Sessions

Tasks persist automatically. To share a task list across sessions:

```bash
CLAUDE_CODE_TASK_LIST_ID=user-import claude
```

Next session, Claude sees which tasks are complete and starts from where you left off. No context from the previous session is needed — the task list IS the state.

## Worked Example: User Import Pipeline

### The Task Spec

See `src/tasks-spec.md` for the full specification. Four tasks:

**Task 1: CSV Parser** (no dependencies)
- Input: Raw CSV string
- Output: Array of user objects
- Handles: quoted fields, empty rows, whitespace trimming
- Acceptance: `npm run test:task1` passes all 7 tests

**Task 2: Validator** (depends on T1)
- Input: Array of parsed users
- Output: `{ valid: User[], invalid: { user, errors }[] }`
- Rules: email format, role enum, non-empty name
- Acceptance: `npm run test:task2` passes all 7 tests

**Task 3: Deduplicator** (depends on T2)
- Input: Array of valid users
- Output: `{ unique: User[], duplicates: User[] }`
- Logic: same email (case-insensitive), keep last occurrence
- Acceptance: `npm run test:task3` passes all 7 tests

**Task 4: Report Generator** (no dependencies)
- Input: Pipeline statistics (counts for each stage)
- Output: `ImportReport` with summary string and timestamp
- Logic: calculates validation and uniqueness rates
- Acceptance: `npm run test:task4` passes all 7 tests
- Key insight: T4 has no dependencies, so Claude can start it alongside T1

### Cross-Session Persistence in Action

**Session 1**: Claude reads spec, creates tasks, implements T1 and T2, marks them complete.

**Session 2**: `CLAUDE_CODE_TASK_LIST_ID=user-import claude` — Claude sees T1 and T2 are done, picks up at T3.

No context from Session 1 is needed — the task list IS the state.

## Files in This Demo

- `src/tasks-spec.md` — The project specification describing tasks and dependencies
- `src/types.ts` — Shared type definitions (the contract between tasks)
- `src/csv-parser.ts` — Task 1 implementation
- `src/validator.ts` — Task 2 implementation
- `src/deduplicator.ts` — Task 3 implementation
- `src/reporter.ts` — Task 4 implementation (no dependencies)
- `tests/task-1-parser.test.ts` — Task 1 tests
- `tests/task-2-validator.test.ts` — Task 2 tests
- `tests/task-3-dedup.test.ts` — Task 3 tests
- `tests/task-4-reporter.test.ts` — Task 4 tests

## Getting Started

1. Review `src/tasks-spec.md` to understand the project structure
2. Review `src/types.ts` for the shared data contract
3. Run `npm install`
4. Ask Claude: "Read tasks-spec.md and create tasks with dependencies, then implement them in order, running tests after each one."
5. Press `Ctrl+T` to watch task status update as Claude works
6. To resume later: `CLAUDE_CODE_TASK_LIST_ID=user-import claude`

## Key Takeaway

Tasks give you structured work with built-in dependency tracking and cross-session persistence. The task list lives in `~/.claude/tasks/`, not in Claude's context window — so progress survives session boundaries, context compactions, and even multi-agent workflows. Notice how T4 (Report Generator) has no dependencies — Claude identifies it as unblocked and can start it alongside T1. For multi-agent parallel work, see Chapter 5 (Subagents and Agent Teams).
