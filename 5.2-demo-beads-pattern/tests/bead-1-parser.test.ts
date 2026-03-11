/**
 * Bead 1: CSV Parser tests
 * Run: npm run test:bead1
 */
import { parseCSV } from '../src/csv-parser';

describe('Bead 1: CSV Parser', () => {
  it('parses simple CSV', () => {
    const csv = `name,email,role\nAlice,alice@example.com,admin\nBob,bob@example.com,editor`;
    const result = parseCSV(csv);
    expect(result).toEqual([
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
      { name: 'Bob', email: 'bob@example.com', role: 'editor' },
    ]);
  });

  it('handles quoted fields', () => {
    const csv = `name,email,role\n"Smith, Jane",jane@example.com,viewer`;
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Smith, Jane');
  });

  it('trims whitespace', () => {
    const csv = `name,email,role\n  Alice  , alice@example.com , admin `;
    const result = parseCSV(csv);
    expect(result[0]).toEqual({ name: 'Alice', email: 'alice@example.com', role: 'admin' });
  });

  it('skips empty rows', () => {
    const csv = `name,email,role\nAlice,alice@example.com,admin\n\nBob,bob@example.com,editor\n`;
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('returns empty array for empty input', () => {
    expect(parseCSV('')).toEqual([]);
    expect(parseCSV('name,email,role')).toEqual([]);
  });
});
