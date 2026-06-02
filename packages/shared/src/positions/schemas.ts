import { z } from 'zod';

const decimalPositive = (label: string) =>
  z.string().regex(/^\d+(\.\d+)?$/, `${label} must be a positive decimal.`);

const decimalSigned = (label: string) =>
  z.string().regex(/^-?\d+(\.\d+)?$/, `${label} must be a signed decimal.`);

export const CreateFillInput = z.object({
  symbol: z.string().trim().toUpperCase().min(1, 'Symbol required.').max(30),
  side: z.enum(['buy', 'sell']),
  qty: decimalPositive('Quantity'),
  price: decimalPositive('Price'),
  fee: decimalPositive('Fee').default('0'),
  feeCcy: z.string().trim().toUpperCase().min(1, 'Fee currency required.').max(10),
  fundingFee: decimalSigned('Funding fee').nullable().default(null),
  executedAt: z.string().datetime({ message: 'Invalid date — use ISO 8601.' }),
  exchangeTradeId: z.string().trim().min(1).max(128).optional(),
  thesis: z.string().max(2000).optional(),
  invalidation: z.string().max(2000).optional(),
  notes: z.string().max(5000).optional(),
  sl: decimalPositive('Stop loss').optional(),
  tp: decimalPositive('Take profit').optional(),
  conviction: z.number().int().min(1).max(5).optional(),
  moods: z.array(z.string().max(50)).max(20).optional(),
});
export type CreateFillInput = z.infer<typeof CreateFillInput>;

export const UpdatePositionMetrics = z.object({
  rPlanned: decimalSigned('Planned R').optional(),
  rRealized: decimalSigned('Realized R').optional(),
  mfe: decimalSigned('MFE').optional(),
  mae: decimalSigned('MAE').optional(),
  wentRight: z.string().max(5000).optional(),
  wentWrong: z.string().max(5000).optional(),
  lesson: z.string().max(1000).optional(),
  planAdherence: decimalPositive('Plan adherence').optional(),
  processScore: decimalPositive('Process score').optional(),
  outcomeScore: decimalPositive('Outcome score').optional(),
  tags: z.array(z.string().trim().min(1).max(50)).max(30).optional(),
  images: z.array(z.string()).optional(),
  checklistState: z.record(z.enum(['done', 'miss', 'none'])).optional(),
});
export type UpdatePositionMetrics = z.infer<typeof UpdatePositionMetrics>;
