# Chapter 5.3: Agent Teams — Parallel Component Development

## Starting Point

This is a clean starting point for the agent teams demo. You have package configuration and task definitions, but no implementations yet.

## Prerequisites

Enable agent teams (experimental feature):
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Your Task

Build a complete React component library by creating an agent team with three teammates:

1. **Teammate A: Form Components** — Button, Input, Select
2. **Teammate B: Dialog Components** — Modal, Toast, Dropdown
3. **Teammate C: Tests** — Unit tests for all components

## How to Start

Ask Claude:
```
Create an agent team to build this component library.
Spawn three teammates:
- Teammate A owns Button, Input, Select in src/components/
- Teammate B owns Modal, Toast, Dropdown in src/components/
- Teammate C writes tests for all components in tests/

Use TypeScript, functional components, named exports, Tailwind CSS.
Each component gets its own file: src/components/ComponentName.tsx
Each test file mirrors: tests/ComponentName.test.tsx
```

## Conventions (All Teammates Follow)

- TypeScript with strict mode
- Functional components with hooks
- Named exports (not default)
- Props interfaces named `${ComponentName}Props`
- Tailwind CSS for styling
- Components in `src/components/`
- Tests in `tests/`

## Navigation

- **Shift+Down** cycles between teammates in the terminal
- Each teammate works independently with its own context

## Quick Start

```bash
npm install
npm test  # Should fail until components are implemented
```

## Success Criteria

- 6 components implemented with proper TypeScript types
- 50+ tests passing across all components
- Clean build: `npm run build` succeeds
- All teammates complete their assigned tasks

## Key Points

- Agent teams work **truly in parallel** — not sequentially like subagents
- Teammates communicate via **shared task list** and **messaging**
- The **team lead** coordinates and resolves blockers
- Each teammate owns specific files — no overlapping
- Shared types file provides the contract between components
