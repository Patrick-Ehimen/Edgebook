import { api } from '@/lib/api-client';
import {
  JournalStatsSchema,
  JournalEntryNullableSchema,
  RecentEntriesSchema,
  DeleteEntryResponseSchema,
} from './schemas';

export const journalApi = {
  getStats: (date?: string) =>
    api.get(`/journal/stats${date ? `?date=${date}` : ''}`, JournalStatsSchema),
  getEntry: (date: string) =>
    api.get(`/journal/entry?date=${date}`, JournalEntryNullableSchema),
  upsertEntry: (date: string, data: Record<string, unknown>) =>
    api.patch('/journal/entry', JournalEntryNullableSchema, { date, ...data }),
  deleteEntry: (date: string) =>
    api.delete(`/journal/entry?date=${date}`, DeleteEntryResponseSchema),
  listRecent: () => api.get('/journal/recent', RecentEntriesSchema),
};
