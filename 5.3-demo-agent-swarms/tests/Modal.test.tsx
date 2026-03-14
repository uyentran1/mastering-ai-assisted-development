import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../src/components/Modal';

describe('Modal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
  };

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <Modal isOpen={false} onClose={jest.fn()}>
        Modal content
      </Modal>
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps}>Modal content</Modal>);
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('displays title', () => {
    render(
      <Modal {...defaultProps} title="Confirm">
        Modal content
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose} title="Test">
        Content
      </Modal>
    );
    const closeButton = screen.getByLabelText('Close modal');
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose} closeOnOverlayClick>
        Content
      </Modal>
    );
    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const onClose = jest.fn();
    render(
      <Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false}>
        Content
      </Modal>
    );
    const overlay = document.querySelector('[aria-hidden="true"]') as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('renders footer content', () => {
    render(
      <Modal {...defaultProps} footer={<button>Confirm</button>}>
        Modal content
      </Modal>
    );
    expect(screen.getByText('Confirm')).toBeInTheDocument();
  });
});
