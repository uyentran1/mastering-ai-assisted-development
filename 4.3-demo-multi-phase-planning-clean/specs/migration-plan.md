# Migration Plan: Flat API → Layered Architecture

## Executive Summary

This document outlines a five-phase migration from a monolithic Express API (all logic in one file) to a clean layered architecture with separate concerns: HTTP routes, business services, and data access repositories.

**Current State**: `src/routes.ts` contains ~150 lines mixing HTTP handling, validation, and database access.

**Target State**: Clean layered architecture with routes → services → repositories → database.

**Migration Time**: 2-3 hours (depending on AI agent efficiency)

**Risk Level**: Medium (can be rolled back at each phase boundary)

---

## Phase 0: Current State Analysis

### src/routes.ts Problems
- Business logic mixed with HTTP request/response handling
- Validation scattered throughout handlers
- Direct database calls in route handlers
- No service layer for code reuse
- No repository layer for data access abstraction
- Hard to test business logic (need to mock Express req/res)
- Hard to reuse business logic in other contexts (CLI, batch jobs, etc.)

### Pain Points
1. Route handlers are 40+ lines each (should be 5-10 lines)
2. Database access is hardcoded (no abstraction)
3. Validation logic is duplicated across routes
4. Error handling is inconsistent
5. Testing requires mocking Express objects

---

## Phase 1: Scaffold New Architecture

**Goal**: Create file structure and type definitions. No implementation yet.

### Files to Create

**src/refactored/types.ts** — Shared type definitions
```typescript
export class AppError extends Error {
  constructor(public code: string, message: string, public statusCode: number = 500) {
    super(message);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id: string) {
    super('NOT_FOUND', `${resource} ${id} not found`, 404);
  }
}

export interface ServiceResult<T> {
  data: T | null;
  error: AppError | null;
}
```

**src/refactored/repositories/** — Data access layer
- `user-repository.ts` — User data access
- `order-repository.ts` — Order data access

**src/refactored/services/** — Business logic layer
- `user-service.ts` — User business logic
- `order-service.ts` — Order business logic

**src/refactored/routes/** — HTTP handlers
- `user-routes.ts` — User endpoints
- `order-routes.ts` — Order endpoints

### Commit
```bash
git commit -m "phase-1: scaffold new architecture with types and directory structure"
```

---

## Phase 2: Extract Repository Layer

**Goal**: Create data access abstraction. Move all database queries to repositories.

### UserRepository Interface
```typescript
interface UserRepository {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(data: Omit<User, 'id'>): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### OrderRepository Interface
Similar pattern for orders.

### Implementation Details
- Repositories contain all database queries
- Repositories are responsible for error handling from database
- Repositories return domain objects (User, Order), not database rows
- No HTTP logic in repositories
- No validation logic in repositories

### What Stays the Same
- `src/routes.ts` still has the old handlers
- Old code continues to work
- No breaking changes yet

### Commit
```bash
git commit -m "phase-2: extract repository layer for data access"
```

---

## Phase 3: Extract Service Layer

**Goal**: Move business logic from routes into services.

### UserService Interface
```typescript
interface UserService {
  getAllUsers(): Promise<User[]>;
  getUserById(id: string): Promise<ServiceResult<User>>;
  createUser(name: string, email: string): Promise<ServiceResult<User>>;
  updateUser(id: string, name: string, email: string): Promise<ServiceResult<User>>;
  deleteUser(id: string): Promise<ServiceResult<void>>;
}
```

### OrderService Interface
Similar pattern for orders.

### Service Responsibilities
- Validation (throw ValidationError if invalid)
- Business logic (calculations, orchestration)
- Using repositories to access data
- NOT responsible for HTTP response formatting

### Services Throw Custom Errors
- `ValidationError` for invalid input
- `NotFoundError` for missing resources
- Routes catch these and convert to HTTP responses

### What Stays the Same
- Old routes continue to work
- Can have dual-mode (new services + old routes for now)

### Commits
```bash
git commit -m "phase-2a: user repository implementation"
git commit -m "phase-2b: order repository implementation"
git commit -m "phase-3a: user service implementation"
git commit -m "phase-3b: order service implementation"
```

---

## Phase 4: Test the New Architecture

**Goal**: Comprehensive test coverage for services and routes.

### Unit Tests: Services (mock repositories)
```
tests/unit/services/
  user-service.test.ts
  order-service.test.ts
```

Test cases:
- Happy path (success cases)
- Validation errors (invalid input)
- Not found errors (missing resources)
- Edge cases (empty lists, boundary values)

### Integration Tests: Routes (mock services)
```
tests/integration/routes/
  user-routes.test.ts
  order-routes.test.ts
```

Test cases:
- Happy path HTTP responses
- Error responses (400, 404, 500)
- Request/response validation
- Integration between route and service

### Coverage Target
- 80%+ line coverage
- 90%+ critical path coverage
- All error cases covered

### Commits
```bash
git commit -m "phase-4a: unit tests for services"
git commit -m "phase-4b: integration tests for routes"
```

---

## Phase 5: Migrate Routes to New Architecture

**Goal**: Update routes to use new services, remove old code.

### What Changes
- Routes are thin wrappers: parse request → call service → format response
- Routes delegate all logic to services
- Routes catch AppError and convert to HTTP responses

### Old Code Removal
- Delete old validation logic from routes
- Delete old database queries from routes
- Delete old error handling from routes
- src/routes.ts becomes 80+ lines shorter

### Breaking Changes
- Old code is removed
- Any code depending on the old patterns breaks (intentional)
- All tests must still pass (new tests protect new code)

### Final Verification
```bash
npm test        # All tests pass
npm run build   # Clean build, no errors
npm run lint    # No warnings
git log         # Five clean commits
```

### Commit
```bash
git commit -m "phase-5: migrate routes to service layer and remove old code"
```

---

## Rollback Strategy

If a phase fails:

1. **Phase 1 fails (scaffold)** → Delete src/refactored/; re-plan
2. **Phase 2 fails (repositories)** → `git revert [phase-2-commit]`; fix types
3. **Phase 3 fails (services)** → `git revert [phase-3-commit]`; fix architecture
4. **Phase 4 fails (tests)** → Don't commit; fix tests
5. **Phase 5 fails (integration)** → `git revert [phase-5-commit]`; fix routes

Always commit after each phase so rollback is clean.

---

## Success Criteria

After Phase 5:

- [ ] All tests pass (unit + integration)
- [ ] No compilation errors or warnings
- [ ] No linting warnings
- [ ] Old code completely removed
- [ ] No dead code or unused imports
- [ ] Routes are simple and readable (each handler < 10 lines)
- [ ] Services encapsulate all business logic
- [ ] Repositories encapsulate all data access
- [ ] Code review is straightforward (follows the plan)

---

## Timeline

- Phase 1 (Scaffold): 15 minutes
- Phase 2 (Repositories): 30 minutes
- Phase 3 (Services): 30 minutes
- Phase 4 (Tests): 45 minutes
- Phase 5 (Integration): 20 minutes

**Total**: ~2 hours

---

## Notes

- Don't skip phases — order matters
- Each phase builds on the previous one
- If a phase doesn't make sense, stop and re-read the plan
- Commit after each phase, even if it's not "done"
- Code review is easier when you follow the plan exactly
