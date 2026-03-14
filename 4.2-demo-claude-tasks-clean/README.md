# Chapter 4.2: Tasks — Dependency Tracking & Cross-Session Persistence

## Starting Point

This is a clean starting point for the Tasks demo. Write a task specification describing your project, then ask Claude to create tasks with dependencies and implement them in order.

## Your Task

Build a CSV processing pipeline by implementing four tasks — three with dependencies, one independent:

1. **Task 1 (csv-parser.ts)** — Parse CSV string -> array of objects
2. **Task 2 (validator.ts)** — Validate users -> separate into valid/invalid (depends on T1)
3. **Task 3 (deduplicator.ts)** — Remove duplicates -> unique/duplicates (depends on T2)
4. **Task 4 (reporter.ts)** — Generate import summary report (no dependencies)

## The Tasks Workflow

1. **Read the spec** — Claude reads `src/tasks-spec.md` and creates Tasks with dependency metadata
2. **Identify unblocked tasks** — T1 and T4 have no dependencies, so both are immediately available
3. **Execute in order** — Claude works through tasks respecting dependencies
4. **Self-verify** — After each task, Claude runs the acceptance tests
5. **Mark complete** — Task status updates are visible via `Ctrl+T` and persist in `~/.claude/tasks/`

## Quick Start

```bash
npm install
npm run test:task1  # Should fail until you implement csv-parser.ts
npm run test:task2  # Should fail until you implement validator.ts
npm run test:task3  # Should fail until you implement deduplicator.ts
npm run test:task4  # Should fail until you implement reporter.ts
npm test            # Run all tests
```

## Prompt for Claude

```
Read src/tasks-spec.md and create tasks for each step with the right
dependencies. Implement them in order, running tests after each one.
```

## Cross-Session Persistence

To share a task list across sessions:
```bash
CLAUDE_CODE_TASK_LIST_ID=user-import claude
```

Press `Ctrl+T` to toggle the task list view in your terminal.

## Key Points

- Tasks are Claude Code's native tracking system — stored in `~/.claude/tasks/`
- Dependencies are metadata, not text annotations — Claude respects them automatically
- `Ctrl+T` shows task status (pending / in progress / completed) in your terminal
- `CLAUDE_CODE_TASK_LIST_ID` lets you resume or share task lists across sessions
- `src/types.ts` defines the data contract between tasks

## Success Criteria

All 28 tests must pass:
- 7 tests for Task 1 (CSV Parser)
- 7 tests for Task 2 (Validator)
- 7 tests for Task 3 (Deduplicator)
- 7 tests for Task 4 (Report Generator)
