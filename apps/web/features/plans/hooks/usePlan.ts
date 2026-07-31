import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api';

export function usePlan(planId: string | undefined) {
  return useQuery({
    queryKey: ['plans', planId],
    queryFn: () => plansApi.get(planId as string),
    enabled: Boolean(planId),
  });
}
