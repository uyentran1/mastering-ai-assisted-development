/**
 * Toast Component
 *
 * A reusable notification component that auto-dismisses.
 */

import React, { useEffect } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  /**
   * Toast message
   */
  message: string;

  /**
   * Toast type (success, error, warning, info)
   * @default "info"
   */
  type?: ToastType;

  /**
   * Duration in milliseconds before auto-dismiss
   * @default 5000
   */
  duration?: number;

  /**
   * Callback when closing the toast
   */
  onClose?: () => void;

  /**
   * Whether the toast is visible
   */
  isVisible?: boolean;
}

/**
 * Toast Component
 *
 * @example
 * <Toast
 *   message="Operation completed successfully"
 *   type="success"
 *   duration={3000}
 *   onClose={() => setToast(null)}
 * />
 */
export const Toast: React.FC<ToastProps> = ({
  message,
  type = 'info',
  duration = 5000,
  onClose,
  isVisible = true,
}) => {
  useEffect(() => {
    if (!isVisible || !onClose) {
      return;
    }

    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [isVisible, duration, onClose]);

  if (!isVisible) {
    return null;
  }

  const typeStyles = {
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-900',
      icon: '✓',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-900',
      icon: '✕',
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-900',
      icon: '!',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-900',
      icon: 'ⓘ',
    },
  };

  const style = typeStyles[type];

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-lg border ${style.bg} ${style.border} ${style.text} shadow-lg`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <span className="text-xl font-bold">{style.icon}</span>
        <p className="flex-1">{message}</p>
        {onClose && (
          <button
            onClick={onClose}
            className="text-lg font-bold hover:opacity-70 focus:outline-none"
            aria-label="Close toast"
          >
            &times;
          </button>
        )}
      </div>
    </div>
  );
};
