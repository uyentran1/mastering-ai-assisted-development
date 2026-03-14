# Feature: Task Search & Filtering

## Overview

Add search and advanced filtering to the task management API, allowing users to find tasks by keyword, date range, and multiple criteria simultaneously.

## Requirements

### 1. Text Search
- Search across task `title` and `description` fields
- Case-insensitive matching
- Partial matches (searching "deploy" should match "Deploy to production")
- Empty search string returns all tasks

### 2. Date Range Filtering
- Filter tasks by `created_at` date range
- Support `from` and `to` parameters (inclusive)
- Either parameter can be omitted (open-ended range)
- Invalid date strings return a 400 error with a clear message

### 3. Combined Filters
- All filters can be combined: search + status + priority + assignee + date range
- Filters are AND-ed together (all must match)
- No results returns an empty array (not an error)

### 4. Sort Options
- Support sorting by: `created_at`, `updated_at`, `priority`, `title`
- Support sort direction: `asc` or `desc`
- Default: `created_at desc` (newest first)
- Priority sort order: high > medium > low

## API Design

```
GET /api/tasks?search=deploy&status=todo&priority=high&from=2025-01-01&to=2025-03-01&sort=priority&order=desc
```

## Acceptance Criteria

- [ ] Text search works case-insensitively across title and description
- [ ] Date range filtering works with ISO date strings
- [ ] All filters can be combined
- [ ] Sort works for all four fields in both directions
- [ ] Invalid inputs return clear 400 errors
- [ ] Empty results return `{ data: [], count: 0 }` (not an error)
- [ ] All existing tests still pass
- [ ] New feature has >90% test coverage
