# Task Spec: User Import Pipeline

## Video 4.2: Tasks — Dependency Tracking & Cross-Session Persistence

This is a project specification describing four tasks with dependencies. Claude reads this spec, creates Tasks with dependency metadata, and works through them in order. Tasks persist in `~/.claude/tasks/` and can be shared across sessions via `CLAUDE_CODE_TASK_LIST_ID`.

## Task 1: CSV Parser

**Goal**: Parse a CSV string into an array of user objects.

**Input**: Raw CSV string
```
name,email,role
Alice,alice@example.com,admin
Bob,bob@example.com,editor
"Smith, Charlie",charlie@example.com,viewer
```

**Output**: Array of objects
```typescript
[
  { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { name: 'Bob', email: 'bob@example.com', role: 'editor' },
  { name: 'Smith, Charlie', email: 'charlie@example.com', role: 'viewer' }
]
```

**Requirements**:
- Parse header row (name, email, role)
- Handle quoted fields (fields may contain commas)
- Trim whitespace from all fields
- Skip empty rows
- Handle various line endings (CRLF, LF)

**Test Command**: `npm run test:task1`

**Commit Message**: `git commit -m "task-1: CSV parser with quoted field support"`

---

## Task 2: Validator

**Goal**: Validate each parsed user object.

**Input**: Array of user objects from Task 1

**Output**:
```typescript
{
  valid: User[],
  invalid: Array<{ user: Record<string, string>, errors: string[] }>
}
```

**Validation Rules**:
- Email must match pattern: `^[^\s@]+@[^\s@]+\.[^\s@]+$` (simple email validation)
- Role must be exactly one of: `'admin'`, `'editor'`, `'viewer'`
- Name must be non-empty (after trimming)

**Error Messages**:
- Invalid email: `"Invalid email format"`
- Invalid role: `"Role must be one of: admin, editor, viewer"`
- Empty name: `"Name is required"`

**Requirements**:
- Return all errors for a user (not just the first error)
- Separate valid users from invalid ones
- Include the original user data in the invalid result

**Test Command**: `npm run test:task2`

**Commit Message**: `git commit -m "task-2: user validator with email and role checks"`

---

## Task 3: Deduplicator

**Goal**: Remove duplicate users from the valid list.

**Input**: Array of valid user objects from Task 2

**Output**:
```typescript
{
  unique: User[],
  duplicates: User[]
}
```

**Deduplication Rules**:
- Duplicate = same email address (case-insensitive comparison)
- When duplicates are found, **keep the LAST occurrence** (most recent in the CSV)
- Put duplicates in the `duplicates` array
- Return the unique set in the `unique` array

**Example**:
```
Input: [
  { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  { name: 'Alice V2', email: 'ALICE@EXAMPLE.COM', role: 'editor' },
  { name: 'Bob', email: 'bob@example.com', role: 'editor' }
]

Output: {
  unique: [
    { name: 'Alice V2', email: 'ALICE@EXAMPLE.COM', role: 'editor' },  // Later Alice
    { name: 'Bob', email: 'bob@example.com', role: 'editor' }
  ],
  duplicates: [
    { name: 'Alice', email: 'alice@example.com', role: 'admin' }  // Earlier Alice
  ]
}
```

**Requirements**:
- Case-insensitive email matching
- Preserve original case of email in output
- Maintain order: unique users in order they first appear (except duplicates removed)

**Test Command**: `npm run test:task3`

**Commit Message**: `git commit -m "task-3: deduplicator with case-insensitive email matching"`

---

## Task 4: Report Generator

**Goal**: Generate a summary report of the import pipeline results.

**Note**: This task has **no dependencies** — it can be implemented at any time, even in parallel with T1.

**Input**: Pipeline statistics
```typescript
{
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  uniqueCount: number;
  duplicateCount: number;
}
```

**Output**:
```typescript
{
  totalParsed: number;
  validCount: number;
  invalidCount: number;
  uniqueCount: number;
  duplicateCount: number;
  summary: string;        // Human-readable multi-line report
  generatedAt: string;    // ISO 8601 timestamp
}
```

**Requirements**:
- Accept counts for each pipeline stage
- Generate a human-readable summary string with all counts
- Include validation rate percentage (valid / totalParsed) when totalParsed > 0
- Include uniqueness rate percentage (unique / valid) when validCount > 0
- Include a `generatedAt` ISO timestamp
- Handle zero counts gracefully (no division by zero)

**Test Command**: `npm run test:task4`

**Commit Message**: `git commit -m "task-4: report generator with pipeline statistics"`

---

## Running the Full Pipeline

After all four tasks pass their tests, you can wire them together:

```typescript
import { parseCSV } from './csv-parser';
import { validateUsers } from './validator';
import { deduplicateUsers } from './deduplicator';
import { generateReport } from './reporter';

const csv = `name,email,role\nAlice,alice@example.com,admin\n...`;

const parsed = parseCSV(csv);
const { valid, invalid } = validateUsers(parsed);
const { unique, duplicates } = deduplicateUsers(valid);
const report = generateReport({
  totalParsed: parsed.length,
  validCount: valid.length,
  invalidCount: invalid.length,
  uniqueCount: unique.length,
  duplicateCount: duplicates.length,
});

console.log(report.summary);
```

---

## Notes for Claude Code

Read this spec and create Tasks for each step. Set dependencies in the task metadata:
- T2 depends on T1
- T3 depends on T2
- T4 has no dependencies (can run alongside T1)

Work through tasks in dependency order. After each task passes its tests, mark it complete and commit:
```bash
npm run test:taskX  # Verify all tests pass
git add -A && git commit -m "task-X: [description]"
```

If stuck, review:
1. The input and output type definitions in `src/types.ts`
2. The test cases in `tests/task-X-*.test.ts` (they show expected behavior)
3. The requirements above (they're detailed and specific)

### Cross-Session Persistence

Tasks are stored in `~/.claude/tasks/`. To resume across sessions:
```bash
CLAUDE_CODE_TASK_LIST_ID=user-import claude
```

Press `Ctrl+T` to toggle the task list view in your terminal.

You're done when all tasks show as complete and `git log` shows four commits:
```
task-4: report generator with pipeline statistics
task-3: deduplicator with case-insensitive email matching
task-2: user validator with email and role checks
task-1: CSV parser with quoted field support
```
