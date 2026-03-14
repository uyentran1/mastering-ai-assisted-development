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
  const seenEmails = new Map<string, number>();
  const duplicates: User[] = [];
  const unique: User[] = [];

  // First pass: identify last occurrence of each email
  for (let i = 0; i < users.length; i++) {
    const email = users[i].email.toLowerCase();
    if (seenEmails.has(email)) {
      // Mark previous occurrence as duplicate
      const prevIndex = seenEmails.get(email)!;
      duplicates.push(users[prevIndex]);
    }
    // Update to latest index
    seenEmails.set(email, i);
  }

  // Second pass: keep only unique entries (last occurrence of each email)
  const uniqueIndices = new Set<number>();
  for (const index of seenEmails.values()) {
    uniqueIndices.add(index);
  }

  for (let i = 0; i < users.length; i++) {
    if (uniqueIndices.has(i)) {
      unique.push(users[i]);
    }
  }

  return { unique, duplicates };
}
