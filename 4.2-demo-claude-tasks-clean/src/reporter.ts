/**
 * Task 4: Report Generator
 *
 * Generate a summary report of the import pipeline results.
 *
 * This task has NO dependencies — it can run in parallel with T1.
 * Claude will start it immediately alongside T1 since both are unblocked.
 *
 * Report Rules:
 * - Accept counts for each pipeline stage
 * - Generate a human-readable summary string
 * - Include a timestamp (generatedAt)
 * - Return: ImportReport
 */

import { ImportReport } from './types';

/** Format a ratio as a one-decimal percentage, or 'n/a' when the base is zero. */
function formatRate(numerator: number, denominator: number): string {
  if (denominator <= 0) {
    return 'n/a';
  }
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

export function generateReport(stats: {
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  uniqueCount: number;
  duplicateCount: number;
}): ImportReport {
  const { totalParsed, validCount, invalidCount, uniqueCount, duplicateCount } = stats;

  const summary = [
    'User Import Report',
    '==================',
    `Rows parsed:      ${totalParsed}`,
    `Valid users:      ${validCount}`,
    `Invalid users:    ${invalidCount}`,
    `Unique users:     ${uniqueCount}`,
    `Duplicate users:  ${duplicateCount}`,
    `Validation rate:  ${formatRate(validCount, totalParsed)}`,
    `Uniqueness rate:  ${formatRate(uniqueCount, validCount)}`,
  ].join('\n');

  return {
    totalParsed,
    validCount,
    invalidCount,
    uniqueCount,
    duplicateCount,
    summary,
    generatedAt: new Date().toISOString(),
  };
}
