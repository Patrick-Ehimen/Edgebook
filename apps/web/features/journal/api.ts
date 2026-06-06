import { api } from '@/lib/api-client';
import {
  JournalStatsSchema,
  JournalEntryNullableSchema,
  RecentEntriesSchema,
} from './schemas';

export const journalApi = {
  getStats: () => api.get('/journal/stats', JournalStatsSchema),
  getEntry: (date: string) =>
    api.get(`/journal/entry?date=${date}`, JournalEntryNullableSchema),
  upsertEntry: (date: string, data: Record<string, unknown>) =>
    api.patch('/journal/entry', JournalEntryNullableSchema, { date, ...data }),
  listRecent: () => api.get('/journal/recent', RecentEntriesSchema),
};
