import { api } from '@/lib/api-client';
import { type ArchiveItemType, ArchiveListResponse } from '@edgebook/shared';
import { z } from 'zod';

const RestoreResponse = z.object({ restored: z.literal(true) });
const PurgeResponse = z.object({ purged: z.literal(true) });

export const archiveApi = {
  list: () => api.get('/archive', ArchiveListResponse),
  restore: (type: ArchiveItemType, id: string) =>
    api.post(`/archive/${type}/${id}/restore`, RestoreResponse, {}),
  purge: (type: ArchiveItemType, id: string) => api.delete(`/archive/${type}/${id}`, PurgeResponse),
};
