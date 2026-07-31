import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreatePlanBody, plansApi } from '../api';

export function useCreatePlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlanBody) => plansApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['plans'] });
    },
  });
}
