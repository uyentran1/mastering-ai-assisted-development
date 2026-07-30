/**
 * Video 4.1: The Ralph Loop — Autonomous AI Agent Loop (snarktank/ralph)
 *
 * Cursor-based pagination utility.
 *
 * Cursors are opaque to the caller: internally they are the base64-encoded
 * `id` of the LAST item on the returned page. Continuation resumes at the
 * item immediately following that id.
 */

export interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

function encodeCursor(id: string): string {
  return Buffer.from(id).toString('base64');
}

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, 'base64').toString();
}

export function paginate<T extends { id: string }>(
  items: T[],
  options: { first: number; after?: string },
): PaginationResult<T> {
  const { first, after } = options;

  if (!Number.isInteger(first) || first <= 0) {
    throw new Error(`Invalid page size: ${first} — "first" must be a positive integer`);
  }

  // An `after` cursor decodes to the id of the last item on the previous page,
  // so continuation resumes at the item immediately following it. An unknown or
  // malformed cursor falls back to the beginning rather than throwing.
  let start = 0;
  if (after) {
    const afterId = decodeCursor(after);
    const index = items.findIndex((item) => item.id === afterId);
    if (index !== -1) {
      start = index + 1;
    }
  }
  const data = items.slice(start, start + first);
  const hasMore = start + data.length < items.length;
  const last = data[data.length - 1];

  return {
    data,
    nextCursor: hasMore && last ? encodeCursor(last.id) : null,
    hasMore,
  };
}
