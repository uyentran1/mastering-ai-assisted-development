import { cn } from '../src/utils/cn';

describe('cn', () => {
  it('joins plain string arguments', () => {
    expect(cn('px-4', 'py-2')).toBe('px-4 py-2');
  });

  it('returns an empty string when given nothing', () => {
    expect(cn()).toBe('');
  });

  it('skips falsy values', () => {
    expect(cn('base', false, null, undefined, '', 'end')).toBe('base end');
  });

  it('keeps the truthy side of a conditional', () => {
    const isActive = true;
    const isDisabled = false;
    expect(cn('btn', isActive && 'bg-blue-600', isDisabled && 'opacity-50')).toBe(
      'btn bg-blue-600'
    );
  });

  it('includes only the keys of an object whose values are truthy', () => {
    expect(
      cn({
        'opacity-50': true,
        'cursor-not-allowed': true,
        hidden: false,
        'sr-only': undefined,
        'text-red-500': null,
      })
    ).toBe('opacity-50 cursor-not-allowed');
  });

  it('mixes strings, objects and conditionals in one call', () => {
    expect(cn('btn', { 'btn-lg': true, 'btn-sm': false }, false, 'shadow')).toBe(
      'btn btn-lg shadow'
    );
  });

  it('flattens nested arrays', () => {
    expect(cn(['px-4', ['py-2', ['gap-1']]])).toBe('px-4 py-2 gap-1');
  });

  it('drops empty arrays rather than emitting stray separators', () => {
    expect(cn('a', [], [false, null], 'b')).toBe('a b');
  });

  it('accepts numbers, including zero-as-a-class edge case', () => {
    expect(cn('z', 0, 42)).toBe('z 42');
  });

  it('handles an array containing objects', () => {
    expect(cn([{ a: true }, { b: false, c: true }])).toBe('a c');
  });
});
