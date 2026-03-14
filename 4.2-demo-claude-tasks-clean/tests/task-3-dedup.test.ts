/**
 * Task 3: Deduplicator Tests
 *
 * All tests must pass to complete the Claude Tasks demo.
 * Run with: npm run test:task3
 */

import { deduplicateUsers } from '../src/deduplicator';
import { User } from '../src/types';

describe('Task 3: Deduplicator', () => {
  it('returns all users when no duplicates', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(2);
    expect(result.duplicates).toHaveLength(0);
  });

  it('keeps last occurrence when duplicates found', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Alice V2', email: 'alice@example.com', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(1);
    expect(result.unique[0]).toEqual({
      name: 'Alice V2',
      email: 'alice@example.com',
      role: 'editor',
    });
    expect(result.duplicates).toHaveLength(1);
    expect(result.duplicates[0].name).toBe('Alice');
  });

  it('matches emails case-insensitively', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Alice V2', email: 'ALICE@EXAMPLE.COM', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(1);
    expect(result.duplicates).toHaveLength(1);
  });

  it('preserves original email case in output', () => {
    const users: User[] = [
      { name: 'Alice', email: 'Alice@Example.Com', role: 'admin' },
      { name: 'Alice V2', email: 'alice@EXAMPLE.com', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique[0].email).toBe('alice@EXAMPLE.com');
  });

  it('handles multiple duplicates', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Alice V2', email: 'alice@example.com', role: 'editor' },
      { name: 'Alice V3', email: 'ALICE@EXAMPLE.COM', role: 'viewer' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(2);
    expect(result.unique[0].name).toBe('Alice V3');
    expect(result.unique[1].name).toBe('Bob');
    expect(result.duplicates).toHaveLength(2);
  });

  it('maintains order of unique users', () => {
    const users: User[] = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
      { name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
      { name: 'Bob V2', email: 'bob@example.com', role: 'admin' },
    ];
    const result = deduplicateUsers(users);
    expect(result.unique).toHaveLength(3);
    expect(result.unique.map(u => u.name)).toEqual(['Alice', 'Charlie', 'Bob V2']);
  });

  it('handles empty list', () => {
    const result = deduplicateUsers([]);
    expect(result.unique).toHaveLength(0);
    expect(result.duplicates).toHaveLength(0);
  });
});
