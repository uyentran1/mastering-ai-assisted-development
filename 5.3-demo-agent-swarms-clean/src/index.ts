/**
 * Component Library — Barrel Export
 *
 * Single entry point for the library: every component, its props type, and the
 * shared type contract are re-exported here.
 */

/* Components ------------------------------------------------------------- */

export { Button } from './components/Button';
export { Input } from './components/Input';
export { Select } from './components/Select';
export { Modal } from './components/Modal';
export { Toast } from './components/Toast';
export { Dropdown } from './components/Dropdown';

/* Shared type contract --------------------------------------------------- */

export type {
  // Shared primitives
  Variant,
  Size,
  ValidationState,
  ToastVariant,
  Placement,
  BaseProps,
  // Per-component props
  ButtonProps,
  InputProps,
  SelectProps,
  SelectBaseProps,
  SingleSelectProps,
  MultiSelectProps,
  SelectOption,
  ModalProps,
  ToastProps,
  DropdownProps,
  DropdownItem,
} from './types';

/* Utilities -------------------------------------------------------------- */

export { cn } from './utils/cn';
export type { ClassValue } from './utils/cn';
