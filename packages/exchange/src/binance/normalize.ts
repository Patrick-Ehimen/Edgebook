import type { NormalizedFill } from '../types';

export interface BinanceUsdmTradeInfo {
  symbol: string;      // 'BTCUSDT'
  side: string;        // 'BUY' | 'SELL'
  qty: string;         // '0.002'
  price: string;       // '7819.01'
  commission: string;  // '0.07819010' (positive) or '-0.07819010' (rebate)
  commissionAsset: string; // 'USDT'
  id: string;
  time: number;
}

export function normalizeBinanceTrade(info: BinanceUsdmTradeInfo): NormalizedFill {
  // Commission may be negative for maker rebates — store absolute value
  const fee = info.commission.startsWith('-')
    ? info.commission.slice(1)
    : info.commission;

  return {
    exchangeTradeId: info.id,
    symbol: info.symbol,
    side: info.side.toLowerCase() as 'buy' | 'sell',
    qty: info.qty,
    price: info.price,
    fee,
    feeCcy: info.commissionAsset,
    executedAt: new Date(info.time),
  };
}
