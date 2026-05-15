'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { SessionSchema, type Session } from '@edgebook/shared/auth';

interface AuthCtx {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  refreshSession: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading, refetch } = useQuery({
    queryKey: ['session'],
    queryFn: () => api.get('/auth/session', SessionSchema),
    retry: false,
    staleTime: 5 * 60_000,
  });

  const refreshSession = async () => {
    await refetch();
  };

  return (
    <Ctx.Provider
      value={{
        session: session ?? null,
        isLoading,
        isAuthenticated: !!session,
        refreshSession,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(Ctx);
  return {
    ...ctx,
    user: ctx.session, // Alias session as user for convenience
  };
};
