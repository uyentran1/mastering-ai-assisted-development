# Task: Build a pagination utility

## Requirements
- Cursor-based pagination (not offset-based)
- Works with any array of items (generic)
- Returns: { data, nextCursor, hasMore }
- Handles: empty results, single page, multi-page
- TypeScript with generics for type safety
- Cursor is base64-encoded item ID

## Acceptance Criteria (tests must pass)
- [ ] Returns correct data for first page
- [ ] Returns correct nextCursor for subsequent pages
- [ ] Returns hasMore: false on last page
- [ ] Handles empty dataset
- [ ] Type-safe — generic T matches item type
- [ ] Works with different page sizes
- [ ] Cursor decodes correctly for continuation

## Interface
```typescript
interface PaginationResult<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

function paginate<T extends { id: string }>(
  items: T[],
  options: { first: number; after?: string }
): PaginationResult<T>;
```
