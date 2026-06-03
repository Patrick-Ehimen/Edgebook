import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api';

export function usePinNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      notesApi.pin(id, pinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
