import { z } from 'zod';

const decimalNonNegative = (label: string) =>
  z.string().regex(/^\d+(\.\d+)?$/, `${label} must be a positive decimal.`);

export const VenueSchema = z.enum(['binance', 'bybit']);
export type Venue = z.infer<typeof VenueSchema>;

export const AccountTypeSchema = z.enum(['futures', 'spot', 'margin']);
export type AccountType = z.infer<typeof AccountTypeSchema>;

export const AccountCategorySchema = z.enum(['live', 'demo', 'prop']);
export type AccountCategory = z.infer<typeof AccountCategorySchema>;

export const CreateAccountInput = z.object({
  venue: VenueSchema,
  label: z.string().trim().min(1, 'Label is required.').max(64, 'Label too long.'),
  accountType: AccountTypeSchema,
  category: AccountCategorySchema.default('live'),
  baseCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .min(2)
    .max(10)
    .regex(/^[A-Z0-9]+$/, 'Base currency must be alphanumeric.'),
  startingBalance: decimalNonNegative('Account size').default('0'),
});
export type CreateAccountInput = z.infer<typeof CreateAccountInput>;

export const UpdateAccountInput = z.object({
  label: z.string().trim().min(1, 'Label is required.').max(64, 'Label too long.').optional(),
  startingBalance: decimalNonNegative('Account size').optional(),
});
export type UpdateAccountInput = z.infer<typeof UpdateAccountInput>;

export const AddApiKeyInput = z.object({
  apiKey: z.string().trim().min(8, 'API key too short.').max(256),
  secret: z.string().trim().min(8, 'Secret too short.').max(512),
});
export type AddApiKeyInput = z.infer<typeof AddApiKeyInput>;

export const ApiKeyMetaSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  scope: z.array(z.string()),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});
export type ApiKeyMeta = z.infer<typeof ApiKeyMetaSchema>;

export const AccountSchema = z.object({
  id: z.string(),
  userId: z.string(),
  venue: VenueSchema,
  label: z.string(),
  accountType: AccountTypeSchema,
  category: AccountCategorySchema,
  baseCurrency: z.string(),
  startingBalance: z.string(),
  createdAt: z.string(),
  keyCount: z.number().int(),
});
export type Account = z.infer<typeof AccountSchema>;
