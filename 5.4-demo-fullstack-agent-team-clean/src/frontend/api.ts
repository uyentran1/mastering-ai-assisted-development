/**
 * Frontend API client.
 *
 * Every backend response is an `ApiResponse<T>` envelope: `{ data, error }`.
 * Success responses carry `error: null`; failures carry a human readable
 * string in `error` and `data: null`. There is no other shape to handle.
 */

import type {
  ApiResponse,
  AuthResponse,
  CreateProjectRequest,
  CreateTaskRequest,
  Project,
  SignInRequest,
  SignUpRequest,
  Task,
  UpdateTaskRequest,
  User,
} from '../shared/types';

/** Base path every endpoint is mounted under. */
export const API_BASE_URL = '/api';

/** localStorage key used to persist the session token. */
export const TOKEN_STORAGE_KEY = 'task-app-token';

/** Thrown whenever the envelope reports an error, or the response is unreadable. */
export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    Object.setPrototypeOf(this, ApiRequestError.prototype);
  }
}

let authToken: string | null = null;

/** Set (or clear) the bearer token attached to subsequent requests. */
export function setAuthToken(token: string | null): void {
  authToken = token;
}

/** Read the token currently attached to requests. */
export function getAuthToken(): string | null {
  return authToken;
}

/**
 * Perform a request and unwrap the `{ data, error }` envelope.
 * Non-null `error` always throws; otherwise `data` is returned.
 */
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init.headers as Record<string, string> | undefined) ?? {}),
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, { ...init, headers });

  let envelope: ApiResponse<T>;
  try {
    envelope = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new ApiRequestError(
      `Request to ${path} failed with status ${response.status}`,
      response.status
    );
  }

  if (envelope.error) {
    throw new ApiRequestError(envelope.error, response.status);
  }

  return envelope.data as T;
}

// ============================================
// Auth
// ============================================

/** Create an account. The backend deliberately returns no token here. */
export function signUp(body: SignUpRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Exchange credentials for a session token. */
export function signIn(body: SignInRequest): Promise<AuthResponse> {
  return request<AuthResponse>('/auth/signin', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Invalidate the current session server-side. */
export function signOut(): Promise<{ message: string }> {
  return request<{ message: string }>('/auth/signout', { method: 'POST' });
}

/** Fetch the authenticated user. The id field is `id`, not `user_id`. */
export function getCurrentUser(): Promise<User> {
  return request<User>('/auth/me');
}

// ============================================
// Projects & tasks
// ============================================

/** List the signed-in user's projects. `task_count` is computed server-side. */
export function getProjects(): Promise<Project[]> {
  return request<Project[]>('/projects');
}

/** Create a project. Responds 201 with the created project (`task_count` 0). */
export function createProject(body: CreateProjectRequest): Promise<Project> {
  return request<Project>('/projects', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** List the tasks belonging to a project. */
export function getProjectTasks(projectId: string): Promise<Task[]> {
  return request<Task[]>(`/projects/${projectId}/tasks`);
}

/**
 * Create a task in a project, via the nested project-scoped path.
 *
 * The API assigns the status itself: every created task comes back as `todo`,
 * which is why `CreateTaskRequest` carries no status field. To land a task in
 * another column, follow this call with `updateTask({ status })`.
 */
export function createTask(
  projectId: string,
  body: CreateTaskRequest
): Promise<Task> {
  return request<Task>(`/projects/${projectId}/tasks`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/** Update a task via the nested project-scoped path. */
export function updateTask(
  projectId: string,
  taskId: string,
  updates: UpdateTaskRequest
): Promise<Task> {
  return request<Task>(`/projects/${projectId}/tasks/${taskId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}
