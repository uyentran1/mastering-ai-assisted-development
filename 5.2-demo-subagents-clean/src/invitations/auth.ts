/**
 * Request authentication for the invitations feature.
 *
 * This module deliberately does NOT implement real authentication — there
 * is no identity provider in this project. What it does is give the route
 * layer a single, explicit place to ask "who is making this request?", so
 * that the answer can never silently default to a made-up identity.
 */

import { NextFunction, Request, RequestHandler, Response } from 'express';

/** The authenticated caller behind a request. */
export interface Principal {
  id: string;
  roles: string[];
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Principal;
    }
  }
}

export const ADMIN_ROLE = 'admin';

/** Returns the authenticated principal for a request, or null if there is none. */
export function getPrincipal(req: Request): Principal | null {
  const user = req.user;
  if (!user || typeof user.id !== 'string' || user.id.length === 0) {
    return null;
  }
  return user;
}

export function isAdmin(principal: Principal): boolean {
  return principal.roles.includes(ADMIN_ROLE);
}

/**
 * DEVELOPMENT ONLY. Populates req.user from the `x-user-id` and
 * `x-user-roles` headers.
 *
 * These headers are entirely caller-controlled, so this middleware lets
 * any client claim any identity and any role. Mounting it in a
 * deployment would let an attacker forge `created_by_user_id`, evade the
 * per-user rate limit by rotating the header, and read every pending
 * invitation by claiming the admin role. It exists so the service can be
 * run and tested locally before a real identity provider is wired in,
 * and it must be opted into explicitly — never mounted by default.
 */
export function devHeaderAuth(): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const id = req.header('x-user-id');
    if (typeof id === 'string' && id.length > 0) {
      const roles = (req.header('x-user-roles') ?? '')
        .split(',')
        .map((r) => r.trim())
        .filter((r) => r.length > 0);
      req.user = { id, roles };
    }
    next();
  };
}
