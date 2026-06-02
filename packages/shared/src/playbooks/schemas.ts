import { z } from 'zod';

export const PlaybookStatus = z.enum(['experimental', 'active', 'paused']);
export type PlaybookStatus = z.infer<typeof PlaybookStatus>;

export const ChecklistItem = z.object({
  id: z.string().min(1).max(128),
  label: z.string().trim().min(1, 'Label required.').max(200),
  type: z.enum(['checkbox', 'text', 'number']).default('checkbox'),
  required: z.boolean().default(false),
});
export type ChecklistItem = z.infer<typeof ChecklistItem>;

export const CriteriaJson = z.object({
  entry: z.string().max(2000).optional(),
  exit: z.string().max(2000).optional(),
  invalidation: z.string().max(2000).optional(),
  sessions: z.array(z.string().max(50)).max(10).optional(),
  timeframes: z.array(z.string().max(20)).max(10).optional(),
  symbols: z.array(z.string().max(30)).max(20).optional(),
  tags: z.array(z.string().max(50)).max(30).optional(),
  minRR: z.string().max(20).optional(),
  riskPct: z.string().regex(/^\d+(\.\d+)?$/).optional(),
});
export type CriteriaJson = z.infer<typeof CriteriaJson>;

export const CreatePlaybook = z.object({
  name: z.string().trim().min(1, 'Name required.').max(100),
  thesis: z.string().trim().min(1, 'Thesis required.').max(5000),
  status: PlaybookStatus.optional().default('experimental'),
  criteriaJson: CriteriaJson.optional().default({}),
  sampleChartUrl: z.string().url().max(2048).optional().nullable(),
  checklistItems: z.array(ChecklistItem).max(30).optional().default([]),
  images: z.array(z.string().min(1)).max(10).optional().default([]),
});
export type CreatePlaybook = z.infer<typeof CreatePlaybook>;

export const UpdatePlaybook = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  thesis: z.string().trim().min(1).max(5000).optional(),
  status: PlaybookStatus.optional(),
  criteriaJson: CriteriaJson.optional(),
  sampleChartUrl: z.string().url().max(2048).optional().nullable(),
});
export type UpdatePlaybook = z.infer<typeof UpdatePlaybook>;

export const UpdateChecklist = z.object({
  items: z.array(ChecklistItem).max(30),
});
export type UpdateChecklist = z.infer<typeof UpdateChecklist>;

export const UpdatePlaybookImages = z.object({
  images: z.array(z.string().min(1)).max(10),
});
export type UpdatePlaybookImages = z.infer<typeof UpdatePlaybookImages>;
