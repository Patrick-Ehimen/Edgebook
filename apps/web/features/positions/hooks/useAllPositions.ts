import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { positionsApi } from '../api';
import type { Position } from '../schemas';

export function useAllPositions(accounts: { id: string }[] | undefined) {
  const queries = useQueries({
    queries: (accounts ?? []).map((a) => ({
      queryKey: ['positions', a.id],
      queryFn: () => positionsApi.list(a.id),
      enabled: (accounts?.length ?? 0) > 0,
    })),
  });

  const isLoading = queries.some((q) => q.isLoading);

  // biome-ignore lint/correctness/useExhaustiveDependencies: recompute on data-updated timestamps, not the queries array identity (which changes every render)
  const data = useMemo<Position[]>(
    () =>
      queries
        .flatMap((q) => q.data ?? [])
        .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime()),
    [queries.map((q) => q.dataUpdatedAt).join(',')],
  );

  return { data, isLoading };
}
