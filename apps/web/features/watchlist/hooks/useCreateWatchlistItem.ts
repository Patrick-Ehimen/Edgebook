import { useMutation, useQueryClient } from '@tanstack/react-query';
import { type CreateWatchlistItemBody, watchlistApi } from '../api';

export function useCreateWatchlistItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateWatchlistItemBody) => watchlistApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });
}
