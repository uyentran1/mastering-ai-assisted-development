# Notification System Spec

Video 1.2: Writing Specs AI Can Execute — This spec demonstrates the six core
areas that make a spec AI-executable: commands, testing, project structure,
code style, git workflow, and boundaries.

## 1. Commands
- `npm test` — run all tests
- `npm run dev` — start dev server
- `npm run build` — compile TypeScript

## 2. Testing
- Framework: Jest with ts-jest
- Location: `tests/` directory, mirroring `src/` structure
- Pattern: `*.test.ts` for unit tests
- Coverage: all public functions must have tests
- Run: `npm test -- --testPathPattern=notification`

## 3. Project Structure
```
src/
  notifications/
    notification.service.ts    — Core notification logic
    notification.types.ts      — TypeScript interfaces
    notification.routes.ts     — Express route handlers
    channels/
      email.channel.ts         — Email delivery
      in-app.channel.ts        — In-app notification storage
      webhook.channel.ts       — Webhook delivery
tests/
  notifications/
    notification.service.test.ts
    channels/
      email.channel.test.ts
```

## 4. Code Style
- TypeScript strict mode
- async/await, never callbacks
- Use custom error types (AppError subclasses)
- All functions documented with JSDoc
- Response envelope: { data, error, meta }

## 5. Git Workflow
- Branch: `feat/notification-system`
- Commits: conventional commits (feat:, fix:, test:)
- Commit after each working milestone

## 6. Boundaries
- DO NOT add new npm dependencies
- DO NOT modify existing routes or middleware
- DO NOT implement actual email sending (use a stub/interface)
- DO NOT store notifications in a real database (use in-memory Map)
- Notification channels must implement the NotificationChannel interface
