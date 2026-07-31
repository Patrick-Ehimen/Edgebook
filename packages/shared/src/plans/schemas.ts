import { z } from 'zod';

export const PlanStatus = z.enum(['draft', 'active', 'archived']);
export type PlanStatus = z.infer<typeof PlanStatus>;

/**
 * A single checked line in a checklist field. `hard` marks a veto row — any
 * unchecked hard row means the setup fails the checklist.
 */
export const PlanCheckItem = z.object({
  id: z.string().min(1).max(128),
  label: z.string().trim().min(1).max(300),
  hard: z.boolean().default(false),
});
export type PlanCheckItem = z.infer<typeof PlanCheckItem>;

/**
 * Field values are stored by field id. The shape depends on the field's type in
 * the template: text/textarea/number → string, tags → string[],
 * table → string[][] (rows of cells), checklist → PlanCheckItem[].
 */
export const PlanFieldValue = z.union([
  z.string().max(20_000),
  z.array(PlanCheckItem).max(60),
  z.array(z.array(z.string().max(1000)).max(8)).max(60),
  z.array(z.string().max(200)).max(60),
]);
export type PlanFieldValue = z.infer<typeof PlanFieldValue>;

export const PlanValues = z.record(z.string().min(1).max(120), PlanFieldValue);
export type PlanValues = z.infer<typeof PlanValues>;

/**
 * The subset of the plan the tilt engine and adherence scoring read. Kept as
 * decimal strings — never floats — per the money/quantity invariant.
 */
const decimalString = z
  .string()
  .trim()
  .regex(/^\d+(\.\d+)?$/, 'Must be a positive number.')
  .max(20);

export const PlanRules = z.object({
  riskPctPerTrade: decimalString.optional(),
  maxOpenRiskPct: decimalString.optional(),
  maxCorrelatedRiskPct: decimalString.optional(),
  maxOpenPositions: decimalString.optional(),
  dailyLossLimitPct: decimalString.optional(),
  weeklyLossLimitPct: decimalString.optional(),
  monthlyDrawdownLimitPct: decimalString.optional(),
  minRRIntraday: decimalString.optional(),
  minRRSwing: decimalString.optional(),
  minRRCounterTrend: decimalString.optional(),
  leverageCeiling: decimalString.optional(),
  targetExpectancyR: decimalString.optional(),
});
export type PlanRules = z.infer<typeof PlanRules>;

export const CreatePlan = z.object({
  name: z.string().trim().min(1, 'Name required.').max(120),
  owner: z.string().trim().max(120).optional().default(''),
  method: z.string().trim().max(2000).optional().default(''),
  version: z.string().trim().max(20).optional().default('1.0'),
  status: PlanStatus.optional().default('draft'),
  effectiveFrom: z.string().datetime().optional().nullable(),
  valuesJson: PlanValues.optional().default({}),
  rulesJson: PlanRules.optional().default({}),
});
export type CreatePlan = z.infer<typeof CreatePlan>;

export const UpdatePlan = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  owner: z.string().trim().max(120).optional(),
  method: z.string().trim().max(2000).optional(),
  version: z.string().trim().max(20).optional(),
  status: PlanStatus.optional(),
  effectiveFrom: z.string().datetime().optional().nullable(),
  valuesJson: PlanValues.optional(),
  rulesJson: PlanRules.optional(),
});
export type UpdatePlan = z.infer<typeof UpdatePlan>;
