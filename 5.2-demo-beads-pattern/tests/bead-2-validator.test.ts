/**
 * Bead 2: Validator tests
 * Run: npm run test:bead2
 */
import { validateUsers } from '../src/validator';

describe('Bead 2: User Validator', () => {
  it('accepts valid users', () => {
    const result = validateUsers([
      { name: 'Alice', email: 'alice@example.com', role: 'admin' },
    ]);
    expect(result.valid).toHaveLength(1);
    expect(result.invalid).toHaveLength(0);
  });

  it('rejects invalid email', () => {
    const result = validateUsers([
      { name: 'Alice', email: 'not-an-email', role: 'admin' },
    ]);
    expect(result.valid).toHaveLength(0);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Invalid email format');
  });

  it('rejects invalid role', () => {
    const result = validateUsers([
      { name: 'Alice', email: 'alice@example.com', role: 'superadmin' as any },
    ]);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Invalid role');
  });

  it('rejects empty name', () => {
    const result = validateUsers([
      { name: '', email: 'alice@example.com', role: 'admin' },
    ]);
    expect(result.invalid).toHaveLength(1);
    expect(result.invalid[0].errors).toContain('Name is required');
  });

  it('reports multiple errors on one user', () => {
    const result = validateUsers([
      { name: '', email: 'bad', role: 'nope' as any },
    ]);
    expect(result.invalid[0].errors.length).toBeGreaterThanOrEqual(3);
  });
});
