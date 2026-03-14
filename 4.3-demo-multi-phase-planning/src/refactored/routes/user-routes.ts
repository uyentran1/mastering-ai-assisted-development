/**
 * Refactored: User Routes
 *
 * This is the target state after Phase 5 (Integrate).
 *
 * Routes are now THIN wrappers:
 * - Parse HTTP request
 * - Call service
 * - Format HTTP response
 * - Handle errors by converting AppError to HTTP status codes
 *
 * No business logic in routes.
 * No data access in routes.
 * No validation in routes.
 */

import express, { Request, Response } from 'express';
import { IUserService, AppError } from '../types';

export function createUserRoutes(userService: IUserService) {
  const router = express.Router();

  // GET /users — List all users
  router.get('/users', async (req: Request, res: Response) => {
    const result = await userService.getAllUsers();
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // GET /users/:id — Get a specific user
  router.get('/users/:id', async (req: Request, res: Response) => {
    const result = await userService.getUserById(req.params.id);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // POST /users — Create a new user
  router.post('/users', async (req: Request, res: Response) => {
    const { name, email } = req.body;
    const result = await userService.createUser(name, email);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.status(201).json({ data: result.data });
  });

  // PUT /users/:id — Update a user
  router.put('/users/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, email } = req.body;
    const result = await userService.updateUser(id, name, email);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: result.data });
  });

  // DELETE /users/:id — Delete a user
  router.delete('/users/:id', async (req: Request, res: Response) => {
    const result = await userService.deleteUser(req.params.id);
    if (result.error) {
      return res.status(result.error.statusCode).json({ error: result.error.message });
    }
    res.json({ data: { success: true } });
  });

  return router;
}
