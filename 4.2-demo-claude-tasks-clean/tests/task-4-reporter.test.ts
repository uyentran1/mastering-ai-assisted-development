/**
 * Task 4: Report Generator Tests
 *
 * All tests must pass to complete the Claude Tasks demo.
 * Run with: npm run test:task4
 */

import { generateReport } from '../src/reporter';

describe('Task 4: Report Generator', () => {
  it('generates a report with correct counts', () => {
    const report = generateReport({
      totalParsed: 10,
      validCount: 8,
      invalidCount: 2,
      uniqueCount: 6,
      duplicateCount: 2,
    });
    expect(report.totalParsed).toBe(10);
    expect(report.validCount).toBe(8);
    expect(report.invalidCount).toBe(2);
    expect(report.uniqueCount).toBe(6);
    expect(report.duplicateCount).toBe(2);
  });

  it('includes a human-readable summary string', () => {
    const report = generateReport({
      totalParsed: 5,
      validCount: 4,
      invalidCount: 1,
      uniqueCount: 3,
      duplicateCount: 1,
    });
    expect(report.summary).toContain('5');
    expect(report.summary).toContain('4');
    expect(report.summary).toContain('1');
    expect(report.summary).toContain('3');
  });

  it('includes a generatedAt timestamp', () => {
    const before = new Date().toISOString();
    const report = generateReport({
      totalParsed: 1,
      validCount: 1,
      invalidCount: 0,
      uniqueCount: 1,
      duplicateCount: 0,
    });
    const after = new Date().toISOString();
    expect(report.generatedAt).toBeTruthy();
    expect(report.generatedAt >= before).toBe(true);
    expect(report.generatedAt <= after).toBe(true);
  });

  it('handles zero counts gracefully', () => {
    const report = generateReport({
      totalParsed: 0,
      validCount: 0,
      invalidCount: 0,
      uniqueCount: 0,
      duplicateCount: 0,
    });
    expect(report.totalParsed).toBe(0);
    expect(report.summary).toContain('0');
    expect(report.generatedAt).toBeTruthy();
  });

  it('includes validation rate percentage in summary', () => {
    const report = generateReport({
      totalParsed: 10,
      validCount: 8,
      invalidCount: 2,
      uniqueCount: 6,
      duplicateCount: 2,
    });
    expect(report.summary).toContain('80.0%');
  });

  it('includes uniqueness rate percentage in summary', () => {
    const report = generateReport({
      totalParsed: 10,
      validCount: 8,
      invalidCount: 2,
      uniqueCount: 6,
      duplicateCount: 2,
    });
    expect(report.summary).toContain('75.0%');
  });

  it('returns a valid ImportReport interface', () => {
    const report = generateReport({
      totalParsed: 3,
      validCount: 2,
      invalidCount: 1,
      uniqueCount: 2,
      duplicateCount: 0,
    });
    expect(report).toHaveProperty('totalParsed');
    expect(report).toHaveProperty('validCount');
    expect(report).toHaveProperty('invalidCount');
    expect(report).toHaveProperty('uniqueCount');
    expect(report).toHaveProperty('duplicateCount');
    expect(report).toHaveProperty('summary');
    expect(report).toHaveProperty('generatedAt');
  });
});
