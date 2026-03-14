/**
 * Select Component
 *
 * A reusable dropdown select component.
 */

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps {
  /**
   * HTML id attribute
   */
  id?: string;

  /**
   * Label text to display above select
   */
  label?: string;

  /**
   * Available options
   */
  options: SelectOption[];

  /**
   * Currently selected value
   */
  value: string;

  /**
   * Change handler
   */
  onChange: (value: string) => void;

  /**
   * Placeholder text
   */
  placeholder?: string;

  /**
   * Whether the select is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Error message to display below select
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
 * Select Component
 *
 * @example
 * <Select
 *   label="Role"
 *   options={[
 *     { value: 'admin', label: 'Administrator' },
 *     { value: 'user', label: 'User' }
 *   ]}
 *   value={role}
 *   onChange={setRole}
 * />
 */
export const Select: React.FC<SelectProps> = ({
  id,
  label,
  options,
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  className = '',
  required = false,
}) => {
  const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'
        } ${
          error ? 'border-red-500' : 'border-gray-300'
        } disabled:opacity-50`}
      >
        {placeholder && (
          <option value="">{placeholder}</option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
    </div>
  );
};
