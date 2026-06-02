import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdatePlaybookBody, playbooksApi } from '../api';

export function useUpdatePlaybook(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdatePlaybookBody) => playbooksApi.update(id, body),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
      qc.setQueryData(['playbooks', id], updated);
    },
  });
}
