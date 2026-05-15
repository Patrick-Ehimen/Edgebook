import { z } from 'zod';

export {
  AccountSchema,
  ApiKeyMetaSchema,
  CreateAccountInput,
  AddApiKeyInput,
  VenueSchema,
  AccountTypeSchema,
} from '@edgebook/shared/accounts';
export type { Account, ApiKeyMeta, Venue, AccountType } from '@edgebook/shared/accounts';

export const AccountListResponse = z.array(
  z.object({
    id: z.string(),
    userId: z.string(),
    venue: z.enum(['binance', 'bybit']),
    label: z.string(),
    accountType: z.string(),
    baseCurrency: z.string(),
    createdAt: z.string(),
    keyCount: z.number(),
  }),
);

export const SyncResponse = z.object({ queued: z.boolean() });
export const OkResponse = z.object({ ok: z.literal(true) });

export const ApiKeyResponse = z.object({
  id: z.string(),
  accountId: z.string(),
  scope: z.array(z.string()),
  lastUsedAt: z.string().nullable(),
  createdAt: z.string(),
});

export const AccountResponse = z.object({
  id: z.string(),
  userId: z.string(),
  venue: z.enum(['binance', 'bybit']),
  label: z.string(),
  accountType: z.string(),
  baseCurrency: z.string(),
  createdAt: z.string(),
  keyCount: z.number(),
});

export type AccountItem = z.infer<typeof AccountResponse>;
