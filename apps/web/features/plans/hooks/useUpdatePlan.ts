import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdatePlanBody, plansApi } from '../api';

export function useUpdatePlan(planId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePlanBody) => plansApi.update(planId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
      qc.invalidateQueries({ queryKey: ['plans', planId] });
    },
  });
}
