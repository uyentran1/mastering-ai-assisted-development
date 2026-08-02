/**
 * Auth routes: signup, signin, signout, me.
 *
 * Signup does NOT return a token — the flow is signup -> signin.
 */

import { Request, Response, Router } from 'express';
import { AuthResponse, User } from '../../shared/types';
import { db } from '../db/mock';
import { currentToken, currentUser, requireAuth } from '../middleware/auth';
import { fail, isPlainObject, isString, isValidEmail, ok } from '../lib/http';

export const authRouter = Router();

const MIN_PASSWORD_LENGTH = 8;

/**
 * POST /api/auth/signup
 * 201 { data: { user_id, email, message }, error: null }
 */
authRouter.post('/signup', (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    return fail(res, 400, 'Request body must be a JSON object');
  }

  const { email, password } = body;

  if (!isValidEmail(email)) {
    return fail(res, 400, 'A valid email is required');
  }
  if (!isString(password)) {
    return fail(res, 400, 'Password is required');
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return fail(res, 400, `Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }

  if (db.findUserByEmail(email)) {
    return fail(res, 409, 'Email already registered');
  }

  const user = db.createUser(email, password);
  const payload: AuthResponse = {
    user_id: user.id,
    email: user.email,
    message: 'Account created',
  };
  return ok(res, 201, payload);
});

/**
 * POST /api/auth/signin
 * 200 { data: { user_id, email, token, message }, error: null }
 */
authRouter.post('/signin', (req: Request, res: Response) => {
  const body: unknown = req.body;
  if (!isPlainObject(body)) {
    return fail(res, 400, 'Request body must be a JSON object');
  }

  const { email, password } = body;

  if (!isString(email) || email.trim() === '') {
    return fail(res, 400, 'Email is required');
  }
  if (!isString(password) || password === '') {
    return fail(res, 400, 'Password is required');
  }

  const user = db.verifyCredentials(email, password);
  if (!user) {
    return fail(res, 401, 'Invalid email or password');
  }

  const payload: AuthResponse = {
    user_id: user.id,
    email: user.email,
    token: db.createToken(user.id),
    message: 'Signed in',
  };
  return ok(res, 200, payload);
});

/**
 * POST /api/auth/signout
 *
 * Requires auth and revokes the exact token that was presented, so a signed
 * out token really stops working. Test isolation is `db.reset()`'s job, not
 * this route's.
 */
authRouter.post('/signout', requireAuth, (req: Request, res: Response) => {
  db.revokeToken(currentToken(req));
  return ok(res, 200, { message: 'Signed out' });
});

/**
 * GET /api/auth/me
 * 200 ApiResponse<User> — note the field is `id`, not `user_id`, because
 * src/shared/types.ts is the contract.
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const user: User = currentUser(req);
  return ok(res, 200, user);
});
