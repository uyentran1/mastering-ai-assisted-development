# React Component Skill

## Trigger
When creating new React components.

## Requirements
Every new component must include:
- TypeScript props interface (exported)
- Functional component with named export
- Accessibility (see accessibility skill)
- Unit tests (see testing skill)
- Error boundary consideration for data-fetching components

## Component Template
```tsx
export interface ComponentNameProps {
  /** Description of prop */
  propName: string;
}

export function ComponentName({ propName }: ComponentNameProps) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
```

## Naming Conventions
- Component files: PascalCase.tsx (e.g., UserProfile.tsx)
- Test files: PascalCase.test.tsx (e.g., UserProfile.test.tsx)
- Props interface: ComponentNameProps
- Hooks: useFeatureName (e.g., useUserProfile)

## Verification
- Component renders without errors
- Props interface is exported
- Tests pass
- Accessibility skill requirements met
