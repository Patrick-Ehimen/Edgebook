// ─── Enums ────────────────────────────────────────────────────────────────────

export type DrawdownKind = 'STATIC' | 'EOD_TRAILING' | 'TICK_TRAILING';

export type PropAccountStatus = 'EVAL' | 'FUNDED' | 'PASSED' | 'SUSPENDED' | 'CLOSED';

export type PropEventKind =
  | 'DAILY_LOSS_WARNING'
  | 'DAILY_LOSS_BREACH'
  | 'DRAWDOWN_WARNING'
  | 'DRAWDOWN_BREACH'
  | 'CONSISTENCY_WARNING'
  | 'CONSISTENCY_BREACH'
  | 'SL_MISSING_WARNING'
  | 'EXPOSURE_WARNING'
  | 'PROFIT_TARGET_HIT'
  | 'MIN_DAYS_MET'
  | 'DAILY_RESET'
  | 'ACCOUNT_LOCKED';

export type PropEventSeverity = 'INFO' | 'WARNING' | 'CRITICAL';

export type PropPayoutStatus = 'PENDING' | 'PAID' | 'REJECTED';

// ─── Rule pack ────────────────────────────────────────────────────────────────

export interface PropRulePack {
  id: string;
  firmId: string;
  version: string;
  accountSize: number;   // USDT
  phase: number;         // 1 | 2
  isActive: boolean;

  profitTargetPct: number;      // 0.10 = 10%

  drawdownKind: DrawdownKind;
  maxDailyLossPct: number | null;
  maxOverallLossPct: number;

  consistencyMaxDayPct: number | null; // null = no consistency rule

  minTradingDays: number | null;
  timeLimitDays: number | null;
  maxRiskPerTradePct: number | null;   // funded-stage only on some firms
  maxTotalExposurePct: number | null;  // funded-stage only on some firms
  slRequiredWithinSecs: number | null; // HyroTrader: 300

  weekendHoldAllowed: boolean;
  overnightHoldAllowed: boolean;

  profitSplitPct: number; // 0.70 = 70%

  verifiedAt: Date;
  notes: string | null;
}

// ─── Account state snapshot ───────────────────────────────────────────────────

/** All monetary values in USDT. */
export interface PropAccountSnapshot {
  accountSize: number;
  /** Running total of realized P&L since eval start. */
  totalRealizedPnl: number;
  /** Best single-day realized P&L seen during the eval. */
  bestDayPnl: number;
  /** Today's realized P&L (UTC day). */
  todayPnl: number;
  /** Balance at the start of the current UTC day. */
  todayStartBalance: number;
  /** Highest balance reached since eval start (used by trailing DD). */
  peakBalance: number;
  /** Number of distinct UTC days with at least one closed position. */
  tradingDaysCount: number;
  /** Current open notional value (sum of all open position sizes). */
  openNotional: number;
}

// ─── Compliance check results ─────────────────────────────────────────────────

export type ComplianceStatus = 'OK' | 'WARNING' | 'CRITICAL' | 'BREACH';

export interface ComplianceCheck {
  rule: PropEventKind;
  status: ComplianceStatus;
  /** 0–1: how much of the allowed headroom has been consumed. */
  usedFraction: number;
  /** Human-readable summary e.g. "−$840 used of $2,000 daily cap". */
  label: string;
  /** Present when status !== OK. */
  detail?: string;
}

export interface ComplianceResult {
  checks: ComplianceCheck[];
  /** True if any check is BREACH — account should be locked. */
  isBreach: boolean;
  /** True if any check is CRITICAL or BREACH — surface urgent alert. */
  isUrgent: boolean;
}
