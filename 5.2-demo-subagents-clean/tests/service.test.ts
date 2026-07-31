import { InvitationRepository, UserRepository } from '../src/invitations/repository';
import {
  InvitationService,
  InvitationError,
  DEFAULT_EXPIRY_DAYS,
  MAX_PENDING_INVITATIONS_PER_USER,
} from '../src/invitations/service';

describe('InvitationService', () => {
  let invitationRepo: InvitationRepository;
  let userRepo: UserRepository;
  let service: InvitationService;

  beforeEach(() => {
    invitationRepo = new InvitationRepository();
    userRepo = new UserRepository();
    service = new InvitationService(invitationRepo, userRepo);
  });

  const VALID_PASSWORD = 'Sup3rSecret';

  describe('createInvitation', () => {
    it('happy path: generates a token and expiry ~7 days out', () => {
      const before = Date.now();
      const result = service.createInvitation('alice@example.com', 'user_1');
      const after = Date.now();

      expect(result.token).toBeTruthy();
      expect(typeof result.expiresAt).toBe('string');

      const expiresAtMs = new Date(result.expiresAt).getTime();
      const expectedMin = before + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000 - 1000;
      const expectedMax = after + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000 + 1000;
      expect(expiresAtMs).toBeGreaterThanOrEqual(expectedMin);
      expect(expiresAtMs).toBeLessThanOrEqual(expectedMax);

      const stored = invitationRepo.findByToken(result.token);
      expect(stored).not.toBeNull();
      expect(stored?.email).toBe('alice@example.com');
      expect(stored?.created_by_user_id).toBe('user_1');
    });

    it('produces a 32-byte base64url token', () => {
      const result = service.createInvitation('bob@example.com', 'user_1');
      const decoded = Buffer.from(result.token, 'base64url');
      expect(decoded.length).toBe(32);
    });

    it('produces tokens that are safe to embed raw in a URL path', () => {
      // Regression guard: plain base64 tokens contain `/` roughly half the
      // time, which silently breaks the redeem route for emailed links.
      for (let i = 0; i < 200; i++) {
        const result = service.createInvitation(`urlsafe${i}@example.com`, `creator_${i}`);
        expect(result.token).toMatch(/^[A-Za-z0-9_-]+$/);
        expect(encodeURIComponent(result.token)).toBe(result.token);
      }
    });

    it('produces unique tokens across calls', () => {
      const tokens = new Set<string>();
      for (let i = 0; i < 10; i++) {
        const result = service.createInvitation(`user${i}@example.com`, `creator_${i}`);
        tokens.add(result.token);
      }
      expect(tokens.size).toBe(10);
    });

    it('rejects invalid email format', () => {
      expect(() => service.createInvitation('not-an-email', 'user_1')).toThrow(InvitationError);
      try {
        service.createInvitation('not-an-email', 'user_1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('INVALID_EMAIL');
        expect((err as InvitationError).status).toBe(400);
      }
    });

    it('rejects when email is already registered', () => {
      userRepo.create({ email: 'taken@example.com', name: 'Taken', password_hash: 'x' });

      try {
        service.createInvitation('taken@example.com', 'user_1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('EMAIL_EXISTS');
      }
    });

    it('rejects duplicate pending invitation for the same email', () => {
      service.createInvitation('dup@example.com', 'user_1');

      try {
        service.createInvitation('dup@example.com', 'user_2');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('EMAIL_EXISTS');
      }
    });

    it('allows a new invite for an email whose prior invite already expired', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      invitationRepo.create({
        id: 'inv_expired',
        token: 'expired-token',
        email: 'reinvite@example.com',
        created_by_user_id: 'user_1',
        expires_at: past,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      });

      expect(() => service.createInvitation('reinvite@example.com', 'user_2')).not.toThrow();
    });

    it('rate limits after 5 pending invitations for the same user', () => {
      for (let i = 0; i < MAX_PENDING_INVITATIONS_PER_USER; i++) {
        service.createInvitation(`invitee${i}@example.com`, 'user_rate');
      }

      try {
        service.createInvitation('invitee-overflow@example.com', 'user_rate');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('RATE_LIMITED');
        expect((err as InvitationError).status).toBe(429);
      }
    });

    it('does not rate limit a different user', () => {
      for (let i = 0; i < MAX_PENDING_INVITATIONS_PER_USER; i++) {
        service.createInvitation(`inviteeA${i}@example.com`, 'user_rate_a');
      }
      expect(() =>
        service.createInvitation('inviteeB@example.com', 'user_rate_b')
      ).not.toThrow();
    });
  });

  describe('redeemInvitation', () => {
    function createPending(email = 'redeem@example.com', createdBy = 'user_1') {
      return service.createInvitation(email, createdBy);
    }

    it('happy path: redeems and creates a user, never returning the password', () => {
      const { token } = createPending();
      const result = service.redeemInvitation(token, 'Redeemed Person', VALID_PASSWORD);

      expect(result.user.email).toBe('redeem@example.com');
      expect(result.user.name).toBe('Redeemed Person');
      expect(typeof result.user.id).toBe('string');
      expect(typeof result.message).toBe('string');

      // Password / hash must never appear anywhere in the response.
      const serialized = JSON.stringify(result);
      expect(serialized).not.toContain(VALID_PASSWORD);
      expect(Object.keys(result.user).sort()).toEqual(['email', 'id', 'name']);

      const storedUser = userRepo.findByEmail('redeem@example.com');
      expect(storedUser).not.toBeNull();
      expect(storedUser?.password_hash).not.toBe(VALID_PASSWORD);
      expect(storedUser?.password_hash).toContain(':');

      const invitation = invitationRepo.findByToken(token);
      expect(invitation?.redeemed_at).toBeTruthy();
      expect(invitation?.redeemed_by_user_id).toBe(storedUser?.id);
    });

    it('rejects an unknown token', () => {
      try {
        service.redeemInvitation('does-not-exist', 'Name', VALID_PASSWORD);
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('TOKEN_NOT_FOUND');
        expect((err as InvitationError).status).toBe(404);
        expect((err as InvitationError).message).not.toContain('does-not-exist');
      }
    });

    it('rejects an expired token', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      invitationRepo.create({
        id: 'inv_expired_2',
        token: 'expired-token-2',
        email: 'expired@example.com',
        created_by_user_id: 'user_1',
        expires_at: past,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      });

      try {
        service.redeemInvitation('expired-token-2', 'Name', VALID_PASSWORD);
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('TOKEN_EXPIRED');
      }
    });

    it('rejects a previously redeemed token', () => {
      const { token } = createPending();
      service.redeemInvitation(token, 'First User', VALID_PASSWORD);

      try {
        service.redeemInvitation(token, 'Second User', 'AnotherPass1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('TOKEN_REDEEMED');
      }
    });

    it('rejects an empty/whitespace-only name', () => {
      const { token } = createPending('nameless@example.com');
      try {
        service.redeemInvitation(token, '   ', VALID_PASSWORD);
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('INVALID_NAME');
      }
    });

    it('rejects a password shorter than 8 characters', () => {
      const { token } = createPending('shortpw@example.com');
      try {
        service.redeemInvitation(token, 'Name', 'Ab1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('INVALID_PASSWORD');
      }
    });

    it('rejects a password missing an uppercase letter', () => {
      const { token } = createPending('noupper@example.com');
      try {
        service.redeemInvitation(token, 'Name', 'lowercase1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('WEAK_PASSWORD');
      }
    });

    it('rejects a password missing a lowercase letter', () => {
      const { token } = createPending('nolower@example.com');
      try {
        service.redeemInvitation(token, 'Name', 'UPPERCASE1');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('WEAK_PASSWORD');
      }
    });

    it('rejects a password missing a digit', () => {
      const { token } = createPending('nodigit@example.com');
      try {
        service.redeemInvitation(token, 'Name', 'NoDigitsHere');
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('WEAK_PASSWORD');
      }
    });

    it('rejects redemption when the email was registered after the invite was created', () => {
      const { token } = createPending('racedemail@example.com');
      userRepo.create({ email: 'racedemail@example.com', name: 'Already', password_hash: 'x' });

      try {
        service.redeemInvitation(token, 'Name', VALID_PASSWORD);
        fail('expected throw');
      } catch (err) {
        expect(err).toBeInstanceOf(InvitationError);
        expect((err as InvitationError).code).toBe('EMAIL_EXISTS');
      }
    });
  });

  describe('listPendingInvitations', () => {
    it('returns only pending (unredeemed, unexpired) invitations', () => {
      const { token: pendingToken } = service.createInvitation('pending@example.com', 'user_1');
      const { token: redeemedToken } = service.createInvitation('willredeem@example.com', 'user_1');
      service.redeemInvitation(redeemedToken, 'Name', VALID_PASSWORD);

      const past = new Date(Date.now() - 1000).toISOString();
      invitationRepo.create({
        id: 'inv_expired_3',
        token: 'expired-token-3',
        email: 'expiredlist@example.com',
        created_by_user_id: 'user_1',
        expires_at: past,
        created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
      });

      const pending = service.listPendingInvitations();
      const tokens = pending.map((inv) => inv.token);
      expect(tokens).toContain(pendingToken);
      expect(tokens).not.toContain(redeemedToken);
      expect(tokens).not.toContain('expired-token-3');
    });
  });
});
