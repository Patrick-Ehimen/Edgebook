import { z } from 'zod';

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
  playbookId: z.string().nullable(),
  sourceHash: z.string(),
});

export type Position = z.infer<typeof PositionSchema>;

export const PositionListResponse = z.array(PositionSchema);
