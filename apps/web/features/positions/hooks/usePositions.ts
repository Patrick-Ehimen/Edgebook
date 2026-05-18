import { useQuery } from '@tanstack/react-query';
import { positionsApi } from '../api';

export function usePositions(
  accountId: string | null,
  options?: { refetchInterval?: number | false },
) {
  const refetchInterval = options?.refetchInterval ?? false;
  return useQuery({
    queryKey: ['positions', accountId],
    queryFn: () => positionsApi.list(accountId!),
    enabled: !!accountId,
    refetchInterval,
  });
}
