# React Component Library — Task Board

## Task Assignments

Six components, two per teammate. Each teammate writes the tests for the
components they own — a test-only agent would have to wait on everyone else,
and file ownership is what keeps three parallel agents from colliding.

### Teammate A: Button + Input
- [ ] Button component (variants: primary, secondary, danger; loading, disabled)
- [ ] Input component (label, placeholder, validation states)
- [ ] Unit tests for both

**Owns**: `src/components/{Button,Input}.tsx`, `tests/{Button,Input}.test.tsx`

**Expected Commits**:
- feat: Button component with primary/secondary/danger variants
- feat: Input component with validation support

### Teammate B: Select + Dropdown
- [ ] Select component (options, multi-select variant, keyboard navigation)
- [ ] Dropdown component (keyboard navigation and focus management)
- [ ] Unit tests for both

**Owns**: `src/components/{Select,Dropdown}.tsx`, `tests/{Select,Dropdown}.test.tsx`

Grouped together because both are listbox/menu widgets sharing roving-focus
keyboard behaviour — one owner keeps that behaviour consistent.

**Expected Commits**:
- feat: Select component with multi-select variant
- feat: Dropdown component with keyboard navigation

### Teammate C: Modal + Toast
- [ ] Modal component (header, body, footer, close button, focus trap)
- [ ] Toast/Alert component (success, error, warning, info variants)
- [ ] Unit tests for both

**Owns**: `src/components/{Modal,Toast}.tsx`, `tests/{Modal,Toast}.test.tsx`

**Expected Commits**:
- feat: Modal component with header/footer support
- feat: Toast/Alert component with multiple variants

### Team Lead: Shared contract, barrel, docs
- [x] `src/types/index.ts` — the shared API contract
- [x] `src/utils/cn.ts` — className helper (`clsx` is not installed)
- [x] `tests/setup.ts` — required by `jest.config.js`, was missing
- [ ] `src/index.ts` — barrel export (after components land)
- [ ] README usage examples and API reference

**Owns**: everything above, plus `TASKS.md`, `package.json`, `tsconfig.json`,
`jest.config.js`. Teammates request changes here rather than editing.

---

## Conventions (All Agents MUST Follow)

### File Organization
- Each component in its own file: `src/components/${ComponentName}.tsx`
- Tests mirror src structure: `tests/${ComponentName}.test.tsx`
- Props interfaces named `${ComponentName}Props`

### Code Style
- TypeScript with strict mode enabled
- Functional components with React hooks
- Named exports (NOT default exports)
- Props as single parameter
- No external state management (use Props + callbacks)

### Styling
- Tailwind CSS for all styling
- NO inline styles
- NO CSS modules
- Reusable classes via `clsx` or similar
- Responsive design (mobile-first)

### Testing
- Jest for test runner
- React Testing Library for component testing
- Minimum 80% line coverage per component
- Test cases: render, user interaction, edge cases, error states

### Components Must Have
- Clear, documented Props interface
- Sensible default values
- Accessible HTML (aria labels, semantic elements)
- Type-safe event handlers

### Commits
- One logical change per commit
- Descriptive commit messages: `feat: X component with Y variant`
- Group related work: Button + tests in one commit is fine

---

## Completed
- [x] Project setup (TypeScript, Jest, React)
- [x] Created directory structure (src/components, tests/)
- [x] Created shared type definitions (`src/types/index.ts`)
- [x] Added `src/utils/cn.ts` and `tests/setup.ts`

---

## In Progress
- [ ] **Teammate A**: Button, Input (+ tests)
- [ ] **Teammate B**: Select, Dropdown (+ tests)
- [ ] **Teammate C**: Modal, Toast (+ tests)
- [ ] **Lead**: barrel export, README, commits

---

## Blocked/Issues

Resolved before the team started:

- **`src/types/index.ts` did not exist** despite being checked off as complete.
  It is the contract the whole team builds against, so the lead wrote it first.
  It now covers all six components' props and compiles clean under strict mode.
- **`tests/setup.ts` did not exist** but `jest.config.js:7` references it via
  `setupFilesAfterEnv` — every test run would have failed before reaching a
  component. Created.
- **`clsx` is not installed** and neither is Tailwind's toolchain. TASKS.md
  allows "clsx or similar", so `src/utils/cn.ts` provides a dependency-free
  equivalent. Tailwind class names are written as normal but are not compiled
  in this repo — styling is not visually verifiable here.

Open, for the lead to decide:

- `npm run build` is bare `tsc` with no `outDir` and `include: ["src","tests"]`,
  so a build emits `.js` next to every source file *and* compiles the tests into
  the package. Left as-is — restructuring the build is outside this task.

---

## Timeline

- **Hour 1**: Core components implemented (Button, Input, Modal, Toast)
- **Hour 2**: Secondary components (Select, Dropdown); tests for Hour 1 work
- **Hour 3**: All tests complete, documentation done
- **Hour 4**: Integration, final review, merge

---

## How Agents Check Progress

Agents should check this file and PROGRESS.md frequently:
- Every 30 minutes: glance at TASKS.md to see if anything changed
- Every 15-30 minutes: check git log (`git log --oneline -10`) to see what others did
- Before starting a new component: check TASKS.md for updates/blockers
- After finishing a component: update PROGRESS.md, commit, and note in TASKS.md

---

## How Team Lead Monitors

Team Lead should:
- Review PROGRESS.md every 30 minutes
- Run `git log` to see commits
- Watch for blockers flagged in PROGRESS.md
- Help resolve conflicts or dependencies
- Keep TASKS.md updated with current status
