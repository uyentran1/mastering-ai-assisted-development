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
  if (!csv.trim()) {
    return [];
  }

  // Split by line endings (handle both CRLF and LF)
  const lines = csv.split(/\r?\n/);

  // Get header
  if (lines.length === 0) {
    return [];
  }

  const headerLine = lines[0];
  const headers = parseCSVLine(headerLine);

  const results: Record<string, string>[] = [];

  // Process data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty rows
    if (line === '') {
      continue;
    }

    const values = parseCSVLine(line);

    // Create object with header keys
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || '';
    }

    results.push(row);
  }

  return results;
}

/**
 * Parse a single CSV line, handling quoted fields with commas
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
      i++;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
    } else {
      current += char;
      i++;
    }
  }

  result.push(current.trim());
  return result;
}
