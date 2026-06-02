import { z } from 'zod';

export const FillShape = z
  .object({
    id: z.string(),
    symbol: z.string(),
    side: z.string(),
    qty: z.string(),
    price: z.string(),
    fee: z.string(),
    feeCcy: z.string().optional(),
    fundingFee: z.string().nullable(),
    executedAt: z.string(),
    thesis: z.string().nullable().optional(),
    invalidation: z.string().nullable().optional(),
    notes: z.string().nullable().optional(),
    sl: z.string().nullable().optional(),
    tp: z.string().nullable().optional(),
    conviction: z.number().nullable().optional(),
    moods: z.array(z.string()).optional(),
  })
  .passthrough();

export const PositionFillSchema = z.object({
  fillId: z.string(),
  role: z.string().nullable(),
  fill: FillShape,
});

export type PositionFill = z.infer<typeof PositionFillSchema>;

export const CheckStateSchema = z.enum(['done', 'miss', 'none']);
export type CheckState = z.infer<typeof CheckStateSchema>;

export const PositionSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  symbol: z.string(),
  side: z.enum(['long', 'short']),
  status: z.enum(['open', 'closed']),
  openedAt: z.string(),
  closedAt: z.string().nullable(),
  qtyMax: z.string(),
  avgEntry: z.string(),
  avgExit: z.string().nullable(),
  grossPnl: z.string(),
  fees: z.string(),
  funding: z.string(),
  netPnl: z.string(),
  rPlanned: z.string().nullable(),
  rRealized: z.string().nullable(),
  mfe: z.string().nullable(),
  mae: z.string().nullable(),
  wentRight: z.string().nullable(),
  wentWrong: z.string().nullable(),
  lesson: z.string().nullable(),
  planAdherence: z.string().nullable(),
  processScore: z.string().nullable(),
  outcomeScore: z.string().nullable(),
  playbookId: z.string().nullable(),
  sourceHash: z.string(),
  checklistState: z.record(CheckStateSchema).nullable().optional(),
});

export type Position = z.infer<typeof PositionSchema>;

export const PositionDetailSchema = PositionSchema.extend({
  fills: z.array(PositionFillSchema),
  tags: z.array(z.string()),
  images: z.array(z.string()),
});

export type PositionDetail = z.infer<typeof PositionDetailSchema>;

export const PositionListResponse = z.array(PositionSchema);
