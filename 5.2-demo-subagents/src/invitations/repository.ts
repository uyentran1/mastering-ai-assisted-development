/**
 * In-memory repository for invitations.
 *
 * In production, this would connect to a database.
 */

import { Invitation } from './types';

export class InvitationRepository {
  private invitations: Invitation[] = [];

  async findByToken(token: string): Promise<Invitation | null> {
    return this.invitations.find(inv => inv.token === token) || null;
  }

  async findByEmail(email: string): Promise<Invitation | null> {
    return this.invitations.find(inv => inv.email === email) || null;
  }

  async findAll(): Promise<Invitation[]> {
    return [...this.invitations];
  }

  async findPending(): Promise<Invitation[]> {
    return this.invitations.filter(inv => !inv.redeemed_at);
  }

  async create(invitation: Omit<Invitation, 'id'>): Promise<Invitation> {
    const id = `inv-${Date.now()}`;
    const newInvitation: Invitation = {
      id,
      ...invitation,
    };
    this.invitations.push(newInvitation);
    return newInvitation;
  }

  async updateRedeemed(
    id: string,
    redeemed_by_user_id: string,
  ): Promise<Invitation> {
    const invitation = this.invitations.find(inv => inv.id === id);
    if (!invitation) {
      throw new Error(`Invitation ${id} not found`);
    }

    invitation.redeemed_at = new Date().toISOString();
    invitation.redeemed_by_user_id = redeemed_by_user_id;

    return invitation;
  }

  async delete(id: string): Promise<void> {
    const index = this.invitations.findIndex(inv => inv.id === id);
    if (index !== -1) {
      this.invitations.splice(index, 1);
    }
  }
}
