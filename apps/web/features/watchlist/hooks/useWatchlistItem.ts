import { useQuery } from '@tanstack/react-query';
import { watchlistApi } from '../api';

export function useWatchlistItem(id: string) {
  return useQuery({
    queryKey: ['watchlist', id],
    queryFn: () => watchlistApi.getById(id),
    enabled: !!id,
  });
}
