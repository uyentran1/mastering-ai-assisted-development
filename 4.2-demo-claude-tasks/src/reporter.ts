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

export function generateReport(stats: {
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  uniqueCount: number;
  duplicateCount: number;
}): ImportReport {
  const { totalParsed, validCount, invalidCount, uniqueCount, duplicateCount } = stats;

  const lines: string[] = [
    `Import Report`,
    `=============`,
    `Total parsed:  ${totalParsed}`,
    `Valid:         ${validCount}`,
    `Invalid:       ${invalidCount}`,
    `Unique:        ${uniqueCount}`,
    `Duplicates:    ${duplicateCount}`,
  ];

  if (totalParsed > 0) {
    const validPct = ((validCount / totalParsed) * 100).toFixed(1);
    lines.push(`Validation rate: ${validPct}%`);
  }

  if (validCount > 0) {
    const uniquePct = ((uniqueCount / validCount) * 100).toFixed(1);
    lines.push(`Uniqueness rate: ${uniquePct}%`);
  }

  const summary = lines.join('\n');

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
