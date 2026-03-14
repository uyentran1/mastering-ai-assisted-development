import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Toast } from '../src/components/Toast';

describe('Toast Component', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('does not render when not visible', () => {
    const { container } = render(
      <Toast message="Test message" isVisible={false} />
    );
    expect(container.innerHTML).toBe('');
  });

  it('renders when visible', () => {
    render(<Toast message="Success!" isVisible type="success" />);
    expect(screen.getByText('Success!')).toBeInTheDocument();
  });

  it('displays different types', () => {
    const { rerender } = render(
      <Toast message="Test" isVisible type="success" />
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();

    rerender(<Toast message="Test" isVisible type="error" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('auto-dismisses after duration', () => {
    const onClose = jest.fn();
    render(
      <Toast
        message="Test"
        isVisible
        duration={3000}
        onClose={onClose}
      />
    );

    jest.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalled();
  });

  it('uses default duration if not specified', () => {
    const onClose = jest.fn();
    render(
      <Toast message="Test" isVisible onClose={onClose} />
    );

    jest.advanceTimersByTime(5000);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders close button', () => {
    const onClose = jest.fn();
    render(
      <Toast message="Test" isVisible onClose={onClose} />
    );
    const closeBtn = screen.getByLabelText('Close toast');
    expect(closeBtn).toBeInTheDocument();
  });
});
