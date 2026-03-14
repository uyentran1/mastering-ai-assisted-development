/**
 * Task 3: Deduplicator
 *
 * Remove duplicate users from the valid list.
 *
 * This task is delegated to a Claude subagent that implements
 * the function and verifies it against tests/task-3-dedup.test.ts.
 *
 * Deduplication Rules:
 * - Duplicate = same email (case-insensitive)
 * - Keep the LAST occurrence (most recent in the list)
 * - Return: { unique: User[], duplicates: User[] }
 */

import { User, DeduplicationResult } from './types';

export function deduplicateUsers(users: User[]): DeduplicationResult {
  // TODO: Implement deduplication
  throw new Error('Task 3 not implemented — implement deduplicateUsers to pass all tests');
}
