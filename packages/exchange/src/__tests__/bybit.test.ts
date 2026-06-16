import { describe, expect, it } from 'vitest';
import fixturesRaw from '../../__fixtures__/bybit/trades.json';
import type { BybitTradeInfo } from '../bybit/normalize';
import { normalizeBybitTrade } from '../bybit/normalize';

const [info0, info1, info2] = fixturesRaw as [BybitTradeInfo, BybitTradeInfo, BybitTradeInfo];

describe('normalizeBybitTrade', () => {
  it('maps a buy trade correctly', () => {
    const result = normalizeBybitTrade(info0);
    expect(result.exchangeTradeId).toBe('a1b2c3d4e5');
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.side).toBe('buy');
    expect(result.qty).toBe('0.001');
    expect(result.price).toBe('16620.50');
    expect(result.fee).toBe('0.01');
    expect(result.feeCcy).toBe('USDT');
    expect(result.executedAt).toEqual(new Date(1672364174443));
  });

  it('maps a sell trade correctly', () => {
    const result = normalizeBybitTrade(info1);
    expect(result.side).toBe('sell');
    expect(result.price).toBe('17050.00');
    expect(result.qty).toBe('0.001');
  });

  it('defaults feeCcy to USDT when feeCurrency is absent', () => {
    const result = normalizeBybitTrade(info2);
    expect(result.feeCcy).toBe('USDT');
  });

  it('parses execTime string to Date', () => {
    const result = normalizeBybitTrade(info0);
    expect(result.executedAt).toEqual(new Date(1672364174443));
  });

  it('normalizes side to lowercase', () => {
    expect(normalizeBybitTrade(info0).side).toBe('buy');
    expect(normalizeBybitTrade(info1).side).toBe('sell');
  });
});
