## Multi-Agent Orchestration Patterns

### The spectrum: From single agent to multi-agent teams
**1. Single agent**

- One agent handles all tasks sequentially
- Simple, no coordination overhead, but bottlenecks on complexity
**2. Subagent pattern**

- One agent spawns child agents for specific subtasks, collects results, integrates output
- Low coordination cost
**3. Swarm pattern**

- Multiple agents work in parallel on independent chunks, share a common data structure, self-organize
- Medium coordination
**4. Agent Team**

- Agents with explicit roles (frontend engineer, DevOps, QA) collaborate via structured protocols
- High coordination, but optimal for complex fullstack projects

### The Sub-agent pattern: Delegation without overhead
**Parent agent tasks**

1. Write backend API schema.
2. Delegate to Child-1: Implement REST endpoints.
3. Delegate to Child-2: Write unit tests.
4. Merge results, verify consistency.
**Benefits**

- Clear parent-child relationship
- Easy error handling (retry single child)
- Low context switching
**When to use**

- Task breakdown is linear or tree-like
- Dependencies are mostly one-way
- Parent must validate/integrate results

### The Swarm pattern: Parallel independence with shared state
**Shared state (PROGRESS.md)**

- Completed: [list of finished modules]
- InProgress: [agent ID: module name]
- Blocked: [module: reason]
- Tests: [passing count]
**Each agent**

1. Reads PROGRESS.md
2. Claims an unclaimed module
3. Works independently
4. Updates PROGRESS.md with results
5. Runs shared tests, reports status
**Use this pattern when**

- Work can be split into truly independent modules (no cross-dependencies)
- Agents benefit from seeing what others completed (examples: reusing types, patterns)
- You want agents to dynamically adjust scope based on overall progress

### Agent teams: Role-based fullstack collaboration
**Agent roles**

- Backend agent: API contracts, business logic
- Frontend agent: UI, state management, integration
- DevOps agent: Infrastructure, CI/CD, deployment
- QA agent: Test strategy, edge cases, integration tests
**Shared artifacts**

**Shared types (types.ts)**

- Central source of truth
- All agents reference, no conflicting definitions
**API contract (api.md)**

- Backend writes, frontend consumes
- DevOps knows what to expose
**Deployment manifest**

- DevOps writes, others read dependencies
**Test report**

- QA aggregates, others see what's verified
**Best suited for**

- Multiple technical domains (frontend, backend, infrastructure)
- Clear contracts between layers (API, schema, config)
- Distinct phases (design > build > test > deploy)

### Communication patterns: Structured handoffs
**TASKS.md**

```
# Development Tasks

## Feature: User Authentication
- Database schema (pending)
- Password hashing utility (done)
- Login endpoint (pending)

## Feature: Admin Dashboard
- Mockups created (done)
- React components (pending)
- API integration (pending)
```
**PROGRESS.md**

```
# Progress Report - 2026-03-10

Backend Agent (Agent-1):
  Status: Completed Auth API
  Next: Refine pagination
  Blocker: None

Frontend Agent (Agent-2):
  Status: Building Dashboard
  Next: Hook up to Backend API
  Blocker: Waiting for API docs
```
**Shared types (types.ts / types.go)**

```
interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: "admin" | "user";
  createdAt: Date;
}
```

### 

- Task is small and atomic: Let one agent handle it.
- High interdependencies: If every step needs approval or input, subagent overhead outweighs benefit.
- Rapid iteration on unclear requirements: Agents need stable specs; thrashing on changes multiplies the pain.
- Context window already pushed: Multiple agents = more tokens. If at token limits, consolidate.

### Summary

- Use subagents for linear task hierarchies with a controlling parent.
- Use swarms for independent work with shared state (test status, progress, blockers).
- Use agent teams for fullstack projects with clear domain boundaries.
- Communicate via TASKS.md, PROGRESS.md, and shared types/contracts, not chat.
