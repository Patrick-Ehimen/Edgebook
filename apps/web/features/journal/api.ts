import { api } from '@/lib/api-client';
import {
  JournalStatsSchema,
  JournalEntryNullableSchema,
  RecentEntriesSchema,
  DeleteEntryResponseSchema,
} from './schemas';

export const journalApi = {
  getStats: (date?: string, accountId?: string) => {
    const params = new URLSearchParams();
    if (date) params.set('date', date);
    if (accountId) params.set('accountId', accountId);
    const qs = params.toString();
    return api.get(`/journal/stats${qs ? `?${qs}` : ''}`, JournalStatsSchema);
  },
  getEntry: (date: string) =>
    api.get(`/journal/entry?date=${date}`, JournalEntryNullableSchema),
  upsertEntry: (date: string, data: Record<string, unknown>) =>
    api.patch('/journal/entry', JournalEntryNullableSchema, { date, ...data }),
  deleteEntry: (date: string) =>
    api.delete(`/journal/entry?date=${date}`, DeleteEntryResponseSchema),
  listRecent: (accountId?: string) => {
    const qs = accountId ? `?accountId=${accountId}` : '';
    return api.get(`/journal/recent${qs}`, RecentEntriesSchema);
  },
};
