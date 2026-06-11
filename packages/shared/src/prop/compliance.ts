/**
 * Pure compliance evaluator — zero I/O, no Node-specific APIs.
 * Runs identically in the browser (real-time UI checks) and in workers.
 */

import type {
  ComplianceCheck,
  ComplianceResult,
  ComplianceStatus,
  PropAccountSnapshot,
  PropRulePack,
} from './types';

// ─── Thresholds for WARNING / CRITICAL ────────────────────────────────────────

/** Fraction of headroom consumed at which status escalates. */
const WARN_AT = 0.75;   // 75% consumed → WARNING
const CRIT_AT = 0.90;   // 90% consumed → CRITICAL

function statusFromFraction(used: number): ComplianceStatus {
  if (used >= 1) return 'BREACH';
  if (used >= CRIT_AT) return 'CRITICAL';
  if (used >= WARN_AT) return 'WARNING';
  return 'OK';
}

function fmt(n: number, decimals = 0): string {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ─── Individual rule evaluators ───────────────────────────────────────────────

function checkProfitTarget(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck {
  const target = pack.accountSize * pack.profitTargetPct;
  const used = snap.totalRealizedPnl / target;
  const status: ComplianceStatus = used >= 1 ? 'OK' : 'OK'; // profit target is always OK until hit
  return {
    rule: 'PROFIT_TARGET_HIT',
    status: used >= 1 ? 'OK' : 'OK',
    usedFraction: Math.max(0, used),
    label: `+$${fmt(snap.totalRealizedPnl, 2)} of $${fmt(target, 2)} target (${fmt(used * 100, 1)}%)`,
  };
}

function checkDailyLoss(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck | null {
  if (pack.maxDailyLossPct === null) return null;

  const cap = pack.accountSize * pack.maxDailyLossPct;
  // todayPnl is negative when losing
  const loss = Math.max(0, -snap.todayPnl);
  const used = loss / cap;
  const status = statusFromFraction(used);

  return {
    rule: used >= 1 ? 'DAILY_LOSS_BREACH' : 'DAILY_LOSS_WARNING',
    status,
    usedFraction: used,
    label: `Daily loss −$${fmt(loss, 2)} of $${fmt(cap, 2)} cap`,
    ...(status !== 'OK' ? { detail: `$${fmt(cap - loss, 2)} headroom remaining today` } : {}),
  };
}

function checkDrawdown(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck {
  const cap = pack.accountSize * pack.maxOverallLossPct;
  const startBalance = pack.accountSize; // eval starts at account size

  let drawdown: number;

  switch (pack.drawdownKind) {
    case 'STATIC':
      // Loss from initial balance — floor never moves
      drawdown = Math.max(0, startBalance - (startBalance + snap.totalRealizedPnl));
      break;
    case 'EOD_TRAILING':
      // Floor moves up with peak EOD balance; current intraday spikes don't move it
      drawdown = Math.max(0, snap.peakBalance - (startBalance + snap.totalRealizedPnl));
      break;
    case 'TICK_TRAILING':
      // Floor moves with every tick (peak includes unrealised — approximated here as realized)
      drawdown = Math.max(0, snap.peakBalance - (startBalance + snap.totalRealizedPnl));
      break;
  }

  const used = drawdown / cap;
  const status = statusFromFraction(used);

  return {
    rule: used >= 1 ? 'DRAWDOWN_BREACH' : 'DRAWDOWN_WARNING',
    status,
    usedFraction: used,
    label: `Drawdown $${fmt(drawdown, 2)} of $${fmt(cap, 2)} (${pack.drawdownKind.replace('_', ' ').toLowerCase()})`,
    ...(status !== 'OK'
      ? { detail: `$${fmt(cap - drawdown, 2)} headroom — ${pack.drawdownKind === 'TICK_TRAILING' ? 'trails every tick' : pack.drawdownKind === 'EOD_TRAILING' ? 'floor moves at day close' : 'fixed from initial balance'}` }
      : {}),
  };
}

function checkConsistency(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck | null {
  if (pack.consistencyMaxDayPct === null || snap.totalRealizedPnl <= 0) return null;

  const used = snap.bestDayPnl / snap.totalRealizedPnl;
  const cap = pack.consistencyMaxDayPct;
  const fraction = used / cap;
  const status = statusFromFraction(fraction);

  return {
    rule: fraction >= 1 ? 'CONSISTENCY_BREACH' : 'CONSISTENCY_WARNING',
    status,
    usedFraction: fraction,
    label: `Best day ${fmt(used * 100, 1)}% of total — cap ${fmt(cap * 100, 0)}%`,
    ...(status !== 'OK'
      ? { detail: `Best day $${fmt(snap.bestDayPnl, 2)} is ${fmt(used * 100, 1)}% of $${fmt(snap.totalRealizedPnl, 2)} total` }
      : {}),
  };
}

function checkMinDays(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck | null {
  if (pack.minTradingDays === null) return null;

  const met = snap.tradingDaysCount >= pack.minTradingDays;
  return {
    rule: 'MIN_DAYS_MET',
    status: met ? 'OK' : 'OK', // not a breach risk — just informational until eval end
    usedFraction: Math.min(1, snap.tradingDaysCount / pack.minTradingDays),
    label: `${snap.tradingDaysCount} of ${pack.minTradingDays} required trading days`,
  };
}

function checkExposure(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceCheck | null {
  if (pack.maxTotalExposurePct === null) return null;

  const cap = pack.accountSize * pack.maxTotalExposurePct;
  const used = snap.openNotional / cap;
  const status = statusFromFraction(used);

  return {
    rule: 'EXPOSURE_WARNING',
    status,
    usedFraction: used,
    label: `Open notional $${fmt(snap.openNotional, 2)} of $${fmt(cap, 2)} (${fmt(pack.maxTotalExposurePct * 100, 0)}% cap)`,
    ...(status !== 'OK' ? { detail: `Reduce open positions — cap is ${fmt(pack.maxTotalExposurePct * 100, 0)}% of account` } : {}),
  };
}

// ─── Public evaluator ─────────────────────────────────────────────────────────

/**
 * Evaluate all applicable compliance rules for a prop account.
 *
 * @param pack  - The active rule pack for this account+phase
 * @param snap  - Current account state snapshot (all values in USDT)
 * @returns     ComplianceResult with per-rule check statuses
 */
export function evaluateCompliance(
  pack: PropRulePack,
  snap: PropAccountSnapshot,
): ComplianceResult {
  const raw: (ComplianceCheck | null)[] = [
    checkProfitTarget(pack, snap),
    checkDailyLoss(pack, snap),
    checkDrawdown(pack, snap),
    checkConsistency(pack, snap),
    checkMinDays(pack, snap),
    checkExposure(pack, snap),
  ];

  const checks = raw.filter((c): c is ComplianceCheck => c !== null);

  const isBreach = checks.some((c) => c.status === 'BREACH');
  const isUrgent = checks.some((c) => c.status === 'CRITICAL' || c.status === 'BREACH');

  return { checks, isBreach, isUrgent };
}

// ─── Helpers for UI ───────────────────────────────────────────────────────────

/** Fraction of the daily loss cap consumed so far today (0–1+). */
export function dailyLossUsedFraction(pack: PropRulePack, todayLoss: number): number {
  if (pack.maxDailyLossPct === null) return 0;
  return Math.max(0, todayLoss) / (pack.accountSize * pack.maxDailyLossPct);
}

/** Fraction of the overall drawdown cap consumed (0–1+). */
export function drawdownUsedFraction(
  pack: PropRulePack,
  peakBalance: number,
  currentBalance: number,
): number {
  const drawdown = Math.max(0, peakBalance - currentBalance);
  return drawdown / (pack.accountSize * pack.maxOverallLossPct);
}

/** Fraction of the profit target reached (0–1+). */
export function profitTargetFraction(pack: PropRulePack, totalPnl: number): number {
  return totalPnl / (pack.accountSize * pack.profitTargetPct);
}
