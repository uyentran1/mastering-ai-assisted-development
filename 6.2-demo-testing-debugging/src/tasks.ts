/**
 * Task Management API — CRUD operations
 *
 * NOTE: This file has intentional gaps for the demo:
 * - Missing input validation in several places
 * - Unhandled edge cases
 * - Error handling that swallows useful information
 * Students will use Claude to write tests that expose these issues.
 */

export interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  assignee?: string;
  created_at: string;
  updated_at: string;
}

// In-memory store (replace with database in production)
let tasks: Task[] = [];
let nextId = 1;

export function getAllTasks(filters?: { status?: string; assignee?: string }): Task[] {
  let result = [...tasks];

  if (filters?.status) {
    result = result.filter(t => t.status === filters.status);
  }
  if (filters?.assignee) {
    result = result.filter(t => t.assignee === filters.assignee);
  }

  return result;
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find(t => t.id === id);
}

export function createTask(input: {
  title: string;
  description?: string;
  priority?: 'low' | 'medium' | 'high';
  assignee?: string;
}): Task {
  // BUG: No validation on title — empty strings, whitespace-only, or very long titles are accepted
  const task: Task = {
    id: String(nextId++),
    title: input.title,
    description: input.description || '',
    status: 'todo',
    priority: input.priority || 'medium',
    assignee: input.assignee,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  tasks.push(task);
  return task;
}

export function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'status' | 'priority' | 'assignee'>>
): Task | null {
  const index = tasks.findIndex(t => t.id === id);
  if (index === -1) return null;

  // BUG: No validation on status transitions — can go from 'done' back to 'todo'
  // BUG: Doesn't update the updated_at timestamp
  tasks[index] = { ...tasks[index], ...updates };
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const initialLength = tasks.length;
  tasks = tasks.filter(t => t.id !== id);
  return tasks.length < initialLength;
}

export function getTasksByPriority(): Record<string, Task[]> {
  // BUG: Doesn't include priorities with zero tasks — consumer might expect all three keys
  const grouped: Record<string, Task[]> = {};
  for (const task of tasks) {
    if (!grouped[task.priority]) {
      grouped[task.priority] = [];
    }
    grouped[task.priority].push(task);
  }
  return grouped;
}

export function reassignTasks(fromAssignee: string, toAssignee: string): number {
  let count = 0;
  for (const task of tasks) {
    if (task.assignee === fromAssignee) {
      task.assignee = toAssignee;
      count++;
    }
  }
  // BUG: Doesn't update updated_at on reassigned tasks
  return count;
}

// Reset for testing
export function _resetStore(): void {
  tasks = [];
  nextId = 1;
}
