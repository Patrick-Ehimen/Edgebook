import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateNoteBody, notesApi } from '../api';

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateNoteBody) => notesApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notes'] });
    },
  });
}
