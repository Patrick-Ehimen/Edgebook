import { useQuery } from '@tanstack/react-query';
import { positionsApi } from '../api';

export function usePositions(accountId: string | null) {
  return useQuery({
    queryKey: ['positions', accountId],
    queryFn: () => positionsApi.list(accountId!),
    enabled: !!accountId,
  });
}
