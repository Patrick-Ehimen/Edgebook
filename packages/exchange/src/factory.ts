import type { Venue } from '@edgebook/shared/accounts';
import { BinanceAdapter } from './binance';
import { BybitAdapter } from './bybit';
import type { ExchangeAdapter } from './types';

export function createAdapter(venue: Venue, apiKey: string, secret: string): ExchangeAdapter {
  switch (venue) {
    case 'binance':
      return new BinanceAdapter(apiKey, secret);
    case 'bybit':
      return new BybitAdapter(apiKey, secret);
    default: {
      const _exhaustive: never = venue;
      throw new Error(`Unsupported venue: ${_exhaustive}`);
    }
  }
}
