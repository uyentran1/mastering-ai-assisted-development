# React Component Library — Task Board

## Task Assignments

### Agent A: Form Components
- [ ] Button component (with variants: primary, secondary, danger, disabled)
- [ ] Input component (with label, placeholder, validation states)
- [ ] Select component (with options, multi-select variant)

**Expected Commits**:
- feat: Button component with primary/secondary/danger variants
- feat: Input component with validation support
- feat: Select component with multi-select variant

### Agent B: Dialog Components
- [ ] Modal component (header, body, footer, close button)
- [ ] Toast/Alert component (success, error, warning, info variants)
- [ ] Dropdown component (with keyboard navigation and focus management)

**Expected Commits**:
- feat: Modal component with header/footer support
- feat: Toast/Alert component with multiple variants
- feat: Dropdown component with keyboard navigation

### Agent C: Testing & Documentation
- [ ] Unit tests for all components (target 85%+ coverage)
- [ ] Storybook/example files for all components
- [ ] Update README.md with usage examples and API reference

**Expected Commits**:
- test: unit tests for form components (Button, Input, Select)
- test: unit tests for dialog components (Modal, Toast, Dropdown)
- docs: Storybook stories and README examples

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
- [x] Project setup (TypeScript, Jest, Tailwind, React)
- [x] Created directory structure (src/components, tests/)
- [x] Created shared type definitions (types/index.ts)

---

## In Progress (Starting Now)
- [ ] **Agent A**: Form components (Button, Input, Select)
- [ ] **Agent B**: Dialog components (Modal, Toast, Dropdown)
- [ ] **Agent C**: Tests and documentation for all

---

## Blocked/Issues
(None yet — all agents can start immediately)

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
