import { bybit } from 'ccxt';
import type { ExchangeAdapter, NormalizedFill } from '../types';
import { type BybitTradeInfo, normalizeBybitTrade } from './normalize';

const PAGE_LIMIT = 200; // Bybit max per page

export class BybitAdapter implements ExchangeAdapter {
  private readonly exchange: bybit;

  constructor(apiKey: string, secret: string) {
    this.exchange = new bybit({
      apiKey,
      secret,
      enableRateLimit: true,
      options: { defaultType: 'linear' },
    });
  }

  async fetchFillsSince(from: Date, symbol?: string): Promise<NormalizedFill[]> {
    const ccxtSymbol = symbol ? nativeToPerp(symbol) : undefined;
    let since = from.getTime();
    const results: NormalizedFill[] = [];

    while (true) {
      const trades = await this.exchange.fetchMyTrades(ccxtSymbol, since, PAGE_LIMIT);
      for (const trade of trades) {
        results.push(normalizeBybitTrade(trade.info as BybitTradeInfo));
      }
      if (trades.length < PAGE_LIMIT) break;
      const lastTs = trades[trades.length - 1]?.timestamp;
      if (lastTs !== undefined) since = lastTs + 1;
    }

    return results;
  }
}

/** 'BTCUSDT' → 'BTC/USDT:USDT' */
function nativeToPerp(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    const base = symbol.slice(0, -4);
    return `${base}/USDT:USDT`;
  }
  return symbol;
}
