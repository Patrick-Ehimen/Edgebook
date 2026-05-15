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
});
export type CreateFillInput = z.infer<typeof CreateFillInput>;
