import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../api';

export function useDeleteWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => watchlistApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      qc.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}
