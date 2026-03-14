# Chapter 4.2: Subagents — Delegation Pattern

## Starting Point

This is a clean starting point for the subagents demo. You have a feature specification but no implementation yet.

## Your Task

Build a complete invitation system by assigning work to specialized subagents:

1. **Research Agent** — Analyze the spec and design the architecture
2. **Implementation Agent** — Build the code based on the design
3. **Testing Agent** — Write comprehensive tests
4. **Documentation Agent** — Document the feature

## The Subagent Pattern Workflow

### Step 1: Research Agent
Analyze `specs/feature.md`:
- Read the user story and acceptance criteria
- Design the architecture (service, repository, validation layers)
- Document design decisions in the repo

Command to send to research agent:
```
Analyze specs/feature.md and design the architecture for an invitation system.
Document: What layers will you create? What's the interface for each?
```

### Step 2: Implementation Agent
Create the codebase based on research design:
- `src/invitations/service.ts` — InvitationService with createInvitation, acceptInvitation, listPendingInvitations, revokeInvitation, resendInvitation
- `src/invitations/repository.ts` — In-memory data store for invitations
- `src/invitations/validation.ts` — Input validation (email format, password strength)
- `src/invitations/routes.ts` — Express routes: POST /invitations, POST /invitations/:id/accept, GET /invitations, DELETE /invitations/:id
- `src/server.ts` — Express app setup

Command to send to implementation agent:
```
Implement the invitation system based on specs/feature.md.
Follow the layered architecture:
- Service layer (business logic)
- Repository layer (data access)
- Validation layer
- Routes (HTTP handlers)
All tests in tests/invitations.test.ts must pass.
```

### Step 3: Testing Agent
Write comprehensive tests covering:
- Happy path: create, send, redeem invitation
- Error cases: invalid email, weak password, expired token
- Edge cases: duplicate invitations, already-redeemed tokens
- All acceptance criteria from spec

Command to send to testing agent:
```
Write comprehensive tests for the invitation system.
Cover: happy path, validation, errors, edge cases.
Make sure all acceptance criteria pass.
Run: npm test
```

### Step 4: Documentation Agent
Document the feature:
- How to use each endpoint
- Examples of requests/responses
- Error handling
- Security considerations

## Quick Start

```bash
npm install
npm test  # Should fail until implementation is complete
```

## Success Criteria

- All 13+ tests pass
- Covers happy path and error cases
- Proper input validation
- Proper error handling
- Service layer (no HTTP in business logic)
- Repository pattern (data access isolated)

## Files to Create

```
src/
├── invitations/
│   ├── types.ts              (already present)
│   ├── service.ts            (TODO)
│   ├── repository.ts         (TODO)
│   ├── validation.ts         (TODO)
│   └── routes.ts             (TODO)
└── server.ts                 (TODO)

tests/
└── invitations.test.ts       (TODO)
```
