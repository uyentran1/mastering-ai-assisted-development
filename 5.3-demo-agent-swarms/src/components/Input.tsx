/**
 * Input Component
 *
 * A reusable text input with optional label, error state, and disabled state.
 */

import React from 'react';

export interface InputProps {
  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * Label text to display above input
   */
  label?: string;

  /**
   * Input type (text, email, password, etc.)
   * @default "text"
   */
  type?: 'text' | 'email' | 'password' | 'number' | 'tel';

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Current input value
   */
  value: string;

  /**
   * Change handler
   */
  onChange: (value: string) => void;

  /**
   * Whether the input is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Error message to display below input
   */
  error?: string;

  /**
   * Additional CSS classes
   */
  className?: string;

  /**
   * Required field indicator
   */
  required?: boolean;
}

/**
 * Input Component
 *
 * @example
 * <Input
 *   label="Email"
 *   type="email"
 *   value={email}
 *   onChange={setEmail}
 *   error={emailError}
 * />
 */
export const Input: React.FC<InputProps> = ({
  id,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  disabled = false,
  error,
  className = '',
  required = false,
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${
          error ? 'border-red-500' : 'border-gray-300'
        } disabled:opacity-50`}
      />
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
