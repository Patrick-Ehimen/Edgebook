import { api } from '@/lib/api-client';
import type { CreatePlan, UpdatePlan } from '@edgebook/shared/plans';
import { OkResponse, PlanListResponse, PlanResponse } from './schemas';

export type CreatePlanBody = CreatePlan;
export type UpdatePlanBody = UpdatePlan;

export const plansApi = {
  list: () => api.get('/plans', PlanListResponse),
  get: (planId: string) => api.get(`/plans/${planId}`, PlanResponse),
  create: (body: CreatePlanBody) => api.post('/plans', PlanResponse, body),
  update: (planId: string, body: UpdatePlanBody) =>
    api.patch(`/plans/${planId}`, PlanResponse, body),
  remove: (planId: string) => api.delete(`/plans/${planId}`, OkResponse),
};
