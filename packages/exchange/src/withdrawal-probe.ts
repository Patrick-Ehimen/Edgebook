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
 * Attempts a withdrawal with the supplied key to verify it is read-only.
 * A key is safe iff the exchange returns a permission-denied error.
 * If the withdrawal succeeds or returns anything other than a permission error,
 * the key has write access and must be rejected.
 *
 * In development mode (NODE_ENV !== 'production') the probe is skipped so
 * engineers can work locally without real exchange credentials.
 */
export async function probeWithdrawal(opts: ProbeOptions): Promise<ProbeResult> {
  if (process.env.NODE_ENV !== 'production') {
    return { safe: true, reason: 'dev-mode: probe skipped' };
  }

  // Real implementation goes here once ccxt.pro adapters are built.
  // Pattern per venue:
  //   binance: POST /sapi/v1/capital/withdraw/apply  → expect { code: -2015 } (invalid API key scope)
  //   bybit:   POST /v5/asset/withdraw/create        → expect { retCode: 10003 } (invalid permissions)
  //
  // If the call resolves with a success shape → return { safe: false, reason: 'withdrawal-succeeded' }
  // If the call throws with a permissions error → return { safe: true, reason: 'permission-denied' }
  // Any other error (network, unknown) → throw so the caller can surface it to the user

  throw new Error(`probeWithdrawal: production impl not yet available for venue "${opts.venue}"`);
}
