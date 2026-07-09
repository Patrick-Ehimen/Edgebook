import { useMutation, useQueryClient } from '@tanstack/react-query';
import { accountsApi } from '../api';
import type { UpdateAccountInputType } from '../schemas';

export function useUpdateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ accountId, body }: { accountId: string; body: UpdateAccountInputType }) =>
      accountsApi.update(accountId, body),
    onSuccess: (_data, { accountId }) => {
      qc.invalidateQueries({ queryKey: ['accounts'] });
      qc.invalidateQueries({ queryKey: ['accounts', accountId] });
    },
  });
}
