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

/**
 * Split a single CSV line into fields, honouring double-quoted fields that may
 * themselves contain commas. A doubled quote inside a quoted field ("") is
 * treated as a literal quote character.
 */
function splitLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (inQuotes) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }

  fields.push(current);
  return fields.map(field => field.trim());
}

export function parseCSV(csv: string): Record<string, string>[] {
  const lines = csv.split(/\r\n|\r|\n/);
  const headerIndex = lines.findIndex(line => line.trim() !== '');

  if (headerIndex === -1) {
    return [];
  }

  const headers = splitLine(lines[headerIndex]);
  const rows: Record<string, string>[] = [];

  for (const line of lines.slice(headerIndex + 1)) {
    if (line.trim() === '') {
      continue;
    }

    const fields = splitLine(line);
    if (fields.every(field => field === '')) {
      continue;
    }

    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = fields[i] ?? '';
    });
    rows.push(row);
  }

  return rows;
}
