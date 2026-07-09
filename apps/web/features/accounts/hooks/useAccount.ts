import { useQuery } from '@tanstack/react-query';
import { accountsApi } from '../api';

export function useAccount(accountId: string | null) {
  return useQuery({
    queryKey: ['accounts', accountId],
    queryFn: () => accountsApi.get(accountId!),
    enabled: !!accountId,
  });
}
