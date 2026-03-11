/**
 * Videos 6.1 & 6.2: Code Review with AI + CI/CD Integration
 *
 * Sample module for the CI/CD demo. The GitHub Actions workflows
 * in .github/workflows/ show how to integrate AI into your CI pipeline.
 */

export function add(a: number, b: number): number {
  return a + b;
}

export function multiply(a: number, b: number): number {
  return a * b;
}

export function divide(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero');
  return a / b;
}
