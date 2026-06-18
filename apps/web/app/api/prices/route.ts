import { NextRequest, NextResponse } from 'next/server';

export interface PriceData {
  price: string;
  change: string;
  positive: boolean;
  change7d: string;
  positive7d: boolean;
  change30d: string;
  positive30d: boolean;
}

const SYMBOL_TO_CG: Record<string, string> = {
  BTC:   'bitcoin',
  ETH:   'ethereum',
  SOL:   'solana',
  BNB:   'binancecoin',
  XRP:   'ripple',
  DOGE:  'dogecoin',
  AVAX:  'avalanche-2',
  LINK:  'chainlink',
  MATIC: 'matic-network',
  POL:   'matic-network',
  OP:    'optimism',
  ARB:   'arbitrum',
  SUI:   'sui',
  TON:   'the-open-network',
  PEPE:  'pepe',
  HYPE:  'hyperliquid',
  AAVE:  'aave',
  ADA:   'cardano',
  DOT:   'polkadot',
  UNI:   'uniswap',
  LTC:   'litecoin',
  BCH:   'bitcoin-cash',
  ATOM:  'cosmos',
  NEAR:  'near',
  APT:   'aptos',
  INJ:   'injective-protocol',
  TIA:   'celestia',
  WIF:   'dogwifcoin',
  BONK:  'bonk',
};

function stripBase(symbol: string): string {
  return symbol.replace(/USDT$|USDC$|BUSD$|PERP$/i, '').toUpperCase();
}

function symbolToCgId(symbol: string): string {
  const ticker = stripBase(symbol);
  return SYMBOL_TO_CG[ticker] ?? ticker.toLowerCase();
}

function formatPrice(n: number): string {
  if (n >= 10_000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1)      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function formatChange(pct: number | null | undefined): { change: string; positive: boolean } {
  if (pct == null || Number.isNaN(pct)) return { change: '—', positive: true };
  const sign = pct >= 0 ? '+' : '';
  return { change: `${sign}${pct.toFixed(2)}%`, positive: pct >= 0 };
}

interface CgMarket {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
  price_change_percentage_7d_in_currency: number | null;
  price_change_percentage_30d_in_currency: number | null;
}

export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get('symbols') ?? '';
  const symbols = raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);

  if (!symbols.length) return NextResponse.json({});

  const cgIds = symbols.map(symbolToCgId);
  const uniqueIds = [...new Set(cgIds)];
  const apiKey = process.env.COINGECKO_API_KEY ?? '';

  try {
    const url = new URL('https://api.coingecko.com/api/v3/coins/markets');
    url.searchParams.set('vs_currency', 'usd');
    url.searchParams.set('ids', uniqueIds.join(','));
    url.searchParams.set('price_change_percentage', '7d,30d');
    if (apiKey) url.searchParams.set('x_cg_demo_api_key', apiKey);

    const res = await fetch(url.toString(), { cache: 'no-store' });
    if (!res.ok) return NextResponse.json({}, { status: 502 });

    const data = (await res.json()) as CgMarket[];
    const byId = new Map(data.map((d) => [d.id, d]));

    const result: Record<string, PriceData> = {};
    for (let i = 0; i < symbols.length; i++) {
      const sym = symbols[i];
      const cgId = cgIds[i];
      if (!sym || !cgId) continue;
      const entry = byId.get(cgId);
      if (!entry) continue;
      const c7  = formatChange(entry.price_change_percentage_7d_in_currency);
      const c30 = formatChange(entry.price_change_percentage_30d_in_currency);
      result[sym] = {
        price: formatPrice(entry.current_price),
        ...formatChange(entry.price_change_percentage_24h),
        change7d:    c7.change,
        positive7d:  c7.positive,
        change30d:   c30.change,
        positive30d: c30.positive,
      };
    }

    return NextResponse.json(result);
  } catch {
    return NextResponse.json({}, { status: 502 });
  }
}
