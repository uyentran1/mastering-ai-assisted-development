/**
 * Express routes for the Invitations module.
 *
 * This layer is a thin HTTP adapter over the InvitationService: it maps
 * incoming requests to service calls and maps service results / thrown
 * InvitationErrors to HTTP responses. It owns no business logic and never
 * touches the repository layer directly.
 */

import { Router, Request, Response } from 'express';
import { InvitationError, InvitationErrorCode, InvitationService, invitationService } from './service';

/**
 * Fallback "created by" user id used when a request carries no
 * authenticated user context. In a real deployment every request would
 * be authenticated and this fallback would never be hit; it exists so
 * this route layer works standalone (no auth middleware wired up yet).
 */
const SYSTEM_USER_ID = 'system';

/** Explicit error-code -> HTTP status mapping, per specs/feature.md's Error Cases table. */
const ERROR_STATUS_MAP: Record<InvitationErrorCode, number> = {
  INVALID_EMAIL: 400,
  EMAIL_EXISTS: 400,
  PENDING_INVITATION: 400,
  RATE_LIMITED: 429,
  TOKEN_NOT_FOUND: 404,
  TOKEN_EXPIRED: 400,
  TOKEN_REDEEMED: 400,
  INVALID_PASSWORD: 400,
  WEAK_PASSWORD: 400,
  INVALID_NAME: 400,
};

/** Resolves the "acting user" id for a request: authenticated user, header, or system fallback. */
function resolveUserId(req: Request): string {
  const authedUser = (req as Request & { user?: { id?: string } }).user;
  if (authedUser && typeof authedUser.id === 'string' && authedUser.id.length > 0) {
    return authedUser.id;
  }
  const headerUserId = req.header('x-user-id');
  if (typeof headerUserId === 'string' && headerUserId.length > 0) {
    return headerUserId;
  }
  return SYSTEM_USER_ID;
}

/** Sends the standard `{ error: { code, message } }` envelope for a given status/code/message. */
function sendError(res: Response, status: number, code: string, message: string): void {
  res.status(status).json({ error: { code, message } });
}

/**
 * Maps a caught error to an HTTP response. Known InvitationErrors are
 * mapped via the explicit status table (falling back to `err.status` if
 * somehow the code is missing from the table). Anything else is an
 * unexpected failure and returns a generic 500 that leaks no internals.
 */
function handleError(err: unknown, res: Response): void {
  if (err instanceof InvitationError) {
    const status = ERROR_STATUS_MAP[err.code] ?? err.status ?? 500;
    sendError(res, status, err.code, err.message);
    return;
  }
  // eslint-disable-next-line no-console
  console.error('Unexpected error in invitations routes:', err);
  sendError(res, 500, 'INTERNAL_ERROR', 'An unexpected error occurred');
}

export function createInvitationRouter(service: InvitationService = invitationService): Router {
  const router = Router();

  router.post('/invitations', (req: Request, res: Response) => {
    try {
      const body = req.body as { email?: unknown } | undefined;
      const email = body?.email;

      if (typeof email !== 'string' || email.trim().length === 0) {
        sendError(res, 400, 'INVALID_EMAIL', 'Email format is invalid');
        return;
      }

      const createdByUserId = resolveUserId(req);
      const result = service.createInvitation(email, createdByUserId);
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.post('/invitations/:token/redeem', (req: Request, res: Response) => {
    try {
      const token = req.params.token;
      const body = req.body as { name?: unknown; password?: unknown } | undefined;
      const name = body?.name;
      const password = body?.password;

      if (typeof name !== 'string' || name.trim().length === 0) {
        sendError(res, 400, 'INVALID_NAME', 'Name is required');
        return;
      }

      if (typeof password !== 'string' || password.length === 0) {
        sendError(res, 400, 'INVALID_PASSWORD', 'Password does not meet requirements');
        return;
      }

      const result = service.redeemInvitation(token, name, password);
      res.status(200).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  router.get('/invitations/pending', (_req: Request, res: Response) => {
    try {
      const pending = service.listPendingInvitations().map((inv) => ({
        email: inv.email,
        expiresAt: inv.expires_at,
        createdBy: inv.created_by_user_id,
        createdAt: inv.created_at,
      }));
      res.status(200).json(pending);
    } catch (err) {
      handleError(err, res);
    }
  });

  return router;
}

/** Default router, wired to the module-level singleton service. Mount with `app.use(router)`. */
const router: Router = createInvitationRouter();
export default router;
