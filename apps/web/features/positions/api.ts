import { api } from '@/lib/api-client';
import { z } from 'zod';
import { PositionDetailSchema, PositionListResponse, PositionSchema } from './schemas';

const FillResponse = z.object({ id: z.string() }).passthrough();
const RecomputeResponse = z.object({ positionCount: z.number() });
const DeleteResponse = z.object({ ok: z.literal(true) });

export interface UpdatePositionMetricsBody {
  playbookId?: string | undefined;
  rPlanned?: string | undefined;
  rRealized?: string | undefined;
  mfe?: string | undefined;
  mae?: string | undefined;
  wentRight?: string | undefined;
  wentWrong?: string | undefined;
  lesson?: string | undefined;
  planAdherence?: string | undefined;
  processScore?: string | undefined;
  outcomeScore?: string | undefined;
  tags?: string[] | undefined;
  images?: string[] | undefined;
  checklistState?: Record<string, 'done' | 'miss' | 'none'> | undefined;
}

export interface CreateFillBody {
  symbol: string;
  side: 'buy' | 'sell';
  qty: string;
  price: string;
  fee: string;
  feeCcy: string;
  fundingFee: string | null;
  executedAt: string;
  thesis?: string | undefined;
  invalidation?: string | undefined;
  notes?: string | undefined;
  sl?: string | undefined;
  tp?: string | undefined;
  conviction?: number | undefined;
  moods?: string[] | undefined;
}

export const positionsApi = {
  list: (accountId: string) =>
    api.get(`/accounts/${accountId}/positions`, PositionListResponse),

  getById: (accountId: string, positionId: string) =>
    api.get(`/accounts/${accountId}/positions/${positionId}`, PositionDetailSchema),

  createFill: (accountId: string, body: CreateFillBody) =>
    api.post(`/accounts/${accountId}/fills`, FillResponse, body),

  recompute: (accountId: string) =>
    api.post(`/accounts/${accountId}/recompute`, RecomputeResponse, {}),

  updateMetrics: (accountId: string, positionId: string, body: UpdatePositionMetricsBody) =>
    api.patch(`/accounts/${accountId}/positions/${positionId}`, PositionSchema, body),

  deletePosition: (accountId: string, positionId: string) =>
    api.delete(`/accounts/${accountId}/positions/${positionId}`, DeleteResponse),
};
