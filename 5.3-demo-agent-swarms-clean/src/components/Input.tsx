import { useId } from 'react';
import type { ChangeEvent } from 'react';
import type { InputProps } from '../types';
import { cn } from '../utils/cn';

const SIZE_CLASSES: Record<NonNullable<InputProps['size']>, string> = {
  sm: 'px-2.5 py-1.5 text-sm',
  md: 'px-3 py-2 text-base',
  lg: 'px-4 py-2.5 text-lg',
};

const VALIDATION_CLASSES: Record<NonNullable<InputProps['validationState']>, string> = {
  default:
    'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
  error:
    'border-red-500 text-red-900 focus:border-red-500 focus:ring-red-500',
  success:
    'border-green-500 focus:border-green-500 focus:ring-green-500',
};

/**
 * A labelled, controlled text input with validation styling and helper /
 * error messaging wired up for assistive technology.
 */
export function Input({
  value,
  onChange,
  label,
  name,
  placeholder,
  type = 'text',
  validationState = 'default',
  errorMessage,
  helperText,
  size = 'md',
  disabled = false,
  required = false,
  onBlur,
  className,
  id,
  'data-testid': dataTestId,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = `${inputId}-description`;

  const isError = validationState === 'error';
  const showErrorMessage = isError && Boolean(errorMessage);
  const showHelperText = !showErrorMessage && Boolean(helperText);
  const describedBy = showErrorMessage || showHelperText ? descriptionId : undefined;

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    onChange(event.target.value, event);
  }

  return (
    <div className={cn('flex flex-col gap-1', className)} data-testid={dataTestId}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
          {label}
          {required && (
            <span aria-hidden="true" className="ml-0.5 text-red-500">
              *
            </span>
          )}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        onChange={handleChange}
        onBlur={onBlur}
        aria-invalid={isError ? true : undefined}
        aria-describedby={describedBy}
        aria-required={required || undefined}
        className={cn(
          'w-full rounded-md border bg-white shadow-sm',
          'focus:outline-none focus:ring-1',
          'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500',
          SIZE_CLASSES[size],
          VALIDATION_CLASSES[validationState]
        )}
      />
      {showErrorMessage && (
        <p id={descriptionId} className="text-sm text-red-600" role="alert">
          {errorMessage}
        </p>
      )}
      {showHelperText && (
        <p id={descriptionId} className="text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
}
