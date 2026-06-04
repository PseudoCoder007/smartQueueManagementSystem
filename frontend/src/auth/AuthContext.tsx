import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { api, jsonBody } from '../api/client';
import type { AdminLoginResponse, AuthResponse, UserProfile } from '../types/models';

type Session = { token: string; user: UserProfile };

interface AuthState {
  session: Session | null;
  setUserSession: (response: AuthResponse) => void;
  adminLogin: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const stored = (): Session | null => {
  const raw = localStorage.getItem('smartqueue.session');
  return raw ? JSON.parse(raw) as Session : null;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(stored);

  const value = useMemo<AuthState>(() => ({
    session,
    setUserSession(response) {
      const next = { token: response.appToken, user: response };
      localStorage.setItem('smartqueue.session', JSON.stringify(next));
      setSession(next);
    },
    async adminLogin(email, password) {
      const response = await api<AdminLoginResponse>('/auth/admin/login', {
        method: 'POST',
        ...jsonBody({ email, password })
      });
      const next = { token: response.token, user: response.user };
      localStorage.setItem('smartqueue.session', JSON.stringify(next));
      setSession(next);
    },
    logout() {
      localStorage.removeItem('smartqueue.session');
      setSession(null);
    }
  }), [session]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return value;
}
