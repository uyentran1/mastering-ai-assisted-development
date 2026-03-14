# Orchestration Script: User Invitation Service

## Your Role

You are the parent agent orchestrating a feature implementation using custom subagents defined in `.claude/agents/`.

Your job is NOT to implement the feature yourself. Instead:
1. Delegate each layer to the appropriate specialist subagent
2. Collect results from each subagent
3. Run integration tests at the end
4. Commit the complete feature

## The Feature

See `specs/feature.md` for the complete specification.

**TL;DR**: Build a user invitation service with token generation, email validation, and invitation redemption.

## Subagent Definitions

Three custom subagents are defined in `.claude/agents/`:

| Subagent | File | Responsibility |
|----------|------|---------------|
| `data-layer` | `.claude/agents/data-layer.md` | Repository with CRUD operations |
| `business-logic` | `.claude/agents/business-logic.md` | Service layer with validation |
| `api-layer` | `.claude/agents/api-layer.md` | Express routes and middleware |

Each subagent has:
- A focused **description** that tells Claude when to delegate
- **Tool restrictions** (Read, Edit, Write, Bash, Grep, Glob)
- **Model** set to Sonnet for fast implementation
- A **system prompt** that defines scope and rules

## Execution Order

### Step 1: Data Layer (use the `data-layer` subagent)

Delegate to the data-layer subagent:
- Read `specs/feature.md` for requirements
- Read `src/invitations/types.ts` for the shared contract
- Implement `src/invitations/repository.ts`
- Run tests to verify

Wait for it to complete and verify its report.

### Step 2: Business Logic (use the `business-logic` subagent)

Delegate to the business-logic subagent:
- Read the repository interface from Step 1
- Implement `src/invitations/service.ts` with validation
- Run tests to verify

Wait for it to complete and verify its report.

### Step 3: API Layer (use the `api-layer` subagent)

Delegate to the api-layer subagent:
- Read the service interface from Step 2
- Implement `src/invitations/routes.ts`
- Run tests to verify

Wait for it to complete and verify its report.

### Step 4: Integration (you, the parent agent)

Run the full test suite:
```bash
npm test
```

All tests must pass. If they do, commit:
```bash
git add -A
git commit -m "feat: user invitation service

Implemented via subagent coordination:
- Data layer: Repository with CRUD operations
- Business logic: Service with validation rules
- API layer: Express routes with error handling

13 tests passing."
```

## Key Constraint

Each subagent gets only the types file and its brief. Do not share the full codebase context. Let each specialist focus on its layer.

## Key Principles

1. **Clear scope**: Each subagent knows exactly which files it owns
2. **Shared contract**: The types file is the interface between layers
3. **Sequential delegation**: Each layer builds on the previous
4. **Integration at the end**: The parent runs the full test suite
5. **Minimal context**: Less context = more focused output
