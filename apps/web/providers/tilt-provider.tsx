'use client';

import { usePositions } from '@/features/positions';
import { evalGlobalRules, evalTradeRules } from '@/lib/tilt-engine';
import type { TiltEvent, TiltRule } from '@/lib/tilt-engine';
import { createContext, useContext, useMemo } from 'react';
import { useGoals } from './goals-provider';
import { useSelectedAccount } from './selected-account-provider';

type TiltCtx = {
  globalEvents: TiltEvent[];
  hasHardBlock: boolean;
  evalForTrade: (symbol: string, qty: number) => TiltEvent[];
};

const TiltCtx = createContext<TiltCtx>({
  globalEvents: [],
  hasHardBlock: false,
  evalForTrade: () => [],
});

export function useTilt() {
  return useContext(TiltCtx);
}

export function TiltProvider({ children }: { children: React.ReactNode }) {
  const { selectedAccountId } = useSelectedAccount();
  const { configByAccount } = useGoals();

  const accountId = selectedAccountId !== 'all' ? selectedAccountId : null;
  const config = accountId ? configByAccount[accountId] : null;
  const rules: TiltRule[] = (config?.rules ?? []) as TiltRule[];

  const { data: positions } = usePositions(accountId, { refetchInterval: 15_000 });

  const tiltPositions = useMemo(
    () =>
      (positions ?? []).map((p) => ({
        symbol: p.symbol,
        status: p.status as 'open' | 'closed',
        netPnl: p.netPnl,
        closedAt: p.closedAt,
        qtyMax: p.qtyMax,
      })),
    [positions],
  );

  const globalEvents = useMemo(
    () => evalGlobalRules(rules, tiltPositions, Date.now()),
    [rules, tiltPositions],
  );

  const hasHardBlock = globalEvents.some((e) => e.level === 'hard');

  function evalForTrade(symbol: string, qty: number): TiltEvent[] {
    return evalTradeRules(rules, tiltPositions, symbol, qty, Date.now());
  }

  return (
    <TiltCtx.Provider value={{ globalEvents, hasHardBlock, evalForTrade }}>
      {children}
    </TiltCtx.Provider>
  );
}
