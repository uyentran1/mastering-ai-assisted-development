# Chapter 5.4: Full-Stack Agent Teams

## Starting Point

This is a clean starting point for the fullstack agent team demo. You have shared types and specs, but no implementations yet. Enable agent teams with `export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`.

## Your Task

Build a complete full-stack application by creating an agent team with three teammates:

- **Backend Teammate** — Express backend with routes, middleware, and database
- **Frontend Teammate** — React frontend with components and hooks
- **Testing Teammate** — Comprehensive API and frontend tests

All teammates share a single `src/shared/types.ts` file that defines the contract between API and frontend. Ask the team lead to require **plan approval** before teammates start implementing.

## The Agent Team Pattern

### Shared Contract: types.ts

Both API and frontend import from `src/shared/types.ts`. This ensures they stay in sync:

```typescript
// Shared types ensure both teams implement the same interfaces
export interface Project { id, name, description, color, ... }
export interface Task { id, project_id, title, status, priority, ... }
export interface CreateProjectRequest { name, description?, color? }
// etc.
```

### API Agent

Build the Express backend:

**Routes:**
- `POST /api/auth/signup` — Create user account
- `POST /api/auth/signin` — Login user
- `GET /api/projects` — List all projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id/tasks` — List tasks in project
- `POST /api/projects/:id/tasks` — Create task
- `PATCH /api/projects/:id/tasks/:taskId` — Update task (status, priority, etc.)
- `DELETE /api/projects/:id/tasks/:taskId` — Delete task

**Database:**
- `src/api/db/mock.ts` — In-memory data store with seed data

**Directory:**
```
src/api/
├── server.ts              (Express app setup)
├── middleware/
│   └── auth.ts           (Mock auth middleware)
├── routes/
│   ├── auth.ts           (Auth endpoints)
│   ├── projects.ts       (Project CRUD)
│   └── tasks.ts          (Task CRUD)
└── db/
    └── mock.ts           (In-memory database)
```

Command:
```
Implement the API backend according to specs/task-app.md.
- Use Express with TypeScript
- Create routes for auth, projects, and tasks
- Implement in-memory database with seed data
- All routes must use shared types from src/shared/types.ts
- Run: npm test — all tests must pass
```

### Frontend Teammate

Build the React frontend:

**Components:**
- `App.tsx` — Main component with navigation
- `components/ProjectList.tsx` — Grid of project cards
- `components/ProjectCard.tsx` — Individual project card
- `components/KanbanBoard.tsx` — Kanban board (3 columns: todo, in-progress, done)
- `components/TaskCard.tsx` — Individual task card

**Hooks:**
- `hooks/useAuth.ts` — Auth state management

**Directory:**
```
src/frontend/
├── App.tsx                (Main app)
├── components/
│   ├── ProjectList.tsx
│   ├── ProjectCard.tsx
│   ├── KanbanBoard.tsx
│   └── TaskCard.tsx
└── hooks/
    └── useAuth.ts
```

Command:
```
Implement the React frontend according to specs/task-app.md.
- Use React with TypeScript
- Import types from src/shared/types.ts
- Create components for projects and tasks
- Use MOCK_PROJECTS and MOCK_TASKS for demo data
- Styling: Tailwind classes (no CSS files)
- Run: npm test — all tests must pass
```

### Testing Teammate

Write comprehensive tests:

**API Tests:**
- `tests/api/auth.test.ts` — Auth routes (signup, signin, duplicate prevention)
- `tests/api/projects.test.ts` — Project CRUD operations
- `tests/api/tasks.test.ts` — Task CRUD operations

**Frontend Tests:**
- `tests/frontend/App.test.tsx` — App component and navigation
- `tests/frontend/ProjectList.test.tsx` — Project list rendering
- `tests/frontend/KanbanBoard.test.tsx` — Kanban board columns and drag/drop

Command:
```
Write comprehensive tests for the full-stack app.
- Use Jest + React Testing Library
- Cover: happy path, error cases, edge cases, state management
- API tests: Use the MockDatabase directly
- Frontend tests: Render components and test interactions
- Aim for 80%+ coverage
- Run: npm test — all must pass
```

## Success Criteria

After all agents finish:

**API:**
- [ ] All routes implemented
- [ ] All input validation
- [ ] Proper error handling
- [ ] MockDatabase with seed data
- [ ] Uses shared types

**Frontend:**
- [ ] All components implemented
- [ ] Responsive design (Tailwind)
- [ ] Proper TypeScript typing
- [ ] Uses shared types
- [ ] MOCK_PROJECTS and MOCK_TASKS integration

**Testing:**
- [ ] 20+ tests total
- [ ] API routes tested
- [ ] Component rendering tested
- [ ] User interactions tested
- [ ] All tests passing

**Integration:**
- [ ] No TypeScript errors
- [ ] No lint errors
- [ ] All tests pass
- [ ] Code is readable and documented

## Quick Start

```bash
npm install
npm test            # Run all tests
npm run build       # TypeScript compilation
npm run test:watch  # Watch mode
```

## Key Patterns

1. **Shared Contract** — types.ts is the single source of truth
2. **Independent Agents** — Each team works independently
3. **Coordination via Files** — No blocking; teams coordinate through shared files
4. **Parallel Development** — All three agents can work simultaneously
5. **Integration Tests** — Testing agent validates both API and frontend

## Example API Route

```typescript
// src/api/routes/projects.ts
import { Project, CreateProjectRequest } from '../../shared/types';
import { db } from '../db/mock';

router.post('/', (req: Request, res: Response) => {
  const { name, description, color } = req.body as CreateProjectRequest;
  // Validate inputs
  // Create project using db.createProject()
  // Return new project with types from shared/types
});
```

## Example Frontend Component

```typescript
// src/frontend/components/ProjectCard.tsx
import { Project } from '../../shared/types';

interface ProjectCardProps {
  project: Project;
  onSelect: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project }) => {
  // Render project card using project.name, project.color, etc.
};
```

## Shared Types Example

```typescript
// src/shared/types.ts (already present)
export interface Project {
  id: string;
  user_id: string;
  name: string;
  color: string;
  task_count?: number;
  // ... more fields
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  // ... more fields
}
```

## Tips for Agents

- **API Agent**: Start with `db/mock.ts`, then routes
- **Frontend Teammate**: Use MOCK_PROJECTS/MOCK_TASKS for development
- **Testing Teammate**: Write tests as you go; don't wait for all implementation

All three agents work in parallel - they're not blocked by each other!
