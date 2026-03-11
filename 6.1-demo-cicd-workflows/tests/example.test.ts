import { add, multiply, divide } from '../src/example';

describe('Math utils', () => {
  it('adds numbers', () => {
    expect(add(2, 3)).toBe(5);
  });

  it('multiplies numbers', () => {
    expect(multiply(4, 5)).toBe(20);
  });

  it('divides numbers', () => {
    expect(divide(10, 2)).toBe(5);
  });

  it('throws on division by zero', () => {
    expect(() => divide(10, 0)).toThrow('Division by zero');
  });
});
