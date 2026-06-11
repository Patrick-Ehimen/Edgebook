import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdatePositionMetricsBody, positionsApi } from '../api';
import type { PositionDetail } from '../schemas';

export function useUpdatePosition(accountId: string, positionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePositionMetricsBody) =>
      positionsApi.updateMetrics(accountId, positionId, body),
    onSuccess: (updated) => {
      // Merge confirmed server data into the detail cache immediately — avoids
      // a race where a background refetch returns stale data before the write commits.
      qc.setQueryData(
        ['position', accountId, positionId],
        (old: PositionDetail | undefined) => old ? { ...old, ...updated } : old,
      );
      qc.invalidateQueries({ queryKey: ['positions', accountId] });
    },
  });
}
