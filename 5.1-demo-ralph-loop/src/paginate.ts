/**
 * Video 5.1: The Ralph Loop — Autonomous Iteration
 *
 * STUB: This file has a skeleton that the AI agent should complete.
 * The agent runs tests, sees failures, implements code, re-runs tests,
 * and iterates until all tests pass (the Ralph Loop).
 *
 * To run the Ralph Loop demo:
 *   claude "Implement the pagination utility described in src/pagination-spec.md.
 *   After each change, run npm run test:pagination. Keep iterating until ALL
 *   tests pass. Do not stop until you have zero test failures."
 */

export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export function paginate<T extends { id: string }>(
  items: T[],
  options: { first: number; after?: string },
): PaginationResult<T> {
  // TODO: Implement cursor-based pagination
  // The AI agent will fill this in during the Ralph Loop demo
  throw new Error('Not implemented — run the Ralph Loop to complete this!');
}
