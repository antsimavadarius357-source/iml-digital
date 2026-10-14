import { createContext, useContext, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api, ApiError } from '../../lib/api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roleLabel: string;
  mustChangePassword: boolean;
  permissions: string[];
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();

  const me = useQuery({
    queryKey: ['me'],
    retry: false,
    staleTime: 60_000,
    queryFn: async () => {
      try {
        return (await api<{ user: User }>('/auth/me')).user;
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return null;
        throw e;
      }
    },
  });

  const loginMutation = useMutation({
    mutationFn: (v: { email: string; password: string }) => api<{ user: User }>('/auth/login', { method: 'POST', body: v }),
    onSuccess: (data) => qc.setQueryData(['me'], data.user),
  });

  const logoutMutation = useMutation({
    mutationFn: () => api<void>('/auth/logout', { method: 'POST' }),
    onSettled: () => {
      qc.setQueryData(['me'], null);
      qc.removeQueries({ predicate: (q) => q.queryKey[0] !== 'me' });
    },
  });

  const user = me.data ?? null;
  const value: AuthState = {
    user,
    isLoading: me.isLoading,
    login: async (email, password) => {
      const res = await loginMutation.mutateAsync({ email, password });
      return res.user;
    },
    logout: async () => void (await logoutMutation.mutateAsync()),
    can: (p) => !!user?.permissions.includes(p),
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
}
