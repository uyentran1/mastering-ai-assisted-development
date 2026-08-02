/**
 * Project routes, including the documented check order
 * auth -> existence -> ownership -> validation.
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

interface ProjectWithTasks extends Project {
  tasks: Task[];
}

beforeAll(startServer);
afterAll(stopServer);
beforeEach(() => db.reset());

describe('GET /api/projects', () => {
  it('lists only the caller\'s projects, each with a computed task_count', async () => {
    const result = await call<Project[]>('GET', '/api/projects', { token: USER_1_TOKEN });
    const projects = expectData(result, 200);

    expect(projects.map((p) => p.id)).toEqual(['proj-1', 'proj-2']);
    expect(projects[0].name).toBe('Personal Website');
    expect(projects[0].task_count).toBe(3);
    expect(projects[1].task_count).toBe(0);
  });

  it('scopes the list to the other user for the other token', async () => {
    const result = await call<Project[]>('GET', '/api/projects', { token: USER_2_TOKEN });
    const projects = expectData(result, 200);

    expect(projects.map((p) => p.id)).toEqual(['proj-3']);
    expect(projects[0].task_count).toBe(1);
  });

  it('returns 401 without a token', async () => {
    expectError(await call('GET', '/api/projects'), 401, 'Unauthorized');
  });
});

describe('POST /api/projects', () => {
  it('creates a project with the default colour', async () => {
    const result = await call<Project>('POST', '/api/projects', {
      token: USER_1_TOKEN,
      body: { name: '  New Project  ' },
    });
    const project = expectData(result, 201);

    expect(project.id).toBe('proj-4');
    expect(project.user_id).toBe('user-1');
    expect(project.name).toBe('New Project');
    expect(project.color).toBe('#3B82F6');
    expect(project.task_count).toBe(0);

    const listed = expectData(
      await call<Project[]>('GET', '/api/projects', { token: USER_1_TOKEN }),
      200
    );
    expect(listed.map((p) => p.id)).toContain('proj-4');
  });

  it('accepts an explicit description and hex colour', async () => {
    const result = await call<Project>('POST', '/api/projects', {
      token: USER_1_TOKEN,
      body: { name: 'Coloured', description: 'With colour', color: '#abcdef' },
    });
    const project = expectData(result, 201);

    expect(project.color).toBe('#abcdef');
    expect(project.description).toBe('With colour');
  });

  it('rejects a missing name with 400', async () => {
    const result = await call('POST', '/api/projects', {
      token: USER_1_TOKEN,
      body: { description: 'no name' },
    });
    expectError(result, 400, 'Name is required');
  });

  it('rejects a whitespace-only name with 400', async () => {
    const result = await call('POST', '/api/projects', {
      token: USER_1_TOKEN,
      body: { name: '   ' },
    });
    expectError(result, 400, 'Name is required');
  });

  it('rejects a malformed colour with 400', async () => {
    const result = await call('POST', '/api/projects', {
      token: USER_1_TOKEN,
      body: { name: 'Bad colour', color: 'blue' },
    });
    expectError(result, 400, 'Color must be a hex color like #3B82F6');
  });

  it('returns 401 before validating the body', async () => {
    expectError(await call('POST', '/api/projects', { body: {} }), 401, 'Unauthorized');
  });
});

describe('GET /api/projects/:id', () => {
  it('returns the project with its tasks', async () => {
    const result = await call<ProjectWithTasks>('GET', '/api/projects/proj-1', {
      token: USER_1_TOKEN,
    });
    const project = expectData(result, 200);

    expect(project.name).toBe('Personal Website');
    expect(project.task_count).toBe(3);
    expect(project.tasks.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3']);
  });

  it('returns an empty tasks array for a project with no tasks', async () => {
    const result = await call<ProjectWithTasks>('GET', '/api/projects/proj-2', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200).tasks).toEqual([]);
  });

  it('returns 403 for another user\'s project', async () => {
    const result = await call('GET', '/api/projects/proj-3', { token: USER_1_TOKEN });
    expectError(result, 403, 'Forbidden');
  });

  it('returns 404 for a project that does not exist', async () => {
    const result = await call('GET', '/api/projects/proj-999', { token: USER_1_TOKEN });
    expectError(result, 404, 'Project not found');
  });
});

describe('PATCH /api/projects/:id', () => {
  it('updates the supplied fields and leaves the rest alone', async () => {
    const result = await call<Project>('PATCH', '/api/projects/proj-1', {
      token: USER_1_TOKEN,
      body: { name: 'Renamed', color: '#000000' },
    });
    const project = expectData(result, 200);

    expect(project.name).toBe('Renamed');
    expect(project.color).toBe('#000000');
    expect(project.description).toBe('Portfolio and blog');
    expect(project.task_count).toBe(3);
  });

  it('returns 400 "No valid fields to update" for an empty body', async () => {
    const result = await call('PATCH', '/api/projects/proj-1', {
      token: USER_1_TOKEN,
      body: {},
    });
    expectError(result, 400, 'No valid fields to update');
  });

  it('rejects an empty name with 400', async () => {
    const result = await call('PATCH', '/api/projects/proj-1', {
      token: USER_1_TOKEN,
      body: { name: '' },
    });
    expectError(result, 400, 'Name must be a non-empty string');
  });

  it('checks ownership before the body: 403, not 400', async () => {
    const result = await call('PATCH', '/api/projects/proj-3', {
      token: USER_1_TOKEN,
      body: { color: 'not-a-colour' },
    });
    expectError(result, 403, 'Forbidden');
  });

  it('checks existence before the body: 404, not 400', async () => {
    const result = await call('PATCH', '/api/projects/proj-999', {
      token: USER_1_TOKEN,
      body: { color: 'not-a-colour' },
    });
    expectError(result, 404, 'Project not found');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('deletes the project and cascade-deletes its tasks', async () => {
    const result = await call<{ message: string }>('DELETE', '/api/projects/proj-1', {
      token: USER_1_TOKEN,
    });
    expect(expectData(result, 200)).toEqual({ message: 'Project deleted' });

    expectError(
      await call('GET', '/api/projects/proj-1', { token: USER_1_TOKEN }),
      404,
      'Project not found'
    );

    for (const taskId of ['task-1', 'task-2', 'task-3']) {
      expectError(
        await call('GET', `/api/tasks/${taskId}`, { token: USER_1_TOKEN }),
        404,
        'Task not found'
      );
    }

    const listed = expectData(
      await call<Project[]>('GET', '/api/projects', { token: USER_1_TOKEN }),
      200
    );
    expect(listed.map((p) => p.id)).toEqual(['proj-2']);
  });

  it('leaves other projects\' tasks untouched', async () => {
    await call('DELETE', '/api/projects/proj-1', { token: USER_1_TOKEN });
    const task = await call<Task>('GET', '/api/tasks/task-4', { token: USER_2_TOKEN });
    expect(expectData(task, 200).id).toBe('task-4');
  });

  it('returns 403 for another user\'s project and does not delete it', async () => {
    expectError(
      await call('DELETE', '/api/projects/proj-3', { token: USER_1_TOKEN }),
      403,
      'Forbidden'
    );
    expect(
      (await call('GET', '/api/projects/proj-3', { token: USER_2_TOKEN })).status
    ).toBe(200);
  });

  it('returns 404 for a project that does not exist', async () => {
    expectError(
      await call('DELETE', '/api/projects/proj-999', { token: USER_1_TOKEN }),
      404,
      'Project not found'
    );
  });
});
