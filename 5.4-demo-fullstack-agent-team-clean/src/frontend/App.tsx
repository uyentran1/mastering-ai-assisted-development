/**
 * App — root component.
 *
 * Two views: the project grid and a project's Kanban board. Which one shows
 * is a discriminated union rather than a pair of booleans, so an invalid
 * combination is unrepresentable.
 *
 * Auth is a hard gate keyed on `isAuthenticated`, never on the current view:
 * an unauthenticated visitor sees Login and nothing else, whatever `view` says.
 *
 * `fetchOnMount` gates *data* I/O only — loading projects and tasks, and
 * persisting task moves. It defaults to false, in which case the app renders
 * purely from MOCK_PROJECTS / MOCK_TASKS, which keeps demos and tests
 * deterministic. Set it to true against a live API.
 *
 * It does not gate auth I/O: `useAuth` always talks to the network to become
 * authenticated (sign-in, or `GET /api/auth/me` when restoring a stored
 * token), so there is no path to a rendered board without network I/O.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  MOCK_PROJECTS,
  MOCK_TASKS,
  MOCK_USER,
  type CreateProjectRequest,
  type CreateTaskRequest,
  type Project,
  type Task,
  type TaskStatus,
} from '../shared/types';
import * as api from './api';
import { useAuth } from './hooks/useAuth';
import { KANBAN_COLUMNS, KanbanBoard } from './components/KanbanBoard';
import { Login } from './components/Login';
import { DEFAULT_PROJECT_COLOR } from './components/NewProjectForm';
import { ProjectList } from './components/ProjectList';

/** Which screen is showing. `projectId` only exists on the board view. */
export type View = { kind: 'projects' } | { kind: 'board'; projectId: string };

export interface AppProps {
  /**
   * When true, load projects and tasks from the API. When false (the default)
   * the app renders from the shared mock data and never calls the network.
   */
  fetchOnMount?: boolean;
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

/** The colour rule the API enforces, mirrored so both modes reject alike. */
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/**
 * Ids for entities created with `fetchOnMount` off, where no server is there
 * to issue one. The counter only has to avoid colliding with the mock ids and
 * with itself, which a `local-` segment and a monotonic suffix both guarantee.
 */
let localIdCounter = 0;

function nextLocalId(prefix: string): string {
  localIdCounter += 1;
  return `${prefix}-local-${localIdCounter}`;
}

/** The column heading for a status, for use in messages. */
function columnTitleOf(status: TaskStatus): string {
  return KANBAN_COLUMNS.find((column) => column.status === status)?.title ?? status;
}

/**
 * Reconcile a freshly loaded task list against current local state.
 *
 * A load's response describes the server as it was when the request was
 * *issued*. If the client wrote a task while that request was in flight, the
 * response is already out of date for that task and must not overwrite it —
 * otherwise a successful write is silently undone and the UI and server
 * disagree until a reload.
 *
 * Being out of date takes two forms, and they need different repairs:
 *
 *   - a task the response *contains* but describes with a stale field. The
 *     local row wins for every id in `localWriteIds`.
 *   - a task the response cannot contain at all, because it did not exist
 *     when the snapshot was taken. No amount of looking inside `loaded` finds
 *     it, so every id in `localCreateIds` missing from the response is added
 *     back from local state.
 *
 * Outside those two sets the server is authoritative, existence included: a
 * task missing from `loaded` is dropped rather than resurrected.
 *
 * A response only speaks for the project it was asked about, so only creates
 * belonging to `projectId` are added back — the rest are no business of this
 * load, and re-adding them would leave the list holding another board's tasks.
 */
function mergeLoadedTasks(
  current: Task[],
  loaded: Task[],
  projectId: string,
  localWriteIds: ReadonlySet<string>,
  localCreateIds: ReadonlySet<string>
): Task[] {
  const reconciled =
    localWriteIds.size === 0
      ? loaded
      : (() => {
          const currentById = new Map(current.map((task) => [task.id, task]));
          return loaded.map((task) =>
            localWriteIds.has(task.id) ? currentById.get(task.id) ?? task : task
          );
        })();

  if (localCreateIds.size === 0) {
    return reconciled;
  }

  const loadedIds = new Set(loaded.map((task) => task.id));
  const missedCreates = current.filter(
    (task) =>
      task.project_id === projectId &&
      localCreateIds.has(task.id) &&
      !loadedIds.has(task.id)
  );

  return missedCreates.length === 0 ? reconciled : [...reconciled, ...missedCreates];
}

export const App: React.FC<AppProps> = ({ fetchOnMount = false }) => {
  const auth = useAuth();

  const [projects, setProjects] = useState<Project[]>(MOCK_PROJECTS);
  const [tasks, setTasks] = useState<Task[]>(MOCK_TASKS);
  const [view, setView] = useState<View>({ kind: 'projects' });
  const [isDataLoading, setIsDataLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { isAuthenticated } = auth;

  /** Owner stamped on locally created projects; the API assigns it otherwise. */
  const userId = auth.user?.id ?? MOCK_USER.id;

  /**
   * Task ids with a write currently in flight. These stay protected across a
   * load boundary: a load that starts mid-PATCH will also have been answered
   * from pre-write state.
   */
  const pendingWriteIdsRef = useRef<Set<string>>(new Set());

  /**
   * Task ids the in-flight load may not overwrite — everything written since
   * that load began, seeded with whatever was already in flight when it did.
   */
  const localWriteIdsRef = useRef<Set<string>>(new Set());

  /**
   * Task ids the in-flight load cannot know exist — everything *created* since
   * that load began, which a response answered from a pre-creation snapshot
   * would otherwise silently delete.
   *
   * A create has no id until the server issues one, so unlike a write there is
   * nothing to seed this with at load start: the id is registered when the
   * POST resolves, and that always falls on the right side of the line. A load
   * still in flight at that moment was issued before the task existed, so its
   * response is stale and the id is now protected against it. A load issued
   * afterwards was answered by a server that already held the task, so its
   * response carries the task and no protection is needed.
   *
   * Membership ends the moment a load reports the id: the server has
   * acknowledged the task, so from then on its existence is the server's call
   * again and a later deletion is honoured. That also bounds the set — it only
   * ever holds tasks created since the last load that saw them.
   */
  const localCreateIdsRef = useRef<Set<string>>(new Set());

  // Load projects once the user is authenticated, if wired to a live API.
  useEffect(() => {
    if (!fetchOnMount || !isAuthenticated) {
      return;
    }

    let cancelled = false;
    setIsDataLoading(true);

    api
      .getProjects()
      .then((loaded) => {
        if (!cancelled) setProjects(loaded);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(messageOf(err, 'Unable to load projects'));
      })
      .finally(() => {
        if (!cancelled) setIsDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOnMount, isAuthenticated]);

  // Load the selected project's tasks when the board opens.
  const boardProjectId = view.kind === 'board' ? view.projectId : null;

  useEffect(() => {
    if (!fetchOnMount || !isAuthenticated || !boardProjectId) {
      return;
    }

    let cancelled = false;

    // From here on, any local write must survive this load's response.
    localWriteIdsRef.current = new Set(pendingWriteIdsRef.current);
    // Creates registered before this load are already in the snapshot it will
    // be answered from, so this load needs to protect none of them.
    localCreateIdsRef.current = new Set();
    setIsDataLoading(true);

    api
      .getProjectTasks(boardProjectId)
      .then((loaded) => {
        if (cancelled) return;

        // Frozen for the merge, because the ref keeps mutating: a create that
        // resolves before the updater runs belongs to the next load's set.
        const createdIds = new Set(localCreateIdsRef.current);

        // The response proves the server knows these tasks, so they go back to
        // being ordinary rows the server owns outright.
        for (const task of loaded) {
          localCreateIdsRef.current.delete(task.id);
        }

        setTasks((current) =>
          mergeLoadedTasks(
            current,
            loaded,
            boardProjectId,
            localWriteIdsRef.current,
            createdIds
          )
        );
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(messageOf(err, 'Unable to load tasks'));
      })
      .finally(() => {
        if (!cancelled) setIsDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [fetchOnMount, isAuthenticated, boardProjectId]);

  const handleSelectProject = useCallback((projectId: string): void => {
    setError(null);
    setView({ kind: 'board', projectId });
  }, []);

  const handleBackToProjects = useCallback((): void => {
    setError(null);
    setView({ kind: 'projects' });
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await auth.signOut();
    setView({ kind: 'projects' });
    setError(null);
  }, [auth]);

  /**
   * Move a task to a new status. The board updates immediately; if the API
   * rejects the move, that one task's status is put back.
   *
   * Every write here is a functional update touching only `taskId`. Never
   * restore a whole list snapshot captured before an await — by the time the
   * await resolves, that snapshot may be missing changes made in the meantime.
   */
  const handleTaskMove = useCallback(
    async (taskId: string, status: TaskStatus): Promise<void> => {
      const target = tasks.find((task) => task.id === taskId);
      if (!target || target.status === status) {
        return;
      }

      const previousStatus = target.status;

      setTasks((current) =>
        current.map((task) => (task.id === taskId ? { ...task, status } : task))
      );
      setError(null);

      if (!fetchOnMount) {
        return;
      }

      pendingWriteIdsRef.current.add(taskId);
      localWriteIdsRef.current.add(taskId);

      try {
        const updated = await api.updateTask(target.project_id, taskId, { status });
        setTasks((current) =>
          current.map((task) => (task.id === taskId ? updated : task))
        );
      } catch (err: unknown) {
        // Revert this task only, against whatever the list holds now. The
        // write never landed, so it no longer outranks a loaded value.
        setTasks((current) =>
          current.map((task) =>
            task.id === taskId ? { ...task, status: previousStatus } : task
          )
        );
        localWriteIdsRef.current.delete(taskId);
        setError(messageOf(err, 'Unable to move task'));
      } finally {
        pendingWriteIdsRef.current.delete(taskId);
      }
    },
    [tasks, fetchOnMount]
  );

  /** Keep a project's `task_count` in step with a task added locally. */
  const countNewTask = useCallback((projectId: string): void => {
    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? { ...project, task_count: (project.task_count ?? 0) + 1 }
          : project
      )
    );
  }, []);

  /**
   * Create a project and append it to the list.
   *
   * Throwing is the signal the form waits on: it keeps the entered values and
   * shows the message, so a rejected create is never mistaken for a success.
   */
  const handleCreateProject = useCallback(
    async (input: CreateProjectRequest): Promise<void> => {
      setError(null);

      if (!fetchOnMount) {
        if (input.color !== undefined && !HEX_COLOR_PATTERN.test(input.color)) {
          throw new Error('Color must be a hex color like #3B82F6');
        }

        const project: Project = {
          id: nextLocalId('proj'),
          user_id: userId,
          name: input.name,
          color: input.color ?? DEFAULT_PROJECT_COLOR,
          created_at: new Date().toISOString(),
          task_count: 0,
        };
        if (input.description !== undefined) {
          project.description = input.description;
        }

        setProjects((current) => [...current, project]);
        return;
      }

      const created = await api.createProject(input);
      setProjects((current) => [...current, created]);
    },
    [fetchOnMount, userId]
  );

  /**
   * Create a task in the column it was added from.
   *
   * The API decides the status on create — every task it makes is `todo`,
   * whatever the request says — so a task destined for another column is
   * created first and moved second, through the same PATCH a drag uses.
   *
   * If that move fails the task is real and sitting in To Do. Saying so beats
   * pretending, so the message names both facts and the board is left showing
   * where the task actually is.
   */
  const handleCreateTask = useCallback(
    async (status: TaskStatus, input: CreateTaskRequest): Promise<void> => {
      const projectId = boardProjectId;
      if (!projectId) {
        // No board is open, so there is no project to create into.
        return;
      }

      setError(null);

      if (!fetchOnMount) {
        const task: Task = {
          id: nextLocalId('task'),
          project_id: projectId,
          title: input.title,
          status,
          priority: input.priority ?? 'medium',
          created_at: new Date().toISOString(),
        };
        if (input.description !== undefined) task.description = input.description;
        if (input.assignee !== undefined) task.assignee = input.assignee;
        if (input.due_date !== undefined) task.due_date = input.due_date;

        setTasks((current) => [...current, task]);
        countNewTask(projectId);
        return;
      }

      const created = await api.createTask(projectId, input);

      // Registered before anything else, and on every path out of here: a load
      // still in flight was answered before this task existed, so nothing but
      // this set can stop that response from deleting it.
      localCreateIdsRef.current.add(created.id);

      setTasks((current) => [...current, created]);
      countNewTask(projectId);

      if (status === created.status) {
        return;
      }

      // Same protection a drag gets: a load in flight must not undo this move.
      pendingWriteIdsRef.current.add(created.id);
      localWriteIdsRef.current.add(created.id);

      try {
        const moved = await api.updateTask(projectId, created.id, { status });
        setTasks((current) =>
          current.map((task) => (task.id === created.id ? moved : task))
        );
      } catch (err: unknown) {
        localWriteIdsRef.current.delete(created.id);
        const message = `Task created in ${columnTitleOf(created.status)}, but moving it to ${columnTitleOf(status)} failed: ${messageOf(err, 'Unable to move task')}`;
        setError(message);
        throw new Error(message);
      } finally {
        pendingWriteIdsRef.current.delete(created.id);
      }
    },
    [boardProjectId, fetchOnMount, countNewTask]
  );

  // Hard auth gate — keyed on authentication, not on the current view.
  if (!isAuthenticated) {
    return (
      <Login
        onSignIn={auth.signIn}
        onSignUp={auth.signUp}
        isLoading={auth.isLoading}
        error={auth.error}
      />
    );
  }

  const activeProject =
    view.kind === 'board'
      ? projects.find((project) => project.id === view.projectId)
      : undefined;

  const boardTasks =
    view.kind === 'board'
      ? tasks.filter((task) => task.project_id === view.projectId)
      : [];

  return (
    <div data-testid="app-root" className="min-h-screen bg-slate-50">
      <header
        data-testid="app-header"
        className="flex items-center justify-between border-b border-slate-200 bg-white px-6 py-4"
      >
        <div className="flex items-center gap-4">
          {view.kind === 'board' && (
            <button
              data-testid="back-to-projects"
              type="button"
              onClick={handleBackToProjects}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100"
            >
              ← Projects
            </button>
          )}
          <h1 data-testid="app-title" className="text-lg font-bold text-slate-900">
            Task App
          </h1>
        </div>

        <div className="flex items-center gap-4">
          {auth.user && (
            <span data-testid="app-user-email" className="text-sm text-slate-600">
              {auth.user.email}
            </span>
          )}
          <button
            data-testid="sign-out-button"
            type="button"
            onClick={handleSignOut}
            className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            Sign out
          </button>
        </div>
      </header>

      {error && (
        <p
          data-testid="app-error"
          role="alert"
          className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700"
        >
          {error}
        </p>
      )}

      {isDataLoading && (
        <p data-testid="app-loading" className="px-6 py-3 text-sm text-slate-500">
          Loading…
        </p>
      )}

      <main data-testid="app-main">
        {view.kind === 'projects' ? (
          <ProjectList
            projects={projects}
            onSelectProject={handleSelectProject}
            onCreateProject={handleCreateProject}
          />
        ) : (
          <KanbanBoard
            tasks={boardTasks}
            project={activeProject}
            onTaskMove={handleTaskMove}
            onCreateTask={handleCreateTask}
          />
        )}
      </main>
    </div>
  );
};

export default App;
