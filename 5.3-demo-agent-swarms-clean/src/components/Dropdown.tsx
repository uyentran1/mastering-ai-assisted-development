import { useEffect, useId, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent, MouseEvent as ReactMouseEvent } from 'react';
import type { DropdownItem, DropdownProps, Placement } from '../types';
import { cn } from '../utils/cn';

const PLACEMENT_CLASSES: Record<Placement, string> = {
  'bottom-start': 'top-full left-0 mt-1',
  'bottom-end': 'top-full right-0 mt-1',
  'top-start': 'bottom-full left-0 mb-1',
  'top-end': 'bottom-full right-0 mb-1',
};

function firstEnabledIndex(items: readonly DropdownItem[]): number {
  return items.findIndex((item) => !item.disabled);
}

function lastEnabledIndex(items: readonly DropdownItem[]): number {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (!items[i].disabled) {
      return i;
    }
  }
  return -1;
}

function nextEnabledIndex(
  items: readonly DropdownItem[],
  from: number,
  direction: 1 | -1
): number {
  if (items.length === 0) {
    return -1;
  }
  let index = from;
  for (let step = 0; step < items.length; step += 1) {
    index += direction;
    if (index < 0) {
      index = items.length - 1;
    } else if (index >= items.length) {
      index = 0;
    }
    if (!items[index].disabled) {
      return index;
    }
  }
  return -1;
}

/**
 * An action menu triggered by a button, supporting both controlled
 * (`open` supplied) and uncontrolled (`defaultOpen`) usage.
 */
export function Dropdown({
  trigger,
  items,
  onSelect,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  placement = 'bottom-start',
  disabled = false,
  label,
  className,
  id,
  'data-testid': dataTestId,
}: DropdownProps) {
  const isControlled = controlledOpen !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const open = isControlled ? controlledOpen : uncontrolledOpen;

  const [activeIndex, setActiveIndex] = useState(-1);

  const generatedId = useId();
  const rootId = id ?? generatedId;
  const triggerId = `${rootId}-trigger`;
  const menuId = `${rootId}-menu`;

  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<Array<HTMLLIElement | null>>([]);

  function setOpen(next: boolean) {
    if (!isControlled) {
      setUncontrolledOpen(next);
    }
    onOpenChange?.(next);
  }

  useEffect(() => {
    if (!open) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(firstEnabledIndex(items));
      itemRefs.current[0]?.focus?.();
    } else {
      setActiveIndex(-1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (open && activeIndex >= 0) {
      itemRefs.current[activeIndex]?.focus();
    }
  }, [open, activeIndex]);

  function openMenu() {
    if (disabled) {
      return;
    }
    setOpen(true);
  }

  function closeMenu(focusTrigger = false) {
    setOpen(false);
    if (focusTrigger) {
      triggerRef.current?.focus();
    }
  }

  function activateItem(item: DropdownItem) {
    if (item.disabled) {
      return;
    }
    item.onSelect?.();
    onSelect?.(item);
    closeMenu(true);
  }

  function handleTriggerClick() {
    if (disabled) {
      return;
    }
    if (open) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  function handleTriggerKeyDown(event: ReactKeyboardEvent<HTMLButtonElement>) {
    if (disabled) {
      return;
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!open) {
          openMenu();
        } else {
          setActiveIndex((current) => nextEnabledIndex(items, current, 1));
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (!open) {
          openMenu();
        } else {
          setActiveIndex((current) => nextEnabledIndex(items, current, -1));
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (!open) {
          openMenu();
        }
        break;
      case 'Escape':
        if (open) {
          event.preventDefault();
          closeMenu(true);
        }
        break;
      default:
        break;
    }
  }

  function handleMenuKeyDown(event: ReactKeyboardEvent<HTMLUListElement>) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setActiveIndex((current) => nextEnabledIndex(items, current, 1));
        break;
      case 'ArrowUp':
        event.preventDefault();
        setActiveIndex((current) => nextEnabledIndex(items, current, -1));
        break;
      case 'Home':
        event.preventDefault();
        setActiveIndex(firstEnabledIndex(items));
        break;
      case 'End':
        event.preventDefault();
        setActiveIndex(lastEnabledIndex(items));
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (activeIndex >= 0) {
          activateItem(items[activeIndex]);
        }
        break;
      case 'Escape':
        event.preventDefault();
        closeMenu(true);
        break;
      case 'Tab':
        closeMenu();
        break;
      default:
        break;
    }
  }

  function handleItemClick(event: ReactMouseEvent<HTMLLIElement>, item: DropdownItem) {
    event.preventDefault();
    activateItem(item);
  }

  return (
    <div className={cn('relative inline-block', className)} id={rootId} data-testid={dataTestId}>
      <button
        ref={triggerRef}
        type="button"
        id={triggerId}
        disabled={disabled}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={handleTriggerClick}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          'inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900',
          'hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600',
          'disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400'
        )}
      >
        {trigger}
      </button>
      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-labelledby={triggerId}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className={cn(
            'absolute z-10 min-w-[10rem] overflow-auto rounded-md border border-gray-200 bg-white py-1 shadow-lg',
            PLACEMENT_CLASSES[placement]
          )}
        >
          {items.map((item, index) => (
            <li
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              role="menuitem"
              tabIndex={index === activeIndex ? 0 : -1}
              aria-disabled={item.disabled || undefined}
              onMouseEnter={() => !item.disabled && setActiveIndex(index)}
              onClick={(event) => handleItemClick(event, item)}
              className={cn(
                'flex cursor-pointer items-center gap-2 px-4 py-2 text-sm outline-none',
                item.disabled && 'cursor-not-allowed text-gray-400',
                !item.disabled && index === activeIndex && 'bg-blue-50 text-blue-700',
                !item.disabled && index !== activeIndex && 'text-gray-900'
              )}
            >
              {item.icon && (
                <span className="shrink-0" aria-hidden="true">
                  {item.icon}
                </span>
              )}
              <span className="truncate">{item.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
