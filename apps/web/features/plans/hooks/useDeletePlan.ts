import { useMutation, useQueryClient } from '@tanstack/react-query';
import { plansApi } from '../api';

export function useDeletePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (planId: string) => plansApi.remove(planId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
