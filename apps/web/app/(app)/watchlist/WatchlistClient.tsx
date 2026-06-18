'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { usePlaybooks } from '@/features/playbooks/hooks/usePlaybooks';
import { useWatchlist } from '@/features/watchlist/hooks/useWatchlist';
import { useCreateWatchlistItem } from '@/features/watchlist/hooks/useCreateWatchlistItem';
import { useDeleteWatchlistItem } from '@/features/watchlist/hooks/useDeleteWatchlistItem';
import { usePrices, type PriceData } from '@/features/watchlist/hooks/usePrices';
import type { WatchlistItem as WatchlistItemRow } from '@/features/watchlist/schemas';
import { useMarketContext } from '@/features/market/useMarketContext';

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart2,
  Bell,
  CalendarDays,
  CalendarRange,
  Check,
  ClipboardList,
  Eye,
  FileText,
  HelpCircle,
  Moon,
  NotebookPen,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Sparkles,
  X,
  Zap,
  Calendar,
} from 'lucide-react';

// ─── Token icon map ──────────────────────────────────────────────────────────

const TOKEN_META: Record<string, { gradient: string; letter: string; ink: string }> = {
  BTC: { gradient: 'linear-gradient(135deg,#f7931a,#ffc371)', letter: '₿', ink: '#fff' },
  ETH: { gradient: 'linear-gradient(135deg,#627eea,#454a75)', letter: 'Ξ', ink: '#fff' },
  SOL: { gradient: 'linear-gradient(135deg,#9945ff,#14f195)', letter: '◎', ink: '#06140f' },
  HYPE: { gradient: 'linear-gradient(135deg,#00d68f,#06b6d4)', letter: 'H', ink: '#06140f' },
  BNB: { gradient: 'linear-gradient(135deg,#f3ba2f,#cd9c00)', letter: 'B', ink: '#06140f' },
  XRP: { gradient: 'linear-gradient(135deg,#0099ff,#005599)', letter: 'X', ink: '#fff' },
  ARB: { gradient: 'linear-gradient(135deg,#28a0f0,#0070d4)', letter: 'A', ink: '#fff' },
  DOGE: { gradient: 'linear-gradient(135deg,#ba9f33,#888)', letter: 'D', ink: '#1a1a1a' },
  TON: { gradient: 'linear-gradient(135deg,#0098ea,#00667a)', letter: 'T', ink: '#fff' },
  AVAX: { gradient: 'linear-gradient(135deg,#e84142,#8b1010)', letter: 'A', ink: '#fff' },
  LINK: { gradient: 'linear-gradient(135deg,#2a5ada,#1c3aa7)', letter: 'L', ink: '#fff' },
  SUI: { gradient: 'linear-gradient(135deg,#4ca2ff,#1a73e8)', letter: 'S', ink: '#fff' },
  PEPE: { gradient: 'linear-gradient(135deg,#11b811,#0a7a0a)', letter: 'P', ink: '#fff' },
  OP: { gradient: 'linear-gradient(135deg,#ff0420,#c50000)', letter: 'O', ink: '#fff' },
  AAVE: { gradient: 'linear-gradient(135deg,#b6509e,#2ebac6)', letter: 'A', ink: '#fff' },
  MATIC: { gradient: 'linear-gradient(135deg,#8247e5,#5b2eb5)', letter: 'M', ink: '#fff' },
};

const GRADIENT_PALETTE = [
  'linear-gradient(135deg,#f97316,#fb923c)',
  'linear-gradient(135deg,#8b5cf6,#a78bfa)',
  'linear-gradient(135deg,#06b6d4,#22d3ee)',
  'linear-gradient(135deg,#ec4899,#f43f5e)',
  'linear-gradient(135deg,#10b981,#34d399)',
  'linear-gradient(135deg,#3b82f6,#60a5fa)',
  'linear-gradient(135deg,#eab308,#fbbf24)',
  'linear-gradient(135deg,#ef4444,#f87171)',
  'linear-gradient(135deg,#14b8a6,#2dd4bf)',
  'linear-gradient(135deg,#d946ef,#e879f9)',
];

function symbolGradient(ticker: string) {
  let h = 0;
  for (let i = 0; i < ticker.length; i++) h = (Math.imul(h, 31) + ticker.charCodeAt(i)) | 0;
  return GRADIENT_PALETTE[Math.abs(h) % GRADIENT_PALETTE.length];
}

function getMeta(symbol: string) {
  const ticker = symbol.replace(/USDT$|PERP$/i, '').toUpperCase();
  return (
    TOKEN_META[ticker] ?? {
      gradient: symbolGradient(ticker),
      letter: ticker[0] ?? '?',
      ink: '#fff',
    }
  );
}

const TAG_COLORS = [
  { bg: 'rgba(249,115,22,.15)', color: '#f97316', border: 'rgba(249,115,22,.3)' },
  { bg: 'rgba(139,92,246,.15)', color: '#a78bfa', border: 'rgba(139,92,246,.3)' },
  { bg: 'rgba(6,182,212,.15)',  color: '#22d3ee', border: 'rgba(6,182,212,.3)'  },
  { bg: 'rgba(236,72,153,.15)', color: '#f43f5e', border: 'rgba(236,72,153,.3)' },
  { bg: 'rgba(16,185,129,.15)', color: '#34d399', border: 'rgba(16,185,129,.3)' },
  { bg: 'rgba(59,130,246,.15)', color: '#60a5fa', border: 'rgba(59,130,246,.3)' },
  { bg: 'rgba(234,179,8,.15)',  color: '#fbbf24', border: 'rgba(234,179,8,.3)'  },
  { bg: 'rgba(239,68,68,.15)',  color: '#f87171', border: 'rgba(239,68,68,.3)'  },
  { bg: 'rgba(20,184,166,.15)', color: '#2dd4bf', border: 'rgba(20,184,166,.3)' },
  { bg: 'rgba(217,70,239,.15)', color: '#e879f9', border: 'rgba(217,70,239,.3)' },
];

const TAG_FALLBACK = { bg: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)', border: 'var(--eb-border)' };
function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (Math.imul(h, 31) + tag.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length] ?? TAG_FALLBACK;
}

// ─── Types ───────────────────────────────────────────────────────────────────

type Horizon = 'day' | 'week' | 'month';
type Bias = 'long' | 'short' | 'neutral' | 'watch';

interface DayToken {
  id: string;
  symbol: string;
  bias: Bias;
  setupTag: string;
  playbook: string;
  playbookNames: string[];
  price: string;
  change24h: string;
  positive: boolean;
  addedAt: string;
  exchange: string;
  entry: string;
  stop: string;
  target: string;
  entryPct: string;
  stopPct: string;
  targetPct: string;
  slWidth: number;
  tpWidth: number;
  cursorLeft: number;
  alertText: string;
  alertType: 'hit' | 'warn' | 'armed';
  keyLevelsData: Array<{ type: string; price: string; label: string }>;
  note: string;
  isAiNote: boolean;
  conviction: number;
  tags: string[];
  funding: string;
  fundingPositive: boolean;
  sparkPoints: string;
  sparkColor: string;
}

interface WeekToken {
  id: string;
  symbol: string;
  bias: Bias;
  timeframe: string;
  price: string;
  change7d: string;
  positive7d: boolean;
  thesis: string;
  tags: Array<{ text: string; style?: React.CSSProperties }>;
  keyLevels: string;
  conviction: number;
  playbookNames: string[];
}

interface MonthToken {
  id: string;
  symbol: string;
  bias: Bias;
  thesis: string;
  price: string;
  monthChange: string;
  monthPositive: boolean;
  target: string;
  targetPct: string;
  since: string;
  days: number;
  playbookNames: string[];
  tags: string[];
  conviction: number;
}

// ─── BIAS config ─────────────────────────────────────────────────────────────

const BIAS: Record<
  Bias,
  { label: string; color: string; bg: string; border: string; leftBorder: string }
> = {
  long: {
    label: 'LONG bias',
    color: 'var(--green)',
    bg: 'rgba(0,168,107,.12)',
    border: 'rgba(0,168,107,.35)',
    leftBorder: 'var(--green)',
  },
  short: {
    label: 'SHORT bias',
    color: 'var(--eb-red)',
    bg: 'rgba(255,91,108,.1)',
    border: 'rgba(255,91,108,.35)',
    leftBorder: 'var(--eb-red)',
  },
  neutral: {
    label: 'NEUTRAL',
    color: 'var(--eb-muted-2)',
    bg: 'var(--eb-panel-2)',
    border: 'var(--eb-border)',
    leftBorder: 'var(--eb-muted)',
  },
  watch: {
    label: 'WATCH',
    color: 'var(--eb-cyan)',
    bg: 'rgba(6,182,212,.1)',
    border: 'rgba(6,182,212,.3)',
    leftBorder: 'var(--eb-cyan)',
  },
};

const QUICK_ADD_TOKENS = [
  'BTCUSDT',
  'ETHUSDT',
  'SOLUSDT',
  'HYPEUSDT',
  'BNBUSDT',
  'XRPUSDT',
  'SUIUSDT',
  'ARBUSDT',
  'OPUSDT',
  'AVAXUSDT',
  'LINKUSDT',
  'TONUSDT',
  'DOGEUSDT',
  'PEPEUSDT',
];

// ─── Shared sub-components ───────────────────────────────────────────────────

function TokenIcon({
  symbol,
  size = 32,
  fontSize = 14,
}: { symbol: string; size?: number; fontSize?: number }) {
  const meta = getMeta(symbol);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.28,
        background: meta.gradient,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize,
        fontWeight: 700,
        color: meta.ink,
        flexShrink: 0,
        lineHeight: 1,
      }}
    >
      {meta.letter}
    </div>
  );
}

function Sparkline({ points, color }: { points: string; color: string }) {
  return (
    <svg
      viewBox="0 0 240 32"
      preserveAspectRatio="none"
      style={{ height: 32, width: '100%', display: 'block', margin: '6px 0' }}
    >
      <polyline points={points} stroke={color} strokeWidth="1.5" fill="none" />
    </svg>
  );
}

function Stars({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span style={{ display: 'inline-flex', gap: 1, fontSize: 13 }}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} style={{ color: i < value ? '#fbbf24' : 'var(--eb-border)' }}>
          ★
        </span>
      ))}
    </span>
  );
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 99,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        color: 'var(--eb-muted-2)',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function AlertDot({ text, type }: { text: string; type: 'hit' | 'warn' | 'armed' }) {
  const s: React.CSSProperties =
    type === 'hit'
      ? { color: 'var(--green)', borderColor: 'var(--green)', background: 'rgba(0,168,107,.15)' }
      : type === 'warn'
        ? {
            color: 'var(--eb-yellow)',
            borderColor: 'rgba(245,165,36,.3)',
            background: 'rgba(245,165,36,.1)',
          }
        : {
            color: 'var(--green)',
            borderColor: 'rgba(0,168,107,.3)',
            background: 'rgba(0,168,107,.08)',
          };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 99,
        border: '1px solid',
        ...s,
      }}
    >
      {type === 'hit' && (
        <span
          style={{
            animation: 'eb-pulse 1.4s infinite',
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'currentColor',
          }}
        />
      )}
      {text}
    </span>
  );
}

// ─── Day card ────────────────────────────────────────────────────────────────

function DayCard({ token, onRemove }: { token: DayToken; onRemove: (id: string) => void }) {
  const b = BIAS[token.bias];
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderLeft: `3px solid ${b.leftBorder}`,
        borderRadius: '0 12px 12px 0',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '14px 16px',
          background: 'linear-gradient(180deg,rgba(255,255,255,.015),transparent)',
        }}
      >
        <TokenIcon symbol={token.symbol} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              letterSpacing: '-.01em',
            }}
          >
            {token.symbol}
            <Chip style={{ color: b.color, borderColor: b.border, background: b.bg }}>
              {b.label}
            </Chip>
          </div>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              marginTop: 2,
              fontFamily: '"JetBrains Mono",monospace',
            }}
          >
            {token.setupTag.replace(/^[^·]+·\s*/, '')} · added {token.addedAt}{token.exchange !== '—' ? ` · ${token.exchange}` : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div
            style={{
              fontFamily: '"JetBrains Mono",monospace',
              fontSize: 18,
              fontWeight: 600,
              letterSpacing: '-.01em',
            }}
          >
            {token.price === '—' ? '—' : `$${token.price}`}
          </div>
          <div
            style={{
              fontSize: 11.5,
              fontFamily: '"JetBrains Mono",monospace',
              color: token.positive ? 'var(--green)' : 'var(--eb-red)',
              marginTop: 2,
            }}
          >
            {token.change24h === '—' ? '—' : `${token.change24h} · 24h`}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginLeft: 6 }}>
          <button
            type="button"
            onClick={() => onRemove(token.id)}
            title="Remove"
            style={{
              background: 'transparent',
              border: 0,
              color: 'var(--eb-muted)',
              cursor: 'pointer',
              padding: '3px 5px',
              borderRadius: 5,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 16px 14px' }}>
        {/* Tags row */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
          {token.playbookNames.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {token.playbookNames.map((name) => {
                const tc = tagColor(name);
                return <Chip key={name} style={{ color: tc.color, background: tc.bg, borderColor: tc.border }}>{name}</Chip>;
              })}
            </div>
          )}
          {token.tags.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {token.tags.map((tag) => {
                const tc = tagColor(tag);
                return <Chip key={tag} style={{ fontSize: 9.5, padding: '1px 6px', color: tc.color, background: tc.bg, borderColor: tc.border }}>{tag}</Chip>;
              })}
            </div>
          )}
        </div>

        {/* Level grid */}
        {token.keyLevelsData.length > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${Math.min(token.keyLevelsData.length, 3)}, 1fr)`,
              gap: 8,
              marginBottom: 10,
            }}
          >
            {token.keyLevelsData.map((lvl) => {
              const t = lvl.type.toUpperCase().charAt(0);
              const COLORS: Record<string, { color: string; bg: string; border: string }> = {
                S: { color: 'var(--green)',     bg: 'rgba(0,168,107,.06)',   border: 'rgba(0,168,107,.25)'   },
                R: { color: 'var(--eb-red)',    bg: 'rgba(255,91,108,.06)',  border: 'rgba(255,91,108,.25)'  },
                T: { color: 'var(--eb-cyan)',   bg: 'rgba(6,182,212,.06)',   border: 'rgba(6,182,212,.25)'   },
                K: { color: 'var(--eb-purple)', bg: 'rgba(139,92,246,.06)', border: 'rgba(139,92,246,.25)'  },
              };
              const LABELS: Record<string, string> = {
                S: 'Support · entry', R: 'Stop loss', T: 'Target', K: 'Key level',
              };
              const c = COLORS[t] ?? { color: 'var(--eb-muted-2)', bg: 'var(--eb-panel-2)', border: 'var(--eb-border)' };
              const lbl = LABELS[t] ?? lvl.type;
              return (
                <div
                  key={`${lvl.type}-${lvl.price}`}
                  style={{ padding: '8px 10px', background: c.bg, borderRadius: 8, border: `1px solid ${c.border}` }}
                >
                  <div style={{ fontSize: 9.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                    {lbl}
                  </div>
                  <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 13, fontWeight: 600, marginTop: 2, color: c.color }}>
                    {lvl.price || '—'}
                  </div>
                  {lvl.label && (
                    <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 1 }}>{lvl.label}</div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Distance bar */}
        {/* Note */}
        <div
          style={{
            padding: '8px 10px',
            background: 'var(--eb-panel-2)',
            borderRadius: 8,
            border: '1px dashed var(--eb-border)',
            fontSize: 11.5,
            color: 'var(--eb-muted-2)',
            lineHeight: 1.5,
            ...(token.isAiNote
              ? {
                  background: 'linear-gradient(135deg,rgba(139,92,246,.06),rgba(6,182,212,.03))',
                  borderColor: 'rgba(139,92,246,.2)',
                }
              : {}),
          }}
        >
          {token.isAiNote && (
            <span
              style={{
                fontWeight: 600,
                color: 'var(--eb-purple)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginRight: 4,
              }}
            >
              <Sparkles size={11} /> AI ·
            </span>
          )}
          {!token.isAiNote && (
            <span
              style={{
                fontWeight: 600,
                color: 'var(--eb-text)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                marginRight: 4,
              }}
            >
              <NotebookPen size={11} /> Note.
            </span>
          )}
          {token.note}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderTop: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
          fontSize: 11,
        }}
      >
        <Stars value={token.conviction} />
        <span style={{ color: 'var(--eb-muted)' }}>
          conviction <b style={{ color: 'var(--eb-text)' }}>{token.conviction}/5</b>
        </span>
      </div>
    </div>
  );
}

// ─── Week card ────────────────────────────────────────────────────────────────

function WeekCard({ token, onRemove }: { token: WeekToken; onRemove: (id: string) => void }) {
  const b = BIAS[token.bias];
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderLeft: `3px solid ${b.leftBorder}`,
        borderRadius: '0 11px 11px 0',
        padding: 12,
        cursor: 'pointer',
      }}
    >
      {/* Head */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9 }}>
        <TokenIcon symbol={token.symbol} size={28} fontSize={12} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13.5,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {token.symbol}
            <Chip
              style={{ fontSize: 9.5, color: b.color, borderColor: b.border, background: b.bg }}
            >
              {b.label}
            </Chip>
          </div>
          <div
            style={{
              fontSize: 10,
              color: 'var(--eb-muted)',
              fontFamily: '"JetBrains Mono",monospace',
              marginTop: 1,
            }}
          >
            {token.timeframe}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontFamily: '"JetBrains Mono",monospace', fontSize: 14, fontWeight: 600 }}>
            {token.price}
          </div>
          <div
            style={{
              fontSize: 10.5,
              fontFamily: '"JetBrains Mono",monospace',
              color: token.positive7d ? 'var(--green)' : 'var(--eb-red)',
            }}
          >
            {token.change7d === '—' ? '—' : `${token.change7d} · 7d`}
          </div>
        </div>
        <button
          type="button"
          onClick={() => onRemove(token.id)}
          title="Remove"
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--eb-muted)',
            cursor: 'pointer',
            padding: '4px 5px',
            borderRadius: 4,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Thesis */}
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--eb-muted-2)',
          lineHeight: 1.5,
          marginBottom: 8,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        <b style={{ color: 'var(--eb-text)' }}>Thesis. </b>
        {token.thesis}
      </div>

      {/* Tags */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 8 }}>
        {token.playbookNames.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {token.playbookNames.map((name) => {
              const tc = tagColor(name);
              return <Chip key={name} style={{ fontSize: 10, color: tc.color, background: tc.bg, borderColor: tc.border }}>{name}</Chip>;
            })}
          </div>
        )}
        {token.tags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {token.tags.map((t) => (
              <Chip key={t.text} style={{ fontSize: 9.5, padding: '1px 6px', ...t.style }}>
                {t.text}
              </Chip>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: 10.5,
          color: 'var(--eb-muted)',
          paddingTop: 8,
          borderTop: '1px dashed var(--eb-border)',
        }}
      >
        <span>
          Key levels ·{' '}
          <b style={{ color: 'var(--eb-text)', fontFamily: '"JetBrains Mono",monospace' }}>
            {token.keyLevels}
          </b>
        </span>
        <Stars value={token.conviction} />
      </div>
    </div>
  );
}

// ─── Month row ────────────────────────────────────────────────────────────────

function MonthRow({ token, onRemove }: { token: MonthToken; onRemove: (id: string) => void }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto auto 1fr auto auto auto auto',
        gap: 12,
        padding: '12px 14px',
        alignItems: 'center',
        borderBottom: '1px solid var(--eb-border)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'var(--eb-panel-2)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      <TokenIcon symbol={token.symbol} size={28} fontSize={12} />
      <div>
        <div style={{ fontWeight: 600, fontSize: 13 }}>{token.symbol}</div>
        <div
          style={{
            fontSize: 10.5,
            color: 'var(--eb-muted)',
            fontFamily: '"JetBrains Mono",monospace',
          }}
        >
          since {token.since} · {token.days} days
        </div>
      </div>
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--eb-muted-2)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <b style={{ color: 'var(--eb-text)' }}>Thesis. </b>
          {token.thesis}
        </div>
        {(token.playbookNames.length > 0 || token.tags.length > 0) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
            {token.playbookNames.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {token.playbookNames.map((name) => {
                  const tc = tagColor(name);
                  return <Chip key={name} style={{ fontSize: 10, color: tc.color, background: tc.bg, borderColor: tc.border }}>{name}</Chip>;
                })}
              </div>
            )}
            {token.tags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                {token.tags.map((tag) => {
                  const tc = tagColor(tag);
                  return <Chip key={tag} style={{ fontSize: 9.5, padding: '1px 6px', color: tc.color, background: tc.bg, borderColor: tc.border }}>{tag}</Chip>;
                })}
              </div>
            )}
          </div>
        )}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: 13,
          fontWeight: 600,
          textAlign: 'right',
        }}
      >
        {token.price}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono",monospace',
          fontSize: 11,
          textAlign: 'right',
          color: token.monthPositive ? 'var(--green)' : 'var(--eb-red)',
        }}
      >
        {token.monthChange}
        <br />
        <span style={{ color: 'var(--eb-muted)', fontSize: 9.5 }}>monthly</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
        <Stars value={token.conviction} />
        <span style={{ fontSize: 9, color: 'var(--eb-muted)' }}>{token.conviction}/5</span>
      </div>
      <div style={{ display: 'flex', gap: 3 }}>
        <button
          type="button"
          onClick={() => onRemove(token.id)}
          title="Remove"
          style={{
            background: 'transparent',
            border: 0,
            color: 'var(--eb-muted)',
            cursor: 'pointer',
            padding: '4px 7px',
            borderRadius: 5,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Playbook Picker ─────────────────────────────────────────────────────────

interface LinkedPlaybook { id: string; name: string; status: string; }

function PlaybookPicker({
  selected,
  onChange,
}: {
  selected: LinkedPlaybook[];
  onChange: (playbooks: LinkedPlaybook[]) => void;
}) {
  const { data: playbooks = [], isLoading } = usePlaybooks();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selectedIds = new Set(selected.map((p) => p.id));
  const filtered = playbooks.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()),
  );

  const toggle = (p: LinkedPlaybook) => {
    if (selectedIds.has(p.id)) {
      onChange(selected.filter((s) => s.id !== p.id));
    } else {
      onChange([...selected, p]);
      setQuery('');
    }
  };

  const remove = (id: string) => onChange(selected.filter((p) => p.id !== id));

  const statusStyle = (status: string) =>
    status === 'active'
      ? { background: 'rgba(0,168,107,.12)', color: 'var(--green)' }
      : status === 'experimental'
        ? { background: 'rgba(245,165,36,.12)', color: 'var(--eb-yellow)' }
        : { background: 'var(--eb-panel-2)', color: 'var(--eb-muted)' };

  const PLAYBOOK_COLORS: { bg: string; border: string; icon: string }[] = [
    { bg: 'rgba(99,102,241,.12)',  border: 'rgba(99,102,241,.4)',  icon: '#818cf8' },
    { bg: 'rgba(245,165,36,.10)',  border: 'rgba(245,165,36,.35)', icon: '#f5a524' },
    { bg: 'rgba(236,72,153,.10)',  border: 'rgba(236,72,153,.35)', icon: '#f472b6' },
    { bg: 'rgba(20,184,166,.10)',  border: 'rgba(20,184,166,.35)', icon: '#2dd4bf' },
    { bg: 'rgba(249,115,22,.10)',  border: 'rgba(249,115,22,.35)', icon: '#fb923c' },
    { bg: 'rgba(139,92,246,.12)',  border: 'rgba(139,92,246,.4)',  icon: '#a78bfa' },
    { bg: 'rgba(59,130,246,.10)',  border: 'rgba(59,130,246,.35)', icon: '#60a5fa' },
    { bg: 'rgba(239,68,68,.10)',   border: 'rgba(239,68,68,.35)',  icon: '#f87171' },
  ];

  const FALLBACK_COLOR = PLAYBOOK_COLORS[0] as { bg: string; border: string; icon: string };

  const playbookColor = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return PLAYBOOK_COLORS[hash % PLAYBOOK_COLORS.length] ?? FALLBACK_COLOR;
  };

  return (
    <div ref={ref} style={{ position: 'relative', marginBottom: 14 }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 7 }}>
          {selected.map((p) => {
            const pc = playbookColor(p.id);
            return (
            <span key={p.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 8px 4px 10px', borderRadius: 8, background: pc.bg, border: `1px solid ${pc.border}`, fontSize: 12, color: 'var(--eb-text)' }}>
              <ClipboardList size={11} style={{ color: pc.icon }} />
              {p.name}
              <button
                type="button"
                onMouseDown={() => remove(p.id)}
                style={{ background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <X size={11} />
              </button>
            </span>
            );
          })}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={isLoading ? 'Loading playbooks…' : 'Search and add playbooks…'}
          style={{ width: '100%', background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 12px 8px 32px', color: 'var(--eb-text)', outline: 0, fontSize: 12.5, fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>
      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 10, boxShadow: '0 12px 32px rgba(0,0,0,.4)', zIndex: 60, overflow: 'hidden', maxHeight: 220, overflowY: 'auto' }}>
          {filtered.length === 0 ? (
            <div style={{ padding: '12px 14px', fontSize: 12, color: 'var(--eb-muted)', textAlign: 'center' }}>
              {isLoading ? 'Loading…' : 'No playbooks found'}
            </div>
          ) : (
            filtered.map((p) => {
              const isSelected = selectedIds.has(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  onMouseDown={() => toggle({ id: p.id, name: p.name, status: p.status })}
                  style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', background: isSelected ? 'rgba(0,168,107,.06)' : 'transparent', border: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit' }}
                >
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${isSelected ? 'var(--green)' : 'var(--eb-border)'}`, background: isSelected ? 'var(--green)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {isSelected && <Check size={10} style={{ color: '#06140f' }} />}
                  </div>
                  <span style={{ flex: 1, fontSize: 13, color: 'var(--eb-text)' }}>{p.name}</span>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 6px', borderRadius: 99, letterSpacing: '.04em', ...statusStyle(p.status) }}>
                    {p.status}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// ─── Add Token Modal ──────────────────────────────────────────────────────────

interface KeyLevel { type: string; price: string; label: string; }

interface ModalState {
  symbol: string;
  horizon: Horizon;
  bias: Bias;
  playbooks: LinkedPlaybook[];
  keyLevels: KeyLevel[];
  tags: string[];
  conviction: number;
  convictionReason: string;
  notes: string;
}

function AddTokenModal({
  defaultHorizon,
  onAdd,
  onClose,
}: {
  defaultHorizon: Horizon;
  onAdd: (horizon: Horizon, formState: ModalState) => void;
  onClose: () => void;
}) {
  const [tagInput, setTagInput] = useState('');
  const [form, setForm] = useState<ModalState>({
    symbol: '',
    horizon: defaultHorizon,
    bias: 'long',
    playbooks: [],
    keyLevels: [],
    tags: [],
    conviction: 3,
    convictionReason: '',
    notes: '',
  });
  const [search, setSearch] = useState('');

  const filteredQuick = QUICK_ADD_TOKENS.filter(
    (t) => !search || t.toLowerCase().includes(search.toLowerCase()),
  );

  const horizonColors = {
    day: { border: 'rgba(245,165,36,.5)', bg: 'rgba(245,165,36,.08)', text: 'var(--eb-yellow)' },
    week: { border: 'rgba(6,182,212,.5)', bg: 'rgba(6,182,212,.08)', text: 'var(--eb-cyan)' },
    month: { border: 'rgba(139,92,246,.5)', bg: 'rgba(139,92,246,.08)', text: 'var(--eb-purple)' },
  };

  const horizonMeta = {
    day: { Icon: CalendarDays, label: 'Today', sub: 'Live setups' },
    week: { Icon: CalendarRange, label: 'This week', sub: 'Refreshes Sun' },
    month: { Icon: Moon, label: 'This month', sub: 'Updates 1st' },
  };

  const handleAdd = () => {
    if (!form.symbol) return;
    onAdd(form.horizon, form);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,12,.6)',
        backdropFilter: 'blur(8px)',
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '32px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div
        style={{
          width: 'min(800px,100%)',
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,.55)',
          overflow: 'hidden',
          animation: 'eb-pop .18s ease-out',
        }}
      >
        {/* Modal head */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--eb-border)',
            background: 'linear-gradient(180deg,rgba(0,0,0,.04),transparent)',
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              background: 'linear-gradient(135deg,var(--green),var(--eb-cyan))',
              color: '#06140f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
            }}
          >
            <Plus size={16} />
          </div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Add token to watchlist</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              marginLeft: 'auto',
              background: 'transparent',
              border: 0,
              color: 'var(--eb-muted)',
              cursor: 'pointer',
              padding: '6px 8px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Token search */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--eb-border)' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              marginBottom: 10,
            }}
          >
            <Search size={15} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (e.target.value)
                  setForm((f: ModalState) => ({ ...f, symbol: e.target.value.toUpperCase() }));
              }}
              placeholder="Search ticker e.g. ETHUSDT"
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                outline: 0,
                color: 'var(--eb-text)',
                fontSize: 14,
                fontFamily: 'inherit',
              }}
            />
            {form.symbol && (
              <Chip
                style={{
                  background: 'rgba(0,168,107,.1)',
                  color: 'var(--green)',
                  borderColor: 'rgba(0,168,107,.3)',
                }}
              >
                {form.symbol}
              </Chip>
            )}
          </div>
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                color: 'var(--eb-muted)',
                marginRight: 4,
                alignSelf: 'center',
              }}
            >
              Quick add
            </span>
            {filteredQuick.slice(0, 10).map((sym) => (
              <button
                type="button"
                key={sym}
                onClick={() => {
                  setForm((f: ModalState) => ({ ...f, symbol: sym }));
                  setSearch('');
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '4px 8px',
                  border: `1px dashed var(--eb-border)`,
                  background: 'transparent',
                  fontSize: 11.5,
                  color: 'var(--eb-muted-2)',
                  cursor: 'pointer',
                  borderRadius: 7,
                  fontFamily: 'inherit',
                  ...(form.symbol === sym
                    ? { borderStyle: 'solid', borderColor: 'var(--green)', color: 'var(--green)' }
                    : {}),
                }}
              >
                <TokenIcon symbol={sym} size={18} fontSize={8} />
                {sym}
              </button>
            ))}
          </div>
        </div>

        {/* Selected token bar */}
        {form.symbol && (
          <div
            style={{
              padding: '12px 18px',
              background: 'linear-gradient(180deg,rgba(98,126,234,.04),transparent)',
              borderBottom: '1px solid var(--eb-border)',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <TokenIcon symbol={form.symbol} size={44} fontSize={20} />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 17,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                {form.symbol}
                <Chip>Perp</Chip>
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--green)', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', display: 'inline-block', boxShadow: '0 0 6px var(--green)' }} />
                  Active
                </span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>
                Configure the setup details below
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div
          style={{
            padding: '16px 18px',
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 18,
            maxHeight: 'calc(100vh - 360px)',
            overflowY: 'auto',
          }}
        >
          {/* LEFT */}
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--eb-muted-2)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              1 · Watchlist horizon
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3,1fr)',
                gap: 6,
                marginBottom: 14,
              }}
            >
              {(['day', 'week', 'month'] as Horizon[]).map((h) => {
                const hc = horizonColors[h];
                const hm = horizonMeta[h];
                const on = form.horizon === h;
                return (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setForm((f: ModalState) => ({ ...f, horizon: h }))}
                    style={{
                      padding: 9,
                      borderRadius: 9,
                      border: `1.5px solid ${on ? hc.border : 'var(--eb-border)'}`,
                      background: on ? hc.bg : 'var(--eb-panel-2)',
                      cursor: 'pointer',
                      textAlign: 'center',
                      fontFamily: 'inherit',
                      transition: 'border-color .12s',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <hm.Icon size={18} style={{ color: on ? hc.text : 'var(--eb-muted)' }} />
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: on ? hc.text : 'var(--eb-text)',
                      }}
                    >
                      {hm.label}
                    </div>
                    <div style={{ fontSize: 9.5, color: 'var(--eb-muted)' }}>{hm.sub}</div>
                  </button>
                );
              })}
            </div>

            <div
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--eb-muted-2)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                marginBottom: 8,
              }}
            >
              2 · Your bias
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 5,
                marginBottom: 14,
              }}
            >
              {[
                { key: 'long' as Bias, Icon: ArrowUpRight, label: 'LONG' },
                { key: 'short' as Bias, Icon: ArrowDownRight, label: 'SHORT' },
                { key: 'neutral' as Bias, Icon: ArrowRight, label: 'NEUTRAL' },
                { key: 'watch' as Bias, Icon: Eye, label: 'WATCH' },
              ].map(({ key, Icon, label }) => {
                const bc = BIAS[key];
                const on = form.bias === key;
                return (
                  <button
                    type="button"
                    key={key}
                    onClick={() => setForm((f: ModalState) => ({ ...f, bias: key }))}
                    style={{
                      padding: '9px 6px',
                      borderRadius: 8,
                      border: `1.5px solid ${on ? bc.border : 'var(--eb-border)'}`,
                      background: on ? bc.bg : 'var(--eb-panel-2)',
                      cursor: 'pointer',
                      fontSize: 11,
                      fontWeight: 500,
                      color: on ? bc.color : 'var(--eb-muted-2)',
                      fontFamily: 'inherit',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 3,
                    }}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                );
              })}
            </div>

            {/* ── Linked playbook ── */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 4 }}>
              3 · Linked playbook
            </div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginBottom: 8, lineHeight: 1.5 }}>
              {'When you click "log trade" from the watchlist card, this playbook\'s checklist auto-loads.'}
            </div>
            <PlaybookPicker
              selected={form.playbooks}
              onChange={(playbooks: LinkedPlaybook[]) => setForm((f: ModalState) => ({ ...f, playbooks }))}
            />

            {/* ── Conviction ── */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              4 · Conviction
            </div>
            <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  type="button"
                  key={v}
                  onClick={() => setForm((f: ModalState) => ({ ...f, conviction: v }))}
                  style={{ background: 'transparent', border: 0, cursor: 'pointer', fontSize: 22, color: v <= form.conviction ? '#fbbf24' : 'var(--eb-border)', lineHeight: 1, padding: '2px 4px' }}
                >
                  ★
                </button>
              ))}
              <span style={{ alignSelf: 'center', fontSize: 11, color: 'var(--eb-muted)', marginLeft: 4 }}>{form.conviction}/5</span>
            </div>
            <input
              type="text"
              value={form.convictionReason}
              onChange={(e) => setForm((f: ModalState) => ({ ...f, convictionReason: e.target.value }))}
              placeholder="Why this conviction level? e.g. HTF + daily aligned"
              style={{ width: '100%', background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '7px 12px', color: 'var(--eb-text)', outline: 0, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }}
            />

            {/* ── Tags ── */}
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              5 · Tags
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: form.tags.length ? 7 : 0 }}>
              {form.tags.map((tag) => {
                const tc = tagColor(tag);
                return (
                  <span
                    key={tag}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 10px', borderRadius: 99, background: tc.bg, border: `1px solid ${tc.border}`, color: tc.color, fontSize: 11.5, fontWeight: 500 }}
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => setForm((f: ModalState) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }))}
                      style={{ background: 'transparent', border: 0, color: tc.color, cursor: 'pointer', padding: 0, lineHeight: 1, opacity: .7, display: 'flex', alignItems: 'center' }}
                    >
                      <X size={10} />
                    </button>
                  </span>
                );
              })}
            </div>
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
                  e.preventDefault();
                  const t = tagInput.trim().replace(/,$/, '');
                  if (t && !form.tags.includes(t)) setForm((f: ModalState) => ({ ...f, tags: [...f.tags, t] }));
                  setTagInput('');
                } else if (e.key === 'Backspace' && !tagInput && form.tags.length) {
                  setForm((f: ModalState) => ({ ...f, tags: f.tags.slice(0, -1) }));
                }
              }}
              placeholder="Type a tag and press Enter…"
              style={{ width: '100%', background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '7px 12px', color: 'var(--eb-text)', outline: 0, fontSize: 12, fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: 14 }}
            />

            {/* ── Notes ── */}
            <div
              style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}
            >
              6 · Notes
            </div>
            <textarea
              value={form.notes}
              onChange={(e) => setForm((f: ModalState) => ({ ...f, notes: e.target.value }))}
              placeholder="Why are you watching this? What's the setup thesis?"
              style={{
                width: '100%',
                minHeight: 80,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 8,
                padding: '9px 12px',
                color: 'var(--eb-text)',
                outline: 0,
                fontSize: 13,
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* RIGHT */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', marginBottom: 8 }}>
              6 · Key levels
            </div>
            {(() => {
              const knownColors: Record<string, { border: string; bg: string; color: string; typeBg: string }> = {
                S: { border: 'rgba(0,168,107,.3)',   bg: 'rgba(0,168,107,.06)',   color: 'var(--green)',     typeBg: 'rgba(0,168,107,.15)' },
                R: { border: 'rgba(255,91,108,.3)',  bg: 'rgba(255,91,108,.06)',  color: 'var(--eb-red)',    typeBg: 'rgba(255,91,108,.15)' },
                T: { border: 'rgba(6,182,212,.3)',   bg: 'rgba(6,182,212,.06)',   color: 'var(--eb-cyan)',   typeBg: 'rgba(6,182,212,.15)' },
                K: { border: 'rgba(139,92,246,.3)',  bg: 'rgba(139,92,246,.06)',  color: 'var(--eb-purple)', typeBg: 'rgba(139,92,246,.15)' },
              };
              const neutral = { border: 'var(--eb-border)', bg: 'var(--eb-panel-3)', color: 'var(--eb-muted-2)', typeBg: 'var(--eb-panel-2)' };
              const getColor = (t: string) => knownColors[t.toUpperCase().charAt(0)] ?? neutral;

              const sPrice = form.keyLevels.find((l) => l.type.toUpperCase() === 'S')?.price || '';
              const rPrice = form.keyLevels.find((l) => l.type.toUpperCase() === 'R')?.price || '';
              const tPrice = form.keyLevels.find((l) => l.type.toUpperCase() === 'T')?.price || '';
              const sVal = Number.parseFloat(sPrice.replace(/,/g, ''));
              const rVal = Number.parseFloat(rPrice.replace(/,/g, ''));
              const tVal = Number.parseFloat(tPrice.replace(/,/g, ''));
              const showRR = sPrice && rPrice && tPrice && !Number.isNaN(sVal) && !Number.isNaN(rVal) && !Number.isNaN(tVal);
              return (
                <>
                  {form.keyLevels.map((level, i) => {
                    const c = getColor(level.type);
                    return (
                      <div key={`level-${i}`} style={{ display: 'grid', gridTemplateColumns: '80px 90px 1fr auto', gap: 5, marginBottom: 6, alignItems: 'center' }}>
                        <input
                          type="text"
                          value={level.type}
                          onChange={(e) => setForm((f: ModalState) => ({
                            ...f,
                            keyLevels: f.keyLevels.map((l, j): KeyLevel =>
                              j === i ? { type: e.target.value, price: l.price, label: l.label } : l
                            ),
                          }))}
                          placeholder="level"
                          style={{ background: c.typeBg, border: `1px solid ${c.border}`, borderRadius: 7, padding: '6px 6px', color: c.color, outline: 0, fontSize: 11, fontWeight: 600, textAlign: 'center', fontFamily: '"JetBrains Mono",monospace', boxSizing: 'border-box' }}
                        />
                        <input
                          type="text"
                          value={level.price}
                          onChange={(e) => setForm((f: ModalState) => ({
                            ...f,
                            keyLevels: f.keyLevels.map((l, j): KeyLevel =>
                              j === i ? { type: l.type, price: e.target.value, label: l.label } : l
                            ),
                          }))}
                          placeholder="price"
                          style={{ background: c.bg, border: `1px solid ${c.border}`, borderRadius: 7, padding: '6px 8px', color: c.color, outline: 0, fontSize: 12, fontFamily: '"JetBrains Mono",monospace', boxSizing: 'border-box' }}
                        />
                        <input
                          type="text"
                          value={level.label}
                          onChange={(e) => setForm((f: ModalState) => ({
                            ...f,
                            keyLevels: f.keyLevels.map((l, j): KeyLevel =>
                              j === i ? { type: l.type, price: l.price, label: e.target.value } : l
                            ),
                          }))}
                          placeholder="description"
                          style={{ background: 'var(--eb-panel-3)', border: '1px solid var(--eb-border)', borderRadius: 7, padding: '6px 8px', color: 'var(--eb-text)', outline: 0, fontSize: 12, boxSizing: 'border-box' }}
                        />
                        <button
                          type="button"
                          onClick={() => setForm((f: ModalState) => ({ ...f, keyLevels: f.keyLevels.filter((_, j) => j !== i) }))}
                          style={{ width: 26, height: 26, borderRadius: 6, background: 'rgba(255,91,108,.1)', border: '1px solid rgba(255,91,108,.2)', color: 'var(--eb-red)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setForm((f: ModalState) => ({ ...f, keyLevels: [...f.keyLevels, { type: '', price: '', label: '' }] }))}
                    style={{ width: '100%', padding: '6px 0', borderRadius: 7, background: 'var(--eb-panel-3)', border: '1px dashed var(--eb-border)', color: 'var(--eb-muted-2)', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 10 }}
                  >
                    <Plus size={12} /> Add level
                  </button>
                  {showRR && (
                    <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(0,168,107,.06)', border: '1px solid rgba(0,168,107,.2)', fontSize: 11.5, color: 'var(--eb-muted-2)', marginTop: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span>Risk (S→R)</span>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', color: 'var(--eb-text)' }}>
                          {Math.abs(sVal - rVal).toFixed(4)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Reward (S→T)</span>
                        <span style={{ fontFamily: '"JetBrains Mono",monospace', color: 'var(--green)' }}>
                          {Math.abs(tVal - sVal).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            <div
              style={{
                marginTop: 16,
                padding: '10px 12px',
                borderRadius: 8,
                background: 'linear-gradient(135deg,rgba(139,92,246,.08),rgba(6,182,212,.03))',
                border: '1px solid rgba(139,92,246,.25)',
                fontSize: 11.5,
                color: 'var(--eb-muted-2)',
                display: 'flex',
                gap: 8,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 20,
                  height: 20,
                  borderRadius: 6,
                  background: 'linear-gradient(135deg,var(--eb-purple),var(--eb-cyan))',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={11} />
              </div>
              <div>
                <b style={{ color: 'var(--eb-text)' }}>AI suggestion.</b> After your first trade, AI
                will match this setup to your best-performing playbooks and suggest key levels based
                on your trade history.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderTop: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            flexWrap: 'wrap',
          }}
        >
          <Chip
            style={{
              color: 'var(--green)',
              borderColor: 'rgba(0,168,107,.3)',
              background: 'rgba(0,168,107,.08)',
              gap: 5,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
              }}
            />{' '}
            Auto-saved as draft
          </Chip>
          <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
            Horizon ·{' '}
            <b style={{ color: 'var(--eb-text)' }}>
              {form.horizon === 'day'
                ? 'Today'
                : form.horizon === 'week'
                  ? 'This week'
                  : 'This month'}
            </b>
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel)',
                color: 'var(--eb-text)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleAdd}
              disabled={!form.symbol}
              style={{
                padding: '6px 14px',
                borderRadius: 7,
                border: '1px solid rgba(0,168,107,.5)',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 12,
                fontWeight: 600,
                cursor: form.symbol ? 'pointer' : 'not-allowed',
                fontFamily: 'inherit',
                opacity: form.symbol ? 1 : 0.5,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <Check size={13} /> Add to watchlist
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onAddManual }: { onAddManual: () => void }) {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1200, width: '100%' }}>
      {/* Hero */}
      <div
        style={{
          background:
            'linear-gradient(135deg,rgba(0,168,107,.08),rgba(6,182,212,.04) 50%,rgba(139,92,246,.06))',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: '32px 28px',
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(500px 220px at 20% 15%,rgba(0,168,107,.08),transparent 60%),radial-gradient(500px 220px at 80% 85%,rgba(139,92,246,.08),transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg,var(--green),var(--eb-cyan))',
            color: '#06140f',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 14,
            boxShadow: '0 12px 32px rgba(0,168,107,.22)',
          }}
        >
          <Eye size={38} />
        </div>
        <h1
          style={{
            position: 'relative',
            zIndex: 1,
            margin: '0 0 8px',
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: '-.02em',
            color: 'var(--eb-text)',
          }}
        >
          Track what matters ·{' '}
          <span
            style={{
              background: 'linear-gradient(90deg,var(--green),var(--eb-cyan),var(--eb-purple))',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            forget the rest
          </span>
        </h1>
        <p
          style={{
            position: 'relative',
            zIndex: 1,
            color: 'var(--eb-muted-2)',
            maxWidth: 600,
            margin: '0 auto 18px',
            fontSize: 13.5,
            lineHeight: 1.6,
          }}
        >
          A watchlist is your <b style={{ color: 'var(--eb-text)' }}>cone of attention</b>. Edgebook
          gives you three time horizons so you can track day-trade candidates, week-long setups, and
          monthly theses without mixing them up.
        </p>
        <button
          type="button"
          onClick={onAddManual}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '8px 16px',
            borderRadius: 8,
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            color: 'var(--eb-text)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <Plus size={14} /> Add tokens manually
        </button>
      </div>

      {/* Why 3 horizons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
        <h2
          style={{
            margin: 0,
            fontSize: 17,
            fontWeight: 600,
            letterSpacing: '-.01em',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <HelpCircle size={17} /> What&apos;s a watchlist for?
        </h2>
        <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
          Three horizons so day-trade hunting doesn&apos;t crowd out longer theses
        </span>
      </div>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 14 }}
      >
        {[
          {
            key: 'day',
            Icon: CalendarDays,
            iconBg: 'rgba(245,165,36,.14)',
            iconBorder: 'rgba(245,165,36,.25)',
            iconColor: 'var(--eb-yellow)',
            title: 'Today',
            desc: "Tokens you're actively hunting setups in right now.",
            bullets: [
              ['Levels:', 'entry, stop, target prices'],
              ['Setup tag:', "which playbook you're applying"],
              ['Distance alerts:', 'ping when price is near entry'],
              ['One-click log:', 'from watchlist into trade'],
            ],
          },
          {
            key: 'week',
            Icon: CalendarRange,
            iconBg: 'rgba(6,182,212,.14)',
            iconBorder: 'rgba(6,182,212,.25)',
            iconColor: 'var(--eb-cyan)',
            title: 'This week',
            desc: 'HTF setups developing this week. Refreshes Sunday during your weekly review.',
            bullets: [
              ['Weekly/4H levels', 'instead of intraday'],
              ['Catalysts:', 'news, unlocks, FOMC, earnings'],
              ['Multi-day patience', '· tracks across sessions'],
              ['Conviction tracking', 'over multiple sessions'],
            ],
          },
          {
            key: 'month',
            Icon: Moon,
            iconBg: 'rgba(139,92,246,.14)',
            iconBorder: 'rgba(139,92,246,.25)',
            iconColor: 'var(--eb-purple)',
            title: 'This month',
            desc: 'Long-horizon theses, macro angles, narrative trades. Updates on the 1st.',
            bullets: [
              ['Single-sentence thesis', 'per token'],
              ['Macro context:', 'ETF flows, regs, narratives'],
              ['Tracking-since date', "· how long you've watched"],
              ['Promote to weekly/daily', 'when trigger fires'],
            ],
          },
        ].map((h) => (
          <div
            key={h.key}
            style={{
              padding: 16,
              border: '1px solid var(--eb-border)',
              borderRadius: 12,
              background: 'var(--eb-panel)',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 10,
                background: h.iconBg,
                border: `1px solid ${h.iconBorder}`,
                color: h.iconColor,
              }}
            >
              <h.Icon size={18} />
            </div>
            <h4 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 600 }}>{h.title}</h4>
            <p
              style={{
                margin: '0 0 8px',
                fontSize: 11.5,
                color: 'var(--eb-muted)',
                lineHeight: 1.5,
              }}
            >
              {h.desc}
            </p>
            <ul
              style={{
                margin: 0,
                paddingLeft: 18,
                fontSize: 11,
                color: 'var(--eb-muted-2)',
                lineHeight: 1.7,
              }}
            >
              {h.bullets.map(([b, d]) => (
                <li key={b}>
                  <b style={{ color: 'var(--eb-text)' }}>{b}</b> {d}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Quick add */}
      <div
        style={{
          padding: 14,
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
          background: 'var(--eb-panel)',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: 'var(--eb-muted-2)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            fontWeight: 600,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Zap size={11} /> Quick add — most-watched perps
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {QUICK_ADD_TOKENS.map((sym) => (
            <button
              type="button"
              key={sym}
              onClick={onAddManual}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 9px',
                borderRadius: 8,
                border: '1px dashed var(--eb-border)',
                background: 'transparent',
                fontSize: 11.5,
                color: 'var(--eb-muted-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <TokenIcon symbol={sym} size={18} fontSize={8} />
              {sym}
            </button>
          ))}
        </div>
      </div>

      <div
        style={{ textAlign: 'center', color: 'var(--eb-muted)', fontSize: 11.5, padding: '14px 0' }}
      >
        Skip for now · we&apos;ll nudge you to start a watchlist after your{' '}
        <b style={{ color: 'var(--eb-text)' }}>first 5 trades</b>.
      </div>
    </div>
  );
}

// ─── Filled state ─────────────────────────────────────────────────────────────

function FilledState({
  dayTokens,
  weekTokens,
  monthTokens,
  onRemoveDay,
  onRemoveWeek,
  onRemoveMonth,
  onAddDay,
  onAddWeek,
  onAddMonth,
  onRefresh,
  totalCount,
}: {
  dayTokens: DayToken[];
  weekTokens: WeekToken[];
  monthTokens: MonthToken[];
  onRemoveDay: (id: string) => void;
  onRemoveWeek: (id: string) => void;
  onRemoveMonth: (id: string) => void;
  onAddDay: () => void;
  onAddWeek: () => void;
  onAddMonth: () => void;
  onRefresh: () => void;
  totalCount: number;
}) {
  const [activeHorizon, setActiveHorizon] = useState<Horizon | 'all'>('all');
  const [biasFilter, setBiasFilter] = useState<'all' | Bias>('all');
  const { data: marketCtx, refetch: refetchMarket } = useMarketContext();

  const handleRefresh = () => { onRefresh(); void refetchMarket(); };
  const [utcTime, setUtcTime] = useState(() => {
    const now = new Date();
    return `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`;
  });

  const todayStr = (() => {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  })();

  const weekStr = (() => {
    const now = new Date();
    const day = now.getDay(); // 0 = Sun
    const mon = new Date(now);
    mon.setDate(now.getDate() - ((day + 6) % 7));
    const sun = new Date(mon);
    sun.setDate(mon.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `${fmt(mon)} – ${fmt(sun)}`;
  })();
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setUtcTime(`${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')} UTC`);
    };
    const ms = (60 - new Date().getUTCSeconds()) * 1000;
    const first = setTimeout(() => { tick(); }, ms);
    const interval = setInterval(tick, 60_000);
    return () => { clearTimeout(first); clearInterval(interval); };
  }, []);

  const sectionH = (title: React.ReactNode, sub: string, right?: React.ReactNode) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        margin: '14px 0 10px',
        flexWrap: 'wrap',
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: '-.01em',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {title}
      </h2>
      <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>{sub}</span>
      {right && <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>{right}</div>}
    </div>
  );

  const addBtn = (label: string, onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        padding: '11px 12px',
        border: '1.5px dashed var(--eb-border)',
        borderRadius: 11,
        background: 'transparent',
        color: 'var(--eb-muted)',
        fontSize: 12.5,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        fontWeight: 500,
        fontFamily: 'inherit',
        marginTop: 10,
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'var(--green)';
        el.style.color = 'var(--green)';
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLButtonElement;
        el.style.borderColor = 'var(--eb-border)';
        el.style.color = 'var(--eb-muted)';
      }}
    >
      <Plus size={16} />
      {label}
    </button>
  );

  const smallBtn = (label: React.ReactNode, onClick?: () => void) => (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '4px 8px',
        borderRadius: 7,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        color: 'var(--eb-text)',
        fontSize: 11.5,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
  );

  const horizonTabs: Array<{ key: Horizon | 'all'; Icon: React.ElementType; label: string; sub: string; count: number; accent: string; accentBg: string }> = [
    {
      key: 'all',
      Icon: Eye,
      label: 'All',
      sub: 'Everything at a glance',
      count: dayTokens.length + weekTokens.length + monthTokens.length,
      accent: 'rgba(0,168,107,.5)',
      accentBg: 'rgba(0,168,107,.08)',
    },
    {
      key: 'day',
      Icon: CalendarDays,
      label: 'Today',
      sub: 'Live trade candidates',
      count: dayTokens.length,
      accent: 'rgba(245,165,36,.5)',
      accentBg: 'rgba(245,165,36,.08)',
    },
    {
      key: 'week',
      Icon: CalendarRange,
      label: 'This week',
      sub: 'HTF setups developing',
      count: weekTokens.length,
      accent: 'rgba(6,182,212,.5)',
      accentBg: 'rgba(6,182,212,.08)',
    },
    {
      key: 'month',
      Icon: Moon,
      label: 'This month',
      sub: 'Theses + macro angles',
      count: monthTokens.length,
      accent: 'rgba(139,92,246,.5)',
      accentBg: 'rgba(139,92,246,.08)',
    },
  ];

  void totalCount;

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1380, width: '100%' }}>
      {/* Market rail */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
            fontSize: 11,
            color: 'var(--eb-muted-2)',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '.07em',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <Radio size={12} /> Market context · live
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Chip
              style={{
                color: 'var(--green)',
                borderColor: 'rgba(0,168,107,.3)',
                background: 'rgba(0,168,107,.08)',
                gap: 5,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: 'var(--green)',
                  display: 'inline-block',
                  animation: 'eb-pulse 1.6s infinite',
                }}
              />
              streaming
            </Chip>
            <Chip>{utcTime}</Chip>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 8 }}>
          {(marketCtx?.items ?? []).map((c) => (
            <div
              key={c.label}
              style={{
                padding: '8px 10px',
                borderRadius: 8,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.05em',
                  fontWeight: 600,
                }}
              >
                {c.label}
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 13,
                  fontWeight: 600,
                  marginTop: 2,
                  color:
                    c.positive === true
                      ? 'var(--green)'
                      : c.positive === false
                        ? 'var(--eb-red)'
                        : 'var(--eb-text)',
                }}
              >
                {c.value}
              </div>
              <div
                style={{
                  fontSize: 9.5,
                  color:
                    c.positive === true
                      ? 'var(--green)'
                      : c.positive === false
                        ? 'var(--eb-red)'
                        : 'var(--eb-muted)',
                }}
              >
                {c.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Horizon tabs */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}
      >
        {horizonTabs.map((h) => {
          const on = activeHorizon === h.key;
          return (
            <button
              type="button"
              key={h.key}
              onClick={() => setActiveHorizon(h.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                borderRadius: 12,
                border: `1px solid ${on ? h.accent : 'var(--eb-border)'}`,
                background: on ? h.accentBg : 'var(--eb-panel)',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                transition: 'border-color .12s',
                boxShadow: on ? `0 0 0 3px ${h.accentBg}` : 'none',
              }}
            >
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 11,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: h.accentBg,
                  border: `1px solid ${h.accent}`,
                  flexShrink: 0,
                  color: on ? h.accent : 'var(--eb-muted)',
                }}
              >
                <h.Icon size={20} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3
                  style={{
                    margin: '0 0 2px',
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--eb-text)',
                  }}
                >
                  {h.label}
                </h3>
                <div style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{h.sub}</div>
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono",monospace',
                  fontSize: 24,
                  fontWeight: 600,
                  letterSpacing: '-.02em',
                  color: 'var(--eb-text)',
                  flexShrink: 0,
                }}
              >
                {h.count}
              </div>
            </button>
          );
        })}
      </div>

      {/* Bias filter strip */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        {([
          { key: 'all',     label: 'All' },
          { key: 'long',    label: 'Long' },
          { key: 'short',   label: 'Short' },
          { key: 'neutral', label: 'Neutral' },
          { key: 'watch',   label: 'Watch' },
        ] as const).map(({ key, label }) => {
          const on = biasFilter === key;
          const accent = key === 'long' ? 'var(--green)' : key === 'short' ? 'var(--eb-red)' : key === 'neutral' ? 'var(--eb-muted-2)' : key === 'watch' ? 'var(--eb-cyan)' : 'var(--green)';
          const accentBg = key === 'long' ? 'rgba(0,168,107,.08)' : key === 'short' ? 'rgba(255,91,108,.08)' : key === 'neutral' ? 'var(--eb-panel-2)' : key === 'watch' ? 'rgba(6,182,212,.08)' : 'rgba(0,168,107,.08)';
          const accentBorder = key === 'long' ? 'rgba(0,168,107,.3)' : key === 'short' ? 'rgba(255,91,108,.3)' : key === 'neutral' ? 'var(--eb-border)' : key === 'watch' ? 'rgba(6,182,212,.3)' : 'rgba(0,168,107,.3)';
          return (
            <button
              type="button"
              key={key}
              onClick={() => setBiasFilter(key)}
              style={{
                fontSize: 11.5,
                padding: '3px 10px',
                borderRadius: 99,
                border: `1px solid ${on ? accentBorder : 'var(--eb-border)'}`,
                background: on ? accentBg : 'var(--eb-panel-2)',
                color: on ? accent : 'var(--eb-muted-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: on ? 600 : 400,
                transition: 'all .1s',
              }}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* ── DAY section ── */}
      {(activeHorizon === 'all' || activeHorizon === 'day') && (
        <>
          {sectionH(
            <>
              <CalendarDays size={17} /> Watchlist · today · {todayStr}
            </>,
            "Tokens you're actively hunting setups in",
            <>
              {smallBtn(
                <>
                  <RefreshCw size={12} /> Refresh prices
                </>,
                handleRefresh,
              )}
            </>,
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
            {dayTokens.filter((t) => biasFilter === 'all' || t.bias === biasFilter).map((tok) => (
              <DayCard key={tok.id} token={tok} onRemove={onRemoveDay} />
            ))}
          </div>
          {addBtn('Add another token for today', onAddDay)}
        </>
      )}

      {/* ── WEEK section ── */}
      {(activeHorizon === 'all' || activeHorizon === 'week') && (
        <>
          {sectionH(
            <>
              <CalendarRange size={17} /> Watchlist · this week · {weekStr}{' '}
              <Chip
                style={{
                  color: 'var(--eb-cyan)',
                  borderColor: 'rgba(6,182,212,.3)',
                  background: 'rgba(6,182,212,.08)',
                }}
              >
                refreshes Sun
              </Chip>
            </>,
            `HTF setups developing · ${weekTokens.length} tokens`,
          )}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
            {weekTokens.filter((t) => biasFilter === 'all' || t.bias === biasFilter).map((tok) => (
              <WeekCard key={tok.id} token={tok} onRemove={onRemoveWeek} />
            ))}
          </div>
          {addBtn('Add weekly token', onAddWeek)}
        </>
      )}

      {/* ── MONTH section ── */}
      {(activeHorizon === 'all' || activeHorizon === 'month') && (
        <>
          {sectionH(
            <>
              <Moon size={17} /> Watchlist · this month{' '}
              <Chip
                style={{
                  color: 'var(--eb-purple)',
                  borderColor: 'rgba(139,92,246,.3)',
                  background: 'rgba(139,92,246,.08)',
                }}
              >
                long-horizon theses
              </Chip>
            </>,
            'Macro angles · narrative trades · monthly catalysts',
          )}
          <div
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              overflow: 'hidden',
            }}
          >
            {monthTokens.length === 0 ? (
              <div
                style={{ padding: '20px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 13 }}
              >
                No monthly theses yet · add your first long-horizon idea
              </div>
            ) : (
              monthTokens.filter((t) => biasFilter === 'all' || t.bias === biasFilter).map((tok) => <MonthRow key={tok.id} token={tok} onRemove={onRemoveMonth} />)
            )}
          </div>
          {addBtn('Add long-horizon thesis', onAddMonth)}
        </>
      )}
    </div>
  );
}

// ─── DB row → display token converters ───────────────────────────────────────

function dbItemToDayToken(item: WatchlistItemRow, p?: PriceData): DayToken {
  const kl = item.keyLevelsJson as Array<{ type: string; price: string }>;
  const addedAt = new Date(item.createdAt);
  const dateStr = addedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const timeStr = `${dateStr} · ${addedAt.getUTCHours().toString().padStart(2, '0')}:${addedAt.getUTCMinutes().toString().padStart(2, '0')} UTC`;
  return {
    id: item.id,
    symbol: item.symbol,
    bias: item.bias as Bias,
    setupTag: item.playbookNames[0] ?? 'Watching',
    playbook: '—',
    price: p?.price ?? '—',
    change24h: p?.change ?? '—',
    positive: p?.positive ?? true,
    addedAt: timeStr,
    exchange: '—',
    entry: kl.find((l) => l.type === 'S')?.price ?? '—',
    stop: kl.find((l) => l.type === 'R')?.price ?? '—',
    target: kl.find((l) => l.type === 'T')?.price ?? '—',
    entryPct: '',
    stopPct: '',
    targetPct: '',
    slWidth: 15,
    tpWidth: 50,
    cursorLeft: 35,
    alertText: 'Set up',
    alertType: 'armed',
    keyLevelsData: item.keyLevelsJson as Array<{ type: string; price: string; label: string }>,
    note: [item.notes, item.convictionReason ? `Conviction: ${item.convictionReason}` : ''].filter(Boolean).join(' · ') || 'Added manually — configure levels and alerts.',
    isAiNote: false,
    conviction: item.conviction,
    funding: '—',
    fundingPositive: true,
    sparkPoints: '0,16 60,14 120,12 180,10 240,8',
    sparkColor: '#00d68f',
    playbookNames: item.playbookNames,
    tags: item.tags,
  };
}

function dbItemToWeekToken(item: WatchlistItemRow, p?: PriceData): WeekToken {
  const kl = item.keyLevelsJson as Array<{ type: string; price: string }>;
  const levelsSummary = kl.filter((l) => l.price).map((l) => `${l.price} ${l.type}`).join(' · ') || '—';
  return {
    id: item.id,
    symbol: item.symbol,
    bias: item.bias as Bias,
    timeframe: (() => { const d = new Date(item.createdAt); return `Added ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · ${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')} UTC`; })(),
    price: p?.price ?? '—',
    change7d: p?.change7d ?? '—',
    positive7d: p?.positive7d ?? true,
    thesis: item.notes || 'Added manually — add thesis when ready.',
    tags: item.tags.map((t) => {
      const tc = tagColor(t);
      return { text: t, style: { background: tc.bg, color: tc.color, border: `1px solid ${tc.border}` } };
    }),
    keyLevels: levelsSummary,
    conviction: item.conviction,
    playbookNames: item.playbookNames,
  };
}

function dbItemToMonthToken(item: WatchlistItemRow, p?: PriceData): MonthToken {
  const kl = item.keyLevelsJson as Array<{ type: string; price: string }>;
  const since = new Date(item.createdAt);
  const daysDiff = Math.floor((Date.now() - since.getTime()) / 86_400_000);
  return {
    id: item.id,
    symbol: item.symbol,
    bias: item.bias as Bias,
    thesis: item.notes || 'Added manually — add thesis when ready.',
    price: p?.price ?? '—',
    monthChange: p?.change30d ?? '—',
    monthPositive: p?.positive30d ?? true,
    target: kl.find((l) => l.type === 'T')?.price ?? '—',
    targetPct: '—',
    since: since.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    days: daysDiff,
    playbookNames: item.playbookNames,
    tags: item.tags,
    conviction: item.conviction,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Sk({ h = 14, w, r = 6 }: { h?: number; w?: string | number; r?: number }) {
  return (
    <div
      style={{
        height: h,
        width: w ?? '100%',
        borderRadius: r,
        background: 'var(--eb-panel-2)',
        animation: 'eb-pulse 1.6s ease-in-out infinite',
        flexShrink: 0,
      }}
    />
  );
}

function WatchlistSkeleton() {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1380, width: '100%' }}>
      <style>{'@keyframes eb-pulse{0%,100%{opacity:1}50%{opacity:.3}}'}</style>

      {/* Market rail skeleton */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
          padding: 12,
          marginBottom: 14,
        }}
      >
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <Sk h={10} w={80} r={4} />
        </div>
        <div style={{ display: 'flex', gap: 24 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <Sk h={9} w={60} r={3} />
              <Sk h={13} w={80} r={4} />
            </div>
          ))}
        </div>
      </div>

      {/* Horizon tabs skeleton — 4 tabs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 12,
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 11, background: 'var(--eb-panel-2)', animation: 'eb-pulse 1.6s ease-in-out infinite', flexShrink: 0 }} />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <Sk h={12} w="60%" r={4} />
              <Sk h={10} w="80%" r={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Bias filter skeleton */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <Sk key={i} h={28} w={72} r={7} />
        ))}
      </div>

      {/* Day section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
        <Sk h={17} w={240} r={5} />
        <Sk h={17} w={100} r={5} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12, marginBottom: 14 }}>
        {[0, 1].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderLeft: '3px solid var(--eb-border)',
              borderRadius: '0 12px 12px 0',
              overflow: 'hidden',
            }}
          >
            <div style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'var(--eb-panel-2)', animation: 'eb-pulse 1.6s ease-in-out infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <Sk h={14} w="50%" r={4} />
                <Sk h={10} w="80%" r={3} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Sk h={18} w={70} r={4} />
                <Sk h={10} w={50} r={3} />
              </div>
            </div>
            <div style={{ padding: '0 16px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Sk h={60} r={8} />
              <Sk h={38} r={8} />
            </div>
            <div style={{ padding: '10px 16px', borderTop: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)' }}>
              <Sk h={10} w="40%" r={3} />
            </div>
          </div>
        ))}
      </div>

      {/* Week section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0 10px' }}>
        <Sk h={17} w={260} r={5} />
        <Sk h={17} w={80} r={5} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderLeft: '3px solid var(--eb-border)',
              borderRadius: '0 11px 11px 0',
              padding: 12,
            }}
          >
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 9 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: 'var(--eb-panel-2)', animation: 'eb-pulse 1.6s ease-in-out infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}>
                <Sk h={12} w="50%" r={4} />
                <Sk h={9} w="70%" r={3} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
                <Sk h={14} w={56} r={4} />
                <Sk h={9} w={40} r={3} />
              </div>
            </div>
            <Sk h={36} r={6} />
            <div style={{ marginTop: 8 }}>
              <Sk h={24} r={6} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WatchlistClient() {
  const [showModal, setShowModal] = useState(false);
  const [modalHorizon, setModalHorizon] = useState<Horizon>('day');

  const { data: watchlistItems = [], isLoading } = useWatchlist();
  const createItem = useCreateWatchlistItem();
  const deleteItem = useDeleteWatchlistItem();

  const symbols = useMemo(() => watchlistItems.map((i) => i.symbol), [watchlistItems]);
  const { data: prices = {}, refetch: refetchPrices } = usePrices(symbols);

  const dayTokens = useMemo(
    () => watchlistItems.filter((i) => i.horizon === 'day').map((i) => dbItemToDayToken(i, prices[i.symbol])),
    [watchlistItems, prices],
  );
  const weekTokens = useMemo(
    () => watchlistItems.filter((i) => i.horizon === 'week').map((i) => dbItemToWeekToken(i, prices[i.symbol])),
    [watchlistItems, prices],
  );
  const monthTokens = useMemo(
    () => watchlistItems.filter((i) => i.horizon === 'month').map((i) => dbItemToMonthToken(i, prices[i.symbol])),
    [watchlistItems, prices],
  );

  const hasTokens = watchlistItems.length > 0;
  const totalCount = watchlistItems.length;

  if (isLoading) return <WatchlistSkeleton />;

  const openModal = (h: Horizon) => {
    setModalHorizon(h);
    setShowModal(true);
  };

  const handleAdd = (_horizon: Horizon, formState: ModalState) => {
    createItem.mutate({
      symbol: formState.symbol.toUpperCase(),
      horizon: formState.horizon,
      bias: formState.bias,
      conviction: formState.conviction,
      tags: formState.tags,
      playbookNames: formState.playbooks.map((p) => p.name),
      keyLevelsJson: formState.keyLevels,
      ...(formState.notes && { notes: formState.notes }),
      ...(formState.convictionReason && { convictionReason: formState.convictionReason }),
    });
  };

  return (
    <>
      {/* Keyframe styles */}
      <style>{`
        @keyframes eb-pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        @keyframes eb-pop { from{transform:translateY(8px) scale(.98);opacity:0}to{transform:none;opacity:1} }
      `}</style>

      {/* Topbar extension */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 26px',
          borderBottom: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
        }}
      >
        <div style={{ fontSize: 12.5, color: 'var(--eb-muted)' }}>
          Workspace / <b style={{ color: 'var(--eb-text)' }}>Watchlist</b>
        </div>
        {hasTokens && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              padding: '2px 9px',
              borderRadius: 99,
              border: '1px solid rgba(0,168,107,.3)',
              background: 'rgba(0,168,107,.08)',
              color: 'var(--green)',
              marginLeft: 4,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: 'var(--green)',
                display: 'inline-block',
                animation: 'eb-pulse 1.6s infinite',
              }}
            />
            {totalCount} tokens · {dayTokens.length} today
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasTokens && (
            <button
              type="button"
              onClick={() => {
                for (const item of watchlistItems) deleteItem.mutate(item.id);
              }}
              style={{
                padding: '5px 10px',
                borderRadius: 7,
                border: '1px solid var(--eb-border)',
                background: 'transparent',
                color: 'var(--eb-muted)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Clear all
            </button>
          )}
          <button
            type="button"
            onClick={() => openModal('day')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 7,
              border: '1px solid rgba(0,168,107,.5)',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> Add token
          </button>
        </div>
      </div>

      {hasTokens ? (
        <FilledState
          dayTokens={dayTokens}
          weekTokens={weekTokens}
          monthTokens={monthTokens}
          onRemoveDay={(id) => deleteItem.mutate(id)}
          onRemoveWeek={(id) => deleteItem.mutate(id)}
          onRemoveMonth={(id) => deleteItem.mutate(id)}
          onAddDay={() => openModal('day')}
          onAddWeek={() => openModal('week')}
          onAddMonth={() => openModal('month')}
          onRefresh={() => { void refetchPrices(); }}
          totalCount={totalCount}
        />
      ) : (
        <EmptyState onAddManual={() => openModal('day')} />
      )}

      {showModal && (
        <AddTokenModal
          defaultHorizon={modalHorizon}
          onAdd={handleAdd}
          onClose={() => setShowModal(false)}
        />
      )}

    </>
  );
}
