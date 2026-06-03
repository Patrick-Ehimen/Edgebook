import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '../api';

export function useMoveNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, folderId }: { id: string; folderId: string }) =>
      notesApi.move(id, folderId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
