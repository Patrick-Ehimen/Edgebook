'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Check,
  ChevronDown,
  ClipboardList,
  Clock,
  Edit3,
  Image,
  Plus,
  RotateCcw,
  Save,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useWatchlistItem } from '@/features/watchlist/hooks/useWatchlistItem';
import { useUpdateWatchlistItem } from '@/features/watchlist/hooks/useUpdateWatchlistItem';
import { useDeleteWatchlistItem } from '@/features/watchlist/hooks/useDeleteWatchlistItem';
import { usePrices } from '@/features/watchlist/hooks/usePrices';
import { usePlaybooks } from '@/features/playbooks/hooks/usePlaybooks';

// ─── Token visuals ────────────────────────────────────────────────────────────

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
  { bg: 'rgba(249,115,22,.12)', color: '#f97316', border: 'rgba(249,115,22,.25)' },
  { bg: 'rgba(139,92,246,.12)', color: '#a78bfa', border: 'rgba(139,92,246,.25)' },
  { bg: 'rgba(6,182,212,.12)', color: '#22d3ee', border: 'rgba(6,182,212,.25)' },
  { bg: 'rgba(236,72,153,.12)', color: '#f43f5e', border: 'rgba(236,72,153,.25)' },
  { bg: 'rgba(16,185,129,.12)', color: '#34d399', border: 'rgba(16,185,129,.25)' },
  { bg: 'rgba(59,130,246,.12)', color: '#60a5fa', border: 'rgba(59,130,246,.25)' },
  { bg: 'rgba(234,179,8,.12)', color: '#fbbf24', border: 'rgba(234,179,8,.25)' },
  { bg: 'rgba(239,68,68,.12)', color: '#f87171', border: 'rgba(239,68,68,.25)' },
  { bg: 'rgba(20,184,166,.12)', color: '#2dd4bf', border: 'rgba(20,184,166,.25)' },
  { bg: 'rgba(217,70,239,.12)', color: '#e879f9', border: 'rgba(217,70,239,.25)' },
];

const TAG_FALLBACK = {
  bg: 'var(--eb-panel-2)',
  color: 'var(--eb-muted-2)',
  border: 'var(--eb-border)',
};

function tagColor(tag: string) {
  let h = 0;
  for (let i = 0; i < tag.length; i++) h = (Math.imul(h, 31) + tag.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(h) % TAG_COLORS.length] ?? TAG_FALLBACK;
}

const PLAYBOOK_COLORS = [
  { bg: 'rgba(99,102,241,.12)', border: 'rgba(99,102,241,.35)', icon: '#818cf8' },
  { bg: 'rgba(245,165,36,.10)', border: 'rgba(245,165,36,.30)', icon: '#f5a524' },
  { bg: 'rgba(236,72,153,.10)', border: 'rgba(236,72,153,.30)', icon: '#f472b6' },
  { bg: 'rgba(20,184,166,.10)', border: 'rgba(20,184,166,.30)', icon: '#2dd4bf' },
  { bg: 'rgba(249,115,22,.10)', border: 'rgba(249,115,22,.30)', icon: '#fb923c' },
  { bg: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.35)', icon: '#a78bfa' },
  { bg: 'rgba(59,130,246,.10)', border: 'rgba(59,130,246,.30)', icon: '#60a5fa' },
  { bg: 'rgba(239,68,68,.10)', border: 'rgba(239,68,68,.30)', icon: '#f87171' },
];

function playbookColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (Math.imul(h, 31) + name.charCodeAt(i)) | 0;
  return PLAYBOOK_COLORS[Math.abs(h) % PLAYBOOK_COLORS.length] ?? PLAYBOOK_COLORS[0]!;
}

// ─── Domain config ────────────────────────────────────────────────────────────

type Horizon = 'day' | 'week' | 'month';
type Bias = 'long' | 'short' | 'neutral' | 'watch';

const BIAS_CFG: Record<Bias, { label: string; color: string; bg: string; border: string }> = {
  long: {
    label: 'Long',
    color: 'var(--green)',
    bg: 'rgba(0,168,107,.1)',
    border: 'rgba(0,168,107,.3)',
  },
  short: {
    label: 'Short',
    color: 'var(--eb-red)',
    bg: 'rgba(255,91,108,.08)',
    border: 'rgba(255,91,108,.3)',
  },
  neutral: {
    label: 'Neutral',
    color: 'var(--eb-muted-2)',
    bg: 'var(--eb-panel-2)',
    border: 'var(--eb-border)',
  },
  watch: {
    label: 'Watch',
    color: 'var(--eb-cyan)',
    bg: 'rgba(6,182,212,.08)',
    border: 'rgba(6,182,212,.25)',
  },
};

const HORIZON_CFG: Record<Horizon, { label: string; color: string; bg: string; border: string }> = {
  day: {
    label: 'Day trade',
    color: '#f97316',
    bg: 'rgba(249,115,22,.1)',
    border: 'rgba(249,115,22,.3)',
  },
  week: {
    label: 'This week',
    color: '#a78bfa',
    bg: 'rgba(139,92,246,.1)',
    border: 'rgba(139,92,246,.3)',
  },
  month: {
    label: 'This month',
    color: '#22d3ee',
    bg: 'rgba(6,182,212,.1)',
    border: 'rgba(6,182,212,.3)',
  },
};

const LEVEL_COLORS: Record<string, { color: string; bg: string; border: string; label: string }> = {
  S: {
    color: 'var(--green)',
    bg: 'rgba(0,168,107,.06)',
    border: 'rgba(0,168,107,.2)',
    label: 'Support',
  },
  R: {
    color: 'var(--eb-red)',
    bg: 'rgba(255,91,108,.06)',
    border: 'rgba(255,91,108,.2)',
    label: 'Resistance',
  },
  T: {
    color: 'var(--eb-cyan)',
    bg: 'rgba(6,182,212,.06)',
    border: 'rgba(6,182,212,.2)',
    label: 'Target',
  },
  K: {
    color: 'var(--eb-purple)',
    bg: 'rgba(139,92,246,.06)',
    border: 'rgba(139,92,246,.2)',
    label: 'Key level',
  },
};
const LEVEL_FALLBACK = {
  color: 'var(--eb-muted-2)',
  bg: 'var(--eb-panel-2)',
  border: 'var(--eb-border)',
  label: 'Level',
};

function levelColors(type: string) {
  return LEVEL_COLORS[type.toUpperCase().charAt(0)] ?? LEVEL_FALLBACK;
}

// ─── Shared style constants (matches trade-detail-client pattern) ─────────────

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 11,
  padding: 16,
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  letterSpacing: '.07em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const btn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '6px 11px',
  borderRadius: 7,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-text)',
  fontSize: 12,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--eb-panel-2)',
  border: '1px solid var(--eb-border)',
  borderRadius: 7,
  padding: '7px 10px',
  color: 'var(--eb-text)',
  outline: 0,
  fontSize: 12.5,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  fontWeight: 600,
  marginBottom: 5,
  display: 'block',
};

const sep: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--eb-border)',
  margin: '12px 0',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatRelative(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h ago`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7) return `${diffD}d ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatAbsolute(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TokenIcon({ symbol, size = 44 }: { symbol: string; size?: number }) {
  const meta = getMeta(symbol);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.26),
        background: meta.gradient,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: Math.round(size * 0.38),
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

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '.03em',
        padding: '3px 9px',
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

function PanelH3({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <h3 style={panelTitle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{left}</span>
      {right && <span>{right}</span>}
    </h3>
  );
}

function ConvictionDots({
  value,
  max = 5,
  onChange,
}: { value: number; max?: number; onChange?: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      {Array.from({ length: max }, (_, i) => (
        <div
          key={i}
          onClick={() => onChange?.(i + 1)}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            background: i < value ? '#fbbf24' : 'var(--eb-border)',
            cursor: onChange ? 'pointer' : 'default',
            transition: 'background .12s, transform .1s',
            transform: onChange && i < value ? 'scale(1.15)' : 'scale(1)',
          }}
        />
      ))}
      <span
        style={{
          marginLeft: 4,
          fontSize: 12,
          color: 'var(--eb-muted)',
          fontFamily: '"JetBrains Mono",monospace',
        }}
      >
        {value}/5
      </span>
    </div>
  );
}

interface LinkedPlaybook {
  id: string;
  name: string;
  status: string;
}

function PlaybookPicker({
  selected,
  onChange,
}: { selected: LinkedPlaybook[]; onChange: (v: LinkedPlaybook[]) => void }) {
  const { data: playbooks = [], isLoading } = usePlaybooks();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);

  const selectedIds = new Set(selected.map((p) => p.id));
  const filtered = playbooks.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const toggle = (p: LinkedPlaybook) => {
    if (selectedIds.has(p.id)) onChange(selected.filter((s) => s.id !== p.id));
    else {
      onChange([...selected, p]);
      setQuery('');
    }
  };
  const remove = (id: string) => onChange(selected.filter((p) => p.id !== id));

  return (
    <div style={{ position: 'relative' }}>
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {selected.map((p) => {
            const pc = playbookColor(p.id);
            return (
              <span
                key={p.id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  padding: '3px 8px 3px 9px',
                  borderRadius: 7,
                  background: pc.bg,
                  border: `1px solid ${pc.border}`,
                  fontSize: 12,
                  color: 'var(--eb-text)',
                }}
              >
                <ClipboardList size={11} style={{ color: pc.icon, flexShrink: 0 }} />
                {p.name}
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    color: 'var(--eb-muted)',
                    cursor: 'pointer',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={11} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <Search
          size={12}
          style={{
            position: 'absolute',
            left: 9,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--eb-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={isLoading ? 'Loading…' : 'Search playbooks…'}
          style={{ ...inputStyle, paddingLeft: 28 }}
        />
      </div>
      {open && filtered.length > 0 && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 9,
            marginTop: 4,
            maxHeight: 200,
            overflowY: 'auto',
            boxShadow: '0 8px 24px rgba(0,0,0,.28)',
          }}
        >
          {filtered.map((p) => {
            const sel = selectedIds.has(p.id);
            const pc = playbookColor(p.id);
            return (
              <div
                key={p.id}
                onMouseDown={() => toggle(p)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '8px 12px',
                  cursor: 'pointer',
                  background: sel ? pc.bg : 'transparent',
                  borderBottom: '1px solid var(--eb-border)',
                }}
              >
                {sel && <Check size={12} style={{ color: pc.icon, flexShrink: 0 }} />}
                <span style={{ fontSize: 12.5, color: 'var(--eb-text)' }}>{p.name}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TagsInput({ tags, onChange }: { tags: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('');
  const addTag = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setInput('');
  };
  return (
    <div>
      {tags.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
          {tags.map((tag) => {
            const tc = tagColor(tag);
            return (
              <span
                key={tag}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '3px 8px',
                  borderRadius: 99,
                  background: tc.bg,
                  border: `1px solid ${tc.border}`,
                  fontSize: 11.5,
                  color: tc.color,
                }}
              >
                {tag}
                <button
                  type="button"
                  onClick={() => onChange(tags.filter((t) => t !== tag))}
                  style={{
                    background: 'transparent',
                    border: 0,
                    cursor: 'pointer',
                    color: 'inherit',
                    padding: 0,
                    display: 'flex',
                    alignItems: 'center',
                    opacity: 0.7,
                  }}
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', gap: 5 }}>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder="Add tag, press Enter…"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={addTag}
          style={{ ...btn, padding: '6px 10px', flexShrink: 0 }}
        >
          <Plus size={12} />
        </button>
      </div>
    </div>
  );
}

type KeyLevel = { type: string; price: string; label: string };
const LEVEL_TYPES = [
  { value: 'S', label: 'Support' },
  { value: 'R', label: 'Resistance' },
  { value: 'T', label: 'Target' },
  { value: 'K', label: 'Key level' },
];

function KeyLevelsEditor({
  levels,
  onChange,
}: { levels: KeyLevel[]; onChange: (v: KeyLevel[]) => void }) {
  const add = () => onChange([...levels, { type: 'S', price: '', label: '' }]);
  const remove = (i: number) => onChange(levels.filter((_, j) => j !== i));
  const update = (i: number, field: keyof KeyLevel, value: string) =>
    onChange(levels.map((l, j) => (j === i ? { ...l, [field]: value } : l)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {levels.map((lvl, i) => {
        const c = levelColors(lvl.type);
        return (
          <div
            key={i}
            style={{
              display: 'grid',
              gridTemplateColumns: '108px 1fr 1fr 28px',
              gap: 5,
              alignItems: 'center',
            }}
          >
            <div style={{ position: 'relative' }}>
              <select
                value={lvl.type}
                onChange={(e) => update(i, 'type', e.target.value)}
                style={{
                  width: '100%',
                  background: c.bg,
                  border: `1px solid ${c.border}`,
                  borderRadius: 6,
                  padding: '7px 24px 7px 8px',
                  color: c.color,
                  outline: 0,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  cursor: 'pointer',
                  appearance: 'none',
                }}
              >
                {LEVEL_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={11}
                style={{
                  position: 'absolute',
                  right: 6,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: c.color,
                  pointerEvents: 'none',
                }}
              />
            </div>
            <input
              type="text"
              value={lvl.price}
              onChange={(e) => update(i, 'price', e.target.value)}
              placeholder="Price"
              style={{ ...inputStyle, fontFamily: '"JetBrains Mono",monospace', fontSize: 12 }}
            />
            <input
              type="text"
              value={lvl.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="Label"
              style={{ ...inputStyle, fontSize: 12 }}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              style={{
                background: 'transparent',
                border: 0,
                color: 'var(--eb-muted)',
                cursor: 'pointer',
                padding: 4,
                borderRadius: 5,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
      <button
        type="button"
        onClick={add}
        style={{
          ...btn,
          alignSelf: 'flex-start',
          borderStyle: 'dashed',
          color: 'var(--eb-muted)',
          background: 'transparent',
        }}
      >
        <Plus size={12} /> Add level
      </button>
    </div>
  );
}

function Sk({ h, w, r = 6 }: { h: number; w?: number | string; r?: number }) {
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

function DetailSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <style>{`@keyframes eb-pulse{0%,100%{opacity:1}50%{opacity:.4}}`}</style>
      {/* Topbar skeleton */}
      <div
        style={{
          padding: '10px 26px',
          borderBottom: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Sk h={14} w={80} r={4} />
        <Sk h={14} w={4} r={2} />
        <Sk h={14} w={100} r={4} />
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Sk h={30} w={70} r={7} />
          <Sk h={30} w={30} r={7} />
        </div>
      </div>
      <div
        style={{
          padding: '20px 26px 48px',
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        {/* Hero skeleton */}
        <div style={{ ...panel, display: 'flex', gap: 14, alignItems: 'center' }}>
          <Sk h={44} w={44} r={12} />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Sk h={18} w={160} r={4} />
            <Sk h={11} w={240} r={3} />
          </div>
          <div
            style={{
              textAlign: 'right',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              alignItems: 'flex-end',
            }}
          >
            <Sk h={22} w={90} r={4} />
            <Sk h={12} w={60} r={3} />
          </div>
        </div>
        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {[0, 1, 2, 3].map((i) => (
            <div key={i} style={{ ...panel, padding: '10px 12px' }}>
              <Sk h={10} w={60} r={3} />
              <div style={{ marginTop: 6 }}>
                <Sk h={18} w={80} r={4} />
              </div>
            </div>
          ))}
        </div>
        {/* Body */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Sk h={140} r={11} />
            <Sk h={100} r={11} />
            <Sk h={60} r={11} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Sk h={80} r={11} />
            <Sk h={120} r={11} />
            <Sk h={80} r={11} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function WatchlistItemDetailClient({ id }: { id: string }) {
  const router = useRouter();
  const { data: item, isLoading, isError } = useWatchlistItem(id);
  const updateItem = useUpdateWatchlistItem(id);
  const deleteItem = useDeleteWatchlistItem();

  const [editing, setEditing] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  const [draft, setDraft] = useState<{
    horizon: Horizon;
    bias: Bias;
    notes: string;
    conviction: number;
    convictionReason: string;
    tags: string[];
    playbookNames: string[];
    keyLevelsJson: KeyLevel[];
    images: string[];
  } | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const images = item?.images ?? [];
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxIdx(null);
      if (e.key === 'ArrowRight') setLightboxIdx((i) => (i !== null ? Math.min(i + 1, images.length - 1) : i));
      if (e.key === 'ArrowLeft') setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : i));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxIdx, item?.images]);

  const { data: prices = {} } = usePrices(item ? [item.symbol] : []);
  const priceData = item ? prices[item.symbol] : undefined;

  const startEdit = useCallback(() => {
    if (!item) return;
    setDraft({
      horizon: item.horizon as Horizon,
      bias: item.bias as Bias,
      notes: item.notes ?? '',
      conviction: item.conviction,
      convictionReason: item.convictionReason ?? '',
      tags: [...item.tags],
      playbookNames: [...item.playbookNames],
      keyLevelsJson: (item.keyLevelsJson as KeyLevel[]) ?? [],
      images: [...item.images],
    });
    setEditing(true);
  }, [item]);

  const cancelEdit = () => {
    setEditing(false);
    setDraft(null);
  };

  const saveEdit = async () => {
    if (!draft) return;
    const body: Parameters<typeof updateItem.mutateAsync>[0] = {
      horizon: draft.horizon,
      bias: draft.bias,
      conviction: draft.conviction,
      tags: draft.tags,
      playbookNames: draft.playbookNames,
      keyLevelsJson: draft.keyLevelsJson,
      images: draft.images,
    };
    if (draft.notes) body.notes = draft.notes;
    if (draft.convictionReason) body.convictionReason = draft.convictionReason;
    await updateItem.mutateAsync(body);
    setEditing(false);
    setDraft(null);
  };

  const handleDelete = async () => {
    await deleteItem.mutateAsync(id);
    router.push('/watchlist');
  };

  if (isLoading) return <DetailSkeleton />;

  if (isError || !item) {
    return (
      <div style={{ padding: '60px 26px', textAlign: 'center', color: 'var(--eb-muted)' }}>
        <div style={{ fontSize: 15, marginBottom: 10 }}>Item not found.</div>
        <button type="button" onClick={() => router.push('/watchlist')} style={btn}>
          <ArrowLeft size={13} /> Back to watchlist
        </button>
      </div>
    );
  }

  const ticker = item.symbol.replace(/USDT$|PERP$/i, '').toUpperCase();
  const biasConf = BIAS_CFG[item.bias as Bias] ?? BIAS_CFG.neutral;
  const horizConf = HORIZON_CFG[item.horizon as Horizon] ?? HORIZON_CFG.day;
  const keyLevels = (item.keyLevelsJson as KeyLevel[]) ?? [];

  const priceStr = priceData ? `$${priceData.price}` : '—';
  const changeStr = priceData ? priceData.change : null;
  const wasEdited = item.updatedAt !== item.createdAt;

  const draftBiasConf = draft ? (BIAS_CFG[draft.bias] ?? BIAS_CFG.neutral) : biasConf;
  const draftHorizConf = draft ? (HORIZON_CFG[draft.horizon] ?? HORIZON_CFG.day) : horizConf;

  const draftPlaybooks: LinkedPlaybook[] = (draft?.playbookNames ?? item.playbookNames).map(
    (name) => ({ id: name, name, status: 'active' }),
  );

  const displayConviction = editing ? (draft?.conviction ?? item.conviction) : item.conviction;
  const displayBias = editing ? draftBiasConf : biasConf;
  const displayHorizon = editing ? draftHorizConf : horizConf;

  return (
    <>
      <style>{`
        @keyframes eb-pulse  { 0%,100%{opacity:1} 50%{opacity:.4} }
        @keyframes eb-fade-up{ from{opacity:0;transform:translateY(5px)} to{opacity:1;transform:none} }
        .wl-det { animation: eb-fade-up .2s ease; }
        .wl-sel-btn { transition: border-color .12s, background .12s; }
        .wl-sel-btn:hover { filter: brightness(1.08); }
        .wl-dot:hover { transform: scale(1.25) !important; }
      `}</style>

      {/* ── Topbar ──────────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '9px 22px',
          borderBottom: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push('/watchlist')}
          style={{
            ...btn,
            background: 'transparent',
            border: 0,
            color: 'var(--eb-muted)',
            padding: '4px 6px',
            gap: 5,
          }}
        >
          <ArrowLeft size={13} />
          <span style={{ fontSize: 12.5 }}>Watchlist</span>
        </button>
        <span style={{ color: 'var(--eb-border)', userSelect: 'none' }}>/</span>
        <span style={{ fontSize: 12.5, fontWeight: 500, color: 'var(--eb-text)' }}>
          {item.symbol}
        </span>

        {wasEdited && !editing && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              marginLeft: 2,
            }}
            title={formatAbsolute(item.updatedAt)}
          >
            <Clock size={10} />
            edited {formatRelative(item.updatedAt)}
          </span>
        )}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {!editing ? (
            <>
              <button type="button" onClick={startEdit} style={btn}>
                <Edit3 size={12} /> Edit
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteDialog(true)}
                style={{
                  ...btn,
                  color: 'var(--eb-red)',
                  borderColor: 'rgba(255,91,108,.25)',
                  background: 'rgba(255,91,108,.06)',
                }}
              >
                <Trash2 size={12} />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={cancelEdit}
                style={{ ...btn, color: 'var(--eb-muted)' }}
              >
                <RotateCcw size={12} /> Cancel
              </button>
              <button
                type="button"
                onClick={saveEdit}
                disabled={updateItem.isPending}
                style={{
                  ...btn,
                  border: '1px solid rgba(0,168,107,.45)',
                  background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                  color: '#06140f',
                  fontWeight: 600,
                  opacity: updateItem.isPending ? 0.6 : 1,
                }}
              >
                <Save size={12} />
                {updateItem.isPending ? 'Saving…' : 'Save changes'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Page body ───────────────────────────────────────────────────── */}
      <div
        className="wl-det"
        style={{
          padding: '18px 26px 56px',
          maxWidth: 960,
          width: '100%',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Hero card */}
        <div style={{ ...panel, display: 'flex', alignItems: 'center', gap: 14 }}>
          <TokenIcon symbol={item.symbol} size={44} />

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: '-.015em',
                  color: 'var(--eb-text)',
                }}
              >
                {item.symbol}
              </span>
              <span
                style={{
                  fontSize: 12.5,
                  color: 'var(--eb-muted)',
                  fontFamily: '"JetBrains Mono",monospace',
                }}
              >
                {ticker}
              </span>
              <Chip
                style={{
                  color: displayBias.color,
                  background: displayBias.bg,
                  borderColor: displayBias.border,
                }}
              >
                {displayBias.label}
              </Chip>
              <Chip
                style={{
                  color: displayHorizon.color,
                  background: displayHorizon.bg,
                  borderColor: displayHorizon.border,
                }}
              >
                {displayHorizon.label}
              </Chip>
            </div>
            <div
              style={{
                marginTop: 4,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
                Added {formatRelative(item.createdAt)}
              </span>
              {wasEdited && (
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--eb-cyan)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                  title={formatAbsolute(item.updatedAt)}
                >
                  <Clock size={9.5} /> Updated {formatRelative(item.updatedAt)}
                </span>
              )}
            </div>
          </div>

          {/* Price */}
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-.02em',
                fontFamily: '"JetBrains Mono",monospace',
                color: 'var(--eb-text)',
              }}
            >
              {priceStr}
            </div>
            {changeStr && (
              <div
                style={{
                  fontSize: 12,
                  fontFamily: '"JetBrains Mono",monospace',
                  color: priceData?.positive ? 'var(--green)' : 'var(--eb-red)',
                  marginTop: 2,
                }}
              >
                {changeStr} · 24h
              </div>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          {/* Conviction */}
          <div style={{ ...panel, padding: '10px 14px' }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--eb-muted)',
                marginBottom: 6,
              }}
            >
              Conviction
            </div>
            {editing ? (
              <ConvictionDots
                value={displayConviction}
                onChange={(v) => setDraft((d) => (d ? { ...d, conviction: v } : d))}
              />
            ) : (
              <ConvictionDots value={displayConviction} />
            )}
          </div>

          {/* Bias */}
          <div style={{ ...panel, padding: '10px 14px' }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--eb-muted)',
                marginBottom: 6,
              }}
            >
              Bias
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['long', 'short', 'neutral', 'watch'] as Bias[]).map((b) => {
                  const bc = BIAS_CFG[b];
                  const sel = draft?.bias === b;
                  return (
                    <button
                      key={b}
                      type="button"
                      className="wl-sel-btn"
                      onClick={() => setDraft((d) => (d ? { ...d, bias: b } : d))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 9px',
                        borderRadius: 99,
                        border: `1px solid ${sel ? bc.border : 'var(--eb-border)'}`,
                        background: sel ? bc.bg : 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 11.5,
                        color: sel ? bc.color : 'var(--eb-muted)',
                      }}
                    >
                      {sel && <Check size={10} />} {bc.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: biasConf.color }}>
                {biasConf.label}
              </span>
            )}
          </div>

          {/* Horizon */}
          <div style={{ ...panel, padding: '10px 14px' }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--eb-muted)',
                marginBottom: 6,
              }}
            >
              Horizon
            </div>
            {editing ? (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {(['day', 'week', 'month'] as Horizon[]).map((h) => {
                  const hc = HORIZON_CFG[h];
                  const sel = draft?.horizon === h;
                  return (
                    <button
                      key={h}
                      type="button"
                      className="wl-sel-btn"
                      onClick={() => setDraft((d) => (d ? { ...d, horizon: h } : d))}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '4px 9px',
                        borderRadius: 99,
                        border: `1px solid ${sel ? hc.border : 'var(--eb-border)'}`,
                        background: sel ? hc.bg : 'transparent',
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 11.5,
                        color: sel ? hc.color : 'var(--eb-muted)',
                      }}
                    >
                      {sel && <Check size={10} />} {hc.label}
                    </button>
                  );
                })}
              </div>
            ) : (
              <span style={{ fontSize: 14, fontWeight: 600, color: horizConf.color }}>
                {horizConf.label}
              </span>
            )}
          </div>

          {/* Symbol */}
          <div style={{ ...panel, padding: '10px 14px' }}>
            <div
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                color: 'var(--eb-muted)',
                marginBottom: 6,
              }}
            >
              Symbol
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--eb-text)',
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              {ticker}
            </span>
            {item.playbookNames.length > 0 && (
              <div style={{ marginTop: 4, fontSize: 10.5, color: 'var(--eb-muted)' }}>
                {item.playbookNames.length} playbook{item.playbookNames.length > 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Body grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 256px', gap: 14 }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Notes / Thesis */}
            <div style={panel}>
              <PanelH3 left="Notes / Thesis" />
              {editing ? (
                <textarea
                  value={draft?.notes ?? ''}
                  onChange={(e) => setDraft((d) => (d ? { ...d, notes: e.target.value } : d))}
                  placeholder="Write your thesis, entry criteria, and invalidation points…"
                  rows={6}
                  style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.65, fontSize: 13 }}
                />
              ) : (
                <div
                  style={{
                    fontSize: 13,
                    color: item.notes ? 'var(--eb-text)' : 'var(--eb-muted)',
                    lineHeight: 1.65,
                    whiteSpace: 'pre-wrap',
                    fontStyle: item.notes ? 'normal' : 'italic',
                  }}
                >
                  {item.notes || 'No notes yet. Click Edit to add your thesis.'}
                </div>
              )}

              {(item.convictionReason || editing) && <hr style={sep} />}

              {editing && (
                <>
                  <label style={fieldLabel}>Conviction rationale</label>
                  <input
                    type="text"
                    value={draft?.convictionReason ?? ''}
                    onChange={(e) =>
                      setDraft((d) => (d ? { ...d, convictionReason: e.target.value } : d))
                    }
                    placeholder="Why this conviction level?"
                    style={inputStyle}
                  />
                </>
              )}
              {item.convictionReason && !editing && (
                <div
                  style={{
                    padding: '9px 11px',
                    background: 'rgba(139,92,246,.06)',
                    borderRadius: 8,
                    border: '1px solid rgba(139,92,246,.18)',
                    fontSize: 12,
                    color: 'var(--eb-purple)',
                    lineHeight: 1.5,
                  }}
                >
                  <span style={{ fontWeight: 600 }}>Conviction rationale · </span>
                  {item.convictionReason}
                </div>
              )}
            </div>

            {/* Key levels */}
            <div style={panel}>
              <PanelH3
                left="Key levels"
                right={
                  <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
                    {keyLevels.length} set
                  </span>
                }
              />
              {editing ? (
                <KeyLevelsEditor
                  levels={draft?.keyLevelsJson ?? []}
                  onChange={(v) => setDraft((d) => (d ? { ...d, keyLevelsJson: v } : d))}
                />
              ) : keyLevels.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                    gap: 8,
                  }}
                >
                  {keyLevels.map((lvl, i) => {
                    const c = levelColors(lvl.type);
                    return (
                      <div
                        key={i}
                        style={{
                          padding: '9px 11px',
                          background: c.bg,
                          borderRadius: 9,
                          border: `1px solid ${c.border}`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9.5,
                            color: c.color,
                            textTransform: 'uppercase',
                            letterSpacing: '.06em',
                            fontWeight: 600,
                            opacity: 0.8,
                            marginBottom: 4,
                          }}
                        >
                          {c.label}
                        </div>
                        <div
                          style={{
                            fontFamily: '"JetBrains Mono",monospace',
                            fontSize: 14,
                            fontWeight: 700,
                            color: c.color,
                          }}
                        >
                          {lvl.price || '—'}
                        </div>
                        {lvl.label && (
                          <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 3 }}>
                            {lvl.label}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                  No key levels set.
                </div>
              )}
            </div>

            {/* Tags */}
            <div style={panel}>
              <PanelH3 left="Tags" />
              {editing ? (
                <TagsInput
                  tags={draft?.tags ?? []}
                  onChange={(v) => setDraft((d) => (d ? { ...d, tags: v } : d))}
                />
              ) : item.tags.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {item.tags.map((tag) => {
                    const tc = tagColor(tag);
                    return (
                      <span
                        key={tag}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          padding: '3px 10px',
                          borderRadius: 99,
                          background: tc.bg,
                          border: `1px solid ${tc.border}`,
                          fontSize: 11.5,
                          color: tc.color,
                        }}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                  No tags added.
                </div>
              )}
            </div>

            {/* Images */}
            <div style={panel}>
              <PanelH3
                left={
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <Image size={12} /> Images
                  </span>
                }
                right={
                  item.images.length > 0 && (
                    <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
                      {item.images.length} image{item.images.length > 1 ? 's' : ''}
                    </span>
                  )
                }
              />
              {editing ? (
                <>
                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    {draft?.images.map((img, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: 'relative',
                          width: 100,
                          height: 100,
                          borderRadius: 8,
                          overflow: 'hidden',
                          border: '1px solid var(--eb-border)',
                        }}
                      >
                        <img
                          src={img}
                          alt={`Upload ${idx + 1}`}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setDraft((d) => ({
                              ...d!,
                              images: d!.images.filter((_, i) => i !== idx),
                            }))
                          }
                          style={{
                            position: 'absolute',
                            top: 4,
                            right: 4,
                            background: 'rgba(0,0,0,.6)',
                            border: 0,
                            borderRadius: '50%',
                            width: 20,
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            cursor: 'pointer',
                            padding: 0,
                          }}
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label
                      htmlFor="image-upload-detail"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 7,
                        border: '1px dashed var(--eb-border)',
                        background: 'var(--eb-panel-2)',
                        color: 'var(--eb-muted)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Image size={13} /> Add image
                    </label>
                    <input
                      id="image-upload-detail"
                      type="file"
                      accept="image/*"
                      multiple
                      style={{ display: 'none' }}
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        for (const file of files) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const dataUrl = ev.target?.result as string;
                            setDraft((d) => ({
                              ...d!,
                              images: [...d!.images, dataUrl],
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                        e.target.value = '';
                      }}
                    />
                    {draft && draft.images.length > 0 && (
                      <span style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>
                        {draft.images.length}/10 images
                      </span>
                    )}
                  </div>
                </>
              ) : item.images.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))',
                    gap: 8,
                  }}
                >
                  {item.images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setLightboxIdx(idx)}
                      style={{
                        position: 'relative',
                        width: '100%',
                        paddingBottom: '100%',
                        borderRadius: 8,
                        overflow: 'hidden',
                        border: '1px solid var(--eb-border)',
                        cursor: 'zoom-in',
                        padding: 0,
                        background: 'none',
                        display: 'block',
                      }}
                    >
                      <img
                        src={img}
                        alt={`Watchlist ${idx + 1}`}
                        style={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                  No images added.
                </div>
              )}
            </div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Playbooks */}
            <div style={panel}>
              <PanelH3 left="Playbooks" />
              {editing ? (
                <PlaybookPicker
                  selected={draftPlaybooks}
                  onChange={(playbooks) =>
                    setDraft((d) => (d ? { ...d, playbookNames: playbooks.map((p) => p.name) } : d))
                  }
                />
              ) : item.playbookNames.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {item.playbookNames.map((name) => {
                    const pc = playbookColor(name);
                    return (
                      <div
                        key={name}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          padding: '7px 10px',
                          borderRadius: 7,
                          background: pc.bg,
                          border: `1px solid ${pc.border}`,
                        }}
                      >
                        <ClipboardList size={12} style={{ color: pc.icon, flexShrink: 0 }} />
                        <span style={{ fontSize: 12.5, color: 'var(--eb-text)' }}>{name}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                  No playbooks linked.
                </div>
              )}
            </div>

            {/* Metadata */}
            <div style={panel}>
              <PanelH3 left="Metadata" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {[
                  {
                    label: 'Added',
                    value: formatRelative(item.createdAt),
                    title: formatAbsolute(item.createdAt),
                    color: 'var(--eb-text)',
                  },
                  {
                    label: 'Last updated',
                    value: formatRelative(item.updatedAt),
                    title: formatAbsolute(item.updatedAt),
                    color: wasEdited ? 'var(--eb-cyan)' : 'var(--eb-text)',
                  },
                  { label: 'Ticker', value: ticker, title: undefined, color: 'var(--eb-text)' },
                  {
                    label: 'Symbol',
                    value: item.symbol,
                    title: undefined,
                    color: 'var(--eb-text)',
                  },
                ].map((row, i, arr) => (
                  <div
                    key={row.label}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '7px 0',
                      borderBottom: i < arr.length - 1 ? '1px solid var(--eb-border)' : 'none',
                    }}
                  >
                    <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>{row.label}</span>
                    <span
                      style={{
                        fontSize: 11.5,
                        fontFamily: '"JetBrains Mono",monospace',
                        color: row.color,
                      }}
                      title={row.title}
                    >
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && item.images[lightboxIdx] && (
        <div
          role="button"
          tabIndex={0}
          aria-label="Close lightbox"
          onClick={() => setLightboxIdx(null)}
          onKeyDown={(e) => e.key === 'Escape' && setLightboxIdx(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,.88)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <img
            src={item.images[lightboxIdx]}
            alt={`Watchlist chart ${lightboxIdx + 1} of ${item.images.length}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: 10,
              objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,.6)',
            }}
          />
          <button
            type="button"
            onClick={() => setLightboxIdx(null)}
            style={{
              position: 'fixed',
              top: 16,
              right: 16,
              background: 'rgba(255,255,255,.1)',
              border: '1px solid rgba(255,255,255,.15)',
              borderRadius: '50%',
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            <X size={16} />
          </button>
          {lightboxIdx > 0 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }}
              style={{
                position: 'fixed',
                left: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.15)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <ChevronLeft size={20} />
            </button>
          )}
          {lightboxIdx < item.images.length - 1 && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }}
              style={{
                position: 'fixed',
                right: 16,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'rgba(255,255,255,.1)',
                border: '1px solid rgba(255,255,255,.15)',
                borderRadius: '50%',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                cursor: 'pointer',
              }}
            >
              <ChevronRight size={20} />
            </button>
          )}
          {item.images.length > 1 && (
            <div
              style={{
                position: 'fixed',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                fontSize: 12,
                color: 'rgba(255,255,255,.5)',
                fontFamily: '"JetBrains Mono",monospace',
              }}
            >
              {lightboxIdx + 1} / {item.images.length}
            </div>
          )}
        </div>
      )}

      {/* Delete dialog */}
      <Dialog
        open={showDeleteDialog}
        onOpenChange={(o) => {
          if (!o) setShowDeleteDialog(false);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Remove {item.symbol}?</DialogTitle>
            <DialogDescription>
              This will permanently remove {item.symbol} from your watchlist. This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <button type="button" onClick={() => setShowDeleteDialog(false)} style={btn}>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleteItem.isPending}
              style={{
                ...btn,
                color: 'var(--eb-red)',
                borderColor: 'rgba(255,91,108,.3)',
                background: 'rgba(255,91,108,.08)',
                fontWeight: 600,
                opacity: deleteItem.isPending ? 0.6 : 1,
              }}
            >
              {deleteItem.isPending ? 'Removing…' : 'Remove'}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
