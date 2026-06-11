import { z } from 'zod';

// ─── Enums ────────────────────────────────────────────────────────────────────

export const DrawdownKindSchema = z.enum(['STATIC', 'EOD_TRAILING', 'TICK_TRAILING']);

export const PropAccountStatusSchema = z.enum([
  'EVAL',
  'FUNDED',
  'PASSED',
  'SUSPENDED',
  'CLOSED',
]);

export const PropEventKindSchema = z.enum([
  'DAILY_LOSS_WARNING',
  'DAILY_LOSS_BREACH',
  'DRAWDOWN_WARNING',
  'DRAWDOWN_BREACH',
  'CONSISTENCY_WARNING',
  'CONSISTENCY_BREACH',
  'SL_MISSING_WARNING',
  'EXPOSURE_WARNING',
  'PROFIT_TARGET_HIT',
  'MIN_DAYS_MET',
  'DAILY_RESET',
  'ACCOUNT_LOCKED',
]);

export const PropEventSeveritySchema = z.enum(['INFO', 'WARNING', 'CRITICAL']);

export const PropPayoutStatusSchema = z.enum(['PENDING', 'PAID', 'REJECTED']);

// ─── Prop firm ────────────────────────────────────────────────────────────────

export const PropFirmSchema = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  website: z.string().url(),
  logoInitial: z.string().length(1),
  logoColor: z.string(),
  exchanges: z.array(z.string()),
  flags: z.array(z.string()),
});

// ─── Rule pack ────────────────────────────────────────────────────────────────

export const PropRulePackSchema = z.object({
  id: z.string(),
  firmId: z.string(),
  version: z.string(),
  accountSize: z.number().positive(),
  phase: z.number().int().min(1).max(2),
  isActive: z.boolean(),

  profitTargetPct: z.number().positive().max(1),

  drawdownKind: DrawdownKindSchema,
  maxDailyLossPct: z.number().positive().max(1).nullable(),
  maxOverallLossPct: z.number().positive().max(1),

  consistencyMaxDayPct: z.number().positive().max(1).nullable(),

  minTradingDays: z.number().int().positive().nullable(),
  timeLimitDays: z.number().int().positive().nullable(),
  maxRiskPerTradePct: z.number().positive().max(1).nullable(),
  maxTotalExposurePct: z.number().positive().max(1).nullable(),
  slRequiredWithinSecs: z.number().int().positive().nullable(),

  weekendHoldAllowed: z.boolean(),
  overnightHoldAllowed: z.boolean(),

  profitSplitPct: z.number().positive().max(1),

  verifiedAt: z.coerce.date(),
  notes: z.string().nullable(),
});

// ─── Account CRUD ─────────────────────────────────────────────────────────────

export const CreatePropAccountSchema = z.object({
  firmId: z.string().cuid(),
  rulePackId: z.string().cuid(),
  label: z.string().min(1).max(120),
  externalId: z.string().max(120).optional(),
  accountSize: z.number().positive(),
  phase: z.number().int().min(1).max(2),
  startedAt: z.coerce.date(),
  exchangeAccountId: z.string().cuid().optional(),
});

export type CreatePropAccountInput = z.infer<typeof CreatePropAccountSchema>;

export const UpdatePropAccountSchema = z.object({
  label: z.string().min(1).max(120).optional(),
  phase: z.number().int().min(1).max(2).optional(),
  status: PropAccountStatusSchema.optional(),
  rulePackId: z.string().cuid().optional(),
  externalId: z.string().max(120).optional(),
  exchangeAccountId: z.string().cuid().optional(),
});

export type UpdatePropAccountInput = z.infer<typeof UpdatePropAccountSchema>;

// ─── Payout ───────────────────────────────────────────────────────────────────

export const CreatePropPayoutSchema = z.object({
  propAccountId: z.string().cuid(),
  grossAmount: z.number().positive(),
  splitPct: z.number().positive().max(1),
  requestedAt: z.coerce.date(),
  notes: z.string().max(500).optional(),
});

export type CreatePropPayoutInput = z.infer<typeof CreatePropPayoutSchema>;

// ─── Snapshot input ───────────────────────────────────────────────────────────

export const PropAccountSnapshotSchema = z.object({
  accountSize: z.number().positive(),
  totalRealizedPnl: z.number(),
  bestDayPnl: z.number(),
  todayPnl: z.number(),
  todayStartBalance: z.number(),
  peakBalance: z.number(),
  tradingDaysCount: z.number().int().min(0),
  openNotional: z.number().min(0),
});

export type PropAccountSnapshotInput = z.infer<typeof PropAccountSnapshotSchema>;
