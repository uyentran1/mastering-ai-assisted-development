/**
 * Task routes.
 *
 * Two path shapes are served by ONE set of handlers:
 *   flat    GET|PATCH|DELETE /api/tasks/:id
 *   nested  GET|POST         /api/projects/:id/tasks
 *           GET|PATCH|DELETE /api/projects/:id/tasks/:taskId
 *
 * Check order is auth -> project (existence, ownership) -> task (existence,
 * membership) -> body/query validation.
 */

import { Request, Response, Router } from 'express';
import {
  CreateTaskRequest,
  Project,
  Task,
  UpdateTaskRequest,
} from '../../shared/types';
import { db, TaskFilters } from '../db/mock';
import { currentUser, requireAuth } from '../middleware/auth';
import {
  fail,
  isNonEmptyString,
  isPlainObject,
  isString,
  isTaskPriority,
  isTaskStatus,
  ok,
  quotedList,
  TASK_PRIORITY_VALUES,
  TASK_STATUS_VALUES,
} from '../lib/http';
import { resolveOwnedProject } from './projects';

/** Mounted at /api/tasks — the flat shape. */
export const tasksRouter = Router();
/** Mounted at /api/projects/:id/tasks — the nested shape. */
export const projectTasksRouter = Router({ mergeParams: true });

// ==========================================
// Param plumbing shared by both shapes
// ==========================================

/**
 * Pull the task id (and, on the nested shape, the project id from the path)
 * out of whichever route matched.
 */
function readTaskRef(req: Request): { taskId: string; pathProjectId?: string } {
  const params = req.params as Record<string, string | undefined>;
  if (params.taskId !== undefined) {
    return { taskId: params.taskId, pathProjectId: params.id };
  }
  return { taskId: params.id ?? '' };
}

/**
 * Resolve the task addressed by this request and assert the caller may touch
 * it. Returns null after having already written the error envelope.
 */
function resolveTask(req: Request, res: Response): { task: Task; project: Project } | null {
  const user = currentUser(req);
  const { taskId, pathProjectId } = readTaskRef(req);

  // Nested shape: the project in the path is checked first, so a task id
  // aimed at someone else's project is a 403 rather than a 404.
  if (pathProjectId !== undefined) {
    const pathProject = resolveOwnedProject(res, pathProjectId, user.id);
    if (!pathProject) return null;

    const task = db.getTask(taskId);
    if (!task || task.project_id !== pathProject.id) {
      fail(res, 404, 'Task not found');
      return null;
    }
    return { task, project: pathProject };
  }

  // Flat shape: ownership is derived from the task's own project.
  const task = db.getTask(taskId);
  if (!task) {
    fail(res, 404, 'Task not found');
    return null;
  }
  const project = db.getProject(task.project_id);
  if (!project) {
    fail(res, 404, 'Task not found');
    return null;
  }
  if (project.user_id !== user.id) {
    fail(res, 403, 'Forbidden');
    return null;
  }
  return { task, project };
}

// ==========================================
// Shared handlers
// ==========================================

/** GET a single task (either shape). */
function getTaskHandler(req: Request, res: Response): void {
  const resolved = resolveTask(req, res);
  if (!resolved) return;
  ok(res, 200, resolved.task);
}

/** PATCH a task (either shape). */
function updateTaskHandler(req: Request, res: Response): void {
  const resolved = resolveTask(req, res);
  if (!resolved) return;

  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    fail(res, 400, 'Request body must be a JSON object');
    return;
  }

  const { title, description, status, priority, assignee, due_date } = body;

  if (title !== undefined && !isNonEmptyString(title)) {
    fail(res, 400, 'Title must be a non-empty string');
    return;
  }
  if (description !== undefined && !isString(description)) {
    fail(res, 400, 'Description must be a string');
    return;
  }
  if (status !== undefined && !isTaskStatus(status)) {
    fail(res, 400, `Status must be one of ${quotedList(TASK_STATUS_VALUES)}`);
    return;
  }
  if (priority !== undefined && !isTaskPriority(priority)) {
    fail(res, 400, `Priority must be one of ${quotedList(TASK_PRIORITY_VALUES)}`);
    return;
  }
  if (assignee !== undefined && !isString(assignee)) {
    fail(res, 400, 'Assignee must be a string');
    return;
  }
  if (due_date !== undefined && !isString(due_date)) {
    fail(res, 400, 'Due date must be a string');
    return;
  }
  if (
    title === undefined &&
    description === undefined &&
    status === undefined &&
    priority === undefined &&
    assignee === undefined &&
    due_date === undefined
  ) {
    fail(res, 400, 'No valid fields to update');
    return;
  }

  const updates: UpdateTaskRequest = {};
  if (title !== undefined) updates.title = (title as string).trim();
  if (description !== undefined) updates.description = description;
  if (status !== undefined) updates.status = status;
  if (priority !== undefined) updates.priority = priority;
  if (assignee !== undefined) updates.assignee = assignee;
  if (due_date !== undefined) updates.due_date = due_date;

  const updated = db.updateTask(resolved.task.id, updates);
  if (!updated) {
    // Unreachable: existence was verified above.
    fail(res, 404, 'Task not found');
    return;
  }
  ok(res, 200, updated);
}

/** DELETE a task (either shape). */
function deleteTaskHandler(req: Request, res: Response): void {
  const resolved = resolveTask(req, res);
  if (!resolved) return;

  db.deleteTask(resolved.task.id);
  ok(res, 200, { message: 'Task deleted' });
}

/** GET the task list for a project (nested shape only). */
function listTasksHandler(req: Request, res: Response): void {
  const user = currentUser(req);
  const projectId = (req.params as Record<string, string | undefined>).id ?? '';

  const project = resolveOwnedProject(res, projectId, user.id);
  if (!project) return;

  const { status, priority, assignee, search } = req.query;

  if (status !== undefined && !isTaskStatus(status)) {
    fail(res, 400, `Status filter must be one of ${quotedList(TASK_STATUS_VALUES)}`);
    return;
  }
  if (priority !== undefined && !isTaskPriority(priority)) {
    fail(res, 400, `Priority filter must be one of ${quotedList(TASK_PRIORITY_VALUES)}`);
    return;
  }
  if (assignee !== undefined && !isString(assignee)) {
    fail(res, 400, 'Assignee filter must be a string');
    return;
  }
  if (search !== undefined && !isString(search)) {
    fail(res, 400, 'Search filter must be a string');
    return;
  }

  const filters: TaskFilters = {};
  if (status !== undefined) filters.status = status;
  if (priority !== undefined) filters.priority = priority;
  if (assignee !== undefined) filters.assignee = assignee;
  if (search !== undefined) filters.search = search;

  ok(res, 200, db.listTasks(project.id, filters));
}

/** POST a new task into a project (nested shape only). */
function createTaskHandler(req: Request, res: Response): void {
  const user = currentUser(req);
  const projectId = (req.params as Record<string, string | undefined>).id ?? '';

  const project = resolveOwnedProject(res, projectId, user.id);
  if (!project) return;

  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    fail(res, 400, 'Request body must be a JSON object');
    return;
  }

  const { title, description, priority, assignee, due_date } = body;

  if (!isNonEmptyString(title)) {
    fail(res, 400, 'Title is required');
    return;
  }
  if (description !== undefined && !isString(description)) {
    fail(res, 400, 'Description must be a string');
    return;
  }
  if (priority !== undefined && !isTaskPriority(priority)) {
    fail(res, 400, `Priority must be one of ${quotedList(TASK_PRIORITY_VALUES)}`);
    return;
  }
  if (assignee !== undefined && !isString(assignee)) {
    fail(res, 400, 'Assignee must be a string');
    return;
  }
  if (due_date !== undefined && !isString(due_date)) {
    fail(res, 400, 'Due date must be a string');
    return;
  }

  const input: CreateTaskRequest = { title: title.trim() };
  if (description !== undefined) input.description = description;
  if (priority !== undefined) input.priority = priority;
  if (assignee !== undefined) input.assignee = assignee;
  if (due_date !== undefined) input.due_date = due_date;

  ok(res, 201, db.createTask(project.id, input));
}

// ==========================================
// Wiring
// ==========================================

tasksRouter.use(requireAuth);
tasksRouter.get('/:id', getTaskHandler);
tasksRouter.patch('/:id', updateTaskHandler);
tasksRouter.delete('/:id', deleteTaskHandler);

projectTasksRouter.use(requireAuth);
projectTasksRouter.get('/', listTasksHandler);
projectTasksRouter.post('/', createTaskHandler);
projectTasksRouter.get('/:taskId', getTaskHandler);
projectTasksRouter.patch('/:taskId', updateTaskHandler);
projectTasksRouter.delete('/:taskId', deleteTaskHandler);
