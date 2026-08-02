/**
 * Project routes.
 *
 * Check order in every handler is: auth (via requireAuth) -> resource
 * existence -> ownership -> body validation. So a malformed body aimed at
 * another user's project returns 403, not 400.
 */

import { Request, Response, Router } from 'express';
import {
  CreateProjectRequest,
  Project,
  Task,
  UpdateProjectRequest,
} from '../../shared/types';
import { db } from '../db/mock';
import { currentUser, requireAuth } from '../middleware/auth';
import {
  fail,
  isHexColor,
  isNonEmptyString,
  isPlainObject,
  isString,
  ok,
} from '../lib/http';

export const projectsRouter = Router();

/** A project plus its tasks — the GET /api/projects/:id payload. */
export interface ProjectWithTasks extends Project {
  tasks: Task[];
}

/**
 * Look up a project and assert the caller owns it.
 *
 * Returns the project, or null after having already written a 404/403
 * envelope to `res`. Callers must return immediately on null.
 */
export function resolveOwnedProject(
  res: Response,
  projectId: string,
  userId: string
): Project | null {
  const project = db.getProject(projectId);
  if (!project) {
    fail(res, 404, 'Project not found');
    return null;
  }
  if (project.user_id !== userId) {
    fail(res, 403, 'Forbidden');
    return null;
  }
  return project;
}

projectsRouter.use(requireAuth);

/** GET /api/projects -> 200 ApiResponse<Project[]> (each with task_count) */
projectsRouter.get('/', (req: Request, res: Response) => {
  const user = currentUser(req);
  return ok(res, 200, db.listProjects(user.id));
});

/** POST /api/projects -> 201 ApiResponse<Project> */
projectsRouter.post('/', (req: Request, res: Response) => {
  const user = currentUser(req);
  const body: unknown = req.body;

  if (!isPlainObject(body)) {
    return fail(res, 400, 'Request body must be a JSON object');
  }

  const { name, description, color } = body;

  if (!isNonEmptyString(name)) {
    return fail(res, 400, 'Name is required');
  }
  if (description !== undefined && !isString(description)) {
    return fail(res, 400, 'Description must be a string');
  }
  if (color !== undefined && !isHexColor(color)) {
    return fail(res, 400, 'Color must be a hex color like #3B82F6');
  }

  const input: CreateProjectRequest = { name: name.trim() };
  if (description !== undefined) input.description = description;
  if (color !== undefined) input.color = color;

  return ok(res, 201, db.createProject(user.id, input));
});

/** GET /api/projects/:id -> 200 ApiResponse<Project & { tasks }> */
projectsRouter.get('/:id', (req: Request, res: Response) => {
  const user = currentUser(req);
  const project = resolveOwnedProject(res, req.params.id, user.id);
  if (!project) return;

  const payload: ProjectWithTasks = {
    ...project,
    tasks: db.listTasks(project.id),
  };
  return ok(res, 200, payload);
});

/** PATCH /api/projects/:id -> 200 ApiResponse<Project> */
projectsRouter.patch('/:id', (req: Request, res: Response) => {
  const user = currentUser(req);
  const project = resolveOwnedProject(res, req.params.id, user.id);
  if (!project) return;

  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    return fail(res, 400, 'Request body must be a JSON object');
  }

  const { name, description, color } = body;

  if (name !== undefined && !isNonEmptyString(name)) {
    return fail(res, 400, 'Name must be a non-empty string');
  }
  if (description !== undefined && !isString(description)) {
    return fail(res, 400, 'Description must be a string');
  }
  if (color !== undefined && !isHexColor(color)) {
    return fail(res, 400, 'Color must be a hex color like #3B82F6');
  }
  if (name === undefined && description === undefined && color === undefined) {
    return fail(res, 400, 'No valid fields to update');
  }

  const updates: UpdateProjectRequest = {};
  if (name !== undefined) updates.name = (name as string).trim();
  if (description !== undefined) updates.description = description;
  if (color !== undefined) updates.color = color;

  const updated = db.updateProject(project.id, updates);
  if (!updated) {
    // Unreachable: existence was verified above.
    return fail(res, 404, 'Project not found');
  }
  return ok(res, 200, updated);
});

/** DELETE /api/projects/:id -> 200 ApiResponse<{ message }>, cascades to tasks */
projectsRouter.delete('/:id', (req: Request, res: Response) => {
  const user = currentUser(req);
  const project = resolveOwnedProject(res, req.params.id, user.id);
  if (!project) return;

  db.deleteProject(project.id);
  return ok(res, 200, { message: 'Project deleted' });
});
