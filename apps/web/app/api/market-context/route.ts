import { NextResponse } from 'next/server';

export interface MarketContextItem {
  label: string;
  value: string;
  sub: string;
  positive: boolean | null;
}

export interface MarketContext {
  items: MarketContextItem[];
}

function fmtPrice(n: number): string {
  if (n >= 10_000) return n.toLocaleString('en-US', { maximumFractionDigits: 2 });
  if (n >= 1)      return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 6 });
}

function fmtPct(n: number): string {
  const sign = n >= 0 ? '+' : '';
  return `${sign}${n.toFixed(2)}%`;
}

interface CgMarket {
  id: string;
  current_price: number;
  price_change_percentage_24h: number;
}

interface CgGlobal {
  data: {
    market_cap_percentage: Record<string, number>;
    market_cap_change_percentage_24h_usd: number;
    total_volume: { usd: number };
  };
}

export async function GET() {
  const apiKey = process.env.COINGECKO_API_KEY ?? '';
  const qs = apiKey ? `&x_cg_demo_api_key=${apiKey}` : '';

  try {
    const [marketsRes, globalRes] = await Promise.all([
      fetch(
        `https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana${qs}`,
        { next: { revalidate: 60 } },
      ),
      fetch(
        `https://api.coingecko.com/api/v3/global${apiKey ? `?x_cg_demo_api_key=${apiKey}` : ''}`,
        { next: { revalidate: 60 } },
      ),
    ]);

    if (!marketsRes.ok || !globalRes.ok) return NextResponse.json({ items: [] }, { status: 502 });

    const markets = (await marketsRes.json()) as CgMarket[];
    const global  = (await globalRes.json()) as CgGlobal;

    const byId = new Map(markets.map((m) => [m.id, m]));
    const btc = byId.get('bitcoin');
    const eth = byId.get('ethereum');
    const sol = byId.get('solana');

    const btcDominance = global.data.market_cap_percentage['btc'] ?? 0;
    const mktChange    = global.data.market_cap_change_percentage_24h_usd;
    const totalVol     = global.data.total_volume['usd'] ?? 0;
    const volStr       = totalVol >= 1e9
      ? `$${(totalVol / 1e9).toFixed(1)}B`
      : `$${(totalVol / 1e6).toFixed(0)}M`;

    const items: MarketContextItem[] = [
      {
        label: 'BTC',
        value: btc ? fmtPrice(btc.current_price) : '—',
        sub:   btc ? fmtPct(btc.price_change_percentage_24h) : '—',
        positive: btc ? btc.price_change_percentage_24h >= 0 : null,
      },
      {
        label: 'ETH',
        value: eth ? fmtPrice(eth.current_price) : '—',
        sub:   eth ? fmtPct(eth.price_change_percentage_24h) : '—',
        positive: eth ? eth.price_change_percentage_24h >= 0 : null,
      },
      {
        label: 'SOL',
        value: sol ? fmtPrice(sol.current_price) : '—',
        sub:   sol ? fmtPct(sol.price_change_percentage_24h) : '—',
        positive: sol ? sol.price_change_percentage_24h >= 0 : null,
      },
      {
        label: 'BTC dominance',
        value: `${btcDominance.toFixed(1)}%`,
        sub:   'market share',
        positive: null,
      },
      {
        label: 'Mkt cap Δ 24h',
        value: fmtPct(mktChange),
        sub:   'total market',
        positive: mktChange >= 0,
      },
      {
        label: 'Volume 24h',
        value: volStr,
        sub:   'total spot',
        positive: null,
      },
    ];

    return NextResponse.json({ items });
  } catch {
    return NextResponse.json({ items: [] }, { status: 502 });
  }
}
