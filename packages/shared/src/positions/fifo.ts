import Decimal from 'decimal.js';
import type { ComputedPosition, FillRole, PositionSide, RawFill } from './types';

Decimal.set({ precision: 30, rounding: Decimal.ROUND_HALF_UP });

// ─── Internal state ───────────────────────────────────────────────────────────

interface Lot {
  qty: Decimal;
  price: Decimal;
}

interface ActivePosition {
  side: PositionSide;
  openedAt: Date;
  lots: Lot[];
  inventory: Decimal;
  qtyMax: Decimal;
  grossPnl: Decimal;
  totalEntryQty: Decimal;
  totalEntryNotional: Decimal;
  totalExitQty: Decimal;
  totalExitNotional: Decimal;
  fees: Decimal;
  funding: Decimal;
  fills: Array<{ fillId: bigint; role: FillRole }>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeActive(side: PositionSide, openedAt: Date): ActivePosition {
  return {
    side,
    openedAt,
    lots: [],
    inventory: new Decimal(0),
    qtyMax: new Decimal(0),
    grossPnl: new Decimal(0),
    totalEntryQty: new Decimal(0),
    totalEntryNotional: new Decimal(0),
    totalExitQty: new Decimal(0),
    totalExitNotional: new Decimal(0),
    fees: new Decimal(0),
    funding: new Decimal(0),
    fills: [],
  };
}

function sourceHashFor(fillIds: bigint[]): string {
  return [...fillIds].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(',');
}

function finalize(pos: ActivePosition, symbol: string, closedAt: Date | null): ComputedPosition {
  const avgEntry = pos.totalEntryQty.isZero()
    ? new Decimal(0)
    : pos.totalEntryNotional.div(pos.totalEntryQty);

  const avgExit = pos.totalExitQty.isZero()
    ? null
    : pos.totalExitNotional.div(pos.totalExitQty);

  const netPnl = pos.grossPnl.minus(pos.fees).plus(pos.funding);

  return {
    symbol,
    side: pos.side,
    status: closedAt ? 'closed' : 'open',
    openedAt: pos.openedAt,
    closedAt,
    qtyMax: pos.qtyMax.toFixed(),
    avgEntry: avgEntry.toFixed(),
    avgExit: avgExit?.toFixed() ?? null,
    grossPnl: pos.grossPnl.toFixed(),
    fees: pos.fees.toFixed(),
    funding: pos.funding.toFixed(),
    netPnl: netPnl.toFixed(),
    sourceHash: sourceHashFor(pos.fills.map((f) => f.fillId)),
    fills: pos.fills,
  };
}

// ─── FIFO matching ────────────────────────────────────────────────────────────

function applyExitFill(
  pos: ActivePosition,
  exitQty: Decimal,
  exitPrice: Decimal,
): void {
  let toMatch = exitQty;

  while (toMatch.gt(0) && pos.lots.length > 0) {
    const lot = pos.lots[0]!;
    const matched = Decimal.min(toMatch, lot.qty);

    pos.grossPnl = pos.grossPnl.plus(
      pos.side === 'long'
        ? matched.mul(exitPrice.minus(lot.price))
        : matched.mul(lot.price.minus(exitPrice)),
    );

    pos.totalExitNotional = pos.totalExitNotional.plus(matched.mul(exitPrice));
    lot.qty = lot.qty.minus(matched);
    toMatch = toMatch.minus(matched);

    if (lot.qty.isZero()) pos.lots.shift();
  }

  pos.inventory = pos.inventory.minus(exitQty);
  pos.totalExitQty = pos.totalExitQty.plus(exitQty);
}

// ─── Per-symbol processing ────────────────────────────────────────────────────

function processSymbol(symbol: string, fills: RawFill[]): ComputedPosition[] {
  const sorted = [...fills].sort(
    (a, b) => a.executedAt.getTime() - b.executedAt.getTime(),
  );

  const results: ComputedPosition[] = [];
  let active: ActivePosition | null = null;

  for (const fill of sorted) {
    const qty = new Decimal(fill.qty);
    const price = new Decimal(fill.price);
    const fee = new Decimal(fill.fee);
    const funding = fill.fundingFee ? new Decimal(fill.fundingFee) : new Decimal(0);

    if (!active) {
      active = makeActive(fill.side === 'buy' ? 'long' : 'short', fill.executedAt);
    }

    const isEntry =
      (active.side === 'long' && fill.side === 'buy') ||
      (active.side === 'short' && fill.side === 'sell');

    // Attribute fees and funding to the current position before branching
    active.fees = active.fees.plus(fee);
    active.funding = active.funding.plus(funding);

    if (isEntry) {
      const role: FillRole = active.inventory.isZero() ? 'entry' : 'scale_in';
      active.lots.push({ qty, price });
      active.inventory = active.inventory.plus(qty);
      active.qtyMax = Decimal.max(active.qtyMax, active.inventory);
      active.totalEntryQty = active.totalEntryQty.plus(qty);
      active.totalEntryNotional = active.totalEntryNotional.plus(qty.mul(price));
      active.fills.push({ fillId: fill.id, role });
    } else {
      // Exit fill — may partially close, fully close, or cross zero
      const closingQty = Decimal.min(qty, active.inventory);
      const crossQty = qty.minus(closingQty); // > 0 only when fill crosses zero

      const isFinalExit = closingQty.eq(active.inventory) && crossQty.isZero();
      const role: FillRole = isFinalExit ? 'exit' : 'scale_out';
      active.fills.push({ fillId: fill.id, role });

      applyExitFill(active, closingQty, price);

      if (active.inventory.isZero()) {
        results.push(finalize(active, symbol, fill.executedAt));

        if (crossQty.gt(0)) {
          // The remainder opens an opposite position; fee already attributed above
          const oppSide: PositionSide = active.side === 'long' ? 'short' : 'long';
          active = makeActive(oppSide, fill.executedAt);
          active.lots.push({ qty: crossQty, price });
          active.inventory = crossQty;
          active.qtyMax = crossQty;
          active.totalEntryQty = crossQty;
          active.totalEntryNotional = crossQty.mul(price);
          active.fills.push({ fillId: fill.id, role: 'entry' });
        } else {
          active = null;
        }
      }
    }
  }

  if (active) {
    results.push(finalize(active, symbol, null));
  }

  return results;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Derives positions from a set of raw fills using FIFO inventory accounting.
 * Pure function — no I/O. Caller is responsible for scoping fills to a single
 * account and passing them all at once. Results are in symbol-then-time order.
 */
export function computePositions(fills: RawFill[]): ComputedPosition[] {
  const bySymbol = new Map<string, RawFill[]>();

  for (const fill of fills) {
    let group = bySymbol.get(fill.symbol);
    if (!group) {
      group = [];
      bySymbol.set(fill.symbol, group);
    }
    group.push(fill);
  }

  const results: ComputedPosition[] = [];
  for (const [symbol, group] of bySymbol) {
    results.push(...processSymbol(symbol, group));
  }

  return results;
}
