import { api } from '@/lib/api-client';
import { DeleteResponse, WatchlistItemSchema, WatchlistListResponse } from './schemas';

export interface CreateWatchlistItemBody {
  symbol: string;
  horizon: 'day' | 'week' | 'month';
  bias: 'long' | 'short' | 'neutral' | 'watch';
  notes?: string;
  conviction?: number;
  convictionReason?: string;
  tags?: string[];
  playbookNames?: string[];
  keyLevelsJson?: Array<{ type: string; price: string; label: string }>;
}

export const watchlistApi = {
  list: () => api.get('/watchlist', WatchlistListResponse),
  create: (body: CreateWatchlistItemBody) => api.post('/watchlist', WatchlistItemSchema, body),
  remove: (id: string) => api.delete(`/watchlist/${id}`, DeleteResponse),
};
