/**
 * Dropdown Component
 *
 * A reusable dropdown menu component with trigger and items.
 */

import React, { useState, useRef, useEffect } from 'react';

export interface DropdownItem {
  /**
   * Unique identifier for the item
   */
  id: string;

  /**
   * Display label for the item
   */
  label: string;

  /**
   * Whether the item is disabled
   */
  disabled?: boolean;
}

export interface DropdownProps {
  /**
   * The dropdown trigger/button text
   */
  trigger: React.ReactNode;

  /**
   * Menu items
   */
  items: DropdownItem[];

  /**
   * Callback when an item is selected
   */
  onSelect: (itemId: string) => void;

  /**
   * Whether the dropdown is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Additional CSS classes for the trigger button
   */
  triggerClassName?: string;

  /**
   * Additional CSS classes for the menu container
   */
  menuClassName?: string;
}

/**
 * Dropdown Component
 *
 * @example
 * <Dropdown
 *   trigger="Actions"
 *   items={[
 *     { id: 'edit', label: 'Edit' },
 *     { id: 'delete', label: 'Delete' }
 *   ]}
 *   onSelect={(id) => handleAction(id)}
 * />
 */
export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  onSelect,
  disabled = false,
  triggerClassName = '',
  menuClassName = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);

  const handleSelect = (itemId: string) => {
    onSelect(itemId);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block" ref={containerRef}>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={disabled}
        className={`px-4 py-2 rounded font-semibold transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          disabled ? 'opacity-50 cursor-not-allowed' : ''
        } ${triggerClassName}`}
      >
        {trigger}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute top-full right-0 mt-2 w-48 bg-white border border-gray-300 rounded shadow-lg z-10 ${menuClassName}`}
        >
          <ul className="py-1">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleSelect(item.id)}
                  disabled={item.disabled}
                  className={`w-full text-left px-4 py-2 transition-colors duration-150 ${
                    item.disabled
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-100 active:bg-gray-200'
                  }`}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
