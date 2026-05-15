import type { NormalizedFill } from '../types';

export interface BybitTradeInfo {
  symbol: string;    // 'BTCUSDT'
  side: string;      // 'Buy' | 'Sell'
  execQty: string;   // '0.001'
  execPrice: string; // '16620.5'
  execFee: string;   // '0.01' (positive; Bybit never sends negative fee strings)
  execId: string;
  execTime: string;  // ms epoch as string e.g. '1672364174443'
  feeCurrency?: string; // present in some responses; default to 'USDT'
}

export function normalizeBybitTrade(info: BybitTradeInfo): NormalizedFill {
  return {
    exchangeTradeId: info.execId,
    symbol: info.symbol,
    side: info.side.toLowerCase() as 'buy' | 'sell',
    qty: info.execQty,
    price: info.execPrice,
    fee: info.execFee,
    feeCcy: info.feeCurrency ?? 'USDT',
    executedAt: new Date(Number(info.execTime)),
  };
}
