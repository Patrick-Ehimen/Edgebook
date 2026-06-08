export interface MoodTag {
  label: string;
  color: string;
  bg: string;
  border: string;
}

export const MOOD_TAGS: MoodTag[] = [
  { label: 'Calm',         color: '#60a5fa', bg: 'rgba(96,165,250,.12)',   border: 'rgba(96,165,250,.35)'  },
  { label: 'Patient',      color: '#34d399', bg: 'rgba(52,211,153,.12)',   border: 'rgba(52,211,153,.35)'  },
  { label: 'Focused',      color: '#a78bfa', bg: 'rgba(167,139,250,.12)',  border: 'rgba(167,139,250,.35)' },
  { label: 'Slept < 6.5h', color: '#f87171', bg: 'rgba(248,113,113,.12)', border: 'rgba(248,113,113,.35)' },
  { label: 'Excited',      color: '#fbbf24', bg: 'rgba(251,191,36,.12)',   border: 'rgba(251,191,36,.35)'  },
  { label: 'Frustrated',   color: '#fb923c', bg: 'rgba(251,146,60,.12)',   border: 'rgba(251,146,60,.35)'  },
  { label: 'Tired',        color: '#94a3b8', bg: 'rgba(148,163,184,.12)',  border: 'rgba(148,163,184,.35)' },
];

/** Look up the color config for a given mood label */
export function getMoodTag(label: string): MoodTag | undefined {
  return MOOD_TAGS.find((m) => m.label === label);
}

const PLAYBOOK_PALETTE: { text: string; bg: string; border: string }[] = [
  { text: '#60a5fa', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.30)' },
  { text: '#a78bfa', bg: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.30)' },
  { text: '#34d399', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.30)' },
  { text: '#f472b6', bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.30)' },
  { text: '#fb923c', bg: 'rgba(249,115,22,.12)', border: 'rgba(249,115,22,.30)' },
  { text: '#facc15', bg: 'rgba(234,179,8,.12)', border: 'rgba(234,179,8,.30)' },
  { text: '#22d3ee', bg: 'rgba(6,182,212,.12)', border: 'rgba(6,182,212,.30)' },
  { text: '#f87171', bg: 'rgba(239,68,68,.12)', border: 'rgba(239,68,68,.30)' },
];

/** Deterministic color for a playbook — pass id when available, name as fallback */
export function getPlaybookColor(key: string) {
  let hash = 0;
  for (let i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  return PLAYBOOK_PALETTE[hash % PLAYBOOK_PALETTE.length]!;
}

export type TradingSession = 'EU' | 'US' | 'Asia';

export const TRADING_SESSIONS: {
  id: TradingSession;
  label: string;
  activeColor: string;
  activeBg: string;
  activeBorder: string;
}[] = [
  { id: 'EU', label: 'EU', activeColor: 'var(--green)', activeBg: 'rgba(0,214,143,.10)', activeBorder: 'rgba(0,214,143,.25)' },
  { id: 'US', label: 'US', activeColor: 'var(--green)', activeBg: 'rgba(0,214,143,.10)', activeBorder: 'rgba(0,214,143,.25)' },
  { id: 'Asia', label: 'Asia', activeColor: 'var(--green)', activeBg: 'rgba(0,214,143,.10)', activeBorder: 'rgba(0,214,143,.25)' },
];

/** Strip quote suffix for display, e.g. ETHUSDT → ETH */
export function tokenBaseLabel(symbol: string) {
  if (!symbol) return 'this token';
  return symbol.replace(/USDT$|USDC$|BUSD$|USD$|PERP$/, '') || symbol;
}
