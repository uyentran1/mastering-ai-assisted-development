# Chapter 5.3: Agent Teams — Parallel Component Development

## Starting Point

This is a clean starting point for the agent teams demo. You have package configuration and task definitions, but no implementations yet.

## Prerequisites

Enable agent teams (experimental feature):
```bash
export CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1
```

## Your Task

Build a complete React component library by creating an agent team with three teammates:

1. **Teammate A: Form Components** — Button, Input, Select
2. **Teammate B: Dialog Components** — Modal, Toast, Dropdown
3. **Teammate C: Tests** — Unit tests for all components

## How to Start

Ask Claude:
```
Create an agent team to build this component library.
Spawn three teammates:
- Teammate A owns Button, Input, Select in src/components/
- Teammate B owns Modal, Toast, Dropdown in src/components/
- Teammate C writes tests for all components in tests/

Use TypeScript, functional components, named exports, Tailwind CSS.
Each component gets its own file: src/components/ComponentName.tsx
Each test file mirrors: tests/ComponentName.test.tsx
```

## Conventions (All Teammates Follow)

- TypeScript with strict mode
- Functional components with hooks
- Named exports (not default)
- Props interfaces named `${ComponentName}Props`
- Tailwind CSS for styling
- Components in `src/components/`
- Tests in `tests/`

## Navigation

- **Shift+Down** cycles between teammates in the terminal
- Each teammate works independently with its own context

## Quick Start

```bash
npm install
npm test  # Should fail until components are implemented
```

## Success Criteria

- 6 components implemented with proper TypeScript types
- 50+ tests passing across all components
- Clean build: `npm run build` succeeds
- All teammates complete their assigned tasks

## Key Points

- Agent teams work **truly in parallel** — not sequentially like subagents
- Teammates communicate via **shared task list** and **messaging**
- The **team lead** coordinates and resolves blockers
- Each teammate owns specific files — no overlapping
- Shared types file provides the contract between components

---

# Component Library — API Reference

All components are **named exports** with props defined in `src/types/index.ts`.
Import from the barrel:

```tsx
import { Button, Input, Select, Modal, Toast, Dropdown } from './src';
```

Every component also accepts `className`, `id`, and `data-testid` via `BaseProps`.

> **Note:** Tailwind is not compiled in this repo. Class names are written as
> they would be in a real Tailwind app, but there is no stylesheet build here —
> components are verified by type and behaviour, not appearance.

## Button

```tsx
<Button variant="danger" size="lg" loading={isSaving} onClick={handleDelete}>
  Delete account
</Button>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `children` | `ReactNode` | — | Required |
| `variant` | `'primary' \| 'secondary' \| 'danger'` | `'primary'` | |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | |
| `disabled` | `boolean` | `false` | |
| `loading` | `boolean` | `false` | Shows spinner, sets `aria-busy`, blocks `onClick` |
| `fullWidth` | `boolean` | `false` | |
| `onClick` | `(e: MouseEvent<HTMLButtonElement>) => void` | — | Not called while disabled or loading |

## Input

Controlled. `onChange` receives the next value first, the event second.

```tsx
<Input
  label="Email"
  value={email}
  onChange={(next) => setEmail(next)}
  type="email"
  validationState={emailError ? 'error' : 'default'}
  errorMessage={emailError}
  required
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `value` | `string` | — | Required |
| `onChange` | `(value: string, e: ChangeEvent) => void` | — | Required |
| `label` | `string` | — | Bound via generated or supplied `id` |
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url' \| 'search'` | `'text'` | |
| `validationState` | `'default' \| 'error' \| 'success'` | `'default'` | `'error'` sets `aria-invalid` |
| `errorMessage` | `string` | — | Shown when state is `'error'` |
| `helperText` | `string` | — | Shown when there is no error |
| `size`, `disabled`, `required`, `placeholder`, `name`, `onBlur` | | | |

## Select

`SelectProps` is a **discriminated union** on `multiple`, so `value` and
`onChange` narrow to the correct shape.

```tsx
// Single — value: string | null
<Select
  label="Country"
  options={[{ value: 'us', label: 'United States' }]}
  value={country}
  onChange={setCountry}
/>

// Multi — value: readonly string[]
<Select
  multiple
  label="Tags"
  options={tagOptions}
  value={tags}
  onChange={setTags}
/>
```

A custom listbox rather than a native `<select>`, so multi-select works.
Keyboard: Arrow keys (skipping `disabled` options), Home/End, Enter/Space,
Escape, Tab. Options are `{ value, label, disabled? }`.

## Modal

```tsx
<Modal
  open={isOpen}
  onClose={() => setIsOpen(false)}
  title="Confirm deletion"
  footer={<Button variant="danger" onClick={confirm}>Delete</Button>}
>
  This action cannot be undone.
</Modal>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `open` | `boolean` | — | Renders nothing when false |
| `onClose` | `() => void` | — | Close button, overlay, or Escape |
| `title` / `footer` | `ReactNode` | — | `title` wires `aria-labelledby` |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | |
| `showCloseButton` | `boolean` | `true` | |
| `closeOnOverlayClick` | `boolean` | `true` | Inside-panel clicks never close |
| `closeOnEscape` | `boolean` | `true` | |

Traps Tab within the dialog and restores focus to the previously-focused
element on close.

## Toast

```tsx
<Toast
  variant="error"
  title="Upload failed"
  message="The file exceeded the size limit."
  duration={null}
  onDismiss={dismiss}
/>
```

| Prop | Type | Default | Notes |
|---|---|---|---|
| `message` | `ReactNode` | — | Required |
| `variant` | `'success' \| 'error' \| 'warning' \| 'info'` | `'info'` | |
| `title` | `string` | — | |
| `open` | `boolean` | `true` | |
| `duration` | `number \| null` | `5000` | `null` persists until dismissed |
| `onDismiss` | `() => void` | — | Auto-dismiss and close button |
| `dismissible` | `boolean` | `true` | |
| `icon` | `ReactNode` | per-variant | |

`error` and `warning` render as assertive live regions; `success` and `info`
are polite.

## Dropdown

```tsx
<Dropdown
  label="Actions"
  trigger={<span>Actions</span>}
  items={[
    { id: 'edit', label: 'Edit' },
    { id: 'del', label: 'Delete', disabled: !canDelete },
  ]}
  onSelect={(item) => run(item.id)}
/>
```

Works controlled (pass `open`) or uncontrolled (`defaultOpen`); `onOpenChange`
fires in both modes. An item's own `onSelect` runs before the component-level
`onSelect`, then the menu closes and focus returns to the trigger. Keyboard:
Arrow keys with roving focus skipping disabled items, Home/End, Enter/Space,
Escape. `placement` is one of `bottom-start | bottom-end | top-start | top-end`.

## Testing

```bash
npm test                  # 172 tests across 7 suites
npm test -- --coverage
npm run build             # tsc; emits .js beside sources (gitignored)
```
