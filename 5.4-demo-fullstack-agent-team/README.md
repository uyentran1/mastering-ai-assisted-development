# Fullstack App with Agent Teams

## Overview

This is the **capstone demo**: building a complete task management application with coordinated agents handling different layers of the stack.

**Architecture**:
- React frontend + Express backend + Supabase (PostgreSQL + Auth)
- Frontend Teammate: React components, routing, state management
- Backend Teammate: Express routes, middleware, database integration
- Testing Teammate: E2E tests, API tests, component tests

**Coordination**: Agents use shared types as the contract between frontend and backend.

## The Task Management App

### Features
1. **Authentication** — Sign up, sign in, sign out (via Supabase Auth)
2. **Projects** — Create, read, update, delete projects
3. **Tasks** — Create, read, update, delete tasks within projects
4. **Kanban Board** — Drag tasks between status columns (todo/in-progress/done)
5. **Real-time Updates** — Supabase subscriptions for live updates

### Tech Stack
- **Frontend**: React 18, TypeScript, Tailwind CSS
- **Backend**: Express.js, TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Testing**: Jest, React Testing Library, Cypress (E2E)

## Agent Team Coordination Strategy

### Key: API-First Design with Plan Approval

**Backend teammate defines the API first**, then Frontend teammate builds UI against it.

Ask the team lead to require **plan approval** before teammates start implementing. Each teammate submits its implementation plan, the lead reviews and approves, then work begins. This prevents wasted effort on misaligned approaches.

```
Phase 1: Lead creates team, assigns roles, requires plan approval
   ↓
Phase 2: Backend teammate submits plan → Lead approves → Backend builds API
   ↓
Phase 3: Frontend teammate builds UI (using mock API, then wires to real)
   ↓
Phase 4: Testing teammate writes E2E tests (exercises both layers, starts last)
```

### Shared Types as Contract

Both agents import from `src/shared/types.ts`:

```typescript
export interface Task {
  id: string;
  project_id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}
```

Frontend knows exactly what the API returns. Backend knows exactly what to return.

## The Three Agent Roles

### Backend Teammate
**Responsibility**: API endpoints, middleware, database layer

**Tasks**:
1. Define all TypeScript interfaces in `src/shared/types.ts`
2. Create Express routes in `src/routes/`
3. Implement Supabase integration in `src/db/`
4. Define error handling and custom errors
5. Write API tests

**Output**: Working Express API with Supabase integration

**Example endpoint**:
```typescript
// src/routes/tasks.ts
router.post('/projects/:id/tasks', async (req, res) => {
  const { title, description } = req.body;
  const { id: projectId } = req.params;

  try {
    const task = await createTask({ projectId, title, description });
    res.status(201).json({ data: task, error: null });
  } catch (error) {
    res.status(500).json({ data: null, error: error.message });
  }
});
```

### Frontend Teammate
**Responsibility**: React components, routing, state management

**Tasks**:
1. Import types from `src/shared/types.ts`
2. Create React components in `src/components/`
3. Build pages in `src/pages/`
4. Set up routing in `src/routes.tsx`
5. Use hooks for API calls (useFetch, useAsync)
6. Write component tests

**Output**: Working React UI connected to API

**Example component**:
```typescript
// src/pages/ProjectTasks.tsx
import { Task } from '../shared/types';

export const ProjectTasks: React.FC<{ projectId: string }> = ({ projectId }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/projects/${projectId}/tasks`)
      .then(r => r.json())
      .then(data => setTasks(data.data))
      .finally(() => setLoading(false));
  }, [projectId]);

  return (
    <div>
      {tasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </div>
  );
};
```

### Testing Teammate
**Responsibility**: E2E tests, integration tests, test infrastructure

**Tasks**:
1. Write API integration tests (using real Supabase, isolated DB)
2. Write React component tests
3. Write E2E tests with Cypress (real browser, full stack)
4. Create test utilities and fixtures
5. Set up CI/CD integration

**Output**: Comprehensive test suite covering all layers

**Example E2E test**:
```typescript
// e2e/project-workflow.cy.ts
describe('Project Workflow', () => {
  it('creates a project and adds a task', () => {
    cy.visit('/');
    cy.contains('Create Project').click();
    cy.get('input[placeholder="Project name"]').type('My Project');
    cy.contains('Create').click();
    cy.contains('My Project').should('be.visible');

    cy.contains('Add Task').click();
    cy.get('input[placeholder="Task title"]').type('Write tests');
    cy.contains('Save').click();

    cy.contains('Write tests').should('be.visible');
    cy.get('[data-testid="task-status"]').should('contain', 'todo');
  });
});
```

## Coordination Timeline

### Week 1, Day 1: Planning
- **Team Lead**: Create spec, define shared types, create TASKS.md
- **All Teammates**: Review architecture and conventions

### Week 1, Days 2-3: Backend Development
- **Backend Teammate**: Define API spec, implement routes, write API tests
- **Frontend Teammate**: Start building UI components (mocked API)
- **Testing Teammate**: Create test infrastructure, fixtures, test utilities

### Week 1, Days 4-5: Integration
- **Frontend Teammate**: Wire real API calls, test against backend
- **Testing Teammate**: Write E2E tests, resolve any issues
- **Backend Teammate**: Fine-tune API, handle edge cases

### Week 1, Day 6: Final Polish
- **Team Lead**: Code review, merge, deploy to staging
- **All Teammates**: Final testing, documentation

## Handling Blockers

**Scenario**: Frontend Teammate needs to fetch tasks, but Backend Teammate hasn't finished the endpoint.

**Solution**:
1. Backend Teammate creates a mock response in `src/shared/types.ts`
2. Frontend Teammate creates a mock fetch function
3. Frontend Teammate builds UI against the mock
4. Backend Teammate finishes the real endpoint
5. Frontend Teammate switches from mock to real API

```typescript
// src/api/tasks.ts (Frontend uses this)
export const fetchTasks = async (projectId: string): Promise<Task[]> => {
  // If API is ready, use it
  // If not, use mock:
  if (process.env.REACT_APP_MOCK_API === 'true') {
    return MOCK_TASKS;  // Imported from shared types
  }
  // Real API call
  const res = await fetch(`/api/projects/${projectId}/tasks`);
  return res.json();
};
```

## Files in This Demo

- `README.md` (this file)
- `specs/task-app.md` — Complete specification
- `src/shared/types.ts` — Shared type definitions (both agents use)
- `src/shared/mocks.ts` — Mock data for frontend development
- `src/api/` (backend) — API layer
- `src/pages/` (frontend) — React pages
- `src/components/` (frontend) — React components
- `tests/` — Test suites for all layers
- `e2e/` — End-to-end Cypress tests
- `package.json` — Shared dependencies

## Getting Started

1. Review `specs/task-app.md` for full specification
2. Review `src/shared/types.ts` to understand the data contract
3. Imagine three agents working on this:
   - Backend Teammate implements Express API
   - Frontend Teammate builds React UI
   - Testing Teammate writes comprehensive tests
4. Study the sample code in each layer
5. Give Claude the team prompt to see agents coordinate

## Key Lessons

1. **API-First Design**: Define types and API spec before implementation
2. **Shared Contract**: Both frontend and backend use the same types
3. **Mock-Driven Frontend**: Frontend can build UI before API is ready
4. **Clear Boundaries**: Each agent owns one layer; minimal overlap
5. **Frequent Integration**: Test integration continuously, not at the end

## Key Takeaway

Fullstack agent teams work best when boundaries are clear (frontend/backend/testing), communication is via shared types and contracts, and each agent can work semi-independently with a clear integration plan.
