import { api } from '@/lib/api-client';
import { z } from 'zod';
import { ChecklistSchema, PlaybookListResponse, PlaybookSchema } from './schemas';

export interface CreatePlaybookBody {
  name: string;
  thesis: string;
  status?: 'experimental' | 'active' | 'paused';
  criteriaJson?: Record<string, unknown>;
  sampleChartUrl?: string | null;
  checklistItems?: Array<{ id: string; label: string; type: 'checkbox' | 'text' | 'number'; required: boolean }>;
}

export interface UpdatePlaybookBody {
  name?: string;
  thesis?: string;
  status?: 'experimental' | 'active' | 'paused';
  criteriaJson?: Record<string, unknown>;
  sampleChartUrl?: string | null;
}

export interface UpdateChecklistBody {
  items: Array<{ id: string; label: string; type: 'checkbox' | 'text' | 'number'; required: boolean }>;
}

const DeleteResponse = z.object({ deleted: z.literal(true) });

export const playbooksApi = {
  list: () => api.get('/playbooks', PlaybookListResponse),

  get: (id: string) => api.get(`/playbooks/${id}`, PlaybookSchema),

  create: (body: CreatePlaybookBody) => api.post('/playbooks', PlaybookSchema, body),

  update: (id: string, body: UpdatePlaybookBody) =>
    api.patch(`/playbooks/${id}`, PlaybookSchema, body),

  remove: (id: string) => api.delete(`/playbooks/${id}`, DeleteResponse),

  createChecklist: (playbookId: string, body: UpdateChecklistBody) =>
    api.post(`/playbooks/${playbookId}/checklists`, ChecklistSchema, body),

  updateChecklist: (playbookId: string, checklistId: string, body: UpdateChecklistBody) =>
    api.patch(`/playbooks/${playbookId}/checklists/${checklistId}`, ChecklistSchema, body),
};
