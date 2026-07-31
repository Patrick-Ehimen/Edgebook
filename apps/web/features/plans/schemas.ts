import { z } from 'zod';

export {
  PlanStatus,
  PlanCheckItem,
  PlanFieldValue,
  PlanValues,
  PlanRules,
  CreatePlan,
  UpdatePlan,
  PLAN_TEMPLATE,
  PLAN_FIELDS,
  PLAN_RULE_FIELDS,
  PLAYBOOK_PREFILL,
  PLAYBOOK_SLOTS,
} from '@edgebook/shared/plans';
export type {
  PlanField,
  PlanFieldType,
  PlanSubsection,
  PlanSectionTemplate,
} from '@edgebook/shared/plans';

export const PlanResponse = z.object({
  id: z.string(),
  userId: z.string(),
  name: z.string(),
  owner: z.string(),
  method: z.string(),
  version: z.string(),
  status: z.enum(['draft', 'active', 'archived']),
  effectiveFrom: z.string().nullable(),
  valuesJson: z.record(z.string(), z.unknown()),
  rulesJson: z.record(z.string(), z.unknown()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const PlanListResponse = z.array(PlanResponse);
export const OkResponse = z.object({ ok: z.literal(true) });

export type Plan = z.infer<typeof PlanResponse>;
