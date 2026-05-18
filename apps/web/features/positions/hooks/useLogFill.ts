import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateFillBody, positionsApi } from '../api';

export function useLogFill(accountId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: CreateFillBody) => {
      await positionsApi.createFill(accountId, body);
      // Recompute synchronously so positions update without needing the worker
      await positionsApi.recompute(accountId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['positions', accountId] });
    },
  });
}
