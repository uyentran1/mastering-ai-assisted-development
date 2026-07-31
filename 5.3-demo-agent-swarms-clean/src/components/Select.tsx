import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { SelectOption, SelectProps } from '../types';
import { cn } from '../utils/cn';

const SIZE_TRIGGER_CLASSES: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

const SIZE_OPTION_CLASSES: Record<NonNullable<SelectProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-base',
  lg: 'px-5 py-2.5 text-lg',
};

function isSelected(props: SelectProps, value: string): boolean {
  if (props.multiple) {
    return props.value.includes(value);
  }
  return props.value === value;
}

function firstEnabledIndex(options: readonly SelectOption[]): number {
  return options.findIndex((option) => !option.disabled);
}

function lastEnabledIndex(options: readonly SelectOption[]): number {
  for (let i = options.length - 1; i >= 0; i -= 1) {
    if (!options[i].disabled) {
      return i;
    }
  }
  return -1;
}

function nextEnabledIndex(
  options: readonly SelectOption[],
  from: number,
  direction: 1 | -1
): number {
  if (options.length === 0) {
    return -1;
  }
  let index = from;
  for (let step = 0; step < options.length; step += 1) {
    index += direction;
    if (index < 0) {
      index = options.length - 1;
    } else if (index >= options.length) {
      index = 0;
    }
    if (!options[index].disabled) {
      return index;
    }
  }
  return -1;
}

/**
 * A custom listbox control supporting both single- and multi-selection,
 * driven entirely via `props.multiple` narrowing rather than a native
 * `<select>` element.
 */
export function Select(props: SelectProps) {
  const {
    options,
    label,
    placeholder = 'Select an option',
    size = 'md',
    name,
    disabled = false,
    required = false,
    validationState = 'default',
    errorMessage,
    className,
    id,
    'data-testid': dataTestId,
  } = props;

  const generatedId = useId();
  const rootId = id ?? generatedId;
  const labelId = `${rootId}-label`;
  const triggerId = `${rootId}-trigger`;
  const listboxId = `${rootId}-listbox`;
  const errorId = `${rootId}-error`;

  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  const isError = validationState === 'error';

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        listboxRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      optionRefs.current[activeIndex]?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [open, activeIndex]);

  function openList(initialIndex?: number) {
    if (disabled) {
      return;
    }
    setOpen(true);
    if (typeof initialIndex === 'number') {
      setActiveIndex(initialIndex);
      return;
    }
    if (props.multiple) {
      const firstSelected = options.findIndex((option) =>
        props.value.includes(option.value)
      );
      setActiveIndex(firstSelected >= 0 ? firstSelected : firstEnabledIndex(options));
    } else {
      const selected = options.findIndex((option) => option.value === props.value);
      setActiveIndex(selected >= 0 ? selected : firstEnabledIndex(options));
    }
  }

  function closeList(focusTrigger = false) {
    setOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }

  function commitValue(option: SelectOption) {
    if (option.disabled) {
      return;
    }
    if (props.multiple) {
      const current = props.value;
      const next = current.includes(option.value)
        ? current.filter((value) => value !== option.value)
        : [...current, option.value];
      props.onChange(next);
    } else {
      props.onChange(option.value);
      closeList(true);
    }
  }

  function handleTriggerClick() {
    if (disabled) {
      return;
    }
    if (open) {
      closeList();
    } else {
      openList();
    }
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          openList();
        } else {
          const direction = event.key === 'ArrowDown' ? 1 : -1;
          setActiveIndex((current) => nextEnabledIndex(options, current, direction));
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) {
          openList();
        } else if (activeIndex >= 0) {
          commitValue(options[activeIndex]);
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeList();
        }
        break;
      case 'Home':
        if (open) {
          event.preventDefault();
          setActiveIndex(firstEnabledIndex(options));
        }
        break;
      case 'End':
        if (open) {
          event.preventDefault();
          setActiveIndex(lastEnabledIndex(options));
        }
        break;
      case 'Tab':
        if (open) {
          closeList();
        }
        break;
      default:
        break;
    }
  }

  function handleOptionClick(event: ReactMouseEvent<HTMLLIElement>, option: SelectOption) {
    event.preventDefault();
    commitValue(option);
  }

  function selectedLabels(): string[] {
    if (props.multiple) {
      return options
        .filter((option) => props.value.includes(option.value))
        .map((option) => option.label);
    }
    const match = options.find((option) => option.value === props.value);
    return match ? [match.label] : [];
  }

  function displayText(): string {
    const labels = selectedLabels();
    if (props.multiple) {
      if (labels.length === 0) {
        return placeholder;
      }
      if (labels.length <= 2) {
        return labels.join(', ');
      }
      return `${labels.length} selected`;
    }
    return labels[0] ?? placeholder;
  }

  const hasSelection = selectedLabels().length > 0;

  return (
    <div
      className={cn('flex w-full flex-col gap-1', className)}
      id={rootId}
      data-testid={dataTestId}
    >
      {label && (
        <label id={labelId} htmlFor={triggerId} className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          id={triggerId}
          name={name}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={label ? `${labelId} ${triggerId}` : undefined}
          aria-invalid={isError || undefined}
          aria-describedby={isError && errorMessage ? errorId : undefined}
          aria-controls={listboxId}
          onClick={handleTriggerClick}
          onKeyDown={handleTriggerKeyDown}
          className={cn(
            'flex w-full items-center justify-between rounded-md border bg-white text-left',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
            'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400',
            SIZE_TRIGGER_CLASSES[size],
            isError
              ? 'border-red-500 text-red-900'
              : 'border-gray-300 text-gray-900',
            !hasSelection && !isError && 'text-gray-500'
          )}
        >
          <span className="truncate">{displayText()}</span>
          <svg
            className={cn('ml-2 h-4 w-4 shrink-0 transition-transform', open && 'rotate-180')}
            viewBox="0 0 20 20"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M5 7l5 5 5-5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {open && (
          <ul
            ref={listboxRef}
            id={listboxId}
            role="listbox"
            aria-multiselectable={props.multiple || undefined}
            aria-labelledby={label ? labelId : undefined}
            tabIndex={-1}
            className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg"
          >
            {options.map((option, index) => {
              const selected = isSelected(props, option.value);
              const active = index === activeIndex;
              return (
                <li
                  key={option.value}
                  ref={(node) => {
                    optionRefs.current[index] = node;
                  }}
                  role="option"
                  aria-selected={selected}
                  aria-disabled={option.disabled || undefined}
                  onMouseEnter={() => !option.disabled && setActiveIndex(index)}
                  onClick={(event) => handleOptionClick(event, option)}
                  className={cn(
                    'flex cursor-pointer items-center justify-between',
                    SIZE_OPTION_CLASSES[size],
                    option.disabled && 'cursor-not-allowed text-gray-400',
                    !option.disabled && active && 'bg-blue-50',
                    !option.disabled && selected && 'font-medium text-blue-700',
                    !option.disabled && !selected && 'text-gray-900'
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {selected && (
                    <svg
                      className="ml-2 h-4 w-4 shrink-0 text-blue-600"
                      viewBox="0 0 20 20"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path
                        d="M4 10l4 4 8-8"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {isError && errorMessage && (
        <p id={errorId} className="text-sm text-red-600">
          {errorMessage}
        </p>
      )}
    </div>
  );
}
