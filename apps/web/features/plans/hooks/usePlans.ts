import { useQuery } from '@tanstack/react-query';
import { plansApi } from '../api';

export function usePlans() {
  return useQuery({
    queryKey: ['plans'],
    queryFn: () => plansApi.list(),
  });
}
