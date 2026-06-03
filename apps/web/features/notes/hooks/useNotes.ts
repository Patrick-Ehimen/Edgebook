import { useQuery } from '@tanstack/react-query';
import { notesApi } from '../api';

export function useNotes() {
  return useQuery({
    queryKey: ['notes'],
    queryFn: () => notesApi.list(),
  });
}
