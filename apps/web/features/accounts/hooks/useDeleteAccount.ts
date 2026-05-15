import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api';

export function useDeleteAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (accountId: string) => accountsApi.delete(accountId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['accounts'] }),
  });
}
