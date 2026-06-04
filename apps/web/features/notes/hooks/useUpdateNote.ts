import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notesApi, type UpdateNoteBody } from '../api';

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: { id: string } & UpdateNoteBody) =>
      notesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
