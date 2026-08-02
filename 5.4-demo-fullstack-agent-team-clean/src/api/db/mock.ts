/**
 * In-memory mock database.
 *
 * Deliberately synchronous and dependency-free so tests can drive it directly.
 * Every accessor returns a deep copy, so callers can never mutate stored state
 * by holding on to a returned object.
 */

import {
  CreateProjectRequest,
  CreateTaskRequest,
  Project,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateProjectRequest,
  UpdateTaskRequest,
  User,
} from '../../shared/types';

/** A user row, including the credential fields never exposed over the wire. */
interface StoredUser extends User {
  password: string;
}

export interface TaskFilters {
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  search?: string;
}

const DEFAULT_PROJECT_COLOR = '#3B82F6';

/** Structured deep copy that keeps plain-object/array shape and drops nothing. */
function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export class MockDatabase {
  private users: StoredUser[] = [];
  private projects: Project[] = [];
  private tasks: Task[] = [];
  /** token -> user id */
  private tokens = new Map<string, string>();

  private userCounter = 0;
  private projectCounter = 0;
  private taskCounter = 0;

  constructor() {
    this.reset();
  }

  /**
   * Restore the database to its seeded state. Counters are reset too, so ID
   * generation is deterministic across tests.
   */
  reset(): void {
    this.users = [
      {
        id: 'user-1',
        email: 'demo@example.com',
        password: 'password123',
        created_at: '2024-01-01T00:00:00.000Z',
      },
      {
        id: 'user-2',
        email: 'other@example.com',
        password: 'password123',
        created_at: '2024-01-02T00:00:00.000Z',
      },
    ];

    this.projects = [
      {
        id: 'proj-1',
        user_id: 'user-1',
        name: 'Personal Website',
        description: 'Portfolio and blog',
        color: '#3B82F6',
        created_at: '2024-01-03T00:00:00.000Z',
        updated_at: '2024-01-03T00:00:00.000Z',
      },
      {
        id: 'proj-2',
        user_id: 'user-1',
        name: 'Mobile App',
        description: 'React Native app',
        color: '#10B981',
        created_at: '2024-01-04T00:00:00.000Z',
        updated_at: '2024-01-04T00:00:00.000Z',
      },
      {
        // Owned by user-2 — the ownership-failure fixture.
        id: 'proj-3',
        user_id: 'user-2',
        name: 'Secret Project',
        description: 'Belongs to another user',
        color: '#EF4444',
        created_at: '2024-01-05T00:00:00.000Z',
        updated_at: '2024-01-05T00:00:00.000Z',
      },
    ];

    this.tasks = [
      {
        id: 'task-1',
        project_id: 'proj-1',
        title: 'Design homepage',
        description: 'Create mockups for homepage',
        status: 'done',
        priority: 'high',
        created_at: '2024-01-06T00:00:00.000Z',
        updated_at: '2024-01-06T00:00:00.000Z',
      },
      {
        id: 'task-2',
        project_id: 'proj-1',
        title: 'Set up hosting',
        description: 'Deploy to Vercel',
        status: 'in-progress',
        priority: 'high',
        assignee: 'user-1',
        created_at: '2024-01-07T00:00:00.000Z',
        updated_at: '2024-01-07T00:00:00.000Z',
      },
      {
        id: 'task-3',
        project_id: 'proj-1',
        title: 'Write blog posts',
        description: 'Write 3 initial blog posts',
        status: 'todo',
        priority: 'medium',
        created_at: '2024-01-08T00:00:00.000Z',
        updated_at: '2024-01-08T00:00:00.000Z',
      },
      {
        // Lives in proj-3 — the task-level ownership-failure fixture.
        id: 'task-4',
        project_id: 'proj-3',
        title: 'Do not touch',
        description: 'Belongs to another user',
        status: 'todo',
        priority: 'low',
        created_at: '2024-01-09T00:00:00.000Z',
        updated_at: '2024-01-09T00:00:00.000Z',
      },
    ];

    this.tokens = new Map<string, string>([
      ['mock-token-user-1', 'user-1'],
      ['mock-token-user-2', 'user-2'],
    ]);

    // Next generated IDs continue past the seed data.
    this.userCounter = 2;
    this.projectCounter = 3;
    this.taskCounter = 4;
  }

  // ==========================================
  // Users & auth
  // ==========================================

  findUserById(id: string): User | null {
    const found = this.users.find((u) => u.id === id);
    return found ? this.publicUser(found) : null;
  }

  findUserByEmail(email: string): User | null {
    const found = this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    return found ? this.publicUser(found) : null;
  }

  /** Resolve a bearer token to its user. Returns null for unknown tokens. */
  findUserByToken(token: string): User | null {
    const userId = this.tokens.get(token);
    if (!userId) return null;
    return this.findUserById(userId);
  }

  createUser(email: string, password: string): User {
    this.userCounter += 1;
    const user: StoredUser = {
      id: `user-${this.userCounter}`,
      email,
      password,
      created_at: new Date().toISOString(),
    };
    this.users.push(user);
    return this.publicUser(user);
  }

  /** Returns the user when the email/password pair matches, otherwise null. */
  verifyCredentials(email: string, password: string): User | null {
    const found = this.users.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    return found ? this.publicUser(found) : null;
  }

  /** Issue (and remember) the deterministic mock token for a user. */
  createToken(userId: string): string {
    const token = `mock-token-${userId}`;
    this.tokens.set(token, userId);
    return token;
  }

  /**
   * Invalidate a token. Returns true if the token existed, false if it was
   * already unknown or revoked.
   */
  revokeToken(token: string): boolean {
    return this.tokens.delete(token);
  }

  // ==========================================
  // Projects
  // ==========================================

  /** Projects owned by a user, each with a computed task_count. */
  listProjects(userId: string): Project[] {
    return this.projects
      .filter((p) => p.user_id === userId)
      .map((p) => this.withTaskCount(p));
  }

  getProject(id: string): Project | null {
    const found = this.projects.find((p) => p.id === id);
    return found ? this.withTaskCount(found) : null;
  }

  createProject(userId: string, input: CreateProjectRequest): Project {
    this.projectCounter += 1;
    const now = new Date().toISOString();
    const project: Project = {
      id: `proj-${this.projectCounter}`,
      user_id: userId,
      name: input.name,
      color: input.color ?? DEFAULT_PROJECT_COLOR,
      created_at: now,
      updated_at: now,
    };
    if (input.description !== undefined) {
      project.description = input.description;
    }
    this.projects.push(project);
    return this.withTaskCount(project);
  }

  updateProject(id: string, updates: UpdateProjectRequest): Project | null {
    const project = this.projects.find((p) => p.id === id);
    if (!project) return null;

    if (updates.name !== undefined) project.name = updates.name;
    if (updates.description !== undefined) project.description = updates.description;
    if (updates.color !== undefined) project.color = updates.color;
    project.updated_at = new Date().toISOString();

    return this.withTaskCount(project);
  }

  /** Delete a project and cascade-delete every task inside it. */
  deleteProject(id: string): boolean {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return false;
    this.projects.splice(index, 1);
    this.tasks = this.tasks.filter((t) => t.project_id !== id);
    return true;
  }

  // ==========================================
  // Tasks
  // ==========================================

  listTasks(projectId: string, filters: TaskFilters = {}): Task[] {
    const search = filters.search?.toLowerCase();
    return this.tasks
      .filter((t) => t.project_id === projectId)
      .filter((t) => (filters.status ? t.status === filters.status : true))
      .filter((t) => (filters.priority ? t.priority === filters.priority : true))
      .filter((t) => (filters.assignee ? t.assignee === filters.assignee : true))
      .filter((t) => (search ? t.title.toLowerCase().includes(search) : true))
      .map((t) => clone(t));
  }

  getTask(id: string): Task | null {
    const found = this.tasks.find((t) => t.id === id);
    return found ? clone(found) : null;
  }

  createTask(projectId: string, input: CreateTaskRequest): Task {
    this.taskCounter += 1;
    const now = new Date().toISOString();
    const task: Task = {
      id: `task-${this.taskCounter}`,
      project_id: projectId,
      title: input.title,
      status: 'todo',
      priority: input.priority ?? 'medium',
      created_at: now,
      updated_at: now,
    };
    if (input.description !== undefined) task.description = input.description;
    if (input.assignee !== undefined) task.assignee = input.assignee;
    if (input.due_date !== undefined) task.due_date = input.due_date;

    this.tasks.push(task);
    return clone(task);
  }

  updateTask(id: string, updates: UpdateTaskRequest): Task | null {
    const task = this.tasks.find((t) => t.id === id);
    if (!task) return null;

    if (updates.title !== undefined) task.title = updates.title;
    if (updates.description !== undefined) task.description = updates.description;
    if (updates.status !== undefined) task.status = updates.status;
    if (updates.priority !== undefined) task.priority = updates.priority;
    if (updates.assignee !== undefined) task.assignee = updates.assignee;
    if (updates.due_date !== undefined) task.due_date = updates.due_date;
    task.updated_at = new Date().toISOString();

    return clone(task);
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex((t) => t.id === id);
    if (index === -1) return false;
    this.tasks.splice(index, 1);
    return true;
  }

  // ==========================================
  // Internals
  // ==========================================

  private publicUser(user: StoredUser): User {
    return {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
    };
  }

  private withTaskCount(project: Project): Project {
    return {
      ...clone(project),
      task_count: this.tasks.filter((t) => t.project_id === project.id).length,
    };
  }
}

/** Process-wide singleton used by the routes. */
export const db = new MockDatabase();
