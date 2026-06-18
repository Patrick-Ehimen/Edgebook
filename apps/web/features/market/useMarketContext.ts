import { useQuery } from '@tanstack/react-query';
import type { MarketContext } from '@/app/api/market-context/route';

export type { MarketContext };

export function useMarketContext() {
  return useQuery({
    queryKey: ['market-context'],
    queryFn: async (): Promise<MarketContext> => {
      const res = await fetch('/api/market-context');
      if (!res.ok) return { items: [] };
      return res.json();
    },
    refetchInterval: 60_000,
    staleTime: 30_000,
  });
}
