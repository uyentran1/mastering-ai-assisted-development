/**
 * Bead 3: Deduplicator tests
 * Run: npm run test:bead3
 */
import { deduplicateUsers } from '../src/deduplicator';
import { User } from '../src/types';

describe('Bead 3: Deduplicator', () => {
  it('returns unique users unchanged', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });

  it('removes duplicates by email (case-insensitive)', () => {
    const users: User[] = [
      { name: 'Alice v1', email: 'alice@example.com', role: 'viewer' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
      { name: 'Alice v2', email: 'ALICE@example.com', role: 'admin' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(2);
    expect(result.duplicates).toHaveLength(1);
  });

  it('keeps the LAST occurrence', () => {
    const users: User[] = [
      { name: 'Alice v1', email: 'alice@example.com', role: 'viewer' },
      { name: 'Alice v2', email: 'alice@example.com', role: 'admin' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique[0].name).toBe('Alice v2');
    expect(result.unique[0].role).toBe('admin');
  });

  it('handles empty array', () => {
    const result = deduplicateUsers([]);
    expect(result.unique).toEqual([]);
    expect(result.duplicates).toEqual([]);
  });
});
