import { InvitationRepository, UserRepository } from '../src/invitations/repository';
import { Invitation } from '../src/invitations/types';

function makeInvitation(overrides: Partial<Invitation> = {}): Invitation {
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return {
    id: overrides.id ?? `inv_${Math.random().toString(36).slice(2, 10)}`,
    token: overrides.token ?? `token_${Math.random().toString(36).slice(2, 10)}`,
    email: overrides.email ?? 'alice@example.com',
    created_by_user_id: overrides.created_by_user_id ?? 'user_1',
    redeemed_at: overrides.redeemed_at,
    redeemed_by_user_id: overrides.redeemed_by_user_id,
    expires_at: overrides.expires_at ?? expires.toISOString(),
    created_at: overrides.created_at ?? now.toISOString(),
  };
}

describe('InvitationRepository', () => {
  let repo: InvitationRepository;

  beforeEach(() => {
    repo = new InvitationRepository();
  });

  afterEach(() => {
    repo.clear();
  });

  describe('create', () => {
    it('creates and returns the invitation', () => {
      const invitation = makeInvitation();
      const created = repo.create(invitation);
      expect(created).toEqual(invitation);
    });

    it('throws on duplicate token', () => {
      const invitation = makeInvitation({ token: 'dup-token' });
      repo.create(invitation);
      const dup = makeInvitation({ id: 'other-id', token: 'dup-token' });
      expect(() => repo.create(dup)).toThrow();
    });

    it('throws on duplicate id', () => {
      const invitation = makeInvitation({ id: 'dup-id' });
      repo.create(invitation);
      const dup = makeInvitation({ id: 'dup-id', token: 'unique-token' });
      expect(() => repo.create(dup)).toThrow();
    });

    it('returns a copy, not a live reference', () => {
      const invitation = makeInvitation();
      const created = repo.create(invitation);
      created.email = 'mutated@example.com';
      const fetched = repo.findById(invitation.id);
      expect(fetched?.email).toBe(invitation.email);
    });
  });

  describe('findById', () => {
    it('returns the invitation when found', () => {
      const invitation = makeInvitation();
      repo.create(invitation);
      expect(repo.findById(invitation.id)).toEqual(invitation);
    });

    it('returns null when not found', () => {
      expect(repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('findByToken', () => {
    it('returns the invitation when found', () => {
      const invitation = makeInvitation();
      repo.create(invitation);
      expect(repo.findByToken(invitation.token)).toEqual(invitation);
    });

    it('returns null when not found', () => {
      expect(repo.findByToken('nonexistent-token')).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('returns all invitations for an email', () => {
      const inv1 = makeInvitation({ id: 'a', token: 't1', email: 'bob@example.com' });
      const inv2 = makeInvitation({ id: 'b', token: 't2', email: 'bob@example.com' });
      const inv3 = makeInvitation({ id: 'c', token: 't3', email: 'other@example.com' });
      repo.create(inv1);
      repo.create(inv2);
      repo.create(inv3);

      const results = repo.findByEmail('bob@example.com');
      expect(results).toHaveLength(2);
      expect(results.map((r) => r.id).sort()).toEqual(['a', 'b']);
    });

    it('returns an empty array when none found', () => {
      expect(repo.findByEmail('nobody@example.com')).toEqual([]);
    });

    it('matches case-insensitively while preserving the stored casing', () => {
      repo.create(makeInvitation({ id: 'ci', token: 'tci', email: 'Mixed.Case@Example.com' }));

      expect(repo.findByEmail('mixed.case@example.com')).toHaveLength(1);
      expect(repo.findByEmail('MIXED.CASE@EXAMPLE.COM')).toHaveLength(1);
      expect(repo.findByEmail('Mixed.Case@Example.com')[0].email).toBe('Mixed.Case@Example.com');
    });
  });

  describe('findPendingByEmail', () => {
    it('returns a pending invitation (not redeemed, not expired)', () => {
      const invitation = makeInvitation({ email: 'pending@example.com' });
      repo.create(invitation);
      expect(repo.findPendingByEmail('pending@example.com')).toEqual(invitation);
    });

    it('returns null when the only invitation is redeemed', () => {
      const invitation = makeInvitation({
        email: 'redeemed@example.com',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: 'user_2',
      });
      repo.create(invitation);
      expect(repo.findPendingByEmail('redeemed@example.com')).toBeNull();
    });

    it('returns null when the only invitation is expired', () => {
      const past = new Date(Date.now() - 1000).toISOString();
      const invitation = makeInvitation({ email: 'expired@example.com', expires_at: past });
      repo.create(invitation);
      expect(repo.findPendingByEmail('expired@example.com')).toBeNull();
    });

    it('returns null when no invitations exist for the email', () => {
      expect(repo.findPendingByEmail('unknown@example.com')).toBeNull();
    });
  });

  describe('findPendingByUser', () => {
    it('returns only pending invitations created by the user', () => {
      const pending = makeInvitation({ id: 'p1', token: 'tp1', created_by_user_id: 'user_1' });
      const redeemed = makeInvitation({
        id: 'p2',
        token: 'tp2',
        created_by_user_id: 'user_1',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: 'user_9',
      });
      const expired = makeInvitation({
        id: 'p3',
        token: 'tp3',
        created_by_user_id: 'user_1',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      });
      const otherUser = makeInvitation({ id: 'p4', token: 'tp4', created_by_user_id: 'user_2' });

      repo.create(pending);
      repo.create(redeemed);
      repo.create(expired);
      repo.create(otherUser);

      const results = repo.findPendingByUser('user_1');
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('p1');
    });

    it('returns an empty array when the user has no pending invitations', () => {
      expect(repo.findPendingByUser('user_without_invites')).toEqual([]);
    });
  });

  describe('markRedeemed', () => {
    it('sets redeemed_at and redeemed_by_user_id', () => {
      const invitation = makeInvitation();
      repo.create(invitation);

      const updated = repo.markRedeemed(invitation.token, 'user_new');
      expect(updated).not.toBeNull();
      expect(updated?.redeemed_by_user_id).toBe('user_new');
      expect(updated?.redeemed_at).toBeDefined();

      const fetched = repo.findById(invitation.id);
      expect(fetched?.redeemed_by_user_id).toBe('user_new');
    });

    it('returns null when the token does not exist', () => {
      expect(repo.markRedeemed('nonexistent-token', 'user_new')).toBeNull();
    });
  });

  describe('update', () => {
    it('applies a partial update and returns the updated invitation', () => {
      const invitation = makeInvitation();
      repo.create(invitation);

      const newExpiry = new Date(Date.now() + 1000000).toISOString();
      const updated = repo.update(invitation.id, { expires_at: newExpiry });

      expect(updated?.expires_at).toBe(newExpiry);
      expect(repo.findById(invitation.id)?.expires_at).toBe(newExpiry);
    });

    it('returns null when the invitation does not exist', () => {
      expect(repo.update('nonexistent', { expires_at: new Date().toISOString() })).toBeNull();
    });

    it('keeps the token index in sync when the token changes', () => {
      const invitation = makeInvitation({ token: 'old-token' });
      repo.create(invitation);

      repo.update(invitation.id, { token: 'new-token' });

      expect(repo.findByToken('old-token')).toBeNull();
      expect(repo.findByToken('new-token')?.id).toBe(invitation.id);
    });

    it('throws when updating to a token already in use by another record', () => {
      const inv1 = makeInvitation({ id: 'a', token: 't1' });
      const inv2 = makeInvitation({ id: 'b', token: 't2' });
      repo.create(inv1);
      repo.create(inv2);

      expect(() => repo.update('b', { token: 't1' })).toThrow();
    });
  });

  describe('delete', () => {
    it('deletes an existing invitation and returns true', () => {
      const invitation = makeInvitation();
      repo.create(invitation);

      expect(repo.delete(invitation.id)).toBe(true);
      expect(repo.findById(invitation.id)).toBeNull();
      expect(repo.findByToken(invitation.token)).toBeNull();
      expect(repo.findByEmail(invitation.email)).toEqual([]);
    });

    it('returns false when the invitation does not exist', () => {
      expect(repo.delete('nonexistent')).toBe(false);
    });
  });

  describe('list / listPending', () => {
    it('list returns all invitations', () => {
      repo.create(makeInvitation({ id: 'a', token: 'ta' }));
      repo.create(makeInvitation({ id: 'b', token: 'tb' }));
      expect(repo.list()).toHaveLength(2);
    });

    it('listPending excludes redeemed and expired invitations', () => {
      const pending = makeInvitation({ id: 'a', token: 'ta' });
      const redeemed = makeInvitation({
        id: 'b',
        token: 'tb',
        redeemed_at: new Date().toISOString(),
        redeemed_by_user_id: 'user_2',
      });
      const expired = makeInvitation({
        id: 'c',
        token: 'tc',
        expires_at: new Date(Date.now() - 1000).toISOString(),
      });

      repo.create(pending);
      repo.create(redeemed);
      repo.create(expired);

      const results = repo.listPending();
      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('a');
    });
  });

  describe('clear', () => {
    it('resets all stored state', () => {
      const invitation = makeInvitation();
      repo.create(invitation);
      repo.clear();

      expect(repo.list()).toEqual([]);
      expect(repo.findById(invitation.id)).toBeNull();
      expect(repo.findByToken(invitation.token)).toBeNull();
    });
  });
});

describe('UserRepository', () => {
  let repo: UserRepository;

  beforeEach(() => {
    repo = new UserRepository();
  });

  afterEach(() => {
    repo.clear();
  });

  describe('create', () => {
    it('creates and returns a user with a generated id and created_at', () => {
      const user = repo.create({
        email: 'carol@example.com',
        name: 'Carol',
        password_hash: 'hashed-password',
      });

      expect(user.id).toBeDefined();
      expect(user.created_at).toBeDefined();
      expect(user.email).toBe('carol@example.com');
      expect(user.name).toBe('Carol');
      expect(user.password_hash).toBe('hashed-password');
    });

    it('throws on duplicate email', () => {
      repo.create({ email: 'dup@example.com', name: 'A', password_hash: 'x' });
      expect(() =>
        repo.create({ email: 'dup@example.com', name: 'B', password_hash: 'y' })
      ).toThrow();
    });

    it('returns a copy, not a live reference', () => {
      const user = repo.create({ email: 'dave@example.com', name: 'Dave', password_hash: 'x' });
      user.name = 'Mutated';
      const fetched = repo.findById(user.id);
      expect(fetched?.name).toBe('Dave');
    });
  });

  describe('findByEmail', () => {
    it('returns the user when found', () => {
      const user = repo.create({ email: 'erin@example.com', name: 'Erin', password_hash: 'x' });
      expect(repo.findByEmail('erin@example.com')).toEqual(user);
    });

    it('returns null when not found', () => {
      expect(repo.findByEmail('nobody@example.com')).toBeNull();
    });

    it('matches case-insensitively', () => {
      const user = repo.create({ email: 'Grace@Example.com', name: 'Grace', password_hash: 'x' });
      expect(repo.findByEmail('grace@example.com')).toEqual(user);
      expect(repo.findByEmail('GRACE@EXAMPLE.COM')).toEqual(user);
    });

    it('rejects a duplicate registration that differs only by case', () => {
      repo.create({ email: 'heidi@example.com', name: 'Heidi', password_hash: 'x' });
      expect(() =>
        repo.create({ email: 'Heidi@Example.com', name: 'Heidi Again', password_hash: 'y' })
      ).toThrow(/already exists/);
    });
  });

  describe('findById', () => {
    it('returns the user when found', () => {
      const user = repo.create({ email: 'frank@example.com', name: 'Frank', password_hash: 'x' });
      expect(repo.findById(user.id)).toEqual(user);
    });

    it('returns null when not found', () => {
      expect(repo.findById('nonexistent')).toBeNull();
    });
  });

  describe('clear', () => {
    it('resets all stored state', () => {
      const user = repo.create({ email: 'gina@example.com', name: 'Gina', password_hash: 'x' });
      repo.clear();
      expect(repo.findById(user.id)).toBeNull();
      expect(repo.findByEmail('gina@example.com')).toBeNull();
    });
  });
});
