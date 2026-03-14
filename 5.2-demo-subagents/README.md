# Subagents — Delegating to Specialists

## Overview

**Subagents** are focused child AI agents spawned by a parent orchestrator to handle specific, self-contained tasks. The subagent does its work, reports back to the parent, and the parent integrates the results.

**Key difference from swarms**: Subagents don't communicate with each other. They report to a central orchestrator who coordinates the overall effort.

## When to Use Subagents

Use subagents when:
- A task can be cleanly divided into independent subtasks
- Subtasks are self-contained (minimal interdependencies)
- You want specialized expertise for each subtask
- Results need to be reviewed before integration

Don't use subagents when:
- Subtasks heavily interdepend (use swarms instead)
- The overall task is small (overhead not worth it)
- Real-time coordination between agents is needed

## The Three Subagent Patterns

### Pattern 1: Research Subagent
**Task**: Analyze an existing system and report back.

**Example prompt to subagent**:
```
Analyze the codebase in src/ and report back:
- What's the architecture? (MVC, layered, monolithic, etc.)
- What test framework is used?
- What naming conventions are followed?
- What dependencies are critical?
- What architectural patterns appear?

Write your findings to RESEARCH.md with specific examples from the code.
```

**Parent uses the report to**: Make architectural decisions for new code.

**Duration**: 15-30 minutes

### Pattern 2: Implementation Subagent
**Task**: Implement a feature following existing patterns.

**Example prompt to subagent**:
```
Implement a new feature in src/[module]:
- Follow the architectural patterns found in [parent's research report]
- Use existing code style and naming conventions
- Run tests after each change
- All tests must pass before you're done
- Document what you implemented in IMPLEMENTATION.md
```

**Parent uses the report to**: Understand what was built and verify it matches the spec.

**Duration**: 30-60 minutes

### Pattern 3: Testing Subagent
**Task**: Write comprehensive tests for existing code.

**Example prompt to subagent**:
```
Write tests for src/[module]:
- Follow the existing test patterns in tests/
- Aim for 80%+ code coverage
- Cover: happy path, edge cases, error cases
- Update tests/README.md with coverage summary

Run tests frequently to ensure they all pass.
```

**Parent uses the report to**: Verify test quality and coverage.

**Duration**: 30-45 minutes

## How the Orchestrator Coordinates

The orchestrator:
1. Breaks the task into subtasks
2. Spawns a subagent for each subtask (sequentially or in parallel)
3. Waits for each subagent to report back
4. Reviews the reports
5. Coordinates integration
6. Makes final decisions

## Orchestrator Prompt Template

```markdown
# Orchestrator Prompt: Feature Implementation with Subagents

## Your Role
You are the lead engineer orchestrating feature implementation across subagents.

## Step 1: Research (Subagent A)

Delegate to a subagent:
"Analyze the codebase and report back in RESEARCH.md:
- Current architecture
- Testing patterns
- Naming conventions
- Key dependencies
- Design decisions"

After subagent reports back, review RESEARCH.md.

## Step 2: Implementation (Subagent B)

Delegate to a subagent:
"Implement the feature described in specs/feature.md:
- Follow patterns documented in RESEARCH.md
- Run tests after each change
- All tests must pass
- Document in IMPLEMENTATION.md"

After subagent reports back, review IMPLEMENTATION.md and code changes.

## Step 3: Testing (Subagent C)

Delegate to a subagent:
"Write comprehensive tests for src/[feature]:
- Follow patterns from RESEARCH.md
- Aim for 80%+ coverage
- Cover happy path, edges, errors
- Document coverage in TESTS.md"

After subagent reports back, review TESTS.md and test count.

## Step 4: Integration (You)

Review all reports and code:
- Does implementation match the spec?
- Are tests adequate?
- Do patterns match the codebase?
- Are there any issues?

If all looks good:
```bash
git add .
git commit -m "feature: [name] (implemented via subagent coordination)"
```

If issues exist, request fixes from relevant subagents.
```

## Subagent Communication

Subagents report back via:

1. **Report files** (RESEARCH.md, IMPLEMENTATION.md, TESTS.md)
   - Written during the subagent's work
   - Parent reads these to understand what was done
   - Specific, detailed, with examples

2. **Git commits**
   - Each subagent commits their work
   - Parent reviews the diff
   - Helps catch unintended changes

3. **Structured output**
   - Summary of what was done
   - Blockers encountered
   - Decisions made
   - Next steps needed

## Example Workflow

**Feature**: Add a user authentication service

### Step 1: Research
Parent delegates to Research Subagent:
```
"Analyze src/ and report:
- How is the current auth handled?
- What JWT/session library is used?
- How are errors handled?
- What testing patterns exist?
Write to RESEARCH.md"
```

Research Subagent returns:
```
RESEARCH.md:
- Current: No auth, routes unprotected
- Library: no JWT yet, using express-session
- Errors: Custom AppError class with statusCode
- Testing: Jest with mocked Express (req, res, next)
- Recommendation: Add JWT for stateless auth
```

### Step 2: Implementation
Parent delegates to Implementation Subagent:
```
"Implement JWT authentication service:
- Create src/auth/auth-service.ts
- Follow error patterns from RESEARCH.md
- Add src/middleware/auth-middleware.ts
- Run tests after each change
- Document in IMPLEMENTATION.md"
```

Implementation Subagent returns:
```
IMPLEMENTATION.md:
- Added AuthService with sign, verify, refresh methods
- Added authMiddleware for route protection
- 45 lines of code
- All existing tests still pass
- New auth code tested with AuthService.test.ts
```

### Step 3: Testing
Parent delegates to Testing Subagent:
```
"Write comprehensive tests for src/auth/:
- Test valid tokens, expired tokens, invalid tokens
- Test JWT signing and verification
- Test middleware (pass/fail scenarios)
- Target 85%+ coverage
- Update TESTS.md"
```

Testing Subagent returns:
```
TESTS.md:
- 12 test cases covering all paths
- 87% code coverage
- All tests passing
- Edge cases: malformed JWT, expired token, missing Authorization header
```

### Step 4: Integration
Parent reviews all work and runs:
```bash
npm test         # All tests pass
npm run build    # Clean build
git diff         # Review changes
git commit -m "feat: JWT authentication with subagent coordination"
```

## Cost Considerations

Each subagent uses its own context window (200k tokens). For three subagents:
- Research: ~50k tokens
- Implementation: ~100k tokens
- Testing: ~70k tokens
- **Total: ~220k tokens = ~2 Claude calls**

Vs. doing it all in one session:
- Sequential: ~220k tokens = 1-2 calls (but slower, more confused)

**Subagents are cost-neutral and often **faster** because each agent is focused.**

## Files in This Demo

- `README.md` (this file)
- `scripts/orchestrate.md` — Template prompt for orchestrators
- `specs/feature.md` — Example feature specification
- `src/feature-example/` — Starter module structure
- `package.json` — Build configuration

## Getting Started

1. Review `scripts/orchestrate.md` to understand the orchestrator role
2. Read `specs/feature.md` to understand what needs to be built
3. Give the orchestrator prompt to Claude
4. Claude spawns subagents for research, implementation, testing
5. After all subagents report back, Claude integrates the results

## Key Differences: Subagents vs. Swarms vs. RALPH

| Pattern | Structure | Communication | Use Case |
|---------|-----------|---------------|----------|
| **RALPH** | Single agent, iterative | Loop feedback | Autonomous refinement, single task |
| **Beads** | Sequential agents | Parent → Subagent (one-way) | Modular chained tasks |
| **Subagents** | Parallel agents | Parent ← Subagent (report back) | Independent specialist tasks |
| **Swarms** | Team agents | Peer-to-peer (shared files) | Collaborative, interdependent work |

## Key Takeaway

Subagents transform a large task into smaller expert specialties. The orchestrator coordinates the effort, reviews reports, and makes final decisions. This pattern is most effective when subtasks are independent and results need human review before integration.
