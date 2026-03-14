/**
 * Task 1: CSV Parser Tests
 *
 * All tests must pass before moving to Task 2.
 * Run with: npm run test:task1
 */

import { parseCSV } from '../src/csv-parser';

describe('Task 1: CSV Parser', () => {
  it('parses simple CSV with headers', () => {
    const csv = 'name,email,role\nAlice,alice@example.com,admin';
    const result = parseCSV(csv);
    expect(result).toEqual([
      {
        name: 'Alice',
        email: 'alice@example.com',
        role: 'admin',
      },
    ]);
  });

  it('handles multiple rows', () => {
    const csv =
      'name,email,role\nAlice,alice@example.com,admin\nBob,bob@example.com,editor';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
  });

  it('handles quoted fields with commas', () => {
    const csv = 'name,email,role\n"Smith, Charlie",charlie@example.com,viewer';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Smith, Charlie');
  });

  it('trims whitespace from fields', () => {
    const csv = 'name , email , role\n  Alice  ,  alice@example.com  ,  admin  ';
    const result = parseCSV(csv);
    expect(result[0].name).toBe('Alice');
    expect(result[0].email).toBe('alice@example.com');
    expect(result[0].role).toBe('admin');
  });

  it('skips empty rows', () => {
    const csv =
      'name,email,role\nAlice,alice@example.com,admin\n\nBob,bob@example.com,editor';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
    expect(result[0].name).toBe('Alice');
    expect(result[1].name).toBe('Bob');
  });

  it('handles CRLF line endings', () => {
    const csv = 'name,email,role\r\nAlice,alice@example.com,admin\r\nBob,bob@example.com,editor';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });

  it('handles LF line endings', () => {
    const csv = 'name,email,role\nAlice,alice@example.com,admin\nBob,bob@example.com,editor';
    const result = parseCSV(csv);
    expect(result).toHaveLength(2);
  });
});
