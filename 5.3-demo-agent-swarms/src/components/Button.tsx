/**
 * Button Component — Example Implementation
 *
 * This is a completed example showing what agents should target.
 * (This would be the result of Agent A's work in Hour 1)
 */

import React from 'react';

export interface ButtonProps {
  /**
   * The button text or content
   */
  children: React.ReactNode;

  /**
   * Visual style variant
   * @default "primary"
   */
  variant?: 'primary' | 'secondary' | 'danger';

  /**
   * Whether the button is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Click handler
   */
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * HTML type attribute
   * @default "button"
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Button Component
 *
 * A reusable button with multiple visual variants.
 *
 * @example
 * <Button variant="primary">Click me</Button>
 * <Button variant="secondary" disabled>Disabled</Button>
 * <Button variant="danger" onClick={() => handleDelete()}>Delete</Button>
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  disabled = false,
  onClick,
  type = 'button',
  className = '',
}) => {
  const baseStyles =
    'px-4 py-2 rounded font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600 active:bg-blue-700',
    secondary: 'bg-gray-300 text-gray-900 hover:bg-gray-400 active:bg-gray-500',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:bg-red-700',
  };

  const combinedClass = `${baseStyles} ${variantStyles[variant]} ${className}`;

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={combinedClass}
    >
      {children}
    </button>
  );
};
