import { useQuery } from '@tanstack/react-query';
import type { PriceData } from '@/app/api/prices/route';

export type { PriceData };

export function usePrices(symbols: string[]) {
  const key = symbols.slice().sort().join(',');
  return useQuery({
    queryKey: ['prices', key],
    queryFn: async (): Promise<Record<string, PriceData>> => {
      if (!symbols.length) return {};
      const res = await fetch(`/api/prices?symbols=${symbols.join(',')}`);
      if (!res.ok) return {};
      return res.json();
    },
    enabled: symbols.length > 0,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}
