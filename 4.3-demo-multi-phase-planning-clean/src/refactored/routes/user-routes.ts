/**
 * User HTTP endpoints.
 *
 * Each handler does exactly three things: pull values off the request, call the
 * service, hand the result to `respond`. No validation, no data access.
 *
 * The service arrives by injection so tests can supply a stub.
 */

import express, { Router } from 'express';
import { IUserService } from '../types';
import { handle, respond } from './respond';

export function createUserRoutes(users: IUserService): Router {
  const router = express.Router();

  router.get(
    '/users',
    handle(async (_req, res) => {
      respond(res, await users.getAllUsers());
    })
  );

  router.get(
    '/users/:id',
    handle(async (req, res) => {
      respond(res, await users.getUserById(req.params.id));
    })
  );

  router.post(
    '/users',
    handle(async (req, res) => {
      const { name, email } = req.body ?? {};
      respond(res, await users.createUser(name, email), 201);
    })
  );

  router.put(
    '/users/:id',
    handle(async (req, res) => {
      const { name, email } = req.body ?? {};
      respond(res, await users.updateUser(req.params.id, name, email));
    })
  );

  router.delete(
    '/users/:id',
    handle(async (req, res) => {
      respond(res, await users.deleteUser(req.params.id));
    })
  );

  return router;
}
