import { bybit } from 'ccxt';
import type { ExchangeAdapter, NormalizedFill } from '../types';
import { type BybitTradeInfo, normalizeBybitTrade } from './normalize';

const PAGE_LIMIT = 200; // Bybit max per page

interface BybitExecListResult {
  retCode: number;
  retMsg: string;
  result: {
    nextPageCursor: string;
    category: string;
    list: BybitTradeInfo[];
  };
}

export class BybitAdapter implements ExchangeAdapter {
  private readonly exchange: bybit;

  constructor(apiKey: string, secret: string) {
    this.exchange = new bybit({
      apiKey,
      secret,
      enableRateLimit: true,
      timeout: 30_000,
      options: { defaultType: 'linear' },
    });
  }

  async fetchFillsSince(from: Date, symbol?: string): Promise<NormalizedFill[]> {
    const results: NormalizedFill[] = [];
    let cursor: string | undefined;

    // Use the raw v5 execution list endpoint — avoids market loading entirely
    // (CCXT's fetchMyTrades loads all market types first, which hangs on restricted networks)
    while (true) {
      const params: Record<string, string | number> = {
        category: 'linear',
        limit: PAGE_LIMIT,
        startTime: from.getTime(),
      };
      if (symbol) params.symbol = symbol;
      if (cursor) params.cursor = cursor;

      const resp = await (this.exchange as unknown as Record<string, (p: Record<string, string | number>) => Promise<BybitExecListResult>>)
        .privateGetV5ExecutionList(params);

      if (resp.retCode !== 0) {
        throw new Error(`Bybit API error ${resp.retCode}: ${resp.retMsg}`);
      }

      for (const item of resp.result.list) {
        results.push(normalizeBybitTrade(item));
      }

      cursor = resp.result.nextPageCursor || undefined;
      if (!cursor || resp.result.list.length < PAGE_LIMIT) break;
    }

    return results;
  }
}
