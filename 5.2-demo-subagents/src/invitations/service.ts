/**
 * Service layer for managing invitations.
 *
 * Handles business logic:
 * - Generating tokens
 * - Validating requests
 * - Managing invitation state
 * - Creating users on redemption
 */

import { randomBytes } from 'crypto';
import { InvitationRepository } from './repository';
import { Invitation, GenerateInvitationResponse, RedeemInvitationResponse } from './types';
import {
  validateInvitationRequest,
  validateRedemptionRequest,
  isTokenExpired,
  ValidationError,
} from './validation';

export class InvitationService {
  private repository: InvitationRepository;
  // In-memory user store (in production, would use real user database)
  private users: Map<string, { id: string; email: string; name: string }> = new Map();
  private invitationExpiryDays = 7;

  constructor(repository?: InvitationRepository) {
    this.repository = repository || new InvitationRepository();
  }

  /**
   * Generate a new invitation token
   */
  async createInvitation(
    email: string,
    createdByUserId: string,
  ): Promise<GenerateInvitationResponse | ValidationError[]> {
    // Validate email
    const validationErrors = validateInvitationRequest(email);
    if (validationErrors.length > 0) {
      return validationErrors;
    }

    // Check if email already registered
    const existingUser = Array.from(this.users.values()).find(
      u => u.email.toLowerCase() === email.toLowerCase(),
    );
    if (existingUser) {
      return [{ field: 'email', message: 'Email is already registered' }];
    }

    // Check for pending invitation
    const existingInvitation = await this.repository.findByEmail(email);
    if (existingInvitation && !existingInvitation.redeemed_at) {
      return [{ field: 'email', message: 'Pending invitation already exists for this email' }];
    }

    // Generate token
    const token = randomBytes(32).toString('base64url');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.invitationExpiryDays);

    // Create invitation
    const invitation = await this.repository.create({
      token,
      email: email.toLowerCase(),
      created_by_user_id: createdByUserId,
      expires_at: expiresAt.toISOString(),
      created_at: new Date().toISOString(),
    });

    return {
      token: invitation.token,
      expiresAt: invitation.expires_at,
    };
  }

  /**
   * Redeem an invitation to create a new user
   */
  async redeemInvitation(
    token: string,
    name: string,
    password: string,
  ): Promise<RedeemInvitationResponse | ValidationError[]> {
    // Validate inputs
    const validationErrors = validateRedemptionRequest(name, password);
    if (validationErrors.length > 0) {
      return validationErrors;
    }

    // Find invitation
    const invitation = await this.repository.findByToken(token);
    if (!invitation) {
      return [{ field: 'token', message: 'Invitation token not found' }];
    }

    // Check if already redeemed
    if (invitation.redeemed_at) {
      return [{ field: 'token', message: 'Invitation has already been redeemed' }];
    }

    // Check if expired
    if (isTokenExpired(invitation.expires_at)) {
      return [{ field: 'token', message: 'Invitation has expired' }];
    }

    // Create user
    const userId = `user-${Date.now()}`;
    this.users.set(userId, {
      id: userId,
      email: invitation.email,
      name: name.trim(),
    });

    // Mark invitation as redeemed
    await this.repository.updateRedeemed(invitation.id, userId);

    return {
      user: {
        id: userId,
        email: invitation.email,
        name: name.trim(),
      },
      message: 'Account created successfully',
    };
  }

  /**
   * List pending invitations
   */
  async listPendingInvitations(): Promise<Invitation[]> {
    return this.repository.findPending();
  }

  /**
   * Revoke an invitation
   */
  async revokeInvitation(token: string): Promise<boolean> {
    const invitation = await this.repository.findByToken(token);
    if (!invitation) {
      return false;
    }

    await this.repository.delete(invitation.id);
    return true;
  }

  /**
   * Resend an invitation (generates new token)
   */
  async resendInvitation(
    email: string,
    createdByUserId: string,
  ): Promise<GenerateInvitationResponse | ValidationError[]> {
    // Find and revoke old invitation
    const oldInvitation = await this.repository.findByEmail(email);
    if (oldInvitation) {
      await this.repository.delete(oldInvitation.id);
    }

    // Create new invitation
    return this.createInvitation(email, createdByUserId);
  }
}
