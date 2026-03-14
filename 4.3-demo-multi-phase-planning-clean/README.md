# Chapter 3.3: Multi-Phase Planning — Refactoring Monolithic Code

## Starting Point

This is a clean starting point for the multi-phase planning demo. You have a monolithic `src/routes.ts` that mixes HTTP handling, validation, and business logic.

## Your Task

Refactor the monolithic routes.ts into a layered architecture with separation of concerns:

1. **Routes** (thin HTTP handlers only)
2. **Services** (business logic and validation)
3. **Repositories** (data access)

## The Multi-Phase Planning Workflow

### Phase 1: Analyze
- Read the migration plan in `specs/migration-plan.md`
- Identify the monolithic problems in `src/routes.ts`
- List what goes where in the target architecture

### Phase 2: Extract Services
Create `src/refactored/services/`:
- `user-service.ts` — UserService implementing IUserService
- `order-service.ts` — OrderService implementing IOrderService
- Extract ALL business logic and validation from routes

### Phase 3: Extract Repositories
Create `src/refactored/repositories/`:
- `user-repository.ts` — In-memory UserRepository
- `order-repository.ts` — In-memory OrderRepository
- Move all database access here

### Phase 4: Extract Routes
Create `src/refactored/routes/`:
- `user-routes.ts` — Thin HTTP handlers for user endpoints
- `order-routes.ts` — Thin HTTP handlers for order endpoints
- Routes are now ONLY responsible for: parsing requests, calling services, formatting responses

### Phase 5: Extract Types
Create/move `src/refactored/types.ts`:
- All interfaces and error classes
- Shared types for all layers

## Quick Start

```bash
npm install
npm test  # Verify the starting monolith compiles
```

## Files You'll Create

```
src/refactored/
├── types.ts                    (shared interfaces)
├── services/
│   ├── user-service.ts        (business logic)
│   └── order-service.ts       (business logic)
├── repositories/
│   ├── user-repository.ts     (data access)
│   └── order-repository.ts    (data access)
└── routes/
    ├── user-routes.ts         (HTTP handlers)
    └── order-routes.ts        (HTTP handlers)
```

## Success Criteria

- Routes are now thin (HTTP only, no business logic)
- Services contain all validation and business rules
- Repositories handle all data access
- No circular dependencies
- All functionality preserved (same endpoints, same responses)
- Code is testable (services can be tested independently of HTTP)

## Key Principles

- **Separation of Concerns** — Each layer has one responsibility
- **Dependency Injection** — Services receive repositories, routes receive services
- **Layered Architecture** — Clear data flow: Routes → Services → Repositories
- **Error Handling** — Unified error types (AppError, ValidationError, NotFoundError)
