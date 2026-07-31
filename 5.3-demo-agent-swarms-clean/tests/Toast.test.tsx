import { act, render, screen } from '@testing-library/react';
import { fireEvent } from '@testing-library/react';
import { Toast } from '../src/components/Toast';

describe('Toast', () => {
  it('renders nothing when open is false', () => {
    render(<Toast message="Hidden" open={false} />);
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('is open by default', () => {
    render(<Toast message="Visible by default" />);
    expect(screen.getByText('Visible by default')).toBeInTheDocument();
  });

  it('renders the message content', () => {
    render(<Toast message="Saved successfully" />);
    expect(screen.getByText('Saved successfully')).toBeInTheDocument();
  });

  it('renders the title when provided', () => {
    render(<Toast title="Heads up" message="Something happened" />);
    expect(screen.getByText('Heads up')).toBeInTheDocument();
  });

  it('omits a title element when title is not provided', () => {
    render(<Toast message="No title here" />);
    expect(screen.queryByText('Heads up')).not.toBeInTheDocument();
  });

  describe('variants', () => {
    it('defaults to the info variant with role="status" and aria-live="polite"', () => {
      render(<Toast message="Info message" />);
      const el = screen.getByRole('status');
      expect(el).toHaveAttribute('aria-live', 'polite');
    });

    it('renders the success variant with role="status" and aria-live="polite"', () => {
      render(<Toast variant="success" message="Success message" />);
      const el = screen.getByRole('status');
      expect(el).toHaveAttribute('aria-live', 'polite');
    });

    it('renders the error variant with role="alert" and aria-live="assertive"', () => {
      render(<Toast variant="error" message="Error message" />);
      const el = screen.getByRole('alert');
      expect(el).toHaveAttribute('aria-live', 'assertive');
    });

    it('renders the warning variant with role="alert" and aria-live="assertive"', () => {
      render(<Toast variant="warning" message="Warning message" />);
      const el = screen.getByRole('alert');
      expect(el).toHaveAttribute('aria-live', 'assertive');
    });

    it('applies distinct colour classes per variant', () => {
      const { rerender } = render(<Toast variant="success" message="msg" />);
      const successClass = screen.getByRole('status').className;

      rerender(<Toast variant="info" message="msg" />);
      const infoClass = screen.getByRole('status').className;

      expect(successClass).not.toEqual(infoClass);
    });

    it('renders a default icon for each variant', () => {
      const { rerender } = render(<Toast variant="success" message="msg" />);
      expect(screen.getByTestId('toast-icon')).toBeInTheDocument();

      rerender(<Toast variant="error" message="msg" />);
      expect(screen.getByTestId('toast-icon')).toBeInTheDocument();

      rerender(<Toast variant="warning" message="msg" />);
      expect(screen.getByTestId('toast-icon')).toBeInTheDocument();

      rerender(<Toast variant="info" message="msg" />);
      expect(screen.getByTestId('toast-icon')).toBeInTheDocument();
    });

    it('overrides the default icon via the icon prop', () => {
      render(<Toast message="msg" icon={<span data-testid="custom-icon">*</span>} />);
      expect(screen.getByTestId('custom-icon')).toBeInTheDocument();
    });
  });

  describe('dismiss button', () => {
    it('renders a dismiss button by default', () => {
      render(<Toast message="Dismissible" />);
      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument();
    });

    it('hides the dismiss button when dismissible is false', () => {
      render(<Toast message="Not dismissible" dismissible={false} />);
      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
    });

    it('calls onDismiss when the dismiss button is clicked', () => {
      const onDismiss = jest.fn();
      render(<Toast message="Click to dismiss" onDismiss={onDismiss} />);
      fireEvent.click(screen.getByRole('button', { name: /dismiss/i }));
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  describe('auto-dismiss timer', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('calls onDismiss automatically after the default 5000ms duration', () => {
      const onDismiss = jest.fn();
      render(<Toast message="Auto dismiss" onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(4999);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('respects a custom duration', () => {
      const onDismiss = jest.fn();
      render(<Toast message="Fast dismiss" duration={1000} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('never auto-dismisses when duration is null', () => {
      const onDismiss = jest.fn();
      render(<Toast message="Persistent" duration={null} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(60000);
      });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('clears the timer on unmount so onDismiss is not called later', () => {
      const onDismiss = jest.fn();
      const { unmount } = render(
        <Toast message="Unmount me" duration={1000} onDismiss={onDismiss} />
      );
      unmount();

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(onDismiss).not.toHaveBeenCalled();
    });

    it('resets the timer when duration changes', () => {
      const onDismiss = jest.fn();
      const { rerender } = render(
        <Toast message="Reset timer" duration={5000} onDismiss={onDismiss} />
      );

      act(() => {
        jest.advanceTimersByTime(3000);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      rerender(<Toast message="Reset timer" duration={1000} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(999);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      act(() => {
        jest.advanceTimersByTime(1);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });

    it('does not schedule a timer while closed, and starts it once opened', () => {
      const onDismiss = jest.fn();
      const { rerender } = render(
        <Toast message="Opens later" open={false} duration={1000} onDismiss={onDismiss} />
      );

      act(() => {
        jest.advanceTimersByTime(5000);
      });
      expect(onDismiss).not.toHaveBeenCalled();

      rerender(<Toast message="Opens later" open duration={1000} onDismiss={onDismiss} />);

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(onDismiss).toHaveBeenCalledTimes(1);
    });
  });

  it('forwards className onto the root element', () => {
    render(<Toast message="Styled" className="custom-toast" />);
    expect(screen.getByRole('status').className).toContain('custom-toast');
  });

  it('forwards data-testid onto the root element', () => {
    render(<Toast message="Testable" data-testid="my-toast" />);
    expect(screen.getByTestId('my-toast')).toBeInTheDocument();
  });

  it('forwards id onto the root element', () => {
    render(<Toast message="Identified" id="save-toast" />);
    expect(screen.getByRole('status')).toHaveAttribute('id', 'save-toast');
  });
});
