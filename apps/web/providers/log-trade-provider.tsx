'use client';

import { LogTradeDialog } from '@/features/positions/components/LogTradeDialog';
import { createContext, useContext, useState } from 'react';

type LogTradeCtx = { open: () => void };
const Ctx = createContext<LogTradeCtx>({ open: () => {} });

export function useLogTrade() {
  return useContext(Ctx);
}

export function LogTradeProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <Ctx.Provider value={{ open: () => setIsOpen(true) }}>
      {children}
      <LogTradeDialog open={isOpen} onOpenChange={setIsOpen} />
    </Ctx.Provider>
  );
}
