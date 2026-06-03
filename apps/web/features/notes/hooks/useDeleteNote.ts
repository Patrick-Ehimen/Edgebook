import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api';

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
