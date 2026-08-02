/**
 * Login — the real component, driven through the DOM.
 */

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Login } from '../../src/frontend/components/Login';

function makeHandlers(): {
  onSignIn: jest.Mock<Promise<boolean>, [string, string]>;
  onSignUp: jest.Mock<Promise<boolean>, [string, string]>;
} {
  return {
    onSignIn: jest.fn<Promise<boolean>, [string, string]>().mockResolvedValue(true),
    onSignUp: jest.fn<Promise<boolean>, [string, string]>().mockResolvedValue(true),
  };
}

function fillCredentials(email: string, password: string): void {
  fireEvent.change(screen.getByTestId('login-email'), { target: { value: email } });
  fireEvent.change(screen.getByTestId('login-password'), { target: { value: password } });
}

describe('Login', () => {
  it('renders sign-in mode by default', () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    expect(screen.getByTestId('login-view')).toBeInTheDocument();
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Sign in to Task App');
    expect(screen.getByTestId('login-submit')).toHaveTextContent('Sign in');
    expect(screen.queryByTestId('login-error')).not.toBeInTheDocument();
  });

  it('honours initialMode="signup"', () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} initialMode="signup" />);

    expect(screen.getByTestId('login-heading')).toHaveTextContent('Create your account');
    expect(screen.getByTestId('login-submit')).toHaveTextContent('Create account');
  });

  it('submits trimmed credentials to onSignIn', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    fillCredentials('  demo@example.com  ', 'password123');
    fireEvent.click(screen.getByTestId('login-submit'));

    await waitFor(() => expect(onSignIn).toHaveBeenCalledTimes(1));
    expect(onSignIn).toHaveBeenCalledWith('demo@example.com', 'password123');
    expect(onSignUp).not.toHaveBeenCalled();
  });

  it('routes the submit to onSignUp after toggling mode', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    fireEvent.click(screen.getByTestId('login-toggle-mode'));
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Create your account');

    fillCredentials('new@example.com', 'password123');
    fireEvent.click(screen.getByTestId('login-submit'));

    await waitFor(() => expect(onSignUp).toHaveBeenCalledTimes(1));
    expect(onSignUp).toHaveBeenCalledWith('new@example.com', 'password123');
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('toggles back to sign in', () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} initialMode="signup" />);

    fireEvent.click(screen.getByTestId('login-toggle-mode'));
    expect(screen.getByTestId('login-heading')).toHaveTextContent('Sign in to Task App');
  });

  it('blocks an empty submit with a local validation error', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    fireEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Email and password are required'
    );
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('blocks a whitespace-only email', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    fillCredentials('   ', 'password123');
    fireEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Email and password are required'
    );
    expect(onSignIn).not.toHaveBeenCalled();
  });

  it('clears the validation error once the user types again', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} />);

    fireEvent.click(screen.getByTestId('login-submit'));
    expect(await screen.findByTestId('login-error')).toBeInTheDocument();

    fillCredentials('demo@example.com', '');
    expect(screen.queryByTestId('login-error')).not.toBeInTheDocument();
  });

  it('renders the server error passed in as a prop', () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(
      <Login onSignIn={onSignIn} onSignUp={onSignUp} error="Invalid email or password" />
    );

    expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid email or password');
  });

  it('keeps the server error visible while the user retypes', () => {
    // Only the local validation error is cleared on change; the `error` prop is
    // owned by the caller and there is no clearError seam on this component.
    const { onSignIn, onSignUp } = makeHandlers();
    render(
      <Login onSignIn={onSignIn} onSignUp={onSignUp} error="Invalid email or password" />
    );

    fillCredentials('demo@example.com', 'password123');

    expect(screen.getByTestId('login-error')).toHaveTextContent('Invalid email or password');
  });

  it('shows the local validation error in preference to the server error', async () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} error="Server said no" />);

    fireEvent.click(screen.getByTestId('login-submit'));

    expect(await screen.findByTestId('login-error')).toHaveTextContent(
      'Email and password are required'
    );
  });

  it('disables the form and relabels the button while loading', () => {
    const { onSignIn, onSignUp } = makeHandlers();
    render(<Login onSignIn={onSignIn} onSignUp={onSignUp} isLoading />);

    expect(screen.getByTestId('login-submit')).toBeDisabled();
    expect(screen.getByTestId('login-submit')).toHaveTextContent('Please wait…');
    expect(screen.getByTestId('login-email')).toBeDisabled();
    expect(screen.getByTestId('login-password')).toBeDisabled();
    expect(screen.getByTestId('login-toggle-mode')).toBeDisabled();
  });
});
