import { useMutation } from '@tanstack/react-query';
import { accountsApi } from '../api';

export function useTriggerSync() {
  return useMutation({
    mutationFn: (accountId: string) => accountsApi.triggerSync(accountId),
  });
}
