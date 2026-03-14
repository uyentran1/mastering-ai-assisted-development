/**
 * useAuth hook - simple auth state management
 */

import { useState } from 'react';

export interface AuthState {
  isAuthenticated: boolean;
  userId: string | null;
  email: string | null;
  token: string | null;
}

export const useAuth = () => {
  const [auth, setAuth] = useState<AuthState>({
    isAuthenticated: false,
    userId: null,
    email: null,
    token: null,
  });

  const login = (userId: string, email: string, token: string) => {
    setAuth({
      isAuthenticated: true,
      userId,
      email,
      token,
    });
  };

  const logout = () => {
    setAuth({
      isAuthenticated: false,
      userId: null,
      email: null,
      token: null,
    });
  };

  return { ...auth, login, logout };
};
