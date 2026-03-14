/**
 * Task 1: CSV Parser
 *
 * Parse a CSV string into an array of user objects.
 *
 * This task is delegated to a Claude subagent that implements
 * the function and verifies it against tests/task-1-parser.test.ts.
 *
 * Requirements:
 * - Parse header row (name, email, role)
 * - Handle quoted fields
 * - Trim whitespace
 * - Skip empty rows
 * - Handle various line endings (CRLF, LF)
 */

import { User } from './types';

export function parseCSV(csv: string): Record<string, string>[] {
  // TODO: Implement CSV parsing
  throw new Error('Task 1 not implemented — implement parseCSV to pass all tests');
}
