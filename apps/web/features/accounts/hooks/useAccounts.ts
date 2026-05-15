import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api';

export function useAccounts() {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: () => accountsApi.list(),
  });
}
