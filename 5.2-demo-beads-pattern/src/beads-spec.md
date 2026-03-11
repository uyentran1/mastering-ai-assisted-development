# Beads Pattern: User Import Pipeline

Video 5.2: Beads Pattern — Modular Task Chains

Each "bead" is a sequential task with its own acceptance criteria and commit
point. If a bead fails, you can roll back to the previous commit without
losing earlier work.

## Bead 1: CSV Parser
Parse a CSV string into an array of user objects.
- Input: CSV string with headers (name, email, role)
- Output: Array of { name, email, role } objects
- Handle: quoted fields, empty rows, whitespace trimming
- Tests: `npm run test:bead1`
- Commit: `git commit -m "bead-1: CSV parser"`

## Bead 2: Validator
Validate each parsed user object.
- Email must match standard format
- Role must be one of: 'admin', 'editor', 'viewer'
- Name must be non-empty
- Returns: { valid: User[], invalid: { user, errors }[] }
- Tests: `npm run test:bead2`
- Commit: `git commit -m "bead-2: user validator"`

## Bead 3: Deduplicator
Remove duplicate users from the valid list.
- Duplicate = same email (case-insensitive)
- Keep the LAST occurrence (latest in the CSV)
- Returns: { unique: User[], duplicates: User[] }
- Tests: `npm run test:bead3`
- Commit: `git commit -m "bead-3: deduplicator"`
