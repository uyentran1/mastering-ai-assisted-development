/**
 * Shared type definitions for the Claude Tasks demo.
 *
 * All four tasks use these types to ensure consistent data flow.
 * These types form the contract between tasks — each task
 * consumes and produces data matching these interfaces.
 */

export interface User {
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
}

export interface ValidationResult {
  valid: User[];
  invalid: Array<{
    user: Record<string, string>;
    errors: string[];
  }>;
}

export interface DeduplicationResult {
  unique: User[];
  duplicates: User[];
}

export interface ImportReport {
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  uniqueCount: number;
  duplicateCount: number;
  summary: string;
  generatedAt: string;
}
