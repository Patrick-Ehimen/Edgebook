import { binanceusdm } from 'ccxt';
import type { ExchangeAdapter, NormalizedFill } from '../types';
import { type BinanceUsdmTradeInfo, normalizeBinanceTrade } from './normalize';

const PAGE_LIMIT = 1000;

export class BinanceAdapter implements ExchangeAdapter {
  private readonly exchange: binanceusdm;

  constructor(apiKey: string, secret: string) {
    this.exchange = new binanceusdm({
      apiKey,
      secret,
      enableRateLimit: true,
      options: { adjustForTimeDifference: true },
    });
  }

  async fetchFillsSince(from: Date, symbol?: string): Promise<NormalizedFill[]> {
    const ccxtSymbol = symbol ? nativeToPerp(symbol) : undefined;
    let since = from.getTime();
    const results: NormalizedFill[] = [];

    while (true) {
      const trades = await this.exchange.fetchMyTrades(ccxtSymbol, since, PAGE_LIMIT);
      for (const trade of trades) {
        results.push(normalizeBinanceTrade(trade.info as BinanceUsdmTradeInfo));
      }
      if (trades.length < PAGE_LIMIT) break;
      const lastTs = trades[trades.length - 1]?.timestamp;
      if (lastTs !== undefined) since = lastTs + 1;
    }

    return results;
  }
}

/** 'BTCUSDT' → 'BTC/USDT:USDT' (ccxt perpetual symbol format) */
function nativeToPerp(symbol: string): string {
  if (symbol.endsWith('USDT')) {
    const base = symbol.slice(0, -4);
    return `${base}/USDT:USDT`;
  }
  if (symbol.endsWith('BUSD')) {
    const base = symbol.slice(0, -4);
    return `${base}/BUSD:BUSD`;
  }
  return symbol;
}
