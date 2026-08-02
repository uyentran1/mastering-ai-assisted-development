/**
 * Task routes across BOTH path shapes:
 *   flat   /api/tasks/:id
 *   nested /api/projects/:id/tasks[/:taskId]
 *
 * The two shapes share handlers but deliberately diverge on the failure code
 * for someone else's task: flat is 403, nested is 404.
 */

import type { Project, Task } from '../../src/shared/types';
import {
  USER_1_TOKEN,
  USER_2_TOKEN,
  call,
  db,
  expectData,
  expectError,
  startServer,
  stopServer,
} from './helpers';

beforeAll(startServer);
afterAll(stopServer);
beforeEach(() => db.reset());

describe('GET /api/projects/:id/tasks', () => {
  it('lists every task in the project', async () => {
    const result = await call<Task[]>('GET', '/api/projects/proj-1/tasks', {
      token: USER_1_TOKEN,
    });
    const tasks = expectData(result, 200);

    expect(tasks.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
    expect(tasks.every((t) => t.project_id === 'proj-1')).toBe(true);
  });

  it('returns an empty list for a project with no tasks', async () => {
    const result = await call<Task[]>('GET', '/api/projects/proj-2/tasks', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200)).toEqual([]);
  });

  it('filters by status', async () => {
    const result = await call<Task[]>('GET', '/api/projects/proj-1/tasks?status=done', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200).map((t) => t.id)).toEqual(['task-1']);
  });

  it('filters by priority', async () => {
    const result = await call<Task[]>('GET', '/api/projects/proj-1/tasks?priority=high', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200).map((t) => t.id)).toEqual(['task-1', 'task-2']);
  });

  it('filters by assignee', async () => {
    const result = await call<Task[]>(
      'GET',
      '/api/projects/proj-1/tasks?assignee=user-1',
      { token: USER_1_TOKEN }
    );
    expect(expectData(result, 200).map((t) => t.id)).toEqual(['task-2']);
  });

  it('searches titles case-insensitively', async () => {
    const result = await call<Task[]>('GET', '/api/projects/proj-1/tasks?search=BLOG', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200).map((t) => t.id)).toEqual(['task-3']);
  });

  it('combines filters', async () => {
    const result = await call<Task[]>(
      'GET',
      '/api/projects/proj-1/tasks?status=todo&priority=high',
      { token: USER_1_TOKEN }
    );
    expect(expectData(result, 200)).toEqual([]);
  });

  it('rejects an unknown status filter with 400', async () => {
    const result = await call('GET', '/api/projects/proj-1/tasks?status=blocked', {
      token: USER_1_TOKEN,
    });
    expectError(result, 400, "Status filter must be one of 'todo', 'in-progress', 'done'");
  });

  it('rejects an unknown priority filter with 400', async () => {
    const result = await call('GET', '/api/projects/proj-1/tasks?priority=urgent', {
      token: USER_1_TOKEN,
    });
    expectError(result, 400, "Priority filter must be one of 'low', 'medium', 'high'");
  });

  it('returns 403 for another user\'s project', async () => {
    const result = await call('GET', '/api/projects/proj-3/tasks', { token: USER_1_TOKEN });
    expectError(result, 403, 'Forbidden');
  });

  it('returns 404 for a project that does not exist', async () => {
    const result = await call('GET', '/api/projects/proj-999/tasks', {
      token: USER_1_TOKEN,
    });
    expectError(result, 404, 'Project not found');
  });

  it('returns 401 without a token', async () => {
    expectError(await call('GET', '/api/projects/proj-1/tasks'), 401, 'Unauthorized');
  });
});

describe('POST /api/projects/:id/tasks', () => {
  it('creates a task with the default priority and todo status', async () => {
    const result = await call<Task>('POST', '/api/projects/proj-2/tasks', {
      token: USER_1_TOKEN,
      body: { title: '  Fresh task  ' },
    });
    const task = expectData(result, 201);

    expect(task.id).toBe('task-5');
    expect(task.project_id).toBe('proj-2');
    expect(task.title).toBe('Fresh task');
    expect(task.status).toBe('todo');
    expect(task.priority).toBe('medium');

    const project = expectData(
      await call<Project>('GET', '/api/projects/proj-2', { token: USER_1_TOKEN }),
      200
    );
    expect(project.task_count).toBe(1);
  });

  it('ignores any status supplied by the client', async () => {
    const result = await call<Task>('POST', '/api/projects/proj-1/tasks', {
      token: USER_1_TOKEN,
      body: { title: 'Sneaky', status: 'done' },
    });
    expect(expectData(result, 201).status).toBe('todo');
  });

  it('stores description, priority, assignee and due_date', async () => {
    const result = await call<Task>('POST', '/api/projects/proj-1/tasks', {
      token: USER_1_TOKEN,
      body: {
        title: 'Full task',
        description: 'Everything set',
        priority: 'high',
        assignee: 'user-1',
        due_date: '2024-12-31',
      },
    });
    const task = expectData(result, 201);

    expect(task.description).toBe('Everything set');
    expect(task.priority).toBe('high');
    expect(task.assignee).toBe('user-1');
    expect(task.due_date).toBe('2024-12-31');
  });

  it('rejects a missing title with 400', async () => {
    const result = await call('POST', '/api/projects/proj-1/tasks', {
      token: USER_1_TOKEN,
      body: { description: 'no title' },
    });
    expectError(result, 400, 'Title is required');
  });

  it('rejects an unknown priority with 400', async () => {
    const result = await call('POST', '/api/projects/proj-1/tasks', {
      token: USER_1_TOKEN,
      body: { title: 'Bad priority', priority: 'urgent' },
    });
    expectError(result, 400, "Priority must be one of 'low', 'medium', 'high'");
  });

  it('checks project ownership before the body: 403, not 400', async () => {
    const result = await call('POST', '/api/projects/proj-3/tasks', {
      token: USER_1_TOKEN,
      body: {},
    });
    expectError(result, 403, 'Forbidden');
  });
});

describe('flat /api/tasks/:id', () => {
  it('GET returns the task', async () => {
    const result = await call<Task>('GET', '/api/tasks/task-2', { token: USER_1_TOKEN });
    const task = expectData(result, 200);

    expect(task.title).toBe('Set up hosting');
    expect(task.status).toBe('in-progress');
    expect(task.project_id).toBe('proj-1');
  });

  it('GET returns 403 for a task in another user\'s project', async () => {
    expectError(
      await call('GET', '/api/tasks/task-4', { token: USER_1_TOKEN }),
      403,
      'Forbidden'
    );
  });

  it('GET returns 404 for a task that does not exist', async () => {
    expectError(
      await call('GET', '/api/tasks/task-999', { token: USER_1_TOKEN }),
      404,
      'Task not found'
    );
  });

  it('GET returns 401 without a token', async () => {
    expectError(await call('GET', '/api/tasks/task-1'), 401, 'Unauthorized');
  });

  it('PATCH moves a task to a new status', async () => {
    const result = await call<Task>('PATCH', '/api/tasks/task-3', {
      token: USER_1_TOKEN,
      body: { status: 'in-progress' },
    });
    const task = expectData(result, 200);

    expect(task.status).toBe('in-progress');
    expect(task.title).toBe('Write blog posts');

    const reread = expectData(
      await call<Task>('GET', '/api/tasks/task-3', { token: USER_1_TOKEN }),
      200
    );
    expect(reread.status).toBe('in-progress');
  });

  it('PATCH rejects an unknown status with 400', async () => {
    const result = await call('PATCH', '/api/tasks/task-3', {
      token: USER_1_TOKEN,
      body: { status: 'blocked' },
    });
    expectError(result, 400, "Status must be one of 'todo', 'in-progress', 'done'");
  });

  it('PATCH rejects an empty body with 400', async () => {
    const result = await call('PATCH', '/api/tasks/task-3', {
      token: USER_1_TOKEN,
      body: {},
    });
    expectError(result, 400, 'No valid fields to update');
  });

  it('PATCH checks ownership before the body: 403, not 400', async () => {
    const result = await call('PATCH', '/api/tasks/task-4', {
      token: USER_1_TOKEN,
      body: { status: 'blocked' },
    });
    expectError(result, 403, 'Forbidden');
  });

  it('DELETE removes the task and lowers the project task_count', async () => {
    const result = await call<{ message: string }>('DELETE', '/api/tasks/task-1', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200)).toEqual({ message: 'Task deleted' });

    expectError(
      await call('GET', '/api/tasks/task-1', { token: USER_1_TOKEN }),
      404,
      'Task not found'
    );

    const project = expectData(
      await call<Project>('GET', '/api/projects/proj-1', { token: USER_1_TOKEN }),
      200
    );
    expect(project.task_count).toBe(2);
  });

  it('DELETE returns 403 for another user\'s task and leaves it in place', async () => {
    expectError(
      await call('DELETE', '/api/tasks/task-4', { token: USER_1_TOKEN }),
      403,
      'Forbidden'
    );
    expect((await call('GET', '/api/tasks/task-4', { token: USER_2_TOKEN })).status).toBe(
      200
    );
  });
});

describe('nested /api/projects/:id/tasks/:taskId', () => {
  it('GET returns a task that belongs to the project in the path', async () => {
    const result = await call<Task>('GET', '/api/projects/proj-1/tasks/task-1', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200).title).toBe('Design homepage');
  });

  it('PATCH updates through the nested shape', async () => {
    const result = await call<Task>('PATCH', '/api/projects/proj-1/tasks/task-1', {
      token: USER_1_TOKEN,
      body: { status: 'todo', priority: 'low' },
    });
    const task = expectData(result, 200);

    expect(task.status).toBe('todo');
    expect(task.priority).toBe('low');
  });

  it('DELETE removes through the nested shape', async () => {
    const result = await call('DELETE', '/api/projects/proj-1/tasks/task-2', {
      token: USER_1_TOKEN,
    });
    expect(result.status).toBe(200);
    expectError(
      await call('GET', '/api/projects/proj-1/tasks/task-2', { token: USER_1_TOKEN }),
      404,
      'Task not found'
    );
  });

  it('returns 404 when the task exists but lives in a different project', async () => {
    const result = await call('GET', '/api/projects/proj-1/tasks/task-4', {
      token: USER_1_TOKEN,
    });
    expectError(result, 404, 'Task not found');
  });

  it('returns 403 when the project in the path belongs to another user', async () => {
    const result = await call('GET', '/api/projects/proj-3/tasks/task-4', {
      token: USER_1_TOKEN,
    });
    expectError(result, 403, 'Forbidden');
  });

  it('diverges from the flat shape for the same task: nested 404 vs flat 403', async () => {
    const nested = await call('GET', '/api/projects/proj-1/tasks/task-4', {
      token: USER_1_TOKEN,
    });
    const flat = await call('GET', '/api/tasks/task-4', { token: USER_1_TOKEN });

    expect(nested.status).toBe(404);
    expect(flat.status).toBe(403);
  });

  it('returns 404 for a task id that does not exist at all', async () => {
    const result = await call('GET', '/api/projects/proj-1/tasks/task-999', {
      token: USER_1_TOKEN,
    });
    expectError(result, 404, 'Task not found');
  });
});

describe('router-level auth precedence', () => {
  it('answers an unmatched path under /api/tasks with 401 before 404', async () => {
    // requireAuth is mounted on the router, so it runs before route matching:
    // an unauthenticated caller cannot even learn that /api/tasks has no
    // collection route.
    expectError(await call('GET', '/api/tasks'), 401, 'Unauthorized');
  });

  it('answers the same path with 404 once authenticated', async () => {
    expectError(await call('GET', '/api/tasks', { token: USER_1_TOKEN }), 404, 'Not found');
  });

  it('answers an unmatched deep nested task path with 404 "Not found"', async () => {
    const result = await call('GET', '/api/projects/proj-1/tasks/task-1/extra', {
      token: USER_1_TOKEN,
    });
    expectError(result, 404, 'Not found');
  });
});
