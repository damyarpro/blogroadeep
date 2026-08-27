// Auth state for the authoring panel: the token lives in localStorage
// (see authToken.ts) and is revalidated against /api/auth/me/ on boot.
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fetchMe, isStaticMode, login as loginRequest, logout as logoutRequest } from './api';
import { readToken, writeToken } from './authToken';
import type { PanelUser } from './types';

interface AuthContextValue {
  user: PanelUser | null;
  /** True until the stored token has been checked against the backend. */
  loading: boolean;
  isStaff: boolean;
  login: (username: string, password: string) => Promise<PanelUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PanelUser | null>(null);
  const [loading, setLoading] = useState(!isStaticMode && Boolean(readToken()));

  // Revalidate a stored token once on boot; a stale one is simply dropped.
  useEffect(() => {
    if (isStaticMode || !readToken()) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then((me) => {
        if (!cancelled) setUser(me);
      })
      .catch(() => {
        if (!cancelled) {
          writeToken(null);
          setUser(null);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await loginRequest(username, password);
    writeToken(result.token);
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Token may already be gone server-side — clear it locally either way.
    }
    writeToken(null);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, loading, isStaff: Boolean(user?.is_staff), login, logout }),
    [user, loading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return context;
}
