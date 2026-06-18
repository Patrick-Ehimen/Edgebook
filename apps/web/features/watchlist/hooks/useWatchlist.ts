import { useQuery } from '@tanstack/react-query';
import { watchlistApi } from '../api';

export function useWatchlist() {
  return useQuery({
    queryKey: ['watchlist'],
    queryFn: () => watchlistApi.list(),
  });
}
