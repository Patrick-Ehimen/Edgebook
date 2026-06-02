import { z } from 'zod';

export const ChecklistItemSchema = z.object({
  id: z.string(),
  label: z.string(),
  type: z.enum(['checkbox', 'text', 'number']),
  required: z.boolean(),
});

export type ChecklistItem = z.infer<typeof ChecklistItemSchema>;

export const ChecklistSchema = z.object({
  id: z.string(),
  playbookId: z.string(),
  itemsJson: z.array(ChecklistItemSchema),
});

export type Checklist = z.infer<typeof ChecklistSchema>;

export const PlaybookStatusSchema = z.enum(['experimental', 'active', 'paused']);
export type PlaybookStatus = z.infer<typeof PlaybookStatusSchema>;

export const PlaybookSchema = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  thesis: z.string(),
  status: PlaybookStatusSchema,
  criteriaJson: z.record(z.unknown()),
  sampleChartUrl: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  checklists: z.array(ChecklistSchema),
  _count: z.object({ positions: z.number() }),
});

export type Playbook = z.infer<typeof PlaybookSchema>;

export const PlaybookListResponse = z.array(PlaybookSchema);
