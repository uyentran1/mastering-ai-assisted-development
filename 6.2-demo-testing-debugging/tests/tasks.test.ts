/**
 * Task tests — intentionally incomplete (~40% coverage)
 *
 * Only covers happy paths. Claude's job is to expand this
 * to cover edge cases, error handling, and boundary conditions.
 */

import { createTask, getAllTasks, getTaskById, deleteTask, _resetStore } from '../src/tasks';

beforeEach(() => {
  _resetStore();
});

describe('createTask', () => {
  it('creates a task with default values', () => {
    const task = createTask({ title: 'Test task' });
    expect(task.title).toBe('Test task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');
    expect(task.id).toBeDefined();
  });
});

describe('getAllTasks', () => {
  it('returns all tasks', () => {
    createTask({ title: 'Task 1' });
    createTask({ title: 'Task 2' });
    const tasks = getAllTasks();
    expect(tasks).toHaveLength(2);
  });
});

describe('getTaskById', () => {
  it('returns a task by ID', () => {
    const created = createTask({ title: 'Find me' });
    const found = getTaskById(created.id);
    expect(found?.title).toBe('Find me');
  });
});

describe('deleteTask', () => {
  it('deletes an existing task', () => {
    const task = createTask({ title: 'Delete me' });
    const result = deleteTask(task.id);
    expect(result).toBe(true);
    expect(getAllTasks()).toHaveLength(0);
  });
});
