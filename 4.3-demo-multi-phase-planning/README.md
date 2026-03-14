# Multi-Phase Planning for Large Refactors

## Overview

The Multi-Phase Planning pattern is designed for **large, complex architectural refactors** that touch many files and require careful decomposition. Instead of diving into implementation, you first create a detailed migration plan, then execute it phase by phase.

**When to use this pattern:**
- Refactors touching 10+ files
- Architecture migrations (monolithic → microservices, flat → layered)
- Major feature additions requiring new patterns
- Projects where mistakes are costly

**Not for:**
- Small, isolated features (use Beads or RALPH instead)
- Bug fixes
- Simple refactors (just do them)

## The Five Phases

### Phase 1: Plan
**Goal**: Analyze the codebase and create a detailed migration plan.

The AI agent:
1. Explores the current codebase structure
2. Identifies pain points and architectural issues
3. Proposes the target architecture
4. Breaks the migration into logical steps
5. Writes everything to `specs/migration-plan.md`

**Output**: A migration spec with:
- Current state description
- Target state description
- Detailed steps for each phase
- Risks and mitigations
- Rollback strategy

**Duration**: Usually 30-60 minutes of analysis

**Commit**: `git commit -m "phase-0: migration plan (analysis)"`

### Phase 2: Scaffold
**Goal**: Create the new file structure and type definitions without implementation.

The AI agent:
1. Creates new directories and files for the new architecture
2. Defines interfaces, types, and class signatures
3. Creates stub implementations (throw NotImplemented)
4. Does NOT implement business logic yet

**Output**:
- New directory structure
- All type definitions and interfaces
- Function/method signatures
- Still has broken imports from old code

**Why first?**: This phase locks in the architecture. Once types are defined, the next phases can implement in parallel (if needed).

**Commit**: `git commit -m "phase-1: scaffold new architecture"`

### Phase 3: Implement
**Goal**: Fill in implementations phase by phase, testing each piece.

The AI agent:
1. Implements one layer at a time (e.g., all repositories, then all services)
2. Tests each layer as it's implemented
3. Verifies that old code still works (no breaking changes yet)
4. Makes incremental commits for each subsystem

**Output**:
- Fully implemented new architecture
- Comprehensive tests
- Old code still works (dual-mode during transition)

**Commits**: Multiple atomic commits:
- `phase-2a: implement user repository`
- `phase-2b: implement order repository`
- `phase-2c: implement user service`
- etc.

### Phase 4: Test
**Goal**: Add comprehensive tests for the new architecture.

The AI agent:
1. Writes unit tests for each service (mocking repositories)
2. Writes integration tests for routes
3. Adds edge case and error handling tests
4. Targets 80%+ code coverage

**Output**:
- Unit test suite
- Integration test suite
- Coverage report
- All tests passing

**Commit**: `git commit -m "phase-3: comprehensive test suite"`

### Phase 5: Integrate
**Goal**: Wire up the new architecture and remove the old code.

The AI agent:
1. Updates all routes to use new services (breaking old imports)
2. Removes old code
3. Updates all imports across the codebase
4. Verifies all tests still pass
5. Clean compilation with no warnings

**Output**:
- Fully migrated codebase
- Old code completely removed
- All tests passing
- No dead code or unused imports

**Commit**: `git commit -m "phase-4: migrate to new architecture and remove old code"`

## Safety & Checkpointing

Because this is a large refactor, safety is critical:

1. **Create a feature branch** before starting:
   ```bash
   git checkout -b refactor/express-layered-architecture
   ```

2. **After each phase, commit** (don't wait for all phases):
   ```bash
   git commit -m "phase-X: [description]"
   ```

3. **Review each phase** before moving to the next:
   ```bash
   git log --oneline
   git show phase-1  # Review the scaffold
   ```

4. **If phase 3 breaks something**, you can:
   ```bash
   git revert phase-2a  # Revert that subsystem
   # Fix the implementation
   git commit -m "phase-2a: [fix description]"
   ```

5. **Final review before merge**:
   ```bash
   git diff main...HEAD  # See all changes since start
   npm test             # Verify all tests pass
   npm run build        # Verify clean build
   npm run lint         # No new warnings
   ```

## Worked Example: Express API Refactor

### The Scenario
You have a monolithic Express API with 500 lines of route handlers in `src/routes.ts`. All business logic, validation, and data access are mixed together.

### The Migration Plan
The migration plan documents:

```markdown
# Current State
- src/routes.ts: 500 lines, mixed concerns
- Direct database calls in routes
- No service layer
- Tight coupling to Express

# Target State
- src/routes/: thin HTTP handlers only
- src/services/: business logic
- src/repositories/: data access
- src/types/: shared interfaces

# Phase 1: Scaffold
- Create src/services/ directory
- Create src/repositories/ directory
- Define ServiceResult<T>, Repository interfaces
- Define custom error types
- Routes still work (not changed yet)

# Phase 2: Implement
- UserRepository: extract data access
- OrderRepository: extract data access
- UserService: extract business logic
- OrderService: extract business logic
- Keep routes working (they still do the old thing)

# Phase 3: Test
- Unit tests for services (mock repositories)
- Integration tests for routes
- Cover happy path and edge cases

# Phase 4: Integrate
- Update routes to use services
- Remove old business logic from routes
- Delete old code
- All tests pass
```

### File Structure

**Before:**
```
src/
  routes.ts (500 lines of everything)
tests/
  routes.test.ts
```

**After:**
```
src/
  types.ts (shared interfaces and errors)
  repositories/
    user-repository.ts
    order-repository.ts
  services/
    user-service.ts
    order-service.ts
  routes/
    user-routes.ts (thin)
    order-routes.ts (thin)
tests/
  unit/
    services/
      user-service.test.ts
      order-service.test.ts
  integration/
    routes/
      user-routes.test.ts
      order-routes.test.ts
```

## When Multi-Phase Planning Succeeds

You'll know this pattern worked when:

1. Migration plan clearly documents the path forward
2. Each phase builds logically on the previous one
3. Rollback is always possible (commits at each phase)
4. New team members can understand the architecture by reading the phases
5. Tests pass throughout, not just at the end
6. No functionality is lost (feature parity maintained)
7. Code review is straightforward (changes follow the plan)

## When Multi-Phase Planning Fails

Watch out for:

1. **Phase 1 takes too long** — Plan is incomplete or confused. Review it before moving to Phase 2.
2. **Phase 2 doesn't compile** — Architecture design was wrong. Don't push forward; reconsider Phase 1.
3. **Phase 3 is chaotic** — Too many loose ends. Split Phase 3 into smaller sub-phases.
4. **Tests written after implementation** — You're not catching bugs early. Write tests per subsystem.
5. **Phase 5 reveals missing functionality** — Features were lost during migration. Run comprehensive testing before Phase 5.

## Files in This Demo

- `README.md` (this file)
- `specs/migration-plan.md` — Detailed migration specification
- `src/routes.ts` — The "before" state (monolithic)
- `src/refactored/` — The "after" state (fully refactored)
  - `types.ts` (shared types)
  - `repositories/` (data access layer)
  - `services/` (business logic layer)
  - `routes/` (HTTP handlers)
- `package.json`, `tsconfig.json` — Build configuration

## Getting Started

1. Review the migration plan in `specs/migration-plan.md`
2. Study the "before" code in `src/routes.ts`
3. Study the "after" code in `src/refactored/`
4. Give Claude the multi-phase prompt (next section)
5. Watch the refactor unfold phase by phase

## The AI Prompt

```
You are performing a large architectural refactor of this Express API.
Work through the phases in order:

Phase 1: PLAN
- Analyze src/routes.ts
- Understand current architecture and pain points
- Propose the target architecture
- Write a detailed plan to specs/migration-plan.md

Phase 2: SCAFFOLD
- Create src/refactored/ directory with new structure
- Define all types, interfaces, and class signatures
- Create stub implementations (throw NotImplemented)
- Do NOT implement business logic yet
- Commit: "phase-1: scaffold new architecture"

Phase 3: IMPLEMENT
- Implement repositories layer (src/refactored/repositories/)
- Implement services layer (src/refactored/services/)
- Test each layer as you implement
- Commit incrementally for each subsystem

Phase 4: TEST
- Write comprehensive unit tests for services
- Write integration tests for routes
- Target 80%+ code coverage
- All tests must pass
- Commit: "phase-3: comprehensive test suite"

Phase 5: INTEGRATE
- Update src/routes.ts to use new services
- Remove old business logic
- Delete src/refactored/_old/ or similar
- Verify all tests pass
- Commit: "phase-4: migrate to new architecture"

After each phase is complete, run git log to confirm commits.
Do NOT skip phases — work through them in order.
```

## Key Takeaway

Multi-Phase Planning transforms a chaotic refactor into a structured, checkpointed journey. Each phase is small enough to understand and review, but collectively they accomplish a major architectural change. The migration plan is your north star — refer to it constantly to stay on track.
