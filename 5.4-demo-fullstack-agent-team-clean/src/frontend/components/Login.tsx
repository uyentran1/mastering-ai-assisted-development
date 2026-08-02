/**
 * Login — email/password form that toggles between sign in and sign up.
 *
 * The component owns only form state. Credentials are handed to the
 * callbacks; the auth result and any server error come back in as props.
 */

import React, { useState } from 'react';

export type LoginMode = 'signin' | 'signup';

export interface LoginProps {
  /** Called with the entered credentials in sign-in mode. */
  onSignIn: (email: string, password: string) => Promise<boolean>;
  /** Called with the entered credentials in sign-up mode. */
  onSignUp: (email: string, password: string) => Promise<boolean>;
  /** Disables the form and relabels the submit button while true. */
  isLoading?: boolean;
  /** Server-side error message to display. */
  error?: string | null;
  /** Which form to show first. Defaults to `'signin'`. */
  initialMode?: LoginMode;
}

export const Login: React.FC<LoginProps> = ({
  onSignIn,
  onSignUp,
  isLoading = false,
  error = null,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<LoginMode>(initialMode);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const isSignUp = mode === 'signup';
  const heading = isSignUp ? 'Create your account' : 'Sign in to Task App';
  const submitLabel = isSignUp ? 'Create account' : 'Sign in';
  const visibleError = validationError ?? error;

  function handleEmailChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setEmail(event.target.value);
    setValidationError(null);
  }

  function handlePasswordChange(event: React.ChangeEvent<HTMLInputElement>): void {
    setPassword(event.target.value);
    setValidationError(null);
  }

  function handleToggleMode(): void {
    setMode(isSignUp ? 'signin' : 'signup');
    setValidationError(null);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();

    const trimmedEmail = email.trim();

    if (!trimmedEmail || !password) {
      setValidationError('Email and password are required');
      return;
    }

    setValidationError(null);

    if (isSignUp) {
      await onSignUp(trimmedEmail, password);
    } else {
      await onSignIn(trimmedEmail, password);
    }
  }

  return (
    <div
      data-testid="login-view"
      className="flex min-h-screen items-center justify-center bg-slate-100 px-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-md">
        <h1
          data-testid="login-heading"
          className="mb-6 text-center text-2xl font-semibold text-slate-900"
        >
          {heading}
        </h1>

        <form data-testid="login-form" onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="login-email"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Email
            </label>
            <input
              id="login-email"
              data-testid="login-email"
              type="email"
              name="email"
              autoComplete="email"
              value={email}
              onChange={handleEmailChange}
              disabled={isLoading}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="login-password"
              className="mb-1 block text-sm font-medium text-slate-700"
            >
              Password
            </label>
            <input
              id="login-password"
              data-testid="login-password"
              type="password"
              name="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={password}
              onChange={handlePasswordChange}
              disabled={isLoading}
              className="w-full rounded-md border border-slate-300 px-3 py-2 text-slate-900 focus:border-blue-500 focus:outline-none"
            />
          </div>

          {visibleError && (
            <p data-testid="login-error" role="alert" className="text-sm text-red-600">
              {visibleError}
            </p>
          )}

          <button
            data-testid="login-submit"
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            {isLoading ? 'Please wait…' : submitLabel}
          </button>
        </form>

        <button
          data-testid="login-toggle-mode"
          type="button"
          onClick={handleToggleMode}
          disabled={isLoading}
          className="mt-4 w-full text-sm text-blue-600 hover:underline"
        >
          {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
        </button>
      </div>
    </div>
  );
};

export default Login;
