/**
 * Tests for the invitations feature
 */

import { InvitationService } from '../src/invitations/service';
import { InvitationRepository } from '../src/invitations/repository';

describe('InvitationService', () => {
  let service: InvitationService;
  let repository: InvitationRepository;

  beforeEach(() => {
    repository = new InvitationRepository();
    service = new InvitationService(repository);
  });

  describe('createInvitation', () => {
    it('generates a valid invitation', async () => {
      const result = await service.createInvitation(
        'test@example.com',
        'user-1',
      );

      expect(Array.isArray(result)).toBe(false);
      expect(result).toHaveProperty('token');
      expect(result).toHaveProperty('expiresAt');
      expect((result as any).token).toBeTruthy();
    });

    it('rejects invalid email format', async () => {
      const result = await service.createInvitation('not-an-email', 'user-1');

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].field).toBe('email');
    });

    it('rejects empty email', async () => {
      const result = await service.createInvitation('', 'user-1');

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].field).toBe('email');
    });

    it('prevents duplicate pending invitations', async () => {
      await service.createInvitation('test@example.com', 'user-1');
      const result = await service.createInvitation('test@example.com', 'user-1');

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].message).toContain('Pending invitation');
    });
  });

  describe('redeemInvitation', () => {
    it('redeems a valid invitation', async () => {
      const invResult = await service.createInvitation(
        'newuser@example.com',
        'user-1',
      );
      const token = (invResult as any).token;

      const redeemResult = await service.redeemInvitation(
        token,
        'New User',
        'SecurePass123',
      );

      expect(Array.isArray(redeemResult)).toBe(false);
      expect((redeemResult as any).user).toHaveProperty('id');
      expect((redeemResult as any).user.email).toBe('newuser@example.com');
      expect((redeemResult as any).user.name).toBe('New User');
    });

    it('rejects invalid token', async () => {
      const result = await service.redeemInvitation(
        'invalid-token',
        'New User',
        'SecurePass123',
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].message).toContain('not found');
    });

    it('rejects redeemed token', async () => {
      const invResult = await service.createInvitation(
        'newuser@example.com',
        'user-1',
      );
      const token = (invResult as any).token;

      await service.redeemInvitation(token, 'New User', 'SecurePass123');
      const secondAttempt = await service.redeemInvitation(
        token,
        'Another User',
        'SecurePass123',
      );

      expect(Array.isArray(secondAttempt)).toBe(true);
      expect((secondAttempt as any)[0].message).toContain('already been redeemed');
    });

    it('rejects weak password', async () => {
      const invResult = await service.createInvitation(
        'newuser@example.com',
        'user-1',
      );
      const token = (invResult as any).token;

      const result = await service.redeemInvitation(
        token,
        'New User',
        'weak',
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any).some((e: any) => e.field === 'password')).toBe(true);
    });

    it('rejects password without uppercase', async () => {
      const invResult = await service.createInvitation(
        'newuser@example.com',
        'user-1',
      );
      const token = (invResult as any).token;

      const result = await service.redeemInvitation(
        token,
        'New User',
        'securepass123',
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any).some((e: any) => e.field === 'password')).toBe(true);
    });

    it('rejects empty name', async () => {
      const invResult = await service.createInvitation(
        'newuser@example.com',
        'user-1',
      );
      const token = (invResult as any).token;

      const result = await service.redeemInvitation(
        token,
        '',
        'SecurePass123',
      );

      expect(Array.isArray(result)).toBe(true);
      expect((result as any)[0].field).toBe('name');
    });
  });

  describe('listPendingInvitations', () => {
    it('returns only pending invitations', async () => {
      const inv1 = await service.createInvitation('user1@example.com', 'user-1');
      const inv2 = await service.createInvitation('user2@example.com', 'user-1');

      // Redeem one
      const token1 = (inv1 as any).token;
      await service.redeemInvitation(token1, 'User 1', 'SecurePass123');

      // List pending
      const pending = await service.listPendingInvitations();

      expect(pending).toHaveLength(1);
      expect(pending[0].email).toBe('user2@example.com');
    });
  });

  describe('revokeInvitation', () => {
    it('revokes an invitation', async () => {
      const result = await service.createInvitation('user@example.com', 'user-1');
      const token = (result as any).token;

      const success = await service.revokeInvitation(token);
      expect(success).toBe(true);

      // Try to use revoked token
      const redeemResult = await service.redeemInvitation(
        token,
        'User',
        'SecurePass123',
      );
      expect(Array.isArray(redeemResult)).toBe(true);
      expect((redeemResult as any)[0].message).toContain('not found');
    });
  });

  describe('resendInvitation', () => {
    it('generates new token for existing email', async () => {
      const inv1 = await service.createInvitation('user@example.com', 'user-1');
      const token1 = (inv1 as any).token;

      const inv2 = await service.resendInvitation('user@example.com', 'user-1');
      const token2 = (inv2 as any).token;

      // Old token should no longer work
      const redeemOld = await service.redeemInvitation(
        token1,
        'User',
        'SecurePass123',
      );
      expect(Array.isArray(redeemOld)).toBe(true);

      // New token should work
      const redeemNew = await service.redeemInvitation(
        token2,
        'User',
        'SecurePass123',
      );
      expect(Array.isArray(redeemNew)).toBe(false);
    });
  });
});
