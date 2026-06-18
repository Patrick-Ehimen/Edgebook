import { z } from 'zod';

export const WatchlistKeyLevel = z.object({
  type: z.string().max(10),
  price: z.string().max(50),
  label: z.string().max(100),
});
export type WatchlistKeyLevel = z.infer<typeof WatchlistKeyLevel>;

export const CreateWatchlistItem = z.object({
  symbol: z.string().trim().min(1).max(30),
  horizon: z.enum(['day', 'week', 'month']),
  bias: z.enum(['long', 'short', 'neutral', 'watch']),
  notes: z.string().max(5000).optional(),
  conviction: z.number().int().min(1).max(5).default(3),
  convictionReason: z.string().max(500).optional(),
  tags: z.array(z.string().max(50)).max(20).default([]),
  playbookNames: z.array(z.string().max(100)).max(10).default([]),
  keyLevelsJson: z.array(WatchlistKeyLevel).max(10).default([]),
});
export type CreateWatchlistItem = z.infer<typeof CreateWatchlistItem>;
