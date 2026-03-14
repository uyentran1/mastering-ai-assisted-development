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

const VALID_ROLES = ['admin', 'editor', 'viewer'];

export function validateUsers(users: Record<string, string>[]): ValidationResult {
  const valid: User[] = [];
  const invalid: Array<{ user: Record<string, string>; errors: string[] }> = [];

  for (const user of users) {
    const errors: string[] = [];

    // Validate name
    if (!user.name || user.name.trim() === '') {
      errors.push('Name is required');
    }

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!user.email || !emailRegex.test(user.email)) {
      errors.push('Invalid email format');
    }

    // Validate role
    if (!VALID_ROLES.includes(user.role)) {
      errors.push('Role must be one of: admin, editor, viewer');
    }

    if (errors.length === 0) {
      valid.push({
        name: user.name,
        email: user.email,
        role: user.role as 'admin' | 'editor' | 'viewer',
      });
    } else {
      invalid.push({
        user,
        errors,
      });
    }
  }

  return { valid, invalid };
}
