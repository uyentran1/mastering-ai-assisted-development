/**
 * Mock bearer-token auth.
 *
 * Clients send `Authorization: Bearer mock-token-user-1`. The token is looked
 * up in the mock database and the resolved user is attached to the request.
 */

import { NextFunction, Request, Response } from 'express';
import { User } from '../../shared/types';
import { db } from '../db/mock';
import { fail } from '../lib/http';

/** A request that has passed through `requireAuth`. */
export interface AuthedRequest extends Request {
  user?: User;
  /** The raw bearer token this request presented, for routes that revoke it. */
  token?: string;
}

/**
 * Guard for every protected route. This runs before any resource lookup or
 * body validation, so an unauthenticated request is always a 401 — never a
 * 404 that leaks whether a resource exists, and never a 400.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;

  if (typeof header !== 'string' || header.trim() === '') {
    fail(res, 401, 'Unauthorized');
    return;
  }

  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) {
    fail(res, 401, 'Unauthorized');
    return;
  }

  const user = db.findUserByToken(token);
  if (!user) {
    fail(res, 401, 'Invalid or expired token');
    return;
  }

  (req as AuthedRequest).user = user;
  (req as AuthedRequest).token = token;
  next();
}

/**
 * Read the authenticated user off a request. Only call this inside a handler
 * mounted behind `requireAuth`; it throws otherwise, which surfaces a
 * programming mistake as a 500 rather than a silent auth bypass.
 */
export function currentUser(req: Request): User {
  const user = (req as AuthedRequest).user;
  if (!user) {
    throw new Error('currentUser() called on a request that did not pass requireAuth');
  }
  return user;
}

/**
 * Read the raw bearer token off a request, for routes that need the token
 * itself (signout revokes it). Same contract as `currentUser`: only valid
 * behind `requireAuth`, and never re-parses the header.
 */
export function currentToken(req: Request): string {
  const token = (req as AuthedRequest).token;
  if (!token) {
    throw new Error('currentToken() called on a request that did not pass requireAuth');
  }
  return token;
}
