# Testing Skill

## Trigger
When creating new functions, modules, or components.

## Requirements
Every new module must have tests that cover:
- Happy path (normal operation)
- Edge cases (empty input, null, boundary values)
- Error cases (invalid input, network failures)
- At least 80% line coverage for new code

## Test Structure
```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle the normal case', () => { /* ... */ });
    it('should handle empty input', () => { /* ... */ });
    it('should throw on invalid input', () => { /* ... */ });
  });
});
```

## Good Example
```typescript
describe('calculateTotal', () => {
  it('sums item prices correctly', () => {
    expect(calculateTotal([{ price: 10 }, { price: 20 }])).toBe(30);
  });

  it('returns 0 for empty array', () => {
    expect(calculateTotal([])).toBe(0);
  });

  it('throws on negative prices', () => {
    expect(() => calculateTotal([{ price: -5 }])).toThrow('Invalid price');
  });
});
```

## Bad Example
```typescript
test('it works', () => {
  expect(calculateTotal([{ price: 10 }])).toBe(10);
});
// Only tests one case, no edge cases, no error cases
```

## Verification
- Run: `npm test -- --coverage`
- All tests must pass
- Coverage must meet threshold
