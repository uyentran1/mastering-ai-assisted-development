# Agent Teams — Parallel Coordination

## Overview

**Agent Teams** are an experimental Claude Code feature that lets multiple Claude Code instances work on the same project simultaneously. Unlike subagents (which run sequentially within one session), agent teams are truly parallel — each teammate is a separate Claude Code instance with its own context window.

**Key difference from subagents**: Teammates communicate directly via a shared task list and messaging. The team lead coordinates, teammates claim tasks, and the team adapts mid-stream when blockers arise.

## Enabling Agent Teams

Agent teams are experimental. Enable them in your settings:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set the environment variable directly:
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## When to Use Agent Teams

Use agent teams when:
- Multiple agents can work on truly independent tasks in parallel
- Tasks might need mid-stream coordination (blockers, shared utilities)
- The overall timeline is tight (parallel >> sequential)
- You want real-time collaboration between agents

Don't use agent teams when:
- Tasks have strict sequential dependencies (use subagents)
- The codebase is small enough for one agent
- Token cost is a concern (each teammate is a full instance)

## The Team Structure

An agent team has:

1. **Team Lead** — Coordinates the team, creates the task list, resolves blockers
2. **Teammate A** — Owns specific files/components
3. **Teammate B** — Owns different files/components
4. **Teammate C** — Owns yet other files/components (tests, documentation, etc.)

Navigation:
- **Shift+Down** cycles between teammates in the terminal
- Each teammate has its own context and tool access

## How It Works

### Shared Task List

The team lead creates a task list that all teammates can see and update:

```
Task List:
- [pending] Button component — assigned to Teammate A
- [pending] Input component — assigned to Teammate A
- [in_progress] Modal component — assigned to Teammate B
- [completed] Select component — assigned to Teammate B
- [pending] Toast component — assigned to Teammate C
- [pending] Dropdown component — assigned to Teammate C
```

Tasks have three states: **pending**, **in progress**, and **completed**.

### Direct Messaging

Teammates can message the lead (and vice versa) when they hit blockers:

```
Teammate B → Lead: "Modal needs a Portal utility that doesn't exist yet. Can you create a task for it?"
Lead → Teammate B: "Created new task: Portal utility. Assigning to Teammate A since they're finishing up."
```

This is the key advantage over the old file-based coordination — teams adapt in real-time.

## Real Example: React Component Library

### Setup

The team builds a component library with six components: Button, Input, Select, Modal, Toast, and Dropdown.

**Prompt to Claude:**
```
Create an agent team to build this component library.
Spawn three teammates — each owns two components.
Use src/components/types.ts as the shared contract.
```

### The Three Phases

**Phase 1: Planning (Team Lead)**
- Lead reads the project spec
- Creates the task list with six tasks
- Assigns two components to each teammate
- Defines conventions: TypeScript, functional components, Tailwind CSS

**Phase 2: Parallel Work (All Teammates)**
- All three teammates start simultaneously
- Each reads the shared types, implements components, writes tests
- If blocked, teammates message the lead
- Lead creates new tasks or reassigns as needed

**Phase 3: Integration (Team Lead)**
- All tasks marked complete
- Lead runs full test suite: `npm test`
- Lead resolves any conflicts
- Lead commits the final result

### Expected Output

Six components with tests:
```
src/components/
  Button.tsx, Input.tsx, Select.tsx,
  Modal.tsx, Toast.tsx, Dropdown.tsx
tests/
  Button.test.tsx, Input.test.tsx, Select.test.tsx,
  Modal.test.tsx, Toast.test.tsx, Dropdown.test.tsx
```

50+ tests, all passing.

## Files in This Demo

- `README.md` (this file)
- `TASKS.md` — Example task board (for reference; agent teams manage tasks internally)
- `PROGRESS.md` — Example progress log (for reference)
- `src/components/Button.tsx` — Example completed component
- `tests/Button.test.tsx` — Example completed tests
- `package.json` — Build configuration

## Agent Teams vs Subagents

| Aspect | Subagents | Agent Teams |
|--------|-----------|-------------|
| **Execution** | Sequential (one at a time) | Truly parallel |
| **Communication** | Subagent → Parent only | Teammates ↔ Lead (messaging) |
| **Coordination** | Parent orchestrates | Shared task list + messaging |
| **Context** | Shared parent context | Independent contexts |
| **Cost** | Lower (one instance) | Higher (multiple instances) |
| **Best for** | Dependent, layered tasks | Independent, parallel tasks |

## Getting Started

1. Enable agent teams: `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`
2. Review the shared types in `src/components/types.ts` (if present) or `Button.tsx` for the pattern
3. Ask Claude to create an agent team for the component library
4. Watch teammates work in parallel
5. Review the completed components and run `npm test`

## Key Takeaway

Agent teams give you true parallelism with built-in coordination. The shared task list and messaging replace the ad-hoc file-based patterns. Start with independent tasks (like components in a library) where coordination risk is low, then scale to more complex scenarios as you build confidence.
