/**
 * Shared Type Definitions
 *
 * Both frontend and backend import from this file.
 * This is the contract that keeps them in sync.
 */

// ============================================
// User Types
// ============================================

export interface User {
  id: string;
  email: string;
  created_at: string;
}

// ============================================
// Project Types
// ============================================

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  created_at: string;
  updated_at?: string;
  task_count?: number;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  color?: string;
}

// ============================================
// Task Types
// ============================================

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  project_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  assignee?: string;
  due_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  priority?: TaskPriority;
  assignee?: string;
  due_date?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  assignee?: string;
  due_date?: string;
}

// ============================================
// Activity Types
// ============================================

export type ActivityAction = 'created' | 'updated' | 'deleted';
export type ResourceType = 'project' | 'task';

export interface Activity {
  id: string;
  user_id: string;
  action: ActivityAction;
  resource_type: ResourceType;
  resource_id: string;
  timestamp: string;
}

// ============================================
// API Response Wrapper
// ============================================

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface ApiError {
  code: string;
  message: string;
  status: number;
}

// ============================================
// Auth Types
// ============================================

export interface SignUpRequest {
  email: string;
  password: string;
}

export interface SignInRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  user_id: string;
  email: string;
  token?: string;
  message: string;
}

// ============================================
// Mock Data for Frontend Development
// ============================================

export const MOCK_USER: User = {
  id: 'user-1',
  email: 'demo@example.com',
  created_at: new Date().toISOString(),
};

export const MOCK_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    user_id: 'user-1',
    name: 'Personal Website',
    description: 'Portfolio and blog',
    color: '#3B82F6',
    created_at: new Date().toISOString(),
    task_count: 5,
  },
  {
    id: 'proj-2',
    user_id: 'user-1',
    name: 'Mobile App',
    description: 'React Native app',
    color: '#10B981',
    created_at: new Date().toISOString(),
    task_count: 8,
  },
];

export const MOCK_TASKS: Task[] = [
  {
    id: 'task-1',
    project_id: 'proj-1',
    title: 'Design homepage',
    description: 'Create mockups for homepage',
    status: 'done',
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-2',
    project_id: 'proj-1',
    title: 'Set up hosting',
    description: 'Deploy to Vercel',
    status: 'in-progress',
    priority: 'high',
    created_at: new Date().toISOString(),
  },
  {
    id: 'task-3',
    project_id: 'proj-1',
    title: 'Write blog posts',
    description: 'Write 3 initial blog posts',
    status: 'todo',
    priority: 'medium',
    created_at: new Date().toISOString(),
  },
];
