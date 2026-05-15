import { AuthenticationError, PermissionDenied, binance, bybit } from 'ccxt';
import type { Venue } from '@edgebook/shared/accounts';

export interface ProbeResult {
  safe: boolean;
  reason: string;
}

export interface ProbeOptions {
  venue: Venue;
  apiKey: string;
  secret: string;
}

/**
 * Verifies that the supplied API key is read-only by inspecting the key's
 * permission set on the exchange. A key is safe iff withdrawals are disabled.
 *
 * In development (NODE_ENV !== 'production') the probe is skipped so engineers
 * can work locally without real exchange credentials.
 */
export async function probeWithdrawal(opts: ProbeOptions): Promise<ProbeResult> {
  if (process.env.NODE_ENV !== 'production') {
    return { safe: true, reason: 'dev-mode: probe skipped' };
  }

  switch (opts.venue) {
    case 'binance':
      return probeBinance(opts.apiKey, opts.secret);
    case 'bybit':
      return probeBybit(opts.apiKey, opts.secret);
    default: {
      const _exhaustive: never = opts.venue;
      throw new Error(`Unsupported venue: ${_exhaustive}`);
    }
  }
}

interface BinanceApiRestrictions {
  enableWithdrawals?: boolean;
}

interface BinancePrivate {
  sapiGetAccountApiRestrictions(params: object): Promise<BinanceApiRestrictions>;
}

async function probeBinance(apiKey: string, secret: string): Promise<ProbeResult> {
  // Use the spot exchange to reach the sapi/v1/account/apiRestrictions endpoint.
  // The USDM futures class inherits all spot private methods.
  const exchange = new binance({ apiKey, secret, enableRateLimit: true });
  try {
    const restrictions = await (exchange as unknown as BinancePrivate).sapiGetAccountApiRestrictions({});
    if (restrictions.enableWithdrawals === true) {
      return { safe: false, reason: 'withdrawal-enabled' };
    }
    return { safe: true, reason: 'read-only-confirmed' };
  } catch (e) {
    if (e instanceof AuthenticationError || e instanceof PermissionDenied) {
      return { safe: false, reason: 'invalid-credentials' };
    }
    throw e;
  }
}

interface BybitQueryApiResult {
  result?: { readOnly?: number };
}

interface BybitPrivate {
  privateGetV5UserQueryApi(params: object): Promise<BybitQueryApiResult>;
}

async function probeBybit(apiKey: string, secret: string): Promise<ProbeResult> {
  const exchange = new bybit({ apiKey, secret, enableRateLimit: true });
  try {
    // GET /v5/user/query-api returns readOnly: 1 for read-only keys, 0 otherwise
    const resp = await (exchange as unknown as BybitPrivate).privateGetV5UserQueryApi({});
    if (resp.result?.readOnly !== 1) {
      return { safe: false, reason: 'withdrawal-enabled' };
    }
    return { safe: true, reason: 'read-only-confirmed' };
  } catch (e) {
    if (e instanceof AuthenticationError || e instanceof PermissionDenied) {
      return { safe: false, reason: 'invalid-credentials' };
    }
    throw e;
  }
}
