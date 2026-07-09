import { api } from '@/lib/api-client';
import {
  AccountListResponse,
  AccountResponse,
  ApiKeyResponse,
  OkResponse,
  SyncResponse,
} from './schemas';
import type { AddApiKeyInput, CreateAccountInput, UpdateAccountInputType } from './schemas';

export const accountsApi = {
  list: () => api.get('/accounts', AccountListResponse),

  get: (accountId: string) => api.get(`/accounts/${accountId}`, AccountResponse),

  create: (body: CreateAccountInput) => api.post('/accounts', AccountResponse, body),

  update: (accountId: string, body: UpdateAccountInputType) =>
    api.patch(`/accounts/${accountId}`, AccountResponse, body),

  delete: (accountId: string) => api.delete(`/accounts/${accountId}`, OkResponse),

  addApiKey: (accountId: string, body: AddApiKeyInput) =>
    api.post(`/accounts/${accountId}/keys`, ApiKeyResponse, body),

  revokeApiKey: (accountId: string, keyId: string) =>
    api.delete(`/accounts/${accountId}/keys/${keyId}`, OkResponse),

  triggerSync: (accountId: string) => api.post(`/accounts/${accountId}/sync`, SyncResponse, {}),
};
