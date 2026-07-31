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
import { getPrincipal, isAdmin, Principal } from './auth';

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

/**
 * Returns the authenticated principal, or sends a 401 and returns null.
 * Requests without an identity are rejected rather than attributed to a
 * placeholder user: silently accepting them would forge the invitation
 * audit trail and let a caller sidestep the per-user rate limit.
 */
function requirePrincipal(req: Request, res: Response): Principal | null {
  const principal = getPrincipal(req);
  if (!principal) {
    sendError(res, 401, 'UNAUTHENTICATED', 'Authentication is required');
    return null;
  }
  return principal;
}

export function createInvitationRouter(service: InvitationService = invitationService): Router {
  const router = Router();

  router.post('/invitations', (req: Request, res: Response) => {
    try {
      const principal = requirePrincipal(req, res);
      if (!principal) return;

      const body = req.body as { email?: unknown } | undefined;
      const email = body?.email;

      if (typeof email !== 'string' || email.trim().length === 0) {
        sendError(res, 400, 'INVALID_EMAIL', 'Email format is invalid');
        return;
      }

      const result = service.createInvitation(email, principal.id);
      res.status(201).json(result);
    } catch (err) {
      handleError(err, res);
    }
  });

  // Intentionally unauthenticated: the caller is redeeming an invitation
  // precisely because they do not have an account yet. The token itself
  // is the credential.
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

  // Admin-only, per specs/feature.md: this response lists the email
  // address of everyone with an outstanding invitation.
  router.get('/invitations/pending', (req: Request, res: Response) => {
    try {
      const principal = requirePrincipal(req, res);
      if (!principal) return;

      if (!isAdmin(principal)) {
        sendError(res, 403, 'FORBIDDEN', 'Admin role is required');
        return;
      }

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
