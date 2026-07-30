/**
 * Task 2: Validator
 *
 * Validate each parsed user object.
 *
 * This task is delegated to a Claude subagent that implements
 * the function and verifies it against tests/task-2-validator.test.ts.
 *
 * Validation Rules:
 * - Email: must match ^[^\s@]+@[^\s@]+\.[^\s@]+$
 * - Role: must be 'admin', 'editor', or 'viewer'
 * - Name: must be non-empty after trimming
 *
 * Returns: { valid: User[], invalid: { user, errors }[] }
 */

import { User, ValidationResult } from './types';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const VALID_ROLES: User['role'][] = ['admin', 'editor', 'viewer'];

export function validateUsers(users: Record<string, string>[]): ValidationResult {
  const result: ValidationResult = { valid: [], invalid: [] };

  for (const user of users) {
    const name = (user.name ?? '').trim();
    const email = (user.email ?? '').trim();
    const role = (user.role ?? '').trim();
    const errors: string[] = [];

    if (name === '') {
      errors.push('Name is required');
    }

    if (!EMAIL_PATTERN.test(email)) {
      errors.push('Invalid email format');
    }

    if (!VALID_ROLES.includes(role as User['role'])) {
      errors.push('Role must be one of: admin, editor, viewer');
    }

    if (errors.length > 0) {
      result.invalid.push({ user, errors });
    } else {
      result.valid.push({ name, email, role: role as User['role'] });
    }
  }

  return result;
}
