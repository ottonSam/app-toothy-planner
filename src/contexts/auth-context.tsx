import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { getCurrentUser, logout } from '@/api/auth';
import { queryKeys } from '@/lib/query-keys';
import type { UserResponse } from '@/types/api';

type AuthStatus = 'authenticated' | 'loading' | 'unauthenticated';

type AuthContextValue = {
  clearUser: () => Promise<void>;
  refreshUser: () => Promise<UserResponse | null>;
  setAuthenticatedUser: (user: UserResponse) => void;
  status: AuthStatus;
  user: UserResponse | null;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<UserResponse | null>(null);
  const [status, setStatus] = useState<AuthStatus>('loading');

  const setAuthenticatedUser = useCallback(
    (nextUser: UserResponse) => {
      setUser(nextUser);
      setStatus('authenticated');
      queryClient.setQueryData(queryKeys.user, nextUser);
    },
    [queryClient]
  );

  const refreshUser = useCallback(async () => {
    setStatus((current) => (current === 'authenticated' ? current : 'loading'));

    try {
      const nextUser = await getCurrentUser();
      setAuthenticatedUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.removeQueries({ queryKey: queryKeys.user });
      return null;
    }
  }, [queryClient, setAuthenticatedUser]);

  const clearUser = useCallback(async () => {
    try {
      await logout();
    } finally {
      setUser(null);
      setStatus('unauthenticated');
      queryClient.clear();
    }
  }, [queryClient]);

  useEffect(() => {
    void refreshUser();
    // Executa apenas no boot do provider para hidratar a sessao por cookie.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      clearUser,
      refreshUser,
      setAuthenticatedUser,
      status,
      user,
    }),
    [clearUser, refreshUser, setAuthenticatedUser, status, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider.');
  }

  return context;
}
