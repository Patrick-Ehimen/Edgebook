'use client';

import { createContext, useContext } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { SessionSchema, type Session } from '@edgebook/shared/auth';

interface AuthCtx {
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const Ctx = createContext<AuthCtx>({ session: null, isLoading: true, isAuthenticated: false });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, isLoading } = useQuery({
    queryKey: ['session'],
    queryFn: () => api.get('/auth/session', SessionSchema),
    retry: false,
    staleTime: 5 * 60_000,
  });

  return (
    <Ctx.Provider
      value={{
        session: session ?? null,
        isLoading,
        isAuthenticated: !!session,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
