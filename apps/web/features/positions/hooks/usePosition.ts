import { useQuery } from '@tanstack/react-query';
import { positionsApi } from '../api';

export function usePosition(accountId: string | null, positionId: string | null) {
  return useQuery({
    queryKey: ['position', accountId, positionId],
    queryFn: () => positionsApi.getById(accountId!, positionId!),
    enabled: !!accountId && !!positionId,
    staleTime: Number.POSITIVE_INFINITY,
  });
}
