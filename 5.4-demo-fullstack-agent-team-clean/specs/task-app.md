# Task Management App Specification

## Overview

A web-based task management application with user authentication, project organization, and a Kanban-style board for task management.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Express.js + TypeScript
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password)
- **Real-time**: Supabase RealtimeSubscriptions

## Features

### Authentication
- Sign up with email/password
- Sign in with email/password
- Sign out
- Session management (JWT via Supabase)
- Protected routes (redirect to login if not authenticated)

### Projects
- List all projects
- Create new project
- View project details
- Edit project (name, description, color)
- Delete project (with confirmation)
- Each project has a Kanban board for tasks

### Tasks
- Create task within a project
- Read task details
- Update task (title, description, status, priority, assignee, due date)
- Delete task (with confirmation)
- Drag-and-drop between status columns (todo → in-progress → done)
- Filter tasks by priority or assignee
- Search tasks by title

### Dashboard
- Overview showing projects and task counts
- Recent activity feed (recently updated tasks/projects)
- Quick links to create project, create task

## API Endpoints

### Authentication
```
POST /api/auth/signup
  Request: { email, password }
  Response: { user_id, email, message }

POST /api/auth/signin
  Request: { email, password }
  Response: { user_id, email, token, message }

POST /api/auth/signout
  Request: (empty)
  Response: { message: "Signed out" }

GET /api/auth/me
  Request: (authenticated)
  Response: { user_id, email, created_at }
```

### Projects
```
GET /api/projects
  Request: (authenticated)
  Response: [{ id, name, description, color, created_at, task_count }]

POST /api/projects
  Request: { name, description?, color? }
  Response: { id, name, description, color, created_at }

GET /api/projects/:id
  Request: (authenticated)
  Response: { id, name, description, color, created_at, tasks: [] }

PATCH /api/projects/:id
  Request: { name?, description?, color? }
  Response: { id, name, description, color, updated_at }

DELETE /api/projects/:id
  Request: (authenticated)
  Response: { message: "Project deleted" }
```

### Tasks
```
GET /api/projects/:id/tasks
  Request: (authenticated)
  Response: [{ id, project_id, title, description, status, priority, ... }]

POST /api/projects/:id/tasks
  Request: { title, description?, priority?, assignee?, due_date? }
  Response: { id, project_id, title, description, status, priority, ... }

GET /api/tasks/:id
  Request: (authenticated)
  Response: { id, project_id, title, description, status, priority, ... }

PATCH /api/tasks/:id
  Request: { title?, description?, status?, priority?, assignee?, due_date? }
  Response: { id, project_id, title, description, status, priority, ... }

DELETE /api/tasks/:id
  Request: (authenticated)
  Response: { message: "Task deleted" }
```

## Shared Types

```typescript
// src/shared/types.ts

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;  // e.g., "#3B82F6"
  created_at: string;
  updated_at?: string;
  task_count?: number;  // Computed in API
}

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;  // User ID
  due_date?: string;  // ISO date string
  created_at: string;
  updated_at?: string;
}

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface AuthResponse {
  user_id: string;
  email: string;
  token?: string;
  message: string;
}

export interface Activity {
  id: string;
  user_id: string;
  action: 'created' | 'updated' | 'deleted';
  resource_type: 'project' | 'task';
  resource_id: string;
  timestamp: string;
}
```

## Page Structure

### Frontend Pages
- `/` — Dashboard (overview, recent activity)
- `/projects` — Projects list
- `/projects/:id` — Project details with Kanban board
- `/tasks/:id` — Task detail modal/page
- `/auth/signup` — Sign up form
- `/auth/signin` — Sign in form
- `/settings` — User settings (logout, profile)

### Components
- `Navigation` — Top nav bar with user menu
- `ProjectCard` — Card showing project preview
- `ProjectBoard` — Kanban board with task columns
- `TaskCard` — Compact task display
- `TaskModal` — Detailed task edit form
- `CreateProjectForm` — Form to create new project
- `CreateTaskForm` — Form to create new task

## Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- id, email, created_at, etc.

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'todo' CHECK (status IN ('todo', 'in-progress', 'done')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  assignee UUID REFERENCES auth.users(id),
  due_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT CHECK (action IN ('created', 'updated', 'deleted')),
  resource_type TEXT CHECK (resource_type IN ('project', 'task')),
  resource_id UUID NOT NULL,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX projects_user_id ON projects(user_id);
CREATE INDEX tasks_project_id ON tasks(project_id);
CREATE INDEX tasks_assignee ON tasks(assignee);
CREATE INDEX activity_user_id ON activity(user_id);
```

## Error Handling

Standard error response format:
```json
{
  "data": null,
  "error": "Project not found"
}
```

HTTP Status Codes:
- 200 — OK
- 201 — Created
- 400 — Bad Request (validation error)
- 401 — Unauthorized (not authenticated)
- 403 — Forbidden (no permission)
- 404 — Not Found
- 500 — Internal Server Error

## Testing Requirements

### Unit Tests
- API route handlers
- React components (rendering, user interaction)
- Type safety checks

### Integration Tests
- API endpoints with mock Supabase
- Authentication flow
- CRUD operations (create, read, update, delete)

### E2E Tests (Cypress)
- Full user flow: sign up → create project → add task → mark done
- Authentication flow
- Kanban board drag-and-drop
- Error scenarios

### Coverage
- Target 80%+ line coverage
- 90%+ coverage for critical paths (auth, CRUD)

## Success Criteria

- [ ] All API endpoints implemented
- [ ] All React pages and components implemented
- [ ] Authentication works (Supabase Auth)
- [ ] Kanban board functional with drag-and-drop
- [ ] All tests passing (unit, integration, E2E)
- [ ] No type errors (TypeScript strict mode)
- [ ] Clean code following project patterns
- [ ] Performance acceptable (API <300ms, UI smooth)

## Timeline

- **Day 1**: Backend Agent defines API spec, Frontend Agent starts UI
- **Day 2**: Backend Agent implements API, Frontend Agent builds components
- **Day 3**: Testing Agent writes tests, agents integrate
- **Day 4**: Polish, bug fixes, final testing
