import type { MouseEvent } from 'react';
import type { ButtonProps } from '../types';
import { cn } from '../utils/cn';

const VARIANT_CLASSES: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 focus-visible:outline-blue-600 disabled:bg-blue-300',
  secondary:
    'bg-white text-gray-900 border border-gray-300 hover:bg-gray-50 focus-visible:outline-gray-400 disabled:bg-gray-100 disabled:text-gray-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-600 disabled:bg-red-300',
};

const SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-base gap-2',
  lg: 'px-5 py-2.5 text-lg gap-2.5',
};

const SPINNER_SIZE_CLASSES: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'h-3.5 w-3.5',
  md: 'h-4 w-4',
  lg: 'h-5 w-5',
};

function Spinner({ size }: { size: NonNullable<ButtonProps['size']> }) {
  return (
    <svg
      className={cn('animate-spin', SPINNER_SIZE_CLASSES[size])}
      viewBox="0 0 24 24"
      fill="none"
      role="presentation"
      aria-hidden="true"
      data-testid="button-spinner"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

/**
 * A clickable control for triggering actions, with support for visual
 * variants, sizes, loading and disabled states.
 */
export function Button({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  disabled = false,
  loading = false,
  fullWidth = false,
  onClick,
  className,
  id,
  'data-testid': dataTestId,
  'aria-label': ariaLabel,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  function handleClick(event: MouseEvent<HTMLButtonElement>) {
    if (isDisabled) {
      return;
    }
    onClick?.(event);
  }

  return (
    <button
      type={type}
      id={id}
      data-testid={dataTestId}
      aria-label={ariaLabel}
      aria-busy={loading}
      disabled={isDisabled}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium',
        'transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-70',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        fullWidth && 'w-full',
        className
      )}
    >
      {loading && <Spinner size={size} />}
      {children}
    </button>
  );
}
