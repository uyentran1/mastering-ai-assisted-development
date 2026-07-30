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
  // Index of the last occurrence of each email, compared case-insensitively.
  const lastIndexByEmail = new Map<string, number>();
  users.forEach((user, i) => {
    lastIndexByEmail.set(user.email.toLowerCase(), i);
  });

  const unique: User[] = [];
  const duplicates: User[] = [];

  users.forEach((user, i) => {
    if (lastIndexByEmail.get(user.email.toLowerCase()) === i) {
      unique.push(user);
    } else {
      duplicates.push(user);
    }
  });

  return { unique, duplicates };
}
