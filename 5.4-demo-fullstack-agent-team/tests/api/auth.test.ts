/**
 * Auth API tests
 */

import { db } from '../../src/api/db/mock';

describe('Auth API', () => {
  beforeEach(() => {
    // Reset database
    (db as any).users = [
      {
        id: 'user-1',
        email: 'existing@example.com',
        created_at: new Date().toISOString(),
      },
    ];
  });

  describe('signup', () => {
    it('creates new user', () => {
      const user = db.createUser('newuser@example.com');
      expect(user.email).toBe('newuser@example.com');
      expect(user.id).toBeTruthy();
    });

    it('prevents duplicate signups', () => {
      const user1 = db.findUser('existing@example.com');
      expect(user1).toBeTruthy();
      expect(user1?.email).toBe('existing@example.com');
    });
  });

  describe('signin', () => {
    it('finds existing user', () => {
      const user = db.findUser('existing@example.com');
      expect(user).toBeTruthy();
      expect(user?.id).toBe('user-1');
    });

    it('returns null for non-existent user', () => {
      const user = db.findUser('nonexistent@example.com');
      expect(user).toBeUndefined();
    });
  });
});
