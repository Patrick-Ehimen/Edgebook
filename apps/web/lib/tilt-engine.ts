// Pure tilt rule evaluators — no I/O, no Node APIs, browser-safe.

export type TiltEvent = {
  ruleId: string;
  ruleLabel: string;
  level: 'soft' | 'hard';
  detail: string;
  cooldownUntil?: number;
};

export type TiltRule = {
  id: string;
  label: string;
  level: 'soft' | 'hard';
  enabled: boolean;
  params: { label: string; value: string; unit?: string }[];
};

export type TiltPosition = {
  symbol: string;
  status: 'open' | 'closed';
  netPnl: string;
  closedAt: string | null;
  qtyMax: string;
};

function param(rule: TiltRule, label: string, fallback: string): string {
  return rule.params.find((p) => p.label === label)?.value ?? fallback;
}

// ─── Individual evaluators ────────────────────────────────────────────────────

export function evalConsecutiveLosses(
  rule: TiltRule,
  positions: TiltPosition[],
  now: number,
): TiltEvent | null {
  if (!rule.enabled) return null;

  const n = Number.parseInt(param(rule, 'Trigger after', '3'), 10);
  const cooldownMin = Number.parseInt(param(rule, 'Cooldown', '30'), 10);

  const closed = positions
    .filter((p) => p.status === 'closed' && p.closedAt != null)
    .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime());

  if (closed.length < n) return null;

  const lastN = closed.slice(0, n);
  if (!lastN.every((p) => Number.parseFloat(p.netPnl) < 0)) return null;

  const lastLossTime = new Date(lastN[0]?.closedAt ?? '').getTime();
  const cooldownUntil = lastLossTime + cooldownMin * 60_000;
  if (now >= cooldownUntil) return null;

  const remainingMin = Math.ceil((cooldownUntil - now) / 60_000);
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    level: rule.level,
    detail: `${n} consecutive losses — cooldown ${remainingMin}m remaining`,
    cooldownUntil,
  };
}

export function evalDailyLossBreaker(
  rule: TiltRule,
  positions: TiltPosition[],
  now: number,
): TiltEvent | null {
  if (!rule.enabled) return null;

  const todayMs = Date.UTC(
    new Date(now).getUTCFullYear(),
    new Date(now).getUTCMonth(),
    new Date(now).getUTCDate(),
  );

  const todayPnl = positions
    .filter(
      (p) =>
        p.status === 'closed' && p.closedAt != null && new Date(p.closedAt).getTime() >= todayMs,
    )
    .reduce((sum, p) => sum + Number.parseFloat(p.netPnl), 0);

  if (todayPnl >= 0) return null;

  const absLoss = Math.abs(todayPnl).toFixed(2);
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    level: rule.level,
    detail: `Daily loss −$${absLoss} today`,
  };
}

export function evalRevengeReentry(
  rule: TiltRule,
  positions: TiltPosition[],
  symbol: string,
  now: number,
): TiltEvent | null {
  if (!rule.enabled || !symbol) return null;

  const windowSec = Number.parseInt(param(rule, 'Window', '60'), 10);
  const windowMs = windowSec * 1_000;
  const sym = symbol.toUpperCase();

  const lastLoss = positions
    .filter(
      (p) =>
        p.symbol === sym &&
        p.status === 'closed' &&
        p.closedAt != null &&
        Number.parseFloat(p.netPnl) < 0,
    )
    .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())[0];

  if (!lastLoss) return null;

  const lossTime = new Date(lastLoss.closedAt ?? '').getTime();
  const cooldownUntil = lossTime + windowMs;
  if (now >= cooldownUntil) return null;

  const remainingSec = Math.ceil((cooldownUntil - now) / 1_000);
  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    level: rule.level,
    detail: `Re-entry on ${sym} blocked — ${remainingSec}s remaining`,
    cooldownUntil,
  };
}

export function evalOversizeEntry(
  rule: TiltRule,
  positions: TiltPosition[],
  proposedQty: number,
): TiltEvent | null {
  if (!rule.enabled || proposedQty <= 0) return null;

  const multiple = Number.parseFloat(param(rule, 'Multiple', '2.0'));

  const last30 = positions
    .filter((p) => p.status === 'closed' && p.closedAt != null)
    .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())
    .slice(0, 30);

  if (last30.length === 0) return null;

  const avgQty = last30.reduce((sum, p) => sum + Number.parseFloat(p.qtyMax), 0) / last30.length;
  if (avgQty <= 0 || proposedQty <= avgQty * multiple) return null;

  return {
    ruleId: rule.id,
    ruleLabel: rule.label,
    level: rule.level,
    detail: `Size ${proposedQty.toFixed(3)} is ${(proposedQty / avgQty).toFixed(1)}× your 30-trade avg (threshold: ${(avgQty * multiple).toFixed(3)})`,
  };
}

// ─── Bulk evaluators ──────────────────────────────────────────────────────────

function matchRule(rule: TiltRule): 'consecutive' | 'daily-loss' | 'revenge' | 'oversize' | null {
  const lbl = rule.label.toLowerCase();
  if (lbl.includes('cooldown') || lbl.includes('consecutive')) return 'consecutive';
  if ((lbl.includes('daily') && lbl.includes('loss')) || lbl.includes('circuit'))
    return 'daily-loss';
  if (lbl.includes('revenge')) return 'revenge';
  if (lbl.includes('oversize') || lbl.includes('confirm')) return 'oversize';
  return null;
}

/** Evaluate rules that can fire without knowing the specific trade (for the global banner). */
export function evalGlobalRules(
  rules: TiltRule[],
  positions: TiltPosition[],
  now: number,
): TiltEvent[] {
  const events: TiltEvent[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const kind = matchRule(rule);
    if (kind === 'consecutive') {
      const e = evalConsecutiveLosses(rule, positions, now);
      if (e) events.push(e);
    } else if (kind === 'daily-loss') {
      const e = evalDailyLossBreaker(rule, positions, now);
      if (e) events.push(e);
    }
  }
  return events;
}

/** Evaluate all rules for a specific trade being logged. */
export function evalTradeRules(
  rules: TiltRule[],
  positions: TiltPosition[],
  symbol: string,
  proposedQty: number,
  now: number,
): TiltEvent[] {
  const events: TiltEvent[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;
    const kind = matchRule(rule);
    if (kind === 'consecutive') {
      const e = evalConsecutiveLosses(rule, positions, now);
      if (e) events.push(e);
    } else if (kind === 'daily-loss') {
      const e = evalDailyLossBreaker(rule, positions, now);
      if (e) events.push(e);
    } else if (kind === 'revenge') {
      const e = evalRevengeReentry(rule, positions, symbol, now);
      if (e) events.push(e);
    } else if (kind === 'oversize') {
      const e = evalOversizeEntry(rule, positions, proposedQty);
      if (e) events.push(e);
    }
  }
  return events;
}
