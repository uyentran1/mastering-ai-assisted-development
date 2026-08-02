/**
 * Creating projects and tasks, end to end.
 *
 * Same rules as App.test.tsx: the components, `useAuth` and
 * `src/frontend/api.ts` run untouched and their HTTP reaches the real Express
 * app over a real socket (see ./bridge). Nothing about the API is stubbed, so
 * every message asserted here is the message the server actually sends and
 * every "the server agrees" check reads the database the routes wrote to.
 *
 * The load-bearing case is the non-`todo` columns. `POST /api/projects/:id/tasks`
 * ignores status — `db.createTask` hardcodes `status: 'todo'` — so a task added
 * from In Progress or Done is a POST followed by a PATCH, and the two halves
 * can fail independently.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../../src/frontend/App';
import * as api from '../../src/frontend/api';
import { db, holdResponse, networkCalls, startBridge, stopBridge } from './bridge';

beforeAll(startBridge);
afterAll(stopBridge);

beforeEach(() => {
  db.reset();
  localStorage.clear();
  api.setAuthToken(null);
  networkCalls.length = 0;
});

/** Render the app and sign in as the seeded demo user. */
async function renderSignedIn(props: { fetchOnMount?: boolean } = {}): Promise<void> {
  render(<App {...props} />);
  fireEvent.change(screen.getByTestId('login-email'), {
    target: { value: 'demo@example.com' },
  });
  fireEvent.change(screen.getByTestId('login-password'), {
    target: { value: 'password123' },
  });
  fireEvent.click(screen.getByTestId('login-submit'));
  await screen.findByTestId('app-root');
}

/** Sign in with live data and wait for the real project list to land. */
async function renderLiveProjects(): Promise<void> {
  await renderSignedIn({ fetchOnMount: true });
  await waitFor(() =>
    expect(
      within(screen.getByTestId('project-card-proj-1')).getByTestId('project-card-task-count')
    ).toHaveTextContent('3 tasks')
  );
}

/** Open a board and wait for its task load to settle. */
async function openLoadedBoard(projectId: string): Promise<void> {
  fireEvent.click(screen.getByTestId(`project-card-${projectId}`));
  await waitFor(() => {
    expect(networkCalls.map((c) => c.path)).toContain(`/api/projects/${projectId}/tasks`);
    expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
  });
}

/** Fill in the project form and submit it. */
function submitNewProject(fields: { name: string; description?: string; color?: string }): void {
  fireEvent.click(screen.getByTestId('new-project-button'));
  fireEvent.change(screen.getByTestId('new-project-name'), {
    target: { value: fields.name },
  });
  if (fields.description !== undefined) {
    fireEvent.change(screen.getByTestId('new-project-description'), {
      target: { value: fields.description },
    });
  }
  if (fields.color !== undefined) {
    fireEvent.change(screen.getByTestId('new-project-color'), {
      target: { value: fields.color },
    });
  }
  fireEvent.click(screen.getByTestId('new-project-submit'));
}

/** Fill in one column's task form and submit it. */
function submitNewTask(
  status: string,
  fields: { title: string; description?: string; priority?: string }
): void {
  fireEvent.click(screen.getByTestId(`add-task-button-${status}`));
  fireEvent.change(screen.getByTestId(`add-task-title-${status}`), {
    target: { value: fields.title },
  });
  if (fields.description !== undefined) {
    fireEvent.change(screen.getByTestId(`add-task-description-${status}`), {
      target: { value: fields.description },
    });
  }
  if (fields.priority !== undefined) {
    fireEvent.change(screen.getByTestId(`add-task-priority-${status}`), {
      target: { value: fields.priority },
    });
  }
  fireEvent.click(screen.getByTestId(`add-task-submit-${status}`));
}

describe('creating a project against the real API', () => {
  it('POSTs it, shows it in the grid and leaves the server holding it', async () => {
    await renderLiveProjects();
    networkCalls.length = 0;

    submitNewProject({ name: 'Third Project', description: 'Made in a test' });

    // proj-3 is seeded and owned by user-2, so the next id the server issues
    // for user-1 is proj-4.
    await screen.findByTestId('project-card-proj-4');

    expect(networkCalls).toEqual([{ method: 'POST', path: '/api/projects' }]);
    const card = within(screen.getByTestId('project-card-proj-4'));
    expect(card.getByTestId('project-card-name')).toHaveTextContent('Third Project');
    expect(card.getByTestId('project-card-description')).toHaveTextContent('Made in a test');
    expect(card.getByTestId('project-card-task-count')).toHaveTextContent('0 tasks');

    const stored = db.getProject('proj-4');
    expect(stored).not.toBeNull();
    expect(stored?.name).toBe('Third Project');
    expect(stored?.user_id).toBe('user-1');
    expect(stored?.color).toBe('#3B82F6');

    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });

  it('sends the colour the user typed', async () => {
    await renderLiveProjects();

    submitNewProject({ name: 'Green', color: '#10B981' });

    await screen.findByTestId('project-card-proj-4');
    expect(db.getProject('proj-4')?.color).toBe('#10B981');
  });

  it('surfaces the API\'s own 400 for a malformed colour, on the form only', async () => {
    await renderLiveProjects();
    networkCalls.length = 0;

    submitNewProject({ name: 'Bad colour', color: '#GGG' });

    expect(await screen.findByTestId('new-project-error')).toHaveTextContent(
      'Color must be a hex color like #3B82F6'
    );
    // The request really went out and really came back 400.
    expect(networkCalls).toEqual([{ method: 'POST', path: '/api/projects' }]);
    // A form-level failure is not an app-level failure.
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
    // Nothing was created, and the entered values survive for a retry.
    expect(db.getProject('proj-4')).toBeNull();
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
    expect(screen.getByTestId('new-project-name')).toHaveValue('Bad colour');
    expect(screen.getByTestId('new-project-color')).toHaveValue('#GGG');
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(2);
  });

  it('surfaces the API\'s 401 when the session died before the create', async () => {
    await renderLiveProjects();
    db.revokeToken('mock-token-user-1');

    submitNewProject({ name: 'Too late' });

    expect(await screen.findByTestId('new-project-error')).toHaveTextContent(
      'Invalid or expired token'
    );
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(2);
  });

  it('keeps the grid at one child per project, with the form outside it', async () => {
    await renderLiveProjects();
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(2);

    submitNewProject({ name: 'Third Project' });
    await screen.findByTestId('project-card-proj-4');

    const grid = screen.getByTestId('project-list-grid');
    expect(grid.children).toHaveLength(3);

    fireEvent.click(screen.getByTestId('new-project-button'));
    expect(grid).not.toContainElement(screen.getByTestId('new-project-form'));
    expect(grid).not.toContainElement(screen.getByTestId('new-project-button'));
  });

  it('opens the board of a project it just created', async () => {
    await renderLiveProjects();
    submitNewProject({ name: 'Third Project' });
    await screen.findByTestId('project-card-proj-4');

    await openLoadedBoard('proj-4');

    expect(screen.getByTestId('kanban-board-title')).toHaveTextContent('Third Project');
    expect(screen.getByTestId('kanban-column-empty-todo')).toBeInTheDocument();
  });
});

describe('creating a project with fetchOnMount off', () => {
  it('appends a locally numbered project and touches no network', async () => {
    await renderSignedIn();
    networkCalls.length = 0;

    submitNewProject({ name: 'Local Only', description: 'No server involved' });

    const card = await screen.findByTestId(/^project-card-proj-local-\d+$/);
    expect(within(card).getByTestId('project-card-name')).toHaveTextContent('Local Only');
    expect(within(card).getByTestId('project-card-task-count')).toHaveTextContent('0 tasks');
    expect(networkCalls).toEqual([]);
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(3);
    expect(screen.queryByTestId('new-project-form')).not.toBeInTheDocument();
  });

  it('mirrors the API\'s colour rule so both modes reject alike', async () => {
    await renderSignedIn();
    networkCalls.length = 0;

    submitNewProject({ name: 'Bad colour', color: '#GGG' });

    expect(await screen.findByTestId('new-project-error')).toHaveTextContent(
      'Color must be a hex color like #3B82F6'
    );
    expect(networkCalls).toEqual([]);
    expect(screen.getByTestId('project-list-grid').children).toHaveLength(2);
    expect(screen.getByTestId('new-project-form')).toBeInTheDocument();
  });
});

describe('creating a task in the To Do column', () => {
  it('is a single POST — no follow-up PATCH, because the API already made it todo', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');
    networkCalls.length = 0;

    submitNewTask('todo', { title: 'Fresh task', description: 'From the todo column' });

    await screen.findByTestId('task-card-task-5');

    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/projects/proj-1/tasks' },
    ]);
    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-5')
    ).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-count-todo')).toHaveTextContent('2');

    const stored = db.getTask('task-5');
    expect(stored?.status).toBe('todo');
    expect(stored?.title).toBe('Fresh task');
    expect(stored?.description).toBe('From the todo column');
    expect(stored?.project_id).toBe('proj-1');

    expect(screen.queryByTestId('add-task-form-todo')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });

  it('sends the chosen priority through to the server', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');

    submitNewTask('todo', { title: 'Urgent', priority: 'high' });

    await screen.findByTestId('task-card-task-5');
    expect(db.getTask('task-5')?.priority).toBe('high');
    expect(
      within(screen.getByTestId('task-card-task-5')).getByTestId('task-card-priority')
    ).toHaveTextContent('high');
  });
});

describe('creating a task in a column the API cannot create into', () => {
  it('POSTs then PATCHes for Done, and the server ends up agreeing', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');
    networkCalls.length = 0;

    submitNewTask('done', { title: 'Already finished' });

    await waitFor(() => expect(db.getTask('task-5')?.status).toBe('done'));

    // Order matters: the task must exist before it can be moved.
    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/projects/proj-1/tasks' },
      { method: 'PATCH', path: '/api/projects/proj-1/tasks/task-5' },
    ]);

    await waitFor(() =>
      expect(
        within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-5')
      ).toBeInTheDocument()
    );
    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).queryByTestId('task-card-task-5')
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId('add-task-form-done')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });

  it('a real GET of the board reports the new task as done', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');

    submitNewTask('done', { title: 'Already finished' });
    await waitFor(() => expect(db.getTask('task-5')?.status).toBe('done'));
    await waitFor(() =>
      expect(
        within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-5')
      ).toBeInTheDocument()
    );

    // Leave and re-enter the board: the second load is a fresh GET whose
    // payload comes from the routes, not from anything the client remembers.
    fireEvent.click(screen.getByTestId('back-to-projects'));
    await openLoadedBoard('proj-1');

    await waitFor(() =>
      expect(
        within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-5')
      ).toBeInTheDocument()
    );
  });

  it('POSTs then PATCHes for In Progress too', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');
    networkCalls.length = 0;

    submitNewTask('in-progress', { title: 'Underway' });

    await waitFor(() => expect(db.getTask('task-5')?.status).toBe('in-progress'));
    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/projects/proj-1/tasks' },
      { method: 'PATCH', path: '/api/projects/proj-1/tasks/task-5' },
    ]);
    await waitFor(() =>
      expect(
        within(screen.getByTestId('kanban-column-tasks-in-progress')).getByTestId(
          'task-card-task-5'
        )
      ).toBeInTheDocument()
    );
  });
});

describe('when a task create fails', () => {
  it('shows a failed POST on the form only, and creates nothing', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');
    db.revokeToken('mock-token-user-1');
    networkCalls.length = 0;

    submitNewTask('todo', { title: 'Doomed', description: 'Never lands' });

    expect(await screen.findByTestId('add-task-error-todo')).toHaveTextContent(
      'Invalid or expired token'
    );
    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/projects/proj-1/tasks' },
    ]);
    // The POST is the whole story: no app-level banner, no phantom card.
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
    expect(db.getTask('task-5')).toBeNull();
    expect(screen.getByTestId('kanban-column-count-todo')).toHaveTextContent('1');
    // The form keeps what was typed so the user can retry.
    expect(screen.getByTestId('add-task-form-todo')).toBeInTheDocument();
    expect(screen.getByTestId('add-task-title-todo')).toHaveValue('Doomed');
    expect(screen.getByTestId('add-task-description-todo')).toHaveValue('Never lands');
  });

  it('reports a created-but-not-moved task on both the form and the app banner', async () => {
    await renderLiveProjects();
    await openLoadedBoard('proj-1');
    networkCalls.length = 0;

    // Delay only the POST's response, so the session can be killed in the gap
    // between the task being created server-side and the PATCH being sent.
    const releasePost = holdResponse('/api/projects/proj-1/tasks', 'POST');
    submitNewTask('done', { title: 'Half-created' });

    await waitFor(() => expect(db.getTask('task-5')).not.toBeNull());
    db.revokeToken('mock-token-user-1');
    releasePost();

    const expected =
      'Task created in To Do, but moving it to Done failed: Invalid or expired token';
    expect(await screen.findByTestId('add-task-error-done')).toHaveTextContent(expected);
    expect(screen.getByTestId('app-error')).toHaveTextContent(expected);

    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/projects/proj-1/tasks' },
      { method: 'PATCH', path: '/api/projects/proj-1/tasks/task-5' },
    ]);

    // The task is real and it is in To Do — the board says exactly that.
    expect(db.getTask('task-5')?.status).toBe('todo');
    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-5')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).queryByTestId('task-card-task-5')
    ).not.toBeInTheDocument();

    // The form stays open with its values, because the promise rejected.
    expect(screen.getByTestId('add-task-form-done')).toBeInTheDocument();
    expect(screen.getByTestId('add-task-title-done')).toHaveValue('Half-created');
  });
});

describe('creating a task with fetchOnMount off', () => {
  it('drops a locally numbered task straight into the column it was added from', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    networkCalls.length = 0;

    submitNewTask('done', { title: 'Local done task', priority: 'low' });

    const card = await screen.findByTestId(/^task-card-task-local-\d+$/);
    expect(screen.getByTestId('kanban-column-tasks-done')).toContainElement(card);
    expect(screen.getByTestId('kanban-column-count-done')).toHaveTextContent('2');
    expect(within(card).getByTestId('task-card-priority')).toHaveTextContent('low');
    expect(networkCalls).toEqual([]);
  });

  it('bumps the project\'s task_count on the way back to the grid', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-1'));

    submitNewTask('todo', { title: 'Local todo task' });
    await screen.findByTestId(/^task-card-task-local-\d+$/);

    fireEvent.click(screen.getByTestId('back-to-projects'));

    // The fixture claims 5; one more makes 6.
    expect(
      within(screen.getByTestId('project-card-proj-1')).getByTestId('project-card-task-count')
    ).toHaveTextContent('6 tasks');
    expect(
      within(screen.getByTestId('project-card-proj-2')).getByTestId('project-card-task-count')
    ).toHaveTextContent('8 tasks');
  });
});

describe('a board load landing after a create', () => {
  it('does not undo a task created into To Do while the load was in flight', async () => {
    await renderLiveProjects();

    // Only the GET is delayed; the POST that follows travels at full speed,
    // so the load's response — a snapshot taken before the task existed —
    // arrives last. Nothing about either request is otherwise altered.
    const releaseBoardLoad = holdResponse('/api/projects/proj-1/tasks', 'GET');
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    await waitFor(() =>
      expect(networkCalls).toContainEqual({
        method: 'GET',
        path: '/api/projects/proj-1/tasks',
      })
    );

    submitNewTask('todo', { title: 'Racing the load' });
    await waitFor(() => expect(db.getTask('task-5')?.title).toBe('Racing the load'));
    await screen.findByTestId('task-card-task-5');

    releaseBoardLoad();
    await waitFor(() => expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument());

    // The write landed on the server; the board must not disagree with it.
    expect(db.getTask('task-5')).not.toBeNull();
    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-5')
    ).toBeInTheDocument();
  });

  it('does not undo a task created into Done while the load was in flight', async () => {
    await renderLiveProjects();

    const releaseBoardLoad = holdResponse('/api/projects/proj-1/tasks', 'GET');
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    await waitFor(() =>
      expect(networkCalls).toContainEqual({
        method: 'GET',
        path: '/api/projects/proj-1/tasks',
      })
    );

    submitNewTask('done', { title: 'Racing the load' });
    await waitFor(() => expect(db.getTask('task-5')?.status).toBe('done'));

    releaseBoardLoad();
    await waitFor(() => expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument());

    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-5')
    ).toBeInTheDocument();
  });
});
