import { api } from '@/lib/api-client';
import { PositionListResponse } from './schemas';

export const positionsApi = {
  list: (accountId: string) =>
    api.get(`/accounts/${accountId}/positions`, PositionListResponse),
};
