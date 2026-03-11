# Accessibility Skill

## Trigger
When creating or modifying React components that render UI elements.

## Requirements
Every component must include:
- Semantic HTML elements (nav, main, section, article, button — not div for everything)
- ARIA labels on interactive elements
- Keyboard navigation support (onKeyDown handlers for clickable non-button elements)
- Sufficient color contrast (don't use light gray on white)
- Focus indicators (never remove outline without replacement)

## Good Example
```tsx
<button
  aria-label="Close dialog"
  onClick={onClose}
  className="close-btn" // has visible focus ring in CSS
>
  <XIcon aria-hidden="true" />
</button>
```

## Bad Example
```tsx
<div onClick={onClose} style={{ cursor: 'pointer' }}>
  <XIcon />
</div>
```

## Verification
- Run: axe-core audit or browser accessibility panel
- Tab through all interactive elements
- Check with screen reader narration
