import { useEffect, useId, useRef } from 'react';
import type { ReactNode } from 'react';
import type { ToastProps, ToastVariant } from '../types';
import { cn } from '../utils/cn';

const CONTAINER_CLASSES: Record<ToastVariant, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const ICON_CLASSES: Record<ToastVariant, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  warning: 'text-yellow-500',
  info: 'text-blue-500',
};

const DEFAULT_ICONS: Record<ToastVariant, ReactNode> = {
  success: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  ),
  error: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  ),
  warning: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.63-1.516 2.63H3.72c-1.347 0-2.189-1.463-1.515-2.63L8.485 2.495zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  ),
  info: (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5" aria-hidden="true">
      <path
        fillRule="evenodd"
        d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zM9 9a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1zm.25 3a.75.75 0 000 1.5h.5a.75.75 0 000-1.5h-.5z"
        clipRule="evenodd"
      />
    </svg>
  ),
};

/**
 * A dismissible notification surface with success/error/warning/info variants.
 *
 * Renders nothing when `open` is false. Auto-dismisses after `duration` ms
 * (default 5000) by calling `onDismiss`; pass `duration={null}` to persist
 * until the user dismisses it manually.
 */
export function Toast({
  variant = 'info',
  message,
  title,
  open = true,
  duration = 5000,
  onDismiss,
  dismissible = true,
  icon,
  className,
  id,
  'data-testid': dataTestId,
}: ToastProps) {
  const generatedId = useId();
  const titleId = id ? `${id}-title` : `${generatedId}-title`;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open || duration === null || duration === undefined) {
      return undefined;
    }

    timerRef.current = setTimeout(() => {
      onDismiss?.();
    }, duration);

    return () => {
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [open, duration, onDismiss]);

  if (!open) {
    return null;
  }

  const isAssertive = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isAssertive ? 'alert' : 'status'}
      aria-live={isAssertive ? 'assertive' : 'polite'}
      aria-labelledby={title ? titleId : undefined}
      id={id}
      className={cn(
        'flex w-full max-w-sm items-start gap-3 rounded-lg border p-4 shadow-md sm:max-w-md',
        CONTAINER_CLASSES[variant],
        className
      )}
      data-testid={dataTestId}
    >
      <span className={cn('mt-0.5 shrink-0', ICON_CLASSES[variant])} data-testid="toast-icon">
        {icon ?? DEFAULT_ICONS[variant]}
      </span>

      <div className="min-w-0 flex-1 text-sm">
        {title && (
          <p id={titleId} className="font-semibold">
            {title}
          </p>
        )}
        <div className={cn(title && 'mt-1')}>{message}</div>
      </div>

      {dismissible && (
        <button
          type="button"
          onClick={() => onDismiss?.()}
          aria-label="Dismiss"
          className="ml-auto inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-current opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-current"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-4 w-4"
            aria-hidden="true"
          >
            <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
          </svg>
        </button>
      )}
    </div>
  );
}
