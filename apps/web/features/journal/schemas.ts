import { z } from 'zod';

export const JournalStatsSchema = z.object({
  streak: z.number(),
  disciplineAvg: z.number().nullable(),
  entriesThisMonth: z.number(),
});

export const JournalEntrySchema = z.object({
  id: z.string(),
  userId: z.string(),
  date: z.string(),
  bias: z.string().nullable().optional(),
  conviction: z.number().nullable().optional(),
  riskCap: z.union([z.string(), z.number()]).nullable().optional().transform(v => v != null ? String(v) : v),
  maxTrades: z.number().nullable().optional(),
  intentMd: z.string().nullable().optional(),
  sleepHours: z.union([z.string(), z.number()]).nullable().optional(),
  energy: z.number().nullable().optional(),
  focus: z.number().nullable().optional(),
  moodTagsJson: z.unknown().nullable().optional(),
  watchlistJson: z.unknown().nullable().optional(),
  keyLevelsJson: z.unknown().nullable().optional(),
  sessionNotesMd: z.string().nullable().optional(),
  eodMd: z.string().nullable().optional(),
  planAdherence: z.number().nullable().optional(),
  processScore: z.number().nullable().optional(),
  outcomeScore: z.number().nullable().optional(),
  wentRightMd: z.string().nullable().optional(),
  wentWrongMd: z.string().nullable().optional(),
  lesson: z.string().nullable().optional(),
  tiltRisk: z.number().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  lockedAt: z.string().nullable().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const JournalEntryNullableSchema = JournalEntrySchema.nullable();

export const RecentEntrySchema = z.object({
  id: z.string(),
  date: z.string(),
  bias: z.string().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  lesson: z.string().nullable().optional(),
});

export const RecentEntriesSchema = z.array(RecentEntrySchema);

export type JournalStats = z.infer<typeof JournalStatsSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type RecentEntry = z.infer<typeof RecentEntrySchema>;
