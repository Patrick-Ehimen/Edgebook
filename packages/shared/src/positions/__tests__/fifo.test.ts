import { describe, expect, it } from 'vitest';
import { computePositions } from '../fifo';
import type { RawFill } from '../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

let seq = 1n;

function fill(
  overrides: Partial<RawFill> & Pick<RawFill, 'side' | 'qty' | 'price'>,
): RawFill {
  return {
    id: seq++,
    symbol: 'BTC-USDT',
    fee: '0',
    fundingFee: null,
    executedAt: new Date('2024-01-01T00:00:00Z'),
    ...overrides,
  };
}

function at(iso: string, overrides: Partial<RawFill> & Pick<RawFill, 'side' | 'qty' | 'price'>): RawFill {
  return fill({ ...overrides, executedAt: new Date(iso) });
}

// ─── Simple long ──────────────────────────────────────────────────────────────

describe('simple long position', () => {
  it('computes P&L for a buy → sell round trip', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.side).toBe('long');
    expect(pos?.status).toBe('closed');
    expect(pos?.grossPnl).toBe('10');
    expect(pos?.netPnl).toBe('10');
    expect(pos?.avgEntry).toBe('100');
    expect(pos?.avgExit).toBe('110');
    expect(pos?.qtyMax).toBe('1');
    expect(pos?.fills).toHaveLength(2);
    expect(pos?.fills[0]?.role).toBe('entry');
    expect(pos?.fills[1]?.role).toBe('exit');
  });

  it('produces a loss when exit price is below entry', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '90' }),
    ];
    const [pos] = computePositions(fills);
    expect(pos?.grossPnl).toBe('-10');
  });
});

// ─── Simple short ─────────────────────────────────────────────────────────────

describe('simple short position', () => {
  it('computes P&L for a sell → buy round trip', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'sell', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'buy', qty: '1', price: '90' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.side).toBe('short');
    expect(pos?.status).toBe('closed');
    expect(pos?.grossPnl).toBe('10');
    expect(pos?.avgEntry).toBe('100');
    expect(pos?.avgExit).toBe('90');
  });

  it('produces a loss when exit price is above entry', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'sell', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'buy', qty: '1', price: '110' }),
    ];
    const [pos] = computePositions(fills);
    expect(pos?.grossPnl).toBe('-10');
  });
});

// ─── Scale-ins ────────────────────────────────────────────────────────────────

describe('scale-in', () => {
  it('FIFO-matches multiple lots against a single exit', () => {
    // buy 1 @ 100, buy 1 @ 120 → avgEntry 110; sell 2 @ 130
    // FIFO P&L: (130-100)*1 + (130-120)*1 = 30+10 = 40
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'buy', qty: '1', price: '120' }),
      at('2024-01-01T02:00:00Z', { side: 'sell', qty: '2', price: '130' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.grossPnl).toBe('40');
    expect(pos?.avgEntry).toBe('110');
    expect(pos?.qtyMax).toBe('2');
    expect(pos?.fills[0]?.role).toBe('entry');
    expect(pos?.fills[1]?.role).toBe('scale_in');
    expect(pos?.fills[2]?.role).toBe('exit');
  });
});

// ─── Partial exits ────────────────────────────────────────────────────────────

describe('partial exits', () => {
  it('keeps position open after a partial exit', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '2', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.status).toBe('open');
    expect(pos?.closedAt).toBeNull();
    expect(pos?.grossPnl).toBe('10');
    expect(pos?.avgExit).toBe('110');
    expect(pos?.fills[1]?.role).toBe('scale_out');
  });

  it('closes after multiple partial exits sum to full qty', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '3', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' }),
      at('2024-01-01T02:00:00Z', { side: 'sell', qty: '1', price: '120' }),
      at('2024-01-01T03:00:00Z', { side: 'sell', qty: '1', price: '130' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.status).toBe('closed');
    expect(pos?.grossPnl).toBe('60'); // (10+20+30)
    expect(pos?.avgExit).toBe('120'); // (110+120+130)/3
    expect(pos?.fills.at(-1)?.role).toBe('exit');
  });
});

// ─── Fees and funding ─────────────────────────────────────────────────────────

describe('fees and funding', () => {
  it('subtracts fees from netPnl', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100', fee: '0.5' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110', fee: '0.5' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.grossPnl).toBe('10');
    expect(pos?.fees).toBe('1');
    expect(pos?.netPnl).toBe('9');
  });

  it('includes signed funding in netPnl', () => {
    // Funding paid (negative) reduces netPnl
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100', fundingFee: '-2' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.funding).toBe('-2');
    expect(pos?.netPnl).toBe('8'); // 10 - 0 + (-2)
  });

  it('includes positive funding (received) in netPnl', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'sell', qty: '1', price: '100', fundingFee: '3' }),
      at('2024-01-01T01:00:00Z', { side: 'buy', qty: '1', price: '90' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.grossPnl).toBe('10');
    expect(pos?.funding).toBe('3');
    expect(pos?.netPnl).toBe('13');
  });
});

// ─── Multiple sequential positions ───────────────────────────────────────────

describe('sequential positions on same symbol', () => {
  it('produces two separate positions', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' }),
      at('2024-01-01T02:00:00Z', { side: 'buy', qty: '1', price: '120' }),
      at('2024-01-01T03:00:00Z', { side: 'sell', qty: '1', price: '130' }),
    ];

    const positions = computePositions(fills);

    expect(positions).toHaveLength(2);
    expect(positions[0]?.grossPnl).toBe('10');
    expect(positions[1]?.grossPnl).toBe('10');
  });
});

// ─── Open position ────────────────────────────────────────────────────────────

describe('open position', () => {
  it('returns an open position with zero grossPnl when never closed', () => {
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
    ];

    const [pos] = computePositions(fills);

    expect(pos?.status).toBe('open');
    expect(pos?.closedAt).toBeNull();
    expect(pos?.avgExit).toBeNull();
    expect(pos?.grossPnl).toBe('0');
  });
});

// ─── Cross-zero ───────────────────────────────────────────────────────────────

describe('cross-zero fill', () => {
  it('closes the long and opens a short with the remainder', () => {
    // Long 1 @ 100. Sell 3 @ 110 — closes the long (pnl=10) and opens short 2 @ 110
    const fills: RawFill[] = [
      at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' }),
      at('2024-01-01T01:00:00Z', { side: 'sell', qty: '3', price: '110' }),
    ];

    const positions = computePositions(fills);

    expect(positions).toHaveLength(2);

    const [closed, open] = positions;
    expect(closed?.side).toBe('long');
    expect(closed?.status).toBe('closed');
    expect(closed?.grossPnl).toBe('10');

    expect(open?.side).toBe('short');
    expect(open?.status).toBe('open');
    expect(open?.qtyMax).toBe('2');
    expect(open?.avgEntry).toBe('110');
  });
});

// ─── Multiple symbols ─────────────────────────────────────────────────────────

describe('multiple symbols', () => {
  it('processes each symbol independently', () => {
    const fills: RawFill[] = [
      fill({ symbol: 'BTC-USDT', side: 'buy', qty: '1', price: '100' }),
      fill({ symbol: 'ETH-USDT', side: 'buy', qty: '10', price: '20' }),
      fill({ symbol: 'BTC-USDT', side: 'sell', qty: '1', price: '110' }),
      fill({ symbol: 'ETH-USDT', side: 'sell', qty: '10', price: '25' }),
    ];

    const positions = computePositions(fills);

    expect(positions).toHaveLength(2);
    const btc = positions.find((p) => p.symbol === 'BTC-USDT');
    const eth = positions.find((p) => p.symbol === 'ETH-USDT');
    expect(btc?.grossPnl).toBe('10');
    expect(eth?.grossPnl).toBe('50');
  });
});

// ─── sourceHash determinism ───────────────────────────────────────────────────

describe('sourceHash', () => {
  it('is identical when same fills are passed in different order', () => {
    const f1 = at('2024-01-01T00:00:00Z', { side: 'buy', qty: '1', price: '100' });
    const f2 = at('2024-01-01T01:00:00Z', { side: 'sell', qty: '1', price: '110' });

    const [a] = computePositions([f1, f2]);
    const [b] = computePositions([f2, f1]); // reversed — must re-sort by executedAt

    expect(a?.sourceHash).toBe(b?.sourceHash);
  });
});
