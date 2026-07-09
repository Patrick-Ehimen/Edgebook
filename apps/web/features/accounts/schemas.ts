import { z } from 'zod';

export {
  AccountSchema,
  ApiKeyMetaSchema,
  CreateAccountInput,
  UpdateAccountInput,
  AddApiKeyInput,
  VenueSchema,
  AccountTypeSchema,
  AccountCategorySchema,
} from '@edgebook/shared/accounts';
export type {
  Account,
  ApiKeyMeta,
  Venue,
  AccountType,
  AccountCategory,
  UpdateAccountInput as UpdateAccountInputType,
} from '@edgebook/shared/accounts';

export const AccountResponse = z.object({
  id: z.string(),
  userId: z.string(),
  venue: z.enum(['binance', 'bybit']),
  label: z.string(),
  accountType: z.string(),
  category: z.enum(['live', 'demo', 'prop']),
  baseCurrency: z.string(),
  startingBalance: z.string(),
  createdAt: z.string(),
  keyCount: z.number(),
});

export const AccountListResponse = z.array(AccountResponse);

export const SyncResponse = z.object({ queued: z.boolean() });
export const OkResponse = z.object({ ok: z.literal(true) });

export const ApiKeyResponse = z.object({
  id: z.string(),
  accountId: z.string(),
  scope: z.array(z.string()),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

export type AccountItem = z.infer<typeof AccountResponse>;
