import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdateWatchlistItemBody, watchlistApi } from '../api';

export function useUpdateWatchlistItem(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateWatchlistItemBody) => watchlistApi.update(id, body),
    onSuccess: (updated) => {
      qc.setQueryData(['watchlist', id], updated);
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
