import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdatePositionMetricsBody, positionsApi } from '../api';

export function useUpdatePosition(accountId: string, positionId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePositionMetricsBody) =>
      positionsApi.updateMetrics(accountId, positionId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions', accountId] });
      qc.invalidateQueries({ queryKey: ['position', accountId, positionId] });
    },
  });
}
