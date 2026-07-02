import { z } from "zod";

export const WatchlistKeyLevelSchema = z.object({
  type: z.string(),
  price: z.string(),
  label: z.string(),
});

export const WatchlistItemSchema = z.object({
  id: z.string(),
  userId: z.string(),
  symbol: z.string(),
  horizon: z.enum(["day", "week", "month"]),
  bias: z.enum(["long", "short", "neutral", "watch"]),
  notes: z.string().nullable(),
  conviction: z.number(),
  convictionReason: z.string().nullable(),
  tags: z.array(z.string()),
  playbookNames: z.array(z.string()),
  keyLevelsJson: z.array(WatchlistKeyLevelSchema),
  images: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type WatchlistItem = z.infer<typeof WatchlistItemSchema>;

export const WatchlistListResponse = z.array(WatchlistItemSchema);

export const DeleteResponse = z.object({ deleted: z.literal(true) });
