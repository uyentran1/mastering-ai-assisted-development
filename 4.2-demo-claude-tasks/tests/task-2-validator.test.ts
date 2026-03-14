/**
 * Task 2: Validator Tests
 *
 * All tests must pass before moving to Task 3.
 * Run with: npm run test:task2
 */

import { validateUsers } from '../src/validator';

describe('Task 2: Validator', () => {
  it('validates correct users', () => {
    const users = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    ];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(0);
  });

  it('rejects invalid email format', () => {
    const users = [{ name: 'Alice', email: 'not-an-email', role: 'admin' }];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Invalid email format');
  });

  it('rejects invalid role', () => {
    const users = [{ name: 'Alice', email: 'alice@example.com', role: 'superuser' }];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Role must be one of: admin, editor, viewer');
  });

  it('rejects empty name', () => {
    const users = [{ name: '', email: 'alice@example.com', role: 'admin' }];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Name is required');
  });

  it('collects multiple errors for a user', () => {
    const users = [{ name: '', email: 'invalid', role: 'superuser' }];
    const result = validateUsers(users);
    expect(result.invalid[0].errors).toHaveLength(3);
    expect(result.invalid[0].errors).toContain('Name is required');
    expect(result.invalid[0].errors).toContain('Invalid email format');
    expect(result.invalid[0].errors).toContain('Role must be one of: admin, editor, viewer');
  });

  it('handles mixed valid and invalid users', () => {
    const users = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: '', email: 'bob@example.com', role: 'admin' },
      { name: 'Charlie', email: 'charlie@example.com', role: 'editor' },
    ];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(2);
    expect(result.invalid).toHaveLength(1);
  });

  it('allows all valid roles', () => {
    const users = [
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
      { name: 'Charlie', email: 'charlie@example.com', role: 'viewer' },
    ];
    const result = validateUsers(users);
    expect(result.valid).toHaveLength(3);
    expect(result.invalid).toHaveLength(0);
  });
});
