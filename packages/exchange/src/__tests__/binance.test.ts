import { describe, expect, it } from 'vitest';
import fixturesRaw from '../../__fixtures__/binance/trades.json';
import type { BinanceUsdmTradeInfo } from '../binance/normalize';
import { normalizeBinanceTrade } from '../binance/normalize';

const infos = fixturesRaw as BinanceUsdmTradeInfo[];

describe('normalizeBinanceTrade', () => {
  it('maps a buy trade correctly', () => {
    const result = normalizeBinanceTrade(infos[0]!);
    expect(result.exchangeTradeId).toBe('3553007025');
    expect(result.symbol).toBe('BTCUSDT');
    expect(result.side).toBe('buy');
    expect(result.qty).toBe('0.001');
    expect(result.price).toBe('16620.50');
    expect(result.fee).toBe('0.00996123');
    expect(result.feeCcy).toBe('USDT');
    expect(result.executedAt).toEqual(new Date(1672364174443));
  });

  it('maps a sell trade correctly', () => {
    const result = normalizeBinanceTrade(infos[1]!);
    expect(result.side).toBe('sell');
    expect(result.price).toBe('17050.00');
    expect(result.qty).toBe('0.001');
  });

  it('strips leading minus from negative commission (maker rebate)', () => {
    const result = normalizeBinanceTrade(infos[2]!);
    expect(result.fee).toBe('0.04843');
  });

  it('normalizes side to lowercase', () => {
    expect(normalizeBinanceTrade(infos[0]!).side).toBe('buy');
    expect(normalizeBinanceTrade(infos[1]!).side).toBe('sell');
  });

  it('uses commissionAsset as feeCcy', () => {
    expect(normalizeBinanceTrade(infos[0]!).feeCcy).toBe('USDT');
  });
});
