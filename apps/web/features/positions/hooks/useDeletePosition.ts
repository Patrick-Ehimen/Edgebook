import { useMutation, useQueryClient } from '@tanstack/react-query';
import { positionsApi } from '../api';

export function useDeletePosition(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (positionId: string) => positionsApi.deletePosition(accountId, positionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions', accountId] });
    },
  });
}
