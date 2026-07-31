import { useState } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../src/components/Modal';

describe('Modal', () => {
  it('renders nothing when open is false', () => {
    render(
      <Modal open={false} onClose={jest.fn()} title="Hidden">
        Body content
      </Modal>
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders the dialog and children when open', () => {
    render(
      <Modal open onClose={jest.fn()} title="My Title">
        Body content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Body content')).toBeInTheDocument();
  });

  it('sets aria-modal to true', () => {
    render(
      <Modal open onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('wires aria-labelledby to the title when title is provided', () => {
    render(
      <Modal open onClose={jest.fn()} title="Settings">
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const labelledBy = dialog.getAttribute('aria-labelledby');
    expect(labelledBy).toBeTruthy();
    expect(document.getElementById(labelledBy as string)).toHaveTextContent('Settings');
  });

  it('does not set aria-labelledby when no title is provided', () => {
    render(
      <Modal open onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
  });

  it('renders footer content when provided', () => {
    render(
      <Modal open onClose={jest.fn()} footer={<span>Footer actions</span>}>
        Content
      </Modal>
    );
    expect(screen.getByText('Footer actions')).toBeInTheDocument();
  });

  it('does not render a footer wrapper when footer is omitted', () => {
    render(
      <Modal open onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.queryByText('Footer actions')).not.toBeInTheDocument();
  });

  it('renders an accessible close button by default', () => {
    render(
      <Modal open onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument();
  });

  it('hides the close button when showCloseButton is false', () => {
    render(
      <Modal open onClose={jest.fn()} showCloseButton={false}>
        Content
      </Modal>
    );
    expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument();
  });

  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        Content
      </Modal>
    );
    fireEvent.click(screen.getByRole('button', { name: /close/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is clicked', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose} data-testid="modal">
        Content
      </Modal>
    );
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the panel', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        <p>Click me</p>
      </Modal>
    );
    fireEvent.click(screen.getByText('Click me'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not close on overlay click when closeOnOverlayClick is false', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose} closeOnOverlayClick={false} data-testid="modal">
        Content
      </Modal>
    );
    fireEvent.click(screen.getByTestId('modal-overlay'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape is pressed', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose}>
        Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not close on Escape when closeOnEscape is false', () => {
    const onClose = jest.fn();
    render(
      <Modal open onClose={onClose} closeOnEscape={false}>
        Content
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes the keydown listener on unmount', () => {
    const onClose = jest.fn();
    const { unmount } = render(
      <Modal open onClose={onClose}>
        Content
      </Modal>
    );
    unmount();
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('maps size to the expected max-width class', () => {
    const { rerender } = render(
      <Modal open onClose={jest.fn()} size="sm">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog').className).toContain('max-w-sm');

    rerender(
      <Modal open onClose={jest.fn()} size="lg">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog').className).toContain('max-w-lg');

    rerender(
      <Modal open onClose={jest.fn()} size="xl">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog').className).toContain('max-w-xl');
  });

  it('defaults to the md size class', () => {
    render(
      <Modal open onClose={jest.fn()}>
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog').className).toContain('max-w-md');
  });

  it('moves focus into the dialog on open', () => {
    render(
      <Modal open onClose={jest.fn()} title="Focus test">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toContainElement(document.activeElement as HTMLElement);
  });

  it('restores focus to the previously focused element on close', () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <div>
          <button onClick={() => setOpen(true)}>Open modal</button>
          <Modal open={open} onClose={() => setOpen(false)}>
            Content
          </Modal>
        </div>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole('button', { name: 'Open modal' });
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    fireEvent.click(trigger);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(document.activeElement).not.toBe(trigger);

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('traps Tab within the dialog', () => {
    render(
      <Modal open onClose={jest.fn()} footer={<button>Confirm</button>}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    confirmButton.focus();
    expect(document.activeElement).toBe(confirmButton);

    // Tab from the last focusable element should wrap to the first.
    fireEvent.keyDown(dialog, { key: 'Tab' });
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(document.activeElement).toBe(closeButton);
  });

  it('wraps Shift+Tab from the first focusable element to the last', () => {
    render(
      <Modal open onClose={jest.fn()} footer={<button>Confirm</button>}>
        Content
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    const closeButton = screen.getByRole('button', { name: /close/i });
    const confirmButton = screen.getByRole('button', { name: 'Confirm' });

    closeButton.focus();
    expect(document.activeElement).toBe(closeButton);

    fireEvent.keyDown(dialog, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(confirmButton);
  });

  it('keeps focus on the panel when Tab is pressed with no focusable elements', () => {
    render(
      <Modal open onClose={jest.fn()} showCloseButton={false}>
        <p>No focusable elements here</p>
      </Modal>
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.keyDown(dialog, { key: 'Tab' });
    expect(document.activeElement).toBe(dialog);
  });

  it('forwards className onto the dialog element', () => {
    render(
      <Modal open onClose={jest.fn()} className="custom-modal">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog').className).toContain('custom-modal');
  });

  it('forwards data-testid onto the dialog element', () => {
    render(
      <Modal open onClose={jest.fn()} data-testid="my-modal">
        Content
      </Modal>
    );
    expect(screen.getByTestId('my-modal')).toBeInTheDocument();
  });

  it('forwards id onto the dialog element', () => {
    render(
      <Modal open onClose={jest.fn()} id="confirm-modal">
        Content
      </Modal>
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('id', 'confirm-modal');
  });

  it('accepts arbitrary ReactNode footer content without importing Button', () => {
    render(
      <Modal
        open
        onClose={jest.fn()}
        footer={
          <>
            <button type="button">Cancel</button>
            <button type="button">Save</button>
          </>
        }
      >
        Content
      </Modal>
    );
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
  });
});
