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

export function validateUsers(users: Record<string, string>[]): ValidationResult {
  // TODO: Implement user validation
  throw new Error('Task 2 not implemented — implement validateUsers to pass all tests');
}
