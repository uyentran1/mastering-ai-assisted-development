/**
 * Shared type contract for the component library.
 *
 * This file is the single source of truth for every component's public API.
 * Component authors import their `${ComponentName}Props` from here rather than
 * declaring it locally, so that independently-built components stay consistent.
 *
 * OWNERSHIP: team lead only. If a component needs a change to this file,
 * request it rather than editing directly — concurrent edits here break everyone.
 */

import type {
  ChangeEvent,
  FocusEvent,
  MouseEvent,
  ReactNode,
} from 'react';

/* -------------------------------------------------------------------------- */
/* Shared primitives                                                          */
/* -------------------------------------------------------------------------- */

/** Visual emphasis shared by interactive controls. */
export type Variant = 'primary' | 'secondary' | 'danger';

/** Control sizing scale. Components map these to Tailwind spacing/text classes. */
export type Size = 'sm' | 'md' | 'lg';

/** Field-level validation feedback for form controls. */
export type ValidationState = 'default' | 'error' | 'success';

/** Semantic intent for notification surfaces. */
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

/** Where a floating surface opens relative to its trigger. */
export type Placement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end';

/**
 * Props every component accepts, so callers can always hook into styling,
 * labelling and test selection.
 */
export interface BaseProps {
  /** Extra Tailwind classes merged after the component's own classes. */
  className?: string;
  /** DOM id for the root element. Form controls derive label/aria ids from it. */
  id?: string;
  /** Test hook forwarded to the root element. */
  'data-testid'?: string;
}

/* -------------------------------------------------------------------------- */
/* Button                                                                     */
/* -------------------------------------------------------------------------- */

export interface ButtonProps extends BaseProps {
  /** Button content. */
  children: ReactNode;
  /** Visual emphasis. @default 'primary' */
  variant?: Variant;
  /** Control size. @default 'md' */
  size?: Size;
  /** Native button behaviour. @default 'button' */
  type?: 'button' | 'submit' | 'reset';
  /** Disables interaction and applies the disabled treatment. @default false */
  disabled?: boolean;
  /**
   * Shows a busy indicator and blocks clicks. Renders `aria-busy`.
   * A loading button is also treated as disabled. @default false
   */
  loading?: boolean;
  /** Stretches the button to its container's width. @default false */
  fullWidth?: boolean;
  /** Click handler. Not called while disabled or loading. */
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  /** Accessible name, required when `children` is not readable text. */
  'aria-label'?: string;
}

/* -------------------------------------------------------------------------- */
/* Input                                                                      */
/* -------------------------------------------------------------------------- */

export interface InputProps extends BaseProps {
  /** Current value. The input is always controlled. */
  value: string;
  /** Fired on every keystroke with the next value. */
  onChange: (value: string, event: ChangeEvent<HTMLInputElement>) => void;
  /** Visible label. Rendered as a `<label>` bound to the input. */
  label?: string;
  /** Form field name. */
  name?: string;
  /** Placeholder text shown when empty. */
  placeholder?: string;
  /** Native input type. @default 'text' */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  /** Validation styling. @default 'default' */
  validationState?: ValidationState;
  /**
   * Message shown beneath the field when `validationState` is `'error'`.
   * Wired to the input via `aria-describedby` and sets `aria-invalid`.
   */
  errorMessage?: string;
  /** Hint shown beneath the field when there is no error. */
  helperText?: string;
  /** Control size. @default 'md' */
  size?: Size;
  /** Disables the field. @default false */
  disabled?: boolean;
  /** Marks the field required for both native validation and a11y. @default false */
  required?: boolean;
  /** Blur handler, useful for touched-state validation. */
  onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
}

/* -------------------------------------------------------------------------- */
/* Select                                                                     */
/* -------------------------------------------------------------------------- */

/** One choice in a `Select`. */
export interface SelectOption {
  /** Stable value submitted/reported on change. */
  value: string;
  /** Human-readable label. */
  label: string;
  /** Renders the option unselectable. @default false */
  disabled?: boolean;
}

/** Props common to both single- and multi-select modes. */
export interface SelectBaseProps extends BaseProps {
  /** Available choices. */
  options: readonly SelectOption[];
  /** Visible label bound to the control. */
  label?: string;
  /** Text shown when nothing is selected. */
  placeholder?: string;
  /** Control size. @default 'md' */
  size?: Size;
  /** Form field name. */
  name?: string;
  /** Disables the whole control. @default false */
  disabled?: boolean;
  /** Marks the field required. @default false */
  required?: boolean;
  /** Validation styling. @default 'default' */
  validationState?: ValidationState;
  /** Message shown when `validationState` is `'error'`. */
  errorMessage?: string;
}

/** Single-selection mode: `value` is one option value, or `null` when empty. */
export interface SingleSelectProps extends SelectBaseProps {
  multiple?: false;
  value: string | null;
  onChange: (value: string | null) => void;
}

/** Multi-selection mode: `value` is the list of selected option values. */
export interface MultiSelectProps extends SelectBaseProps {
  multiple: true;
  value: readonly string[];
  onChange: (value: string[]) => void;
}

/**
 * Discriminated on `multiple`, so TypeScript narrows `value`/`onChange`
 * to the right shape at every call site.
 */
export type SelectProps = SingleSelectProps | MultiSelectProps;

/* -------------------------------------------------------------------------- */
/* Modal                                                                      */
/* -------------------------------------------------------------------------- */

export interface ModalProps extends BaseProps {
  /** Whether the dialog is visible. Renders nothing when false. */
  open: boolean;
  /** Called on close button, overlay click, or Escape. */
  onClose: () => void;
  /** Header content. Wired to the dialog via `aria-labelledby`. */
  title?: ReactNode;
  /** Body content. */
  children: ReactNode;
  /** Footer content, typically action buttons. */
  footer?: ReactNode;
  /** Dialog width. @default 'md' */
  size?: Size | 'xl';
  /** Renders the header close button. @default true */
  showCloseButton?: boolean;
  /** Closes when the backdrop is clicked. @default true */
  closeOnOverlayClick?: boolean;
  /** Closes when Escape is pressed. @default true */
  closeOnEscape?: boolean;
}

/* -------------------------------------------------------------------------- */
/* Toast                                                                      */
/* -------------------------------------------------------------------------- */

export interface ToastProps extends BaseProps {
  /** Semantic intent, drives colour and default icon. @default 'info' */
  variant?: ToastVariant;
  /** Body content. */
  message: ReactNode;
  /** Optional bold heading above the message. */
  title?: string;
  /** Controls visibility. @default true */
  open?: boolean;
  /**
   * Auto-dismiss delay in milliseconds. Pass `null` to persist until
   * dismissed manually. @default 5000
   */
  duration?: number | null;
  /** Called on auto-dismiss and on close-button click. */
  onDismiss?: () => void;
  /** Renders the close button. @default true */
  dismissible?: boolean;
  /** Replaces the variant's default icon. */
  icon?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/* Dropdown                                                                   */
/* -------------------------------------------------------------------------- */

/** One entry in a `Dropdown` menu. */
export interface DropdownItem {
  /** Stable identifier, used as the React key and in `onSelect`. */
  id: string;
  /** Human-readable label. */
  label: string;
  /** Renders the item unselectable and skips it during keyboard navigation. */
  disabled?: boolean;
  /** Leading icon. */
  icon?: ReactNode;
  /** Per-item handler, called before the component-level `onSelect`. */
  onSelect?: () => void;
}

export interface DropdownProps extends BaseProps {
  /** Trigger content, rendered inside the menu button. */
  trigger: ReactNode;
  /** Menu entries. */
  items: readonly DropdownItem[];
  /** Called with the chosen item after its own `onSelect` runs. */
  onSelect?: (item: DropdownItem) => void;
  /** Controlled open state. Omit to let the component manage its own. */
  open?: boolean;
  /** Initial open state in uncontrolled mode. @default false */
  defaultOpen?: boolean;
  /** Notified whenever the menu opens or closes, in either mode. */
  onOpenChange?: (open: boolean) => void;
  /** Menu position relative to the trigger. @default 'bottom-start' */
  placement?: Placement;
  /** Disables the trigger. @default false */
  disabled?: boolean;
  /** Accessible name for the menu button. */
  label?: string;
}
