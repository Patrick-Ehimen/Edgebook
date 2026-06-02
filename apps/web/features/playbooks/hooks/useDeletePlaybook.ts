import { useMutation, useQueryClient } from '@tanstack/react-query';
import { playbooksApi } from '../api';

export function useDeletePlaybook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => playbooksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });
}
