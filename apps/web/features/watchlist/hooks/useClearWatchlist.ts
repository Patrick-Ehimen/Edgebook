import { useMutation, useQueryClient } from '@tanstack/react-query';
import { watchlistApi } from '../api';

export function useClearWatchlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) => Promise.all(ids.map((id) => watchlistApi.remove(id))),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
      qc.invalidateQueries({ queryKey: ['archive'] });
    },
  });
}
