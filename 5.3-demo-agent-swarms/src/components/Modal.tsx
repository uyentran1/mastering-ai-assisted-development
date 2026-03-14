/**
 * Modal Component
 *
 * A reusable dialog/modal component with overlay.
 */

import React from 'react';

export interface ModalProps {
  /**
   * Whether the modal is visible
   */
  isOpen: boolean;

  /**
   * Modal title
   */
  title?: string;

  /**
   * Modal content
   */
  children: React.ReactNode;

  /**
   * Callback when closing the modal
   */
  onClose: () => void;

  /**
   * Optional footer content (buttons, etc.)
   */
  footer?: React.ReactNode;

  /**
   * Whether clicking outside closes the modal
   * @default true
   */
  closeOnOverlayClick?: boolean;
}

/**
 * Modal Component
 *
 * @example
 * <Modal
 *   isOpen={isOpen}
 *   title="Confirm Action"
 *   onClose={() => setIsOpen(false)}
 *   footer={
 *     <>
 *       <Button onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button variant="danger" onClick={handleDelete}>Delete</Button>
 *     </>
 *   }
 * >
 *   Are you sure you want to delete this item?
 * </Modal>
 */
export const Modal: React.FC<ModalProps> = ({
  isOpen,
  title,
  children,
  onClose,
  footer,
  closeOnOverlayClick = true,
}) => {
  if (!isOpen) {
    return null;
  }

  const handleOverlayClick = () => {
    if (closeOnOverlayClick) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={handleOverlayClick}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
              aria-label="Close modal"
            >
              <span className="text-2xl">&times;</span>
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-6 py-4">{children}</div>

        {/* Footer */}
        {footer && (
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
