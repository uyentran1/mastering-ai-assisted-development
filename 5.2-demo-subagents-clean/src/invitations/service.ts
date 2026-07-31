/**
 * Business logic layer for the Invitations module.
 *
 * This layer owns all validation, rate limiting, token generation and
 * password hashing rules described in specs/feature.md. It depends on the
 * repository layer for persistence only — it never touches storage
 * internals directly.
 */

import * as crypto from 'crypto';
import { invitationRepository, userRepository, InvitationRepository, UserRepository } from './repository';
import { GenerateInvitationResponse, Invitation, RedeemInvitationResponse } from './types';

/** Default invitation expiry window, in days, per spec ("7 days default"). */
export const DEFAULT_EXPIRY_DAYS = 7;

/** Max number of concurrently-pending invitations a single user may hold. */
export const MAX_PENDING_INVITATIONS_PER_USER = 5;

/**
 * Known error codes the API layer can map to HTTP statuses.
 *
 * PENDING_INVITATION and INVALID_NAME are not in the spec's Error Cases
 * table: the spec requires both rules (no duplicate pending invite, name
 * must be non-empty) but names no code for either, so we define one in
 * the same style as the rest.
 */
export type InvitationErrorCode =
  | 'INVALID_EMAIL'
  | 'EMAIL_EXISTS'
  | 'PENDING_INVITATION'
  | 'RATE_LIMITED'
  | 'TOKEN_NOT_FOUND'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_REDEEMED'
  | 'INVALID_PASSWORD'
  | 'WEAK_PASSWORD'
  | 'INVALID_NAME';

const ERROR_STATUS: Record<InvitationErrorCode, number> = {
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

/**
 * Thrown for every invitation business-rule violation. `code` is a stable
 * machine-readable identifier the API layer can switch on; `status` is the
 * HTTP status the spec's Error Cases table associates with that code.
 */
export class InvitationError extends Error {
  public readonly code: InvitationErrorCode;
  public readonly status: number;

  constructor(code: InvitationErrorCode, message: string) {
    super(message);
    this.name = 'InvitationError';
    this.code = code;
    this.status = ERROR_STATUS[code];
    Object.setPrototypeOf(this, InvitationError.prototype);
  }
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function generateId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Hashes a plaintext password using scrypt with a random salt. The stored
 * format is `salt:hash`, both hex-encoded, so verification does not need
 * any extra metadata.
 */
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Constant-time verification of a plaintext password against a stored
 * `salt:hash` string. Exported for completeness / potential login flows,
 * though the invitation redemption flow itself only ever hashes (never
 * verifies) a password.
 */
export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hashHex] = stored.split(':');
  if (!salt || !hashHex) return false;
  const derivedKey = crypto.scryptSync(password, salt, 64);
  const storedKey = Buffer.from(hashHex, 'hex');
  if (derivedKey.length !== storedKey.length) return false;
  return crypto.timingSafeEqual(derivedKey, storedKey);
}

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && EMAIL_REGEX.test(email);
}

function hasUpper(s: string): boolean {
  return /[A-Z]/.test(s);
}
function hasLower(s: string): boolean {
  return /[a-z]/.test(s);
}
function hasDigit(s: string): boolean {
  return /[0-9]/.test(s);
}

export class InvitationService {
  constructor(
    private readonly invitations: InvitationRepository = invitationRepository,
    private readonly users: UserRepository = userRepository
  ) {}

  /**
   * Generates a new invitation token for `email`, created by
   * `createdByUserId`. Throws InvitationError on any validation failure.
   */
  createInvitation(email: string, createdByUserId: string): GenerateInvitationResponse {
    if (!isValidEmail(email)) {
      throw new InvitationError('INVALID_EMAIL', 'Email format is invalid');
    }

    if (this.users.findByEmail(email)) {
      throw new InvitationError('EMAIL_EXISTS', 'Email is already registered');
    }

    if (this.invitations.findPendingByEmail(email)) {
      throw new InvitationError(
        'PENDING_INVITATION',
        'An invitation for this email is already pending'
      );
    }

    const pendingForUser = this.invitations.findPendingByUser(createdByUserId);
    if (pendingForUser.length >= MAX_PENDING_INVITATIONS_PER_USER) {
      throw new InvitationError('RATE_LIMITED', 'Too many invitations sent');
    }

    // base64url, not base64: the token is carried in a URL path segment
    // (POST /invitations/:token/redeem), and plain base64's `/` and `+`
    // would break path matching in an emailed invitation link.
    const token = crypto.randomBytes(32).toString('base64url');
    const now = new Date();
    const createdAt = now.toISOString();
    const expiresAt = new Date(now.getTime() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const invitation: Invitation = {
      id: generateId('inv'),
      token,
      email,
      created_by_user_id: createdByUserId,
      expires_at: expiresAt,
      created_at: createdAt,
    };

    this.invitations.create(invitation);

    return { token, expiresAt };
  }

  /**
   * Redeems an invitation token, creating a new user account. Throws
   * InvitationError on any validation failure. Never includes the raw
   * token in an error message.
   */
  redeemInvitation(token: string, name: string, password: string): RedeemInvitationResponse {
    const invitation = this.invitations.findByToken(token);
    if (!invitation) {
      throw new InvitationError('TOKEN_NOT_FOUND', 'Invitation token not found');
    }

    if (invitation.redeemed_at) {
      throw new InvitationError('TOKEN_REDEEMED', 'Invitation has already been redeemed');
    }

    const nowIso = new Date().toISOString();
    if (invitation.expires_at <= nowIso) {
      throw new InvitationError('TOKEN_EXPIRED', 'Invitation has expired');
    }

    if (typeof name !== 'string' || name.trim().length === 0) {
      throw new InvitationError('INVALID_NAME', 'Name is required');
    }

    if (typeof password !== 'string' || password.length < 8) {
      throw new InvitationError('INVALID_PASSWORD', 'Password does not meet requirements');
    }

    if (!hasUpper(password) || !hasLower(password) || !hasDigit(password)) {
      throw new InvitationError(
        'WEAK_PASSWORD',
        'Password must contain uppercase, lowercase, and digits'
      );
    }

    if (this.users.findByEmail(invitation.email)) {
      throw new InvitationError('EMAIL_EXISTS', 'Email is already registered');
    }

    const password_hash = hashPassword(password);
    const user = this.users.create({
      email: invitation.email,
      name: name.trim(),
      password_hash,
    });

    this.invitations.markRedeemed(token, user.id);

    return {
      user: { id: user.id, email: user.email, name: user.name },
      message: 'Account created successfully',
    };
  }

  /** Returns all currently-pending (not redeemed, not expired) invitations. */
  listPendingInvitations(): Invitation[] {
    return this.invitations.listPending();
  }
}

export const invitationService = new InvitationService();
