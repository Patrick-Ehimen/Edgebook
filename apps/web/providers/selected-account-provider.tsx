'use client';

import { createContext, useContext, useState } from 'react';

type Ctx = {
  selectedAccountId: string | 'all';
  setSelectedAccountId: (id: string | 'all') => void;
};

const SelectedAccountCtx = createContext<Ctx>({
  selectedAccountId: 'all',
  setSelectedAccountId: () => {},
});

export function useSelectedAccount() {
  return useContext(SelectedAccountCtx);
}

export function SelectedAccountProvider({ children }: { children: React.ReactNode }) {
  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  return (
    <SelectedAccountCtx.Provider value={{ selectedAccountId, setSelectedAccountId }}>
      {children}
    </SelectedAccountCtx.Provider>
  );
}
