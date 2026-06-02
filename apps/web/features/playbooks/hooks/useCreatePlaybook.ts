import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreatePlaybookBody, playbooksApi } from '../api';

export function useCreatePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePlaybookBody) => playbooksApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
}
