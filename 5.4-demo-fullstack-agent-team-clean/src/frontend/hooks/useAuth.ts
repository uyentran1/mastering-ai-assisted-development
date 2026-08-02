/**
 * Auth state management.
 *
 * Owns the session token, persists it to localStorage under
 * `task-app-token`, restores it on mount, and clears it on sign-out.
 * All localStorage access is guarded because it throws in restricted
 * contexts (private browsing, disabled storage, non-browser test envs).
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { User } from '../../shared/types';
import * as api from '../api';

export const TOKEN_STORAGE_KEY = api.TOKEN_STORAGE_KEY;

export interface UseAuthResult {
  /** The authenticated user, from `GET /api/auth/me`. */
  user: User | null;
  /** The active session token, or null when signed out. */
  token: string | null;
  /** True only when both a token and a resolved user are present. */
  isAuthenticated: boolean;
  /** True while a sign-in, sign-up, sign-out or session restore is in flight. */
  isLoading: boolean;
  /** Human readable message from the last failed auth operation. */
  error: string | null;
  /** Sign in and load the real user. Resolves true on success. */
  signIn: (email: string, password: string) => Promise<boolean>;
  /** Create an account, then sign in with the same credentials. */
  signUp: (email: string, password: string) => Promise<boolean>;
  /** Clear the session locally and server-side. */
  signOut: () => Promise<void>;
  /** Dismiss the current error. */
  clearError: () => void;
}

function readStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  } catch {
    return null;
  }
}

function writeStoredToken(token: string): void {
  try {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    // Storage unavailable — the session simply will not survive a reload.
  }
}

function clearStoredToken(): void {
  try {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Nothing to do; the in-memory token is cleared regardless.
  }
}

function messageOf(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export function useAuth(): UseAuthResult {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const isMountedRef = useRef<boolean>(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Restore a persisted session on mount.
  useEffect(() => {
    const stored = readStoredToken();
    if (!stored) {
      return;
    }

    let cancelled = false;
    api.setAuthToken(stored);
    setIsLoading(true);

    api
      .getCurrentUser()
      .then((restored) => {
        if (cancelled) return;
        setToken(stored);
        setUser(restored);
      })
      .catch(() => {
        if (cancelled) return;
        // A stale or rejected token is worthless — drop it silently.
        api.setAuthToken(null);
        clearStoredToken();
        setToken(null);
        setUser(null);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const clearError = useCallback((): void => {
    setError(null);
  }, []);

  const signIn = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const auth = await api.signIn({ email, password });

      if (!auth.token) {
        throw new Error('Sign in did not return a session token');
      }

      api.setAuthToken(auth.token);
      writeStoredToken(auth.token);

      // Take the real user (with a true created_at) from /auth/me rather
      // than synthesising one from the sign-in response.
      const currentUser = await api.getCurrentUser();

      setToken(auth.token);
      setUser(currentUser);
      return true;
    } catch (err) {
      api.setAuthToken(null);
      clearStoredToken();
      setToken(null);
      setUser(null);
      setError(messageOf(err, 'Unable to sign in'));
      return false;
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  const signUp = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      setIsLoading(true);
      setError(null);

      try {
        // Signup returns no token, so the account has to be signed into.
        await api.signUp({ email, password });
      } catch (err) {
        setError(messageOf(err, 'Unable to create account'));
        setIsLoading(false);
        return false;
      }

      setIsLoading(false);
      return signIn(email, password);
    },
    [signIn]
  );

  const signOut = useCallback(async (): Promise<void> => {
    setIsLoading(true);

    try {
      await api.signOut();
    } catch {
      // Sign-out is best effort; the local session is dropped either way.
    }

    api.setAuthToken(null);
    clearStoredToken();
    setToken(null);
    setUser(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    user,
    token,
    isAuthenticated: user !== null && token !== null,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    clearError,
  };
}

export default useAuth;
