/**
 * App — the whole frontend, wired to the REAL backend.
 *
 * These are cross-stack tests: the components, `useAuth` and
 * `src/frontend/api.ts` all run untouched, and their HTTP calls reach the real
 * Express app over a real socket (see ./bridge). Nothing is stubbed except the
 * `fetch` transport jsdom does not provide.
 */

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { App } from '../../src/frontend/App';
import * as api from '../../src/frontend/api';
import { db, holdResponse, networkCalls, startBridge, stopBridge } from './bridge';

const TOKEN_KEY = 'task-app-token';

beforeAll(startBridge);
afterAll(stopBridge);

beforeEach(() => {
  db.reset();
  localStorage.clear();
  api.setAuthToken(null);
  networkCalls.length = 0;
});

/** Fill and submit the login form. */
function submitCredentials(email: string, password: string): void {
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: email } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: password } });
  fireEvent.click(screen.getByTestId('login-submit'));
}

/** Render the app and sign in as the seeded demo user. */
async function renderSignedIn(props: { fetchOnMount?: boolean } = {}): Promise<void> {
  render(<App {...props} />);
  submitCredentials('demo@example.com', 'password123');
  await screen.findByTestId('app-root');
}

/**
 * Open a board under `fetchOnMount` and wait for its task load to finish.
 *
 * The wait is not cosmetic: the board initially renders MOCK_TASKS, whose ids
 * match the seeded ones, so the cards are on screen before the API answers.
 * Acting before the load settles races the in-flight GET against any write
 * that follows it (see the App notes in the test report).
 */
async function openLoadedBoard(projectId: string): Promise<void> {
  fireEvent.click(screen.getByTestId(`project-card-${projectId}`));
  await waitFor(() => {
    expect(networkCalls.map((c) => c.path)).toContain(`/api/projects/${projectId}/tasks`);
    expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument();
  });
}

describe('auth gate', () => {
  it('renders the login view and nothing else when signed out', () => {
    render(<App />);

    expect(screen.getByTestId('login-view')).toBeInTheDocument();
    expect(screen.queryByTestId('app-root')).not.toBeInTheDocument();
    expect(screen.queryByTestId('project-list')).not.toBeInTheDocument();
  });

  it('makes no network call at all while signed out', () => {
    render(<App />);

    expect(networkCalls).toEqual([]);
  });

  it('signs in against the real API and reveals the app shell', async () => {
    await renderSignedIn();

    expect(screen.getByTestId('app-user-email')).toHaveTextContent('demo@example.com');
    expect(screen.queryByTestId('login-view')).not.toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBe('mock-token-user-1');
    expect(api.getAuthToken()).toBe('mock-token-user-1');
    expect(networkCalls).toEqual([
      { method: 'POST', path: '/api/auth/signin' },
      { method: 'GET', path: '/api/auth/me' },
    ]);
  });

  it('surfaces the real 401 message and stays signed out on bad credentials', async () => {
    render(<App />);
    submitCredentials('demo@example.com', 'wrong-password');

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Invalid email or password'
    );
    expect(screen.queryByTestId('app-root')).not.toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
  });

  it('signs up a new account and signs straight into it', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-toggle-mode'));
    submitCredentials('new@example.com', 'password123');

    await screen.findByTestId('app-root');

    expect(screen.getByTestId('app-user-email')).toHaveTextContent('new@example.com');
    expect(localStorage.getItem(TOKEN_KEY)).toBe('mock-token-user-3');
    expect(networkCalls.map((c) => c.path)).toEqual([
      '/api/auth/signup',
      '/api/auth/signin',
      '/api/auth/me',
    ]);
  });

  it('reports the real 409 when signing up with a taken email', async () => {
    render(<App />);
    fireEvent.click(screen.getByTestId('login-toggle-mode'));
    submitCredentials('demo@example.com', 'password123');

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Email already registered'
    );
    expect(screen.queryByTestId('app-root')).not.toBeInTheDocument();
  });

  it('restores a persisted session on mount', async () => {
    localStorage.setItem(TOKEN_KEY, 'mock-token-user-2');
    render(<App />);

    await screen.findByTestId('app-root');

    expect(screen.getByTestId('app-user-email')).toHaveTextContent('other@example.com');
    expect(networkCalls).toEqual([{ method: 'GET', path: '/api/auth/me' }]);
  });

  it('discards a stale persisted token and stays on the login view', async () => {
    localStorage.setItem(TOKEN_KEY, 'mock-token-revoked');
    render(<App />);

    await waitFor(() => expect(localStorage.getItem(TOKEN_KEY)).toBeNull());
    expect(screen.getByTestId('login-view')).toBeInTheDocument();
    expect(screen.queryByTestId('app-root')).not.toBeInTheDocument();
  });

  it('signs out, revokes the token server-side and returns to the login view', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('sign-out-button'));

    await screen.findByTestId('login-view');

    expect(screen.queryByTestId('app-root')).not.toBeInTheDocument();
    expect(localStorage.getItem(TOKEN_KEY)).toBeNull();
    expect(db.findUserByToken('mock-token-user-1')).toBeNull();
  });
});

describe('navigation', () => {
  it('opens a project board and comes back to the project list', async () => {
    await renderSignedIn();

    expect(screen.getByTestId('project-list')).toBeInTheDocument();
    expect(screen.queryByTestId('back-to-projects')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('project-card-proj-1'));

    expect(screen.getByTestId('kanban-board')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-board-title')).toHaveTextContent('Personal Website');
    expect(screen.queryByTestId('project-list')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('back-to-projects'));

    expect(screen.getByTestId('project-list')).toBeInTheDocument();
    expect(screen.queryByTestId('kanban-board')).not.toBeInTheDocument();
  });

  it('renders the mock projects with no further network I/O when fetchOnMount is off', async () => {
    await renderSignedIn();
    networkCalls.length = 0;

    expect(screen.getByTestId('project-card-proj-1')).toHaveTextContent('Personal Website');
    expect(screen.getByTestId('project-card-proj-2')).toHaveTextContent('Mobile App');
    expect(
      within(screen.getByTestId('project-card-proj-1')).getByTestId(
        'project-card-task-count'
      )
    ).toHaveTextContent('5 tasks');
    expect(networkCalls).toEqual([]);
  });

  it('shows the seeded tasks in the right columns on the proj-1 board', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-1'));

    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-3')
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kanban-column-tasks-in-progress')).getByTestId(
        'task-card-task-2'
      )
    ).toBeInTheDocument();
    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-1')
    ).toBeInTheDocument();
  });

  it('renders an empty board for proj-2, which owns none of the mock tasks', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-2'));

    expect(screen.getByTestId('kanban-board-title')).toHaveTextContent('Mobile App');
    expect(screen.getByTestId('kanban-column-empty-todo')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-empty-in-progress')).toBeInTheDocument();
    expect(screen.getByTestId('kanban-column-empty-done')).toBeInTheDocument();
  });
});

describe('drag and drop', () => {
  it('moves a card between columns without touching the network', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    networkCalls.length = 0;

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    await waitFor(() =>
      expect(
        within(screen.getByTestId('kanban-column-tasks-done')).getByTestId(
          'task-card-task-3'
        )
      ).toBeInTheDocument()
    );
    expect(screen.getByTestId('kanban-column-count-done')).toHaveTextContent('2');
    expect(screen.getByTestId('kanban-column-empty-todo')).toBeInTheDocument();
    expect(networkCalls).toEqual([]);
  });

  it('leaves the board alone when a card is dropped where it already is', async () => {
    await renderSignedIn();
    fireEvent.click(screen.getByTestId('project-card-proj-1'));

    fireEvent.dragStart(screen.getByTestId('task-card-task-1'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    expect(screen.getByTestId('kanban-column-count-done')).toHaveTextContent('1');
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });
});

describe('error handling', () => {
  it('rolls the board back and surfaces the API error when a move is rejected', async () => {
    await renderSignedIn({ fetchOnMount: true });
    await waitFor(() =>
      expect(
        within(screen.getByTestId('project-card-proj-1')).getByTestId(
          'project-card-task-count'
        )
      ).toHaveTextContent('3 tasks')
    );

    await openLoadedBoard('proj-1');

    // Kill the session server-side: the next write is rejected for real.
    db.revokeToken('mock-token-user-1');

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    expect(await screen.findByTestId('app-error')).toHaveTextContent(
      'Invalid or expired token'
    );
    // The optimistic move is undone: the card is back in its original column.
    expect(
      within(screen.getByTestId('kanban-column-tasks-todo')).getByTestId('task-card-task-3')
    ).toBeInTheDocument();
    expect(db.getTask('task-3')?.status).toBe('todo');
  });
});

describe('live data (fetchOnMount)', () => {
  it('replaces the mock projects with the caller\'s real ones', async () => {
    await renderSignedIn({ fetchOnMount: true });

    await waitFor(() =>
      expect(
        within(screen.getByTestId('project-card-proj-1')).getByTestId(
          'project-card-task-count'
        )
      ).toHaveTextContent('3 tasks')
    );

    // proj-2 really has no tasks; the mock fixture claimed 8.
    expect(
      within(screen.getByTestId('project-card-proj-2')).getByTestId(
        'project-card-task-count'
      )
    ).toHaveTextContent('0 tasks');
    // proj-3 belongs to user-2 and must never reach this user's list.
    expect(screen.queryByTestId('project-card-proj-3')).not.toBeInTheDocument();
    expect(networkCalls.map((c) => c.path)).toContain('/api/projects');
  });

  it('loads a board\'s tasks from the API and persists a drag through the real PATCH', async () => {
    await renderSignedIn({ fetchOnMount: true });
    await waitFor(() =>
      expect(
        within(screen.getByTestId('project-card-proj-1')).getByTestId(
          'project-card-task-count'
        )
      ).toHaveTextContent('3 tasks')
    );

    await openLoadedBoard('proj-1');
    expect(screen.getByTestId('task-card-task-3')).toBeInTheDocument();

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    await waitFor(() => expect(db.getTask('task-3')?.status).toBe('done'));
    expect(networkCalls).toContainEqual({
      method: 'PATCH',
      path: '/api/projects/proj-1/tasks/task-3',
    });

    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-3')
    ).toBeInTheDocument();
    expect(screen.queryByTestId('app-error')).not.toBeInTheDocument();
  });

  it('does not let a slow board load overwrite a move that already succeeded', async () => {
    // A board load that is still in flight when the user drops a card carries
    // a snapshot taken BEFORE the write. Only its arrival is delayed here —
    // the request, the server and the response bytes are entirely real.
    await renderSignedIn({ fetchOnMount: true });
    await waitFor(() =>
      expect(
        within(screen.getByTestId('project-card-proj-1')).getByTestId(
          'project-card-task-count'
        )
      ).toHaveTextContent('3 tasks')
    );

    const releaseBoardLoad = holdResponse('/api/projects/proj-1/tasks');
    fireEvent.click(screen.getByTestId('project-card-proj-1'));
    await waitFor(() =>
      expect(networkCalls.map((c) => c.path)).toContain('/api/projects/proj-1/tasks')
    );

    fireEvent.dragStart(screen.getByTestId('task-card-task-3'));
    fireEvent.drop(screen.getByTestId('kanban-column-done'));

    // The write really landed: the server now holds the new status.
    await waitFor(() => expect(db.getTask('task-3')?.status).toBe('done'));

    releaseBoardLoad();
    await waitFor(() =>
      expect(screen.queryByTestId('app-loading')).not.toBeInTheDocument()
    );

    // The board must agree with the server it just wrote to.
    expect(
      within(screen.getByTestId('kanban-column-tasks-done')).getByTestId('task-card-task-3')
    ).toBeInTheDocument();
  });
});
