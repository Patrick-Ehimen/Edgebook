import { z } from 'zod';

export const ArchiveItemType = z.enum(['notes', 'watchlist', 'playbook', 'journal']);
export type ArchiveItemType = z.infer<typeof ArchiveItemType>;

export const ArchivedItem = z.object({
  id: z.string(),
  type: ArchiveItemType,
  title: z.string(),
  context: z.string(),
  originLabel: z.string(),
  removedAt: z.string(),
});
export type ArchivedItem = z.infer<typeof ArchivedItem>;

export const ArchiveListResponse = z.array(ArchivedItem);
export type ArchiveListResponse = z.infer<typeof ArchiveListResponse>;
