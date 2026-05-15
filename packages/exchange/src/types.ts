export interface NormalizedFill {
  exchangeTradeId: string;
  symbol: string;   // native exchange symbol e.g. 'BTCUSDT'
  side: 'buy' | 'sell';
  qty: string;      // positive decimal string, preserves exchange precision
  price: string;    // positive decimal string
  fee: string;      // non-negative decimal string
  feeCcy: string;
  executedAt: Date;
}

export interface ExchangeAdapter {
  /** Fetch all fills since `from`, paginating internally. */
  fetchFillsSince(from: Date, symbol?: string): Promise<NormalizedFill[]>;
}
