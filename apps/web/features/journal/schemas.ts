import { z } from 'zod';

export const DisciplineComponentSchema = z.object({
  score: z.number(),
  delta: z.number(),
});

export const JournalStatsSchema = z.object({
  streak: z.number(),
  longestStreak: z.number(),
  disciplineAvg: z.number().nullable(),
  entriesThisMonth: z.number(),
  discipline: z.object({
    score: z.number(),
    delta: z.number(),
    planAdherence: DisciplineComponentSchema,
    ruleViolations: DisciplineComponentSchema,
    journalCompletion: DisciplineComponentSchema,
    riskDiscipline: DisciplineComponentSchema,
  }).optional(),
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
  tomorrowMd: z.string().nullable().optional(),
  tagsJson: z.unknown().nullable().optional(),
  energyEod: z.number().nullable().optional(),
  tiltRisk: z.number().nullable().optional(),
  confidenceEod: z.number().nullable().optional(),
  finalizedAt: z.string().nullable().optional(),
  lockedAt: z.string().nullable().optional(),
  pinned: z.boolean().optional(),
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
  moodTagsJson: z.unknown().nullable().optional(),
  conviction: z.number().nullable().optional(),
  sleepHours: z.union([z.string(), z.number()]).nullable().optional(),
  intentMd: z.string().nullable().optional(),
  tradeCount: z.number(),
  discipline: z.number().nullable().optional(),
  tagsJson: z.unknown().nullable().optional(),
  pinned: z.boolean().optional(),
});

export const RecentEntriesSchema = z.array(RecentEntrySchema);

export const DeleteEntryResponseSchema = z.object({
  id: z.string(),
});

export type JournalStats = z.infer<typeof JournalStatsSchema>;
export type JournalEntry = z.infer<typeof JournalEntrySchema>;
export type RecentEntry = z.infer<typeof RecentEntrySchema>;
