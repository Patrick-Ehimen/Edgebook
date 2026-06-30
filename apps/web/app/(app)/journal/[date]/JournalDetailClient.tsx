'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/features/journal';
import type { JournalEntry, JournalStats } from '@/features/journal';
import { useAccounts } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import type { Position } from '@/features/positions';
import { api } from '@/lib/api-client';
import { z } from 'zod';
import Link from 'next/link';
import { RiDeleteBin6Line } from 'react-icons/ri';
import {
  ArrowLeft,
  Compass,
  Zap,
  Moon,
  Star,
  Lock,
  Unlock,
  TrendingUp,
  TrendingDown,
  Activity,
  Globe,
  Plus,
  Eye,
  X,
  ChevronRight,
  Trash2,
  BookOpen,
  Check,
  Save,
  Radio,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useLogTrade } from '@/providers/log-trade-provider';
import { SessionMap } from '@/components/SessionMap';
import { JournalContextPanel } from '../JournalContextPanel';
import {
  MOOD_TAGS,
  getMoodTag,
  getPlaybookColor,
  getTagColor,
  TRADING_SESSIONS,
  tokenBaseLabel,
  type TradingSession,
} from '../journal-constants';

// ─── helpers ──────────────────────────────────────────────────────────────────

function getActiveSession() {
  const hour = new Date().getUTCHours();
  if (hour >= 0 && hour < 8)
    return { label: 'Asia session', color: 'var(--eb-purple)', rgb: '139,92,246' };
  if (hour >= 8 && hour < 16)
    return { label: 'EU session', color: 'var(--eb-cyan)', rgb: '6,182,212' };
  return { label: 'US session', color: 'var(--eb-yellow)', rgb: '245,165,36' };
}

function getBiasColors(bias: string | null | undefined) {
  if (bias === 'LONG')
    return {
      bg: 'linear-gradient(135deg,rgba(0,214,143,.10),rgba(6,182,212,.04) 50%, rgba(139,92,246,.06))',
      accent: 'var(--green)',
      rgb: '0,214,143',
      Icon: TrendingUp,
    };
  if (bias === 'SHORT')
    return {
      bg: 'linear-gradient(135deg,rgba(239,68,68,.10),rgba(139,92,246,.04) 50%, rgba(6,182,212,.06))',
      accent: '#ef4444',
      rgb: '239,68,68',
      Icon: TrendingDown,
    };
  return {
    bg: 'linear-gradient(135deg,rgba(122,131,149,.10),rgba(122,131,149,.04) 50%, rgba(122,131,149,.06))',
    accent: 'var(--eb-muted)',
    rgb: '122,131,149',
    Icon: Activity,
  };
}

function fmtHeading(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function isToday(dateStr: string) {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

// ─── atoms ────────────────────────────────────────────────────────────────────

function SectionHeader({
  icon,
  title,
  description,
  chip,
  large,
}: {
  icon: React.ReactNode;
  title: string;
  description?: string;
  chip?: React.ReactNode;
  large?: boolean;
}) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: description ? 4 : 0 }}
      >
        <span style={{ color: 'var(--green)' }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: large ? 18 : 14, color: 'var(--eb-text)' }}>
          {title}
        </span>
        {chip && <span style={{ marginLeft: 'auto' }}>{chip}</span>}
      </div>
      {description && (
        <div style={{ fontSize: 13, color: 'var(--eb-muted-2)', lineHeight: 1.4 }}>
          {description}
        </div>
      )}
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
        padding: '2px 9px',
        borderRadius: 99,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        color: 'var(--eb-muted-2)',
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: '18px 20px',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        color: 'var(--eb-muted)',
        textTransform: 'uppercase' as const,
        letterSpacing: '.06em',
        fontWeight: 600,
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  );
}

function ReadonlyTextarea({
  value,
  placeholder,
}: { value: string | null | undefined; placeholder: string }) {
  if (!value)
    return (
      <span style={{ color: 'var(--eb-muted)', fontSize: 12.5, fontStyle: 'italic' }}>
        {placeholder}
      </span>
    );
  return (
    <div
      style={{ fontSize: 13, color: 'var(--eb-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}
    >
      {value}
    </div>
  );
}

function ScoreBadge({
  value,
  max = 10,
  label,
}: { value: number | null | undefined; max?: number; label: string }) {
  const pct = value != null ? (value / max) * 100 : 0;
  const color =
    pct >= 80
      ? 'var(--green)'
      : pct >= 50
        ? 'var(--eb-yellow)'
        : pct > 0
          ? 'var(--eb-red)'
          : 'var(--eb-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span
          style={{
            fontSize: 26,
            fontWeight: 700,
            fontFamily: 'var(--font-mono, monospace)',
            color,
          }}
        >
          {value != null ? value : '—'}
        </span>
        {value != null && <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>/ {max}</span>}
      </div>
      <div
        style={{ height: 4, borderRadius: 99, background: 'var(--eb-border)', overflow: 'hidden' }}
      >
        <div
          style={{
            height: '100%',
            borderRadius: 99,
            background: color,
            width: `${pct}%`,
            transition: 'width .3s',
          }}
        />
      </div>
    </div>
  );
}

// ─── Tag input component ────────────────────────────────────────────────────────

function TagInput({
  tags,
  onAdd,
  onRemove,
  placeholder,
}: {
  tags: string[];
  onAdd: (tag: string) => void;
  onRemove: (tag: string) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');

  const commit = () => {
    const t = input.trim();
    if (t && !tags.includes(t)) {
      onAdd(t);
    }
    setInput('');
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: 6,
        padding: 6,
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        background: 'var(--eb-panel-2)',
        minHeight: 36,
        alignItems: 'center',
      }}
    >
      {tags.map((tag) => {
        const tc = getTagColor(tag);
        return (
        <span
          key={tag}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            padding: '3px 9px',
            borderRadius: 99,
            border: `1px solid ${tc.border}`,
            background: tc.bg,
            color: tc.color,
          }}
        >
          {tag}
          <span
            onClick={() => onRemove(tag)}
            style={{
              color: 'var(--eb-muted)',
              cursor: 'pointer',
              fontSize: 13,
              lineHeight: 1,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--eb-red)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--eb-muted)')}
          >
            ×
          </span>
        </span>
      );
    })}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            commit();
          }
        }}
        onBlur={commit}
        placeholder={placeholder ?? 'Type to add tag…'}
        style={{
          flex: 1,
          minWidth: 120,
          background: 'transparent',
          border: 0,
          color: 'var(--eb-text)',
          outline: 'none',
          fontSize: 12.5,
          fontFamily: 'inherit',
        }}
      />
    </div>
  );
}

// ─── Editable EOD section ─────────────────────────────────────────────────────

function SliderField({
  label,
  value,
  set,
  min = 0,
  max = 10,
  display,
}: {
  label: string;
  value: number;
  set: (v: number) => void;
  min?: number;
  max?: number;
  display?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flex: '0 0 100px', fontSize: 12, color: 'var(--eb-muted)' }}>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => set(Number(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--green)', height: 4 }}
      />
      <span
        style={{
          flex: '0 0 50px',
          textAlign: 'right',
          fontSize: 12.5,
          fontFamily: 'monospace',
          fontWeight: 500,
        }}
      >
        {display ?? value}
      </span>
    </div>
  );
}

function TextareaField({
  label,
  value,
  set,
  placeholder,
  minHeight = 72,
}: {
  label: string;
  value: string;
  set: (v: string) => void;
  placeholder?: string;
  minHeight?: number;
}) {
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <textarea
        value={value}
        onChange={(e) => set(e.target.value)}
        placeholder={placeholder}
        style={{
          width: '100%',
          minHeight,
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 8,
          padding: '8px 11px',
          color: 'var(--eb-text)',
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
          resize: 'vertical',
          boxSizing: 'border-box',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--green)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--eb-border)';
        }}
      />
    </div>
  );
}

function EodEditor({
  entry,
  dateStr,
  locked,
}: { entry: JournalEntry; dateStr: string; locked: boolean }) {
  const qc = useQueryClient();
  const [planAdherence, setPlanAdherence] = useState(entry.planAdherence ?? 50);
  const [processScore, setProcessScore] = useState(entry.processScore ?? 5);
  const [outcomeScore, setOutcomeScore] = useState(entry.outcomeScore ?? 5);
  const [wentRight, setWentRight] = useState(entry.wentRightMd ?? '');
  const [wentWrong, setWentWrong] = useState(entry.wentWrongMd ?? '');
  const [lesson, setLesson] = useState(entry.lesson ?? '');
  const [tomorrowMd, setTomorrowMd] = useState(entry.tomorrowMd ?? '');
  const [tags, setTags] = useState<string[]>(() => {
    if (!entry.tagsJson) return [];
    if (Array.isArray(entry.tagsJson)) return entry.tagsJson as string[];
    return [];
  });


  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      journalApi.upsertEntry(dateStr, {
        planAdherence,
        processScore,
        outcomeScore,
        wentRightMd: wentRight,
        wentWrongMd: wentWrong,
        lesson,
        tomorrowMd,
        tagsJson: tags.length > 0 ? tags : null,
        finalizedAt: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      toast.success('EOD review saved and finalized');
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        opacity: locked ? 0.6 : 1,
        pointerEvents: locked ? 'none' : 'auto',
      }}
    >
      {/* Score badges */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <ScoreBadge value={planAdherence} max={100} label="Plan adherence" />
        <ScoreBadge value={processScore} max={10} label="Process score" />
        <ScoreBadge value={outcomeScore} max={10} label="Outcome score" />
      </div>

      {/* Score sliders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
        <SliderField
          label="Did I follow my plan?"
          value={planAdherence}
          set={setPlanAdherence}
          min={0}
          max={100}
          display={`${planAdherence}%`}
        />
        <SliderField label="Process score" value={processScore} set={setProcessScore} />
        <SliderField label="Outcome score" value={outcomeScore} set={setOutcomeScore} />
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: 0 }} />

      {/* What went right / wrong */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <TextareaField
          label="What went right"
          value={wentRight}
          set={setWentRight}
          placeholder="Two or three bullet points — what should I repeat?"
          minHeight={80}
        />
        <TextareaField
          label="What went wrong"
          value={wentWrong}
          set={setWentWrong}
          placeholder="Be specific. Process problems, not outcomes."
          minHeight={80}
        />
      </div>

      {/* Lesson */}
      <div>
        <FieldLabel>Lesson · one sentence</FieldLabel>
        <input
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="The one thing future-you will read tomorrow before market open."
          style={{
            width: '100%',
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 8,
            padding: '9px 11px',
            color: 'var(--eb-text)',
            fontSize: 13,
            fontFamily: 'inherit',
            outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = 'var(--green)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = 'var(--eb-border)';
          }}
        />
      </div>

      {/* Tomorrow's prep */}
      <TextareaField
        label="Tomorrow's prep"
        value={tomorrowMd}
        set={setTomorrowMd}
        placeholder="Levels to mark, news to check, no-trade windows."
        minHeight={60}
      />

      {/* Tags */}
      <div>
        <FieldLabel>Tags &amp; tomorrow's flags</FieldLabel>
        <TagInput
          tags={tags}
          onAdd={(t) => setTags([...tags, t])}
          onRemove={(t) => setTags(tags.filter((x) => x !== t))}
          placeholder="Type to add tag…"
        />
      </div>

      {/* Save */}
      {!locked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 16px',
              borderRadius: 7,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? 'Saving…' : <><Save size={14} /> Save EOD review</>}
          </button>
        </div>
      )}
    </div>
  );
}

function getTradingDayInfo(dateStr: string) {
  const target = new Date(`${dateStr}T00:00:00`);
  const year = target.getFullYear();
  const month = target.getMonth();

  const isWeekday = (d: Date) => {
    const day = d.getDay();
    return day !== 0 && day !== 6;
  };

  let totalWeekdays = 0;
  let currentDayIndex = 0;

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    if (isWeekday(date)) {
      totalWeekdays++;
      if (d <= target.getDate()) {
        currentDayIndex++;
      }
    }
  }

  return { current: currentDayIndex, total: totalWeekdays };
}

// ─── atoms ────────────────────────────────────────────────────────────────────

function Badge({
  children,
  color,
  rgb,
  Icon,
}: { children: React.ReactNode; color: string; rgb: string; Icon?: any }) {
  return (
    <span
      className="chip"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: 11.5,
        padding: '2px 9px',
        borderRadius: 99,
        border: `1px solid rgba(${rgb},.30)`,
        background: `rgba(${rgb},.08)`,
        color: color,
      }}
    >
      {Icon && <Icon size={12} />}
      {children}
    </span>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero({
  entry,
  dateStr,
  isToday: today,
  stats,
}: { entry: JournalEntry; dateStr: string; isToday: boolean; stats?: any }) {
  const session = getActiveSession();
  const bias = getBiasColors(entry.bias);
  const Icon = bias.Icon;
  const dayName = new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const tradingDay = getTradingDayInfo(dateStr);
  const streak = stats?.streak ?? 0;

  return (
    <section
      style={{
        background: bias.bg,
        border: '1px solid var(--eb-border)',
        borderRadius: 14,
        padding: '20px 22px',
        marginBottom: 14,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 14,
          position: 'relative',
          zIndex: 2,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: '-.015em',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              color: 'var(--eb-text)',
            }}
          >
            <span style={{ fontSize: 30, lineHeight: 1 }}>
              <Icon size={28} style={{ color: bias.accent }} />
            </span>
            Day-wide context · {dayName}
          </h1>
          <div style={{ fontSize: 12, color: 'var(--eb-muted-2)', marginTop: 4 }}>
            {session.label} · trading day{' '}
            <b>
              {tradingDay.current} of {tradingDay.total}
            </b>{' '}
            this month · journal streak <b>{streak} days</b> · trading day starts <b>00:00 UTC</b>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginLeft: 'auto' }}>
          <Badge color={session.color} rgb={session.rgb}>
            <span
              className="pulse-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: session.color,
                animation: 'pulse 1.6s infinite',
                boxShadow: `0 0 0 3px rgba(${session.rgb},.18)`,
                display: 'inline-block',
              }}
            ></span>
            {session.label}
          </Badge>
          <Badge color="var(--green)" rgb="0,214,143">
            4 rules armed
          </Badge>
          {entry.lockedAt && (
            <Badge color="var(--eb-yellow)" rgb="245,165,36" Icon={Lock}>
              Intent locked
            </Badge>
          )}
        </div>
      </div>

      <div
        style={{
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
          padding: '14px 16px',
          position: 'relative',
          zIndex: 2,
        }}
      >
        <div
          style={{
            fontSize: 10,
            color: 'var(--eb-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.08em',
            fontWeight: 600,
            marginBottom: 6,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <Globe size={12} /> Today&apos;s mission · intent & thesis
        </div>
        <div style={{ fontSize: 14.5, lineHeight: 1.55, color: 'var(--eb-text)' }}>
          {entry.intentMd || (
            <span style={{ color: 'var(--eb-muted)', fontStyle: 'italic' }}>
              No mission recorded for today yet. Log your pre-market intent to set focus.
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Pre-market Intent Components ───────────────────────────────────────────

const SLOT_COLORS = [
  {
    bg: 'linear-gradient(180deg,#00d68f,#00b67a)',
    text: '#06140f',
    chip: 'rgba(0,214,143,.14)',
    chipText: 'var(--green)',
    chipBorder: 'rgba(0,214,143,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#60a5fa,#3b82f6)',
    text: '#fff',
    chip: 'rgba(96,165,250,.14)',
    chipText: '#60a5fa',
    chipBorder: 'rgba(96,165,250,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#a78bfa,#7c3aed)',
    text: '#fff',
    chip: 'rgba(167,139,250,.14)',
    chipText: '#a78bfa',
    chipBorder: 'rgba(167,139,250,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#f5a524,#d97706)',
    text: '#fff',
    chip: 'rgba(245,165,36,.14)',
    chipText: 'var(--eb-yellow)',
    chipBorder: 'rgba(245,165,36,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#ef4444,#b91c1c)',
    text: '#fff',
    chip: 'rgba(239,68,68,.14)',
    chipText: '#ef4444',
    chipBorder: 'rgba(239,68,68,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#06b6d4,#0891b2)',
    text: '#fff',
    chip: 'rgba(6,182,212,.14)',
    chipText: 'var(--eb-cyan)',
    chipBorder: 'rgba(6,182,212,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#fb923c,#ea580c)',
    text: '#fff',
    chip: 'rgba(251,146,60,.14)',
    chipText: '#fb923c',
    chipBorder: 'rgba(251,146,60,.30)',
  },
  {
    bg: 'linear-gradient(180deg,#34d399,#059669)',
    text: '#06140f',
    chip: 'rgba(52,211,153,.14)',
    chipText: '#34d399',
    chipBorder: 'rgba(52,211,153,.30)',
  },
];

function RiskAllocationBar({
  riskCap,
  maxTrades,
  plans,
  dayPositions,
}: {
  riskCap: number | null;
  maxTrades: number | null;
  plans: TokenPlan[] | undefined;
  dayPositions: DayPosition[] | undefined;
}) {
  const cap = riskCap ?? 0;
  const usedPlans = (plans ?? []).filter((p) => p.symbol);
  const trades = dayPositions ?? [];

  interface SlotItem {
    id: string;
    symbol: string;
    riskPct: string | null;
    type: 'plan' | 'trade' | 'remaining';
  }
  const slotsList: SlotItem[] = [];

  const plannedSymbols = new Set(usedPlans.map((p) => p.symbol.toUpperCase()));

  for (const p of usedPlans) {
    const traded = trades.some((t) => t.symbol.toUpperCase() === p.symbol.toUpperCase());
    slotsList.push({ id: p.id, symbol: p.symbol, riskPct: p.riskPct || null, type: traded ? 'trade' : 'plan' });
  }

  const unplannedTrades = trades.filter((t) => !plannedSymbols.has(t.symbol.toUpperCase()));

  const maxSlots = Math.max(1, maxTrades ?? 1);
  const usedCount = slotsList.length;
  const remainingCount = Math.max(0, maxSlots - usedCount);

  const usedRisk = usedPlans.reduce((sum, p) => sum + (Number(p.riskPct) || 0), 0);
  const remainingRisk = Math.max(0, cap - usedRisk);
  const perRemaining = remainingCount > 0 ? +(remainingRisk / remainingCount).toFixed(2) : 0;

  for (let i = 0; i < remainingCount; i++) {
    slotsList.push({
      id: `remaining-${i}`,
      symbol: 'Remaining',
      riskPct: `${perRemaining}`,
      type: 'remaining',
    });
  }

  const totalSlots = slotsList.length;
  const pct = cap > 0 ? 100 / totalSlots : 0;

  if (totalSlots === 0) return null;

  return (
    <div
      style={{
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: '14px 18px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 2 }}>
            Risk allocation across trades
          </div>
          <div style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
            <b style={{ color: 'var(--eb-text)' }}>{cap}%</b> cap ·{' '}
            <b style={{ color: 'var(--eb-text)' }}>{usedCount}</b> of{' '}
            <b style={{ color: 'var(--eb-text)' }}>{maxSlots}</b> trade{maxSlots !== 1 ? 's' : ''}{' '}
            used
          </div>
        </div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {slotsList.map((slot, i) => {
            const c = SLOT_COLORS[i % SLOT_COLORS.length]!;
            return (
              <Chip
                key={slot.id}
                style={{
                  background: c.chip,
                  color: c.chipText,
                  borderColor: c.chipBorder,
                  fontFamily: 'var(--font-mono, monospace)',
                  ...(slot.type === 'remaining' ? { fontStyle: 'italic' as const } : {}),
                }}
              >
                {slot.type === 'remaining'
                  ? `${slot.symbol} · ${slot.riskPct}%`
                  : `${slot.symbol} · ${slot.riskPct || '—'}%${slot.type === 'trade' ? ' ✓' : ''}`}
              </Chip>
            );
          })}
        </div>
      </div>

      {/* Bar */}
      <div
        style={{
          height: 28,
          borderRadius: 8,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          overflow: 'hidden',
          display: 'flex',
        }}
      >
        {slotsList.map((slot, i) => {
          const c = SLOT_COLORS[i % SLOT_COLORS.length]!;
          const label = slot.type === 'remaining' ? `${slot.riskPct}%` : slot.symbol;
          return (
            <div
              key={slot.id}
              style={{
                width: `${pct}%`,
                height: '100%',
                background: c.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 600,
                color: c.text,
                fontFamily: 'var(--font-mono, monospace)',
                borderRight: i < totalSlots - 1 ? '2px solid var(--eb-bg)' : undefined,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              {pct > 8 ? label : ''}
            </div>
          );
        })}
      </div>

      {unplannedTrades.length > 0 && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 12px',
            borderRadius: 8,
            background: 'rgba(245,165,36,.07)',
            border: '1px solid rgba(245,165,36,.22)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <AlertTriangle size={12} style={{ color: 'var(--eb-yellow)', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: 'var(--eb-yellow)', fontWeight: 600, flexShrink: 0 }}>
            Unplanned trades
          </span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted-2)' }}>
            The following symbols were not in your risk plan:
          </span>
          <span style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
            {unplannedTrades.map((t) => (
              <span
                key={t.id}
                style={{
                  fontSize: 10.5,
                  padding: '1px 7px',
                  borderRadius: 99,
                  background: 'rgba(245,165,36,.14)',
                  color: 'var(--eb-yellow)',
                  border: '1px solid rgba(245,165,36,.30)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                }}
              >
                {t.symbol}
              </span>
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Watch for the Day ───────────────────────────────────────────────────────

// Known token brand gradients + deterministic fallback palette
const KNOWN_TOKEN_COLORS: Record<string, { grad: string; text: string }> = {
  ETH: { grad: 'linear-gradient(135deg,#627eea,#454a75)', text: '#fff' },
  BTC: { grad: 'linear-gradient(135deg,#f7931a,#ffc371)', text: '#fff' },
  SOL: { grad: 'linear-gradient(135deg,#9945ff,#14f195)', text: '#fff' },
  HYPE: { grad: 'linear-gradient(135deg,#00d68f,#06b6d4)', text: '#06140f' },
  BNB: { grad: 'linear-gradient(135deg,#f3ba2f,#cd9c00)', text: '#06140f' },
  XRP: { grad: 'linear-gradient(135deg,#0099ff,#005599)', text: '#fff' },
  ARB: { grad: 'linear-gradient(135deg,#28a0f0,#0070d4)', text: '#fff' },
  OP: { grad: 'linear-gradient(135deg,#ff0420,#c50000)', text: '#fff' },
  DOGE: { grad: 'linear-gradient(135deg,#ba9f33,#888)', text: '#1a1a1a' },
  TON: { grad: 'linear-gradient(135deg,#0098ea,#00667a)', text: '#fff' },
  AVAX: { grad: 'linear-gradient(135deg,#e84142,#9b1e1e)', text: '#fff' },
  SUI: { grad: 'linear-gradient(135deg,#4da2ff,#0066cc)', text: '#fff' },
  APT: { grad: 'linear-gradient(135deg,#00c2a8,#006d5e)', text: '#fff' },
  LINK: { grad: 'linear-gradient(135deg,#375bd2,#1a3a8f)', text: '#fff' },
};

const FALLBACK_GRADS = [
  { grad: 'linear-gradient(135deg,#00d68f,#00b67a)', text: '#06140f' },
  { grad: 'linear-gradient(135deg,#60a5fa,#3b82f6)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#a78bfa,#7c3aed)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#f5a524,#d97706)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#ef4444,#b91c1c)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#06b6d4,#0891b2)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#fb923c,#ea580c)', text: '#fff' },
  { grad: 'linear-gradient(135deg,#34d399,#059669)', text: '#06140f' },
];

function tokenAvatar(symbol: string): { grad: string; text: string } {
  // Strip common quote suffixes to get base token
  const base = symbol.replace(/USDT$|USDC$|BUSD$|USD$|PERP$/, '');
  if (KNOWN_TOKEN_COLORS[base]) return KNOWN_TOKEN_COLORS[base]!;
  const sum = symbol.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return FALLBACK_GRADS[sum % FALLBACK_GRADS.length]!;
}

function WatchlistEditor({
  entry,
  dateStr,
  locked,
}: { entry: JournalEntry; dateStr: string; locked: boolean }) {
  const qc = useQueryClient();
  const [tokens, setTokens] = useState<string[]>(
    Array.isArray((entry as any).watchlistJson) ? ((entry as any).watchlistJson as string[]) : [],
  );
  const [input, setInput] = useState('');
  const inputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    const raw = (entry as any).watchlistJson;
    setTokens(Array.isArray(raw) ? (raw as string[]) : []);
  }, [(entry as any).watchlistJson]);

  const { mutate } = useMutation({
    mutationFn: (next: string[]) => journalApi.upsertEntry(dateStr, { watchlistJson: next } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
    },
    onError: () => toast.error('Failed to save watchlist'),
  });

  const add = () => {
    const val = input.trim().toUpperCase();
    if (!val || tokens.includes(val)) {
      setInput('');
      return;
    }
    const next = [...tokens, val];
    setTokens(next);
    mutate(next);
    setInput('');
  };

  const remove = (t: string) => {
    const next = tokens.filter((x) => x !== t);
    setTokens(next);
    mutate(next);
  };

  return (
    <Panel style={{ opacity: locked ? 0.6 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ color: 'var(--eb-cyan)' }}>
          <Eye size={16} />
        </span>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--eb-text)' }}>
          WatchList for the Day
        </span>
        <Chip
          style={{
            fontSize: 10.5,
            color: 'var(--eb-cyan)',
            borderColor: 'rgba(6,182,212,.30)',
            background: 'rgba(6,182,212,.08)',
          }}
        >
          NO PLAN BUT ON RADAR
        </Chip>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--eb-muted)' }}>
          {tokens.length} token{tokens.length !== 1 ? 's' : ''} watching
        </span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, minHeight: 34 }}>
        {tokens.length === 0 && (
          <span
            style={{
              fontSize: 12,
              color: 'var(--eb-muted)',
              fontStyle: 'italic',
              alignSelf: 'center',
            }}
          >
            No tokens on radar yet — add one below.
          </span>
        )}
        {tokens.map((t) => {
          const av = tokenAvatar(t);
          return (
            <div
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '4px 8px 4px 4px',
                borderRadius: 8,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--eb-text)',
              }}
            >
              {/* Avatar */}
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  flexShrink: 0,
                  background: av.grad,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 11,
                  fontWeight: 700,
                  color: av.text,
                  fontFamily: 'inherit',
                }}
              >
                {t[0]}
              </div>
              {t}
              {!locked && (
                <button
                  type="button"
                  onClick={() => remove(t)}
                  style={{
                    background: 'transparent',
                    border: 0,
                    padding: '0 2px',
                    cursor: 'pointer',
                    color: 'var(--eb-muted)',
                    lineHeight: 1,
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title={`Remove ${t}`}
                >
                  <X size={11} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Add input */}
      {!locked && (
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 8,
              padding: '6px 10px',
            }}
          >
            <Plus size={12} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add();
              }}
              placeholder="Add token, e.g. ETHUSDT"
              style={{
                flex: 1,
                background: 'transparent',
                border: 0,
                outline: 'none',
                color: 'var(--eb-text)',
                fontSize: 12.5,
                fontFamily: 'var(--font-mono, monospace)',
                textTransform: 'uppercase',
              }}
            />
          </div>
          <button
            type="button"
            onClick={add}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              cursor: 'pointer',
              border: '1px solid rgba(6,182,212,.40)',
              background: 'rgba(6,182,212,.08)',
              color: 'var(--eb-cyan)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            Add
          </button>
        </div>
      )}
    </Panel>
  );
}

// ─── Token plan types ─────────────────────────────────────────────────────────

interface KeyLevel {
  id: string;
  price: string;
  label: string;
}

interface TokenPlan {
  id: string;
  symbol: string;
  bias: 'LONG' | 'NEUTRAL' | 'SHORT';
  conviction: number;
  riskPct: string;
  maxTrades: string;
  thesis: string;
  entryTrigger: string;
  invalidation: string;
  playbooks: string[];
  allowedSessions: TradingSession[];
  notes: string;
  levels: KeyLevel[];
}

interface DayPosition {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  status: 'open' | 'closed';
  openedAt: string;
  netPnl: string | null;
  rPlanned: string | null;
  rRealized: string | null;
  playbookId: string | null;
}

function playbookColorKey(name: string, playbooks: { id: string; name: string }[]) {
  return playbooks.find((p) => p.name === name)?.id ?? name;
}

function normalizePlan(raw: Record<string, unknown>): TokenPlan {
  const playbooks = Array.isArray(raw.playbooks)
    ? (raw.playbooks as string[]).filter(Boolean)
    : typeof raw.playbook === 'string' && raw.playbook
      ? [raw.playbook]
      : [];

  return {
    id: typeof raw.id === 'string' ? raw.id : crypto.randomUUID(),
    symbol: typeof raw.symbol === 'string' ? raw.symbol : '',
    bias:
      raw.bias === 'LONG' || raw.bias === 'SHORT' || raw.bias === 'NEUTRAL' ? raw.bias : 'NEUTRAL',
    conviction: typeof raw.conviction === 'number' ? raw.conviction : 3,
    riskPct: typeof raw.riskPct === 'string' ? raw.riskPct : '',
    maxTrades: typeof raw.maxTrades === 'string' ? raw.maxTrades : '1',
    thesis: typeof raw.thesis === 'string' ? raw.thesis : '',
    entryTrigger: typeof raw.entryTrigger === 'string' ? raw.entryTrigger : '',
    invalidation: typeof raw.invalidation === 'string' ? raw.invalidation : '',
    playbooks,
    allowedSessions: Array.isArray(raw.allowedSessions)
      ? (raw.allowedSessions as string[]).filter(
          (s): s is TradingSession => s === 'EU' || s === 'US' || s === 'Asia',
        )
      : [],
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    levels: Array.isArray(raw.levels) ? (raw.levels as KeyLevel[]) : [],
  };
}

function parsePlans(raw: unknown): TokenPlan[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null && 'symbol' in item,
    )
    .map(normalizePlan);
}

const LEVEL_PALETTE = [
  { color: '#60a5fa', border: 'rgba(96,165,250,.35)' },
  { color: '#34d399', border: 'rgba(52,211,153,.35)' },
  { color: '#a78bfa', border: 'rgba(167,139,250,.35)' },
  { color: '#fbbf24', border: 'rgba(251,191,36,.35)' },
  { color: '#f87171', border: 'rgba(248,113,113,.35)' },
  { color: '#06b6d4', border: 'rgba(6,182,212,.35)' },
  { color: '#fb923c', border: 'rgba(251,146,60,.35)' },
  { color: '#00d68f', border: 'rgba(0,214,143,.35)' },
];

function levelColor(idx: number) {
  return LEVEL_PALETTE[idx % LEVEL_PALETTE.length]!;
}

function emptyPlan(): TokenPlan {
  return {
    id: crypto.randomUUID(),
    symbol: '',
    bias: 'NEUTRAL',
    conviction: 3,
    riskPct: '',
    maxTrades: '1',
    thesis: '',
    entryTrigger: '',
    invalidation: '',
    playbooks: [],
    allowedSessions: [],
    notes: '',
    levels: [],
  };
}

function TokenCard({
  plan,
  playbooks,
  onUpdate,
  onRemove,
  defaultOpen = false,
}: {
  plan: TokenPlan;
  playbooks: { id: string; name: string }[];
  onUpdate: (p: TokenPlan) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const [draft, setDraft] = useState<TokenPlan>(plan);
  const [newLevel, setNewLevel] = useState('');
  const [newLevelLabel, setNewLevelLabel] = useState('');
  const [customPlaybook, setCustomPlaybook] = useState('');

  useEffect(() => {
    setDraft(plan);
  }, [plan]);

  const biasColor =
    draft.bias === 'LONG' ? 'var(--green)' : draft.bias === 'SHORT' ? '#ef4444' : 'var(--eb-muted)';
  const borderLeft =
    draft.bias === 'LONG'
      ? '3px solid var(--green)'
      : draft.bias === 'SHORT'
        ? '3px solid #ef4444'
        : '3px solid var(--eb-border)';
  const av = tokenAvatar(draft.symbol || '?');

  const togglePlaybook = (name: string) => {
    const next = draft.playbooks.includes(name)
      ? draft.playbooks.filter((x) => x !== name)
      : [...draft.playbooks, name];
    patch({ playbooks: next });
  };

  const addCustomPlaybook = () => {
    const val = customPlaybook.trim();
    if (!val || draft.playbooks.includes(val)) {
      setCustomPlaybook('');
      return;
    }
    patch({ playbooks: [...draft.playbooks, val] });
    setCustomPlaybook('');
  };

  const toggleSession = (session: TradingSession) => {
    const next = draft.allowedSessions.includes(session)
      ? draft.allowedSessions.filter((x) => x !== session)
      : [...draft.allowedSessions, session];
    patch({ allowedSessions: next });
  };

  const patch = (fields: Partial<TokenPlan>) => {
    const next = { ...draft, ...fields };
    setDraft(next);
    onUpdate(next);
  };

  const addLevel = () => {
    const price = newLevel.trim();
    if (!price) return;
    patch({
      levels: [...draft.levels, { id: crypto.randomUUID(), price, label: newLevelLabel.trim() }],
    });
    setNewLevel('');
    setNewLevelLabel('');
  };

  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        marginBottom: 10,
        overflow: 'hidden',
        borderLeft,
      }}
    >
      {/* Header */}
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          cursor: 'pointer',
          background: 'linear-gradient(180deg,rgba(255,255,255,.015),transparent)',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            background: av.grad,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: av.text,
            flexShrink: 0,
          }}
        >
          {(draft.symbol || '?')[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontWeight: 600,
                fontSize: 13,
                fontFamily: 'var(--font-mono, monospace)',
                color: 'var(--eb-text)',
              }}
            >
              {draft.symbol || '—'}
            </span>
            <Chip
              style={{
                color: biasColor,
                borderColor: biasColor + '40',
                background: biasColor + '10',
                fontSize: 10.5,
              }}
            >
              {draft.bias}
            </Chip>
            {draft.playbooks.map((name) => {
              const style = getPlaybookColor(playbookColorKey(name, playbooks));
              return (
                <Chip
                  key={name}
                  style={{
                    fontSize: 10.5,
                    color: style.text,
                    background: style.bg,
                    borderColor: style.border,
                  }}
                >
                  <BookOpen size={9} /> {name}
                </Chip>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 3 }}>
            <span style={{ display: 'flex', gap: 2 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Star
                  key={n}
                  size={9}
                  fill={n <= draft.conviction ? '#fbbf24' : 'none'}
                  color={n <= draft.conviction ? '#fbbf24' : 'var(--eb-border)'}
                />
              ))}
            </span>
            {draft.riskPct && (
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--eb-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                }}
              >
                Risk {draft.riskPct}%
              </span>
            )}
            {draft.maxTrades && (
              <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
                Max {draft.maxTrades} trades
              </span>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          style={{
            background: 'transparent',
            border: 0,
            color: '#ef4444',
            cursor: 'pointer',
            padding: 4,
            display: 'flex',
            opacity: 0.7,
          }}
        >
          <Trash2 size={13} />
        </button>
        <ChevronRight
          size={15}
          style={{
            color: 'var(--eb-muted)',
            transition: 'transform .12s',
            transform: open ? 'rotate(90deg)' : 'none',
            flexShrink: 0,
          }}
        />
      </div>

      {open && (
        <div style={{ padding: '0 16px 16px' }}>
          <hr style={{ border: 0, borderTop: '1px dashed var(--eb-border)', margin: '0 0 14px' }} />

          {/* Row 1: Symbol + Bias + Conviction + Risk + Max trades */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5,1fr)',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <FieldLabel>Symbol</FieldLabel>
              <input
                value={draft.symbol}
                onChange={(e) => patch({ symbol: e.target.value.toUpperCase() })}
                placeholder="ETHUSDT"
                style={{
                  width: '100%',
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 7,
                  padding: '5px 9px',
                  color: 'var(--eb-text)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <FieldLabel>Bias</FieldLabel>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--eb-panel)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 7,
                  padding: 2,
                  gap: 1,
                }}
              >
                {(['LONG', 'NEUTRAL', 'SHORT'] as const).map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => patch({ bias: b })}
                    style={{
                      background:
                        draft.bias === b
                          ? b === 'LONG'
                            ? 'rgba(0,214,143,.16)'
                            : b === 'SHORT'
                              ? 'rgba(239,68,68,.16)'
                              : 'var(--eb-panel-2)'
                          : 'transparent',
                      border: 0,
                      color:
                        draft.bias === b
                          ? b === 'LONG'
                            ? 'var(--green)'
                            : b === 'SHORT'
                              ? '#ef4444'
                              : 'var(--eb-text)'
                          : 'var(--eb-muted)',
                      padding: '4px 6px',
                      borderRadius: 5,
                      fontSize: 10,
                      fontWeight: 500,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b === 'NEUTRAL' ? 'NEU' : b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Conviction</FieldLabel>
              <div style={{ display: 'flex', gap: 2, paddingTop: 4 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => patch({ conviction: n })}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    <Star
                      size={16}
                      fill={n <= draft.conviction ? '#fbbf24' : 'none'}
                      color={n <= draft.conviction ? '#fbbf24' : 'var(--eb-border)'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <FieldLabel>Risk %</FieldLabel>
              <input
                value={draft.riskPct}
                onChange={(e) => patch({ riskPct: e.target.value })}
                placeholder="0.5"
                style={{
                  width: '100%',
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 7,
                  padding: '5px 9px',
                  color: 'var(--eb-text)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
            <div>
              <FieldLabel>Max trades</FieldLabel>
              <input
                value={draft.maxTrades}
                onChange={(e) => patch({ maxTrades: e.target.value })}
                placeholder="2"
                style={{
                  width: '100%',
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 7,
                  padding: '5px 9px',
                  color: 'var(--eb-text)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 12.5,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Thesis */}
          <div style={{ marginBottom: 10 }}>
            <FieldLabel>Thesis</FieldLabel>
            <textarea
              value={draft.thesis}
              onChange={(e) => patch({ thesis: e.target.value })}
              placeholder="What's your read on this token today?"
              rows={4}
              style={{
                width: '100%',
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 8,
                padding: '7px 10px',
                color: 'var(--eb-text)',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--green)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--eb-border)';
              }}
            />
          </div>

          {/* Entry trigger + Invalidation */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}
          >
            {[
              {
                label: 'Entry trigger',
                val: draft.entryTrigger,
                set: (v: string) => patch({ entryTrigger: v }),
                ph: 'Sweep of level + close above…',
              },
              {
                label: 'Invalidation',
                val: draft.invalidation,
                set: (v: string) => patch({ invalidation: v }),
                ph: 'Close below level without reclaim…',
              },
            ].map(({ label, val, set, ph }) => (
              <div key={label}>
                <FieldLabel>{label}</FieldLabel>
                <textarea
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  rows={3}
                  style={{
                    width: '100%',
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 8,
                    padding: '7px 10px',
                    color: 'var(--eb-text)',
                    fontSize: 13,
                    fontFamily: 'inherit',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = 'var(--green)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = 'var(--eb-border)';
                  }}
                />
              </div>
            ))}
          </div>

          {/* Key Levels */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Key levels</FieldLabel>
            <div
              style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 7, minHeight: 24 }}
            >
              {draft.levels.length === 0 && (
                <span style={{ fontSize: 11.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                  No levels added yet.
                </span>
              )}
              {draft.levels.map((l, idx) => {
                const lc = levelColor(idx);
                return (
                  <div
                    key={l.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      padding: '3px 8px',
                      borderRadius: 6,
                      border: `1px solid ${lc.border}`,
                      background: 'var(--eb-panel-2)',
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12,
                    }}
                  >
                    <span style={{ color: lc.color, fontWeight: 600 }}>$ {l.price}</span>
                    {l.label && (
                      <span style={{ fontSize: 10, color: 'var(--eb-muted)' }}>· {l.label}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => patch({ levels: draft.levels.filter((x) => x.id !== l.id) })}
                      style={{
                        background: 'transparent',
                        border: 0,
                        color: 'var(--eb-muted)',
                        cursor: 'pointer',
                        padding: '0 1px',
                        display: 'flex',
                        lineHeight: 1,
                      }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
                <span
                  style={{
                    position: 'absolute',
                    left: 8,
                    fontSize: 12,
                    color: 'var(--eb-muted)',
                    pointerEvents: 'none',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  $
                </span>
                <input
                  value={newLevel}
                  onChange={(e) => setNewLevel(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') addLevel();
                  }}
                  placeholder="0.00"
                  style={{
                    width: 88,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 6,
                    padding: '4px 8px 4px 18px',
                    color: 'var(--eb-text)',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12,
                    outline: 'none',
                  }}
                />
              </div>
              <input
                value={newLevelLabel}
                onChange={(e) => setNewLevelLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addLevel();
                }}
                placeholder="Label (optional)"
                style={{
                  flex: 1,
                  minWidth: 100,
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 6,
                  padding: '4px 8px',
                  color: 'var(--eb-text)',
                  fontSize: 12,
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={addLevel}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  padding: '4px 10px',
                  borderRadius: 6,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-text)',
                  fontSize: 11.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                <Plus size={11} /> Add
              </button>
            </div>
          </div>

          {/* Playbooks + Allowed sessions */}
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}
          >
            <div>
              <FieldLabel>Playbooks</FieldLabel>
              {playbooks.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                  {playbooks.map((p) => {
                    const active = draft.playbooks.includes(p.name);
                    const style = getPlaybookColor(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => togglePlaybook(p.name)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          background: active ? style.bg : 'var(--eb-panel-2)',
                          color: active ? style.text : 'var(--eb-muted)',
                          border: `1px solid ${active ? style.border : 'var(--eb-border)'}`,
                          borderRadius: 99,
                          fontSize: 11,
                          padding: '3px 9px',
                          cursor: 'pointer',
                          transition: 'background .12s, color .12s, border-color .12s',
                          fontFamily: 'inherit',
                        }}
                      >
                        <BookOpen size={9} /> {p.name}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div>
                  {draft.playbooks.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
                      {draft.playbooks.map((name) => {
                        const style = getPlaybookColor(name);
                        return (
                          <div
                            key={name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              padding: '3px 8px',
                              borderRadius: 99,
                              border: `1px solid ${style.border}`,
                              background: style.bg,
                              fontSize: 11,
                              color: style.text,
                            }}
                          >
                            <BookOpen size={9} /> {name}
                            <button
                              type="button"
                              onClick={() => togglePlaybook(name)}
                              style={{
                                background: 'transparent',
                                border: 0,
                                padding: 0,
                                cursor: 'pointer',
                                color: 'inherit',
                                display: 'flex',
                                lineHeight: 1,
                              }}
                            >
                              <X size={10} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <input
                      value={customPlaybook}
                      onChange={(e) => setCustomPlaybook(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') addCustomPlaybook();
                      }}
                      placeholder="e.g. Liquidity sweep"
                      style={{
                        flex: 1,
                        background: 'var(--eb-panel-2)',
                        border: '1px solid var(--eb-border)',
                        borderRadius: 7,
                        padding: '5px 9px',
                        color: 'var(--eb-text)',
                        fontSize: 12.5,
                        fontFamily: 'inherit',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={addCustomPlaybook}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '5px 10px',
                        borderRadius: 7,
                        border: '1px solid var(--eb-border)',
                        background: 'var(--eb-panel-2)',
                        color: 'var(--eb-text)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      <Plus size={11} /> Add
                    </button>
                  </div>
                </div>
              )}
            </div>
            <div>
              <FieldLabel>Allowed sessions for {tokenBaseLabel(draft.symbol)} today</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {TRADING_SESSIONS.map((session) => {
                  const active = draft.allowedSessions.includes(session.id);
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => toggleSession(session.id)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        background: active ? session.activeBg : 'var(--eb-panel-2)',
                        color: active ? session.activeColor : 'var(--eb-muted)',
                        border: `1px solid ${active ? session.activeBorder : 'var(--eb-border)'}`,
                        borderRadius: 99,
                        fontSize: 11,
                        padding: '3px 9px',
                        cursor: 'pointer',
                        transition: 'background .12s, color .12s, border-color .12s',
                        fontFamily: 'inherit',
                      }}
                    >
                      {session.label}
                      {active ? ' ✓' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Notes for this token</FieldLabel>
            <textarea
              value={draft.notes}
              onChange={(e) => patch({ notes: e.target.value })}
              placeholder="Anything extra to keep in mind…"
              rows={4}
              style={{
                width: '100%',
                minHeight: 88,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 8,
                padding: '7px 10px',
                color: 'var(--eb-text)',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
                lineHeight: 1.6,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = 'var(--green)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = 'var(--eb-border)';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function TokenPlansEditor({
  entry,
  dateStr,
  locked,
}: { entry: JournalEntry; dateStr: string; locked: boolean }) {
  const qc = useQueryClient();
  const raw = (entry as any).keyLevelsJson;
  const [plans, setPlans] = useState<TokenPlan[]>(() => parsePlans(raw));

  useEffect(() => {
    setPlans(parsePlans((entry as any).keyLevelsJson));
  }, [(entry as any).keyLevelsJson]);

  const { data: playbooksRaw } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => api.get('/playbooks', z.array(z.object({ id: z.string(), name: z.string() }))),
  });
  const playbooks = playbooksRaw ?? [];

  const { mutate, isPending } = useMutation({
    mutationFn: (next: TokenPlan[]) =>
      journalApi.upsertEntry(dateStr, { keyLevelsJson: next } as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] }),
    onError: () => toast.error('Failed to save token plan'),
  });

  const savePlans = (next: TokenPlan[]) => {
    setPlans(next);
    mutate(next);
  };

  return (
    <div style={{ opacity: locked ? 0.55 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
      {plans.map((p, i) => (
        <TokenCard
          key={p.id}
          plan={p}
          playbooks={playbooks}
          onUpdate={(updated) => savePlans(plans.map((x) => (x.id === p.id ? updated : x)))}
          onRemove={() => savePlans(plans.filter((x) => x.id !== p.id))}
          defaultOpen={i === plans.length - 1 && !p.symbol}
        />
      ))}
      <button
        type="button"
        onClick={() => savePlans([...plans, emptyPlan()])}
        disabled={isPending}
        style={{
          width: '100%',
          border: '1.5px dashed var(--eb-border)',
          borderRadius: 11,
          padding: 14,
          background: 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          fontSize: 13,
          color: 'var(--eb-muted)',
          fontWeight: 500,
          fontFamily: 'inherit',
          transition: 'border-color .12s, color .12s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--green)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--green)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--eb-border)';
          (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-muted)';
        }}
      >
        <Plus size={18} /> Add token
      </button>
    </div>
  );
}

function PremarketIntentEditor({
  entry,
  dateStr,
  dayPositions,
}: { entry: JournalEntry; dateStr: string; dayPositions: DayPosition[] | undefined }) {
  const qc = useQueryClient();
  const [bias, setBias] = useState(entry.bias ?? 'NEUTRAL');
  const [conviction, setConviction] = useState(entry.conviction ?? 3);
  const [riskCap, setRiskCap] = useState((entry as any).riskCap?.toString() ?? '');
  const [maxTrades, setMaxTrades] = useState((entry as any).maxTrades?.toString() ?? '');
  const [sleepHours, setSleepHours] = useState(Number(entry.sleepHours) || 7);
  const [energy, setEnergy] = useState(entry.energy || 7);
  const [focus, setFocus] = useState(entry.focus || 7);
  const moods: string[] = Array.isArray(entry.moodTagsJson) ? (entry.moodTagsJson as string[]) : [];
  const locked = !!entry.lockedAt;

  // Keep sliders in sync when the entry is updated externally (e.g. via the modal)
  useEffect(() => {
    setSleepHours(Number(entry.sleepHours) || 7);
  }, [entry.sleepHours]);
  useEffect(() => {
    setEnergy(entry.energy || 7);
  }, [entry.energy]);
  useEffect(() => {
    setFocus(entry.focus || 7);
  }, [entry.focus]);

  const { mutate, isPending } = useMutation({
    mutationFn: (updates: Partial<JournalEntry>) => journalApi.upsertEntry(dateStr, updates),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      toast.success('Pre-market intent updated');
    },
    onError: (err) => {
      console.error('Failed to save pre-market intent:', err);
      toast.error('Failed to save updates');
    },
  });

  const save = (updates: Partial<JournalEntry>) => {
    mutate(updates);
  };

  const handleLock = () => {
    mutate({ lockedAt: new Date().toISOString() } as any, {
      onSuccess: () => toast.success('Intent locked'),
    });
  };

  const handleUnlock = () => {
    mutate({ lockedAt: null } as any, { onSuccess: () => toast.success('Intent unlocked') });
  };

  return (
    <Panel>
      {/* Header row with lock/unlock button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: 'var(--green)' }}>
              <Compass size={20} />
            </span>
            <span style={{ fontWeight: 600, fontSize: 18, color: 'var(--eb-text)' }}>
              Pre-market intent
            </span>
          </div>
          <div style={{ fontSize: 13, color: 'var(--eb-muted-2)', lineHeight: 1.4 }}>
            Plan each token separately — bias, levels, allocation. Risk budget enforces across all
            of them.
          </div>
        </div>
        {locked ? (
          <button
            type="button"
            onClick={handleUnlock}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 7,
              cursor: 'pointer',
              border: '1px solid rgba(245,165,36,.40)',
              background: 'rgba(245,165,36,.10)',
              color: 'var(--eb-yellow)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            <Unlock size={12} /> Unlock intent
          </button>
        ) : (
          <button
            type="button"
            onClick={handleLock}
            disabled={isPending}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 7,
              cursor: 'pointer',
              border: '1px solid rgba(0,214,143,.40)',
              background: 'rgba(0,214,143,.08)',
              color: 'var(--green)',
              fontSize: 12,
              fontWeight: 600,
              fontFamily: 'inherit',
              opacity: isPending ? 0.6 : 1,
              flexShrink: 0,
            }}
          >
            <Lock size={12} /> Lock intent
          </button>
        )}
      </div>

      {/* Locked banner */}
      {locked && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '9px 14px',
            borderRadius: 8,
            marginBottom: 14,
            background: 'rgba(245,165,36,.08)',
            border: '1px solid rgba(245,165,36,.30)',
            color: 'var(--eb-yellow)',
            fontSize: 12,
          }}
        >
          <Lock size={13} style={{ flexShrink: 0 }} />
          <span>
            Intent locked at{' '}
            <b>
              {new Date(entry.lockedAt!).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZoneName: 'short',
              })}
            </b>
            . Locking prevents hindsight edits. Unlock to make changes.
          </span>
        </div>
      )}

      <div style={{ opacity: locked ? 0.55 : 1, pointerEvents: locked ? 'none' : 'auto' }}>
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 14,
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
            <div className="field">
              <FieldLabel>Overall day bias</FieldLabel>
              <div
                style={{
                  display: 'inline-flex',
                  background: 'var(--eb-panel)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 8,
                  padding: 3,
                  gap: 2,
                }}
              >
                {(['LONG', 'NEUTRAL', 'SHORT'] as const).map((b) => (
                  <button
                    key={b}
                    onClick={() => {
                      setBias(b);
                      save({ bias: b });
                    }}
                    style={{
                      background:
                        bias === b
                          ? b === 'LONG'
                            ? 'rgba(0,214,143,.16)'
                            : b === 'SHORT'
                              ? 'rgba(239,68,68,.16)'
                              : 'var(--eb-bg)'
                          : 'transparent',
                      border: 0,
                      color:
                        bias === b
                          ? b === 'LONG'
                            ? 'var(--green)'
                            : b === 'SHORT'
                              ? '#ef4444'
                              : 'var(--eb-text)'
                          : 'var(--eb-muted)',
                      padding: '5px 12px',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 500,
                      cursor: 'pointer',
                    }}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <FieldLabel>Conviction</FieldLabel>
              <div style={{ display: 'flex', gap: 3, fontSize: 14 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      setConviction(n);
                      save({ conviction: n });
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      display: 'flex',
                    }}
                  >
                    <Star
                      size={18}
                      fill={n <= conviction ? '#fbbf24' : 'none'}
                      color={n <= conviction ? '#fbbf24' : 'var(--eb-border)'}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <FieldLabel>Total risk cap</FieldLabel>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12.5,
                  color: 'var(--eb-text)',
                }}
              >
                <input
                  type="text"
                  value={riskCap}
                  onChange={(e) => setRiskCap(e.target.value)}
                  onBlur={(e) => {
                    const val = e.target.value.trim();
                    if (val === '') return; // don't save empty
                    const num = Number(val);
                    if (isNaN(num)) return;
                    save({ riskCap: num } as any);
                  }}
                  style={{
                    background: 'var(--eb-panel)',
                    border: '1px solid var(--eb-border)',
                    padding: '5px 10px',
                    borderRadius: 8,
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    width: 70,
                    outline: 'none',
                    color: 'inherit',
                    textAlign: 'center',
                  }}
                />
                <span style={{ color: 'var(--eb-muted)' }}>% account</span>
              </div>
            </div>
            <div className="field">
              <FieldLabel>Max trades today</FieldLabel>
              <input
                type="text"
                value={maxTrades}
                onChange={(e) => setMaxTrades(e.target.value)}
                onBlur={(e) => {
                  const val = e.target.value.trim();
                  if (val === '') return;
                  const num = Number(val);
                  if (isNaN(num)) return;
                  save({ maxTrades: num } as any);
                }}
                style={{
                  background: 'var(--eb-panel)',
                  border: '1px solid var(--eb-border)',
                  padding: '5px 10px',
                  borderRadius: 8,
                  width: 60,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 600,
                  outline: 'none',
                  color: 'inherit',
                  textAlign: 'center',
                }}
              />
            </div>
          </div>

          <hr style={{ border: 0, borderTop: '1px dashed var(--eb-border)', margin: '14px 0' }} />

          <h4
            style={{
              margin: '0 0 8px',
              fontSize: 10,
              fontWeight: 600,
              color: 'var(--eb-muted-2)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            State of mind · pre-session
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
            {[
              {
                label: 'Sleep',
                value: sleepHours,
                set: setSleepHours,
                max: 12,
                unit: 'h',
                step: 0.5,
                field: 'sleepHours',
              },
              {
                label: 'Energy',
                value: energy,
                set: setEnergy,
                max: 10,
                unit: '/10',
                step: 1,
                field: 'energy',
              },
              {
                label: 'Focus',
                value: focus,
                set: setFocus,
                max: 10,
                unit: '/10',
                step: 1,
                field: 'focus',
              },
            ].map((s) => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ flex: '0 0 50px', fontSize: 11.5, color: 'var(--eb-muted)' }}>
                  {s.label}
                </span>
                <input
                  type="range"
                  min="0"
                  max={s.max}
                  step={s.step}
                  value={s.value}
                  onChange={(e) => s.set(Number(e.target.value))}
                  onMouseUp={(e) =>
                    save({ [s.field]: Number((e.target as HTMLInputElement).value) })
                  }
                  onTouchEnd={(e) =>
                    save({ [s.field]: Number((e.target as HTMLInputElement).value) })
                  }
                  style={{ flex: 1, accentColor: 'var(--green)', height: 4 }}
                />
                <span
                  style={{
                    flex: '0 0 45px',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--eb-text)',
                  }}
                >
                  {s.label === 'Sleep' ? s.value.toFixed(1) : s.value}
                  {s.unit}
                </span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
            {MOOD_TAGS.map(({ label, color, bg, border }) => {
              const active = moods.includes(label);
              return (
                <button
                  key={label}
                  onClick={() => {
                    const nextMoods = active ? moods.filter((x) => x !== label) : [...moods, label];
                    save({ moodTagsJson: nextMoods });
                  }}
                  style={{
                    background: active ? bg : 'var(--eb-panel-2)',
                    color: active ? color : 'var(--eb-muted)',
                    border: `1px solid ${active ? border : 'var(--eb-border)'}`,
                    borderRadius: 99,
                    fontSize: 11,
                    padding: '3px 9px',
                    cursor: 'pointer',
                    transition: 'background .12s, color .12s, border-color .12s',
                    fontFamily: 'inherit',
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <RiskAllocationBar
          riskCap={riskCap ? Number(riskCap) : null}
          maxTrades={maxTrades ? Number(maxTrades) : null}
          plans={parsePlans((entry as any).keyLevelsJson)}
          dayPositions={dayPositions}
        />

        <TokenPlansEditor entry={entry} dateStr={dateStr} locked={locked} />
      </div>
    </Panel>
  );
}

// ─── Live Session ────────────────────────────────────────────────────────────

function LiveSession({
  entry,
  dateStr,
  dayPositions,
  stats,
  accountId,
  locked,
}: {
  entry: JournalEntry;
  dateStr: string;
  dayPositions: DayPosition[];
  stats: JournalStats | null | undefined;
  accountId: string | null;
  locked: boolean;
}) {
  const router = useRouter();
  const logTrade = useLogTrade();
  const { data: playbooks } = useQuery({
    queryKey: ['playbooks'],
    queryFn: () => api.get('/playbooks', z.array(z.object({ id: z.string(), name: z.string() }))),
  });
  const qc = useQueryClient();
  const [note, setNote] = useState(entry.sessionNotesMd ?? '');
  const session = getActiveSession();

  useEffect(() => {
    setNote(entry.sessionNotesMd ?? '');
  }, [entry.sessionNotesMd]);

  const { mutate: saveNote } = useMutation({
    mutationFn: (val: string) => journalApi.upsertEntry(dateStr, { sessionNotesMd: val }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
    },
  });

  const plannedSymbolsInSession = new Set(
    parsePlans((entry as any).keyLevelsJson).map((p) => p.symbol.toUpperCase()),
  );

  const openCount = dayPositions.filter((p) => p.status === 'open').length;
  const closedCount = dayPositions.filter((p) => p.status === 'closed').length;
  const wins = dayPositions.filter((p) => p.netPnl && Number(p.netPnl) > 0).length;
  const losses = dayPositions.filter((p) => p.netPnl && Number(p.netPnl) < 0).length;
  const totalPnl = dayPositions.reduce((sum, p) => sum + (p.netPnl ? Number(p.netPnl) : 0), 0);
  const maxTrades = Number((entry as any).maxTrades) || 0;
  const isOverPlan = maxTrades > 0 && dayPositions.length > maxTrades;

  const discipline = stats?.discipline?.score ?? null;

  const thStyle: React.CSSProperties = {
    textAlign: 'left',
    padding: '9px 12px',
    borderBottom: '1px solid var(--eb-border)',
    fontSize: 10.5,
    color: 'var(--eb-muted)',
    textTransform: 'uppercase',
    letterSpacing: '.05em',
    fontWeight: 600,
    whiteSpace: 'nowrap',
    background: 'var(--eb-panel)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '9px 12px',
    borderBottom: '1px solid var(--eb-border)',
    fontSize: 12,
    whiteSpace: 'nowrap',
  };

  return (
    <Panel>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
        <span style={{ color: 'var(--green)' }}>
          <Zap size={16} />
        </span>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--eb-text)' }}>Live session</span>
        <Chip
          style={{
            color: session.color,
            borderColor: `${session.color}40`,
            background: `${session.color}15`,
            fontSize: 10.5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: session.color,
              display: 'inline-block',
              marginRight: 4,
            }}
          />
          {session.label}
        </Chip>
        {!locked && (
          <span style={{ marginLeft: 'auto' }}>
            <button
              type="button"
              onClick={logTrade.open}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 12px',
                borderRadius: 7,
                cursor: 'pointer',
                border: '1px solid rgba(0,214,143,.40)',
                background: 'rgba(0,214,143,.08)',
                color: 'var(--green)',
                fontSize: 12,
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
            >
              <Plus size={13} /> Log trade
            </button>
          </span>
        )}
      </div>

      {/* KPIs row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}
      >
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Trades taken
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--eb-text)',
              marginTop: 2,
            }}
          >
            {dayPositions.length}
            {maxTrades > 0 ? (
              <span style={{ color: 'var(--eb-muted)', fontWeight: 400, fontSize: 14 }}>
                {' '}
                / {maxTrades}
              </span>
            ) : (
              ''
            )}
          </div>
          {isOverPlan && (
            <div style={{ fontSize: 11, color: 'var(--eb-yellow)', marginTop: 2 }}>
              ⚠ Over plan by {dayPositions.length - maxTrades}
            </div>
          )}
        </div>
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Open positions
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              color: openCount > 0 ? 'var(--green)' : 'var(--eb-muted)',
              marginTop: 2,
            }}
          >
            {openCount}
          </div>
          {openCount > 0 && (
            <div
              style={{
                fontSize: 11,
                color: 'var(--eb-muted-2)',
                marginTop: 2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {dayPositions
                .filter((p) => p.status === 'open')
                .map((p) => p.symbol)
                .join(', ')}
            </div>
          )}
        </div>
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            W / L
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              marginTop: 2,
            }}
          >
            <span style={{ color: 'var(--green)' }}>{wins}W</span>
            {' / '}
            <span style={{ color: 'var(--eb-red)' }}>{losses}L</span>
          </div>
          {wins + losses > 0 && (
            <div style={{ fontSize: 11, color: 'var(--eb-muted-2)', marginTop: 2 }}>
              {((wins / (wins + losses)) * 100).toFixed(0)}% win rate
            </div>
          )}
        </div>
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            padding: '10px 12px',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
            }}
          >
            Discipline today
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              fontFamily: 'var(--font-mono, monospace)',
              color:
                discipline != null
                  ? discipline >= 70
                    ? 'var(--green)'
                    : discipline >= 40
                      ? 'var(--eb-yellow)'
                      : 'var(--eb-red)'
                  : 'var(--eb-muted)',
              marginTop: 2,
            }}
          >
            {discipline != null ? `${discipline}/100` : '—'}
          </div>
          {dayPositions.length > 0 && (
            <div style={{ fontSize: 11, color: 'var(--eb-muted-2)', marginTop: 2 }}>
              Net P&L{' '}
              <span
                style={{ color: totalPnl >= 0 ? 'var(--green)' : 'var(--eb-red)', fontWeight: 600 }}
              >
                {totalPnl >= 0 ? '+' : ''}
                {totalPnl.toFixed(2)}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Trades table */}
      {dayPositions.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.05em',
              fontWeight: 600,
              marginBottom: 8,
            }}
          >
            Trades today
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Time', 'Symbol', 'Side', 'R', 'Net P&L', 'Status'].map((h) => (
                    <th key={h} style={thStyle}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {dayPositions.map((pos) => {
                  const pnlColor =
                    pos.status === 'open'
                      ? 'var(--eb-muted)'
                      : pos.netPnl && Number(pos.netPnl) >= 0
                        ? 'var(--green)'
                        : 'var(--eb-red)';
                  const rVal =
                    pos.rRealized && !Number.isNaN(Number(pos.rRealized))
                      ? `${Number(pos.rRealized) >= 0 ? '+' : ''}${Number(pos.rRealized).toFixed(2)}R`
                      : '—';
                  return (
                    <tr
                      key={pos.id}
                      style={{ cursor: 'pointer' }}
                      onClick={() => router.push(`/trades/${pos.id}?account=${accountId}`)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ')
                          router.push(`/trades/${pos.id}?account=${accountId}`);
                      }}
                      tabIndex={0}
                    >
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: 'var(--font-mono, monospace)',
                          color: 'var(--eb-muted)',
                          fontSize: 11,
                        }}
                      >
                        {new Date(pos.openedAt).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ ...tdStyle, fontWeight: 600 }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          {pos.symbol}
                          {plannedSymbolsInSession.size > 0 && !plannedSymbolsInSession.has(pos.symbol.toUpperCase()) && (
                            <span
                              title="Not in risk plan"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 3,
                                fontSize: 9.5,
                                padding: '1px 5px',
                                borderRadius: 99,
                                background: 'rgba(245,165,36,.14)',
                                color: 'var(--eb-yellow)',
                                border: '1px solid rgba(245,165,36,.30)',
                                fontWeight: 600,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              <AlertTriangle size={9} /> unplanned
                            </span>
                          )}
                        </span>
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          color: pos.side === 'long' ? 'var(--green)' : 'var(--eb-red)',
                          fontWeight: 600,
                        }}
                      >
                        {pos.side.toUpperCase()}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          color: (() => {
                            const v = Number(pos.rRealized ?? '');
                            return pos.rRealized && !Number.isNaN(v)
                              ? v >= 0
                                ? 'var(--green)'
                                : 'var(--eb-red)'
                              : 'var(--eb-muted)';
                          })(),
                        }}
                      >
                        {rVal}
                      </td>
                      <td
                        style={{
                          ...tdStyle,
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 600,
                          color: pnlColor,
                        }}
                      >
                        {pos.status === 'open'
                          ? '—'
                          : `${pos.netPnl && Number(pos.netPnl) >= 0 ? '+' : ''}${pos.netPnl ? Number(pos.netPnl).toFixed(2) : '—'}`}
                      </td>
                      <td style={tdStyle}>
                        <span
                          style={{
                            display: 'inline-flex',
                            fontSize: 10.5,
                            padding: '1px 7px',
                            borderRadius: 99,
                            color: pos.status === 'open' ? 'var(--eb-purple)' : 'var(--eb-muted)',
                            background:
                              pos.status === 'open' ? 'rgba(139,92,246,.12)' : 'var(--eb-panel-2)',
                            border: `1px solid ${pos.status === 'open' ? 'rgba(139,92,246,.30)' : 'var(--eb-border)'}`,
                          }}
                        >
                          {pos.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {dayPositions.length > 1 && (
            <div
              style={{ marginTop: 8, fontSize: 11, color: 'var(--eb-muted)', textAlign: 'right' }}
            >
              {dayPositions.length} trade{dayPositions.length !== 1 ? 's' : ''} today ·{' '}
              <span style={{ color: 'var(--green)' }}>{closedCount} closed</span>
              {openCount > 0 && (
                <span>
                  , <span style={{ color: 'var(--eb-purple)' }}>{openCount} open</span>
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {dayPositions.length === 0 && (
        <div
          style={{
            padding: '24px 0',
            textAlign: 'center',
            color: 'var(--eb-muted)',
            fontSize: 13,
            borderTop: '1px solid var(--eb-border)',
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📋</div>
          <div style={{ fontWeight: 500, color: 'var(--eb-muted-2)' }}>No trades logged today</div>
          {!locked && (
            <div style={{ fontSize: 12, marginTop: 4 }}>
              Click{' '}
              <button
                type="button"
                onClick={logTrade.open}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  font: 'inherit',
                  fontWeight: 700,
                  color: 'var(--green)',
                  cursor: 'pointer',
                }}
              >
                Log trade
              </button>{' '}
              to record your first trade.
            </div>
          )}
        </div>
      )}

      {/* Mid-session note */}
      <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '0 0 14px' }} />
      <h4
        style={{
          margin: '0 0 8px',
          fontSize: 10,
          fontWeight: 600,
          color: 'var(--eb-muted-2)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
        }}
      >
        Mid-session note
      </h4>
      <textarea
        value={note}
        disabled={locked}
        onChange={(e) => setNote(e.target.value)}
        onBlur={(e) => {
          if (locked) return;
          const val = e.target.value;
          if (val !== entry.sessionNotesMd) saveNote(val);
          e.currentTarget.style.borderColor = 'var(--eb-border)';
        }}
        placeholder="Quick note while you trade — what's the tape doing, why did you take that trade, etc."
        rows={4}
        style={{
          width: '100%',
          minHeight: 74,
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 8,
          padding: '9px 11px',
          color: locked ? 'var(--eb-muted)' : 'var(--eb-text)',
          fontSize: 13,
          fontFamily: 'inherit',
          outline: 'none',
          resize: locked ? 'none' : 'vertical',
          boxSizing: 'border-box',
          lineHeight: 1.6,
          opacity: locked ? 0.6 : 1,
          cursor: locked ? 'not-allowed' : 'text',
        }}
        onFocus={(e) => {
          if (!locked) e.currentTarget.style.borderColor = 'var(--green)';
        }}
      />
    </Panel>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JournalDetailClient({ date: dateStr }: { date: string }) {
  const today = isToday(dateStr);
  const qc = useQueryClient();
  const router = useRouter();
  const [contextOpen, setContextOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: () => journalApi.deleteEntry(dateStr),
    onSuccess: () => {
      toast.success('Journal entry deleted');
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      qc.invalidateQueries({ queryKey: ['journal-stats'] });
      router.push('/journal');
    },
    onError: (err) => {
      toast.error(err instanceof Error ? err.message : 'Failed to delete entry');
    },
  });

  const unlockEodMutation = useMutation({
    mutationFn: () => journalApi.upsertEntry(dateStr, { finalizedAt: null } as any),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      toast.success('EOD review unlocked');
    },
    onError: () => toast.error('Failed to unlock'),
  });

  const { data: stats } = useQuery({
    queryKey: ['journal-stats', dateStr],
    queryFn: () => journalApi.getStats(dateStr),
  });

  const { data: entry, isPending } = useQuery({
    queryKey: ['journal-entry', dateStr],
    queryFn: () => journalApi.getEntry(dateStr),
  });

  const { data: accounts } = useAccounts();
  const accountId = accounts?.[0]?.id ?? null;
  const { data: positions } = usePositions(accountId);
  const dayPositions: DayPosition[] = React.useMemo(
    () =>
      (positions ?? [])
        .filter((p) => p.openedAt.startsWith(dateStr))
        .map((p) => ({
          id: p.id,
          symbol: p.symbol,
          side: p.side,
          status: p.status,
          openedAt: p.openedAt,
          netPnl: p.netPnl,
          rPlanned: p.rPlanned,
          rRealized: p.rRealized,
          playbookId: p.playbookId,
        })),
    [positions, dateStr],
  );

  if (isPending) {
    return (
      <div
        style={{ padding: '22px 26px 80px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}
      >
        <style>{`
          @keyframes eb-shimmer {
            0% { background-position: -600px 0 }
            100% { background-position: 600px 0 }
          }
          .eb-skel {
            border-radius: 6px;
            background: linear-gradient(90deg, var(--eb-panel-2) 25%, var(--eb-border) 50%, var(--eb-panel-2) 75%);
            background-size: 600px 100%;
            animation: eb-shimmer 1.4s ease-in-out infinite;
          }
        `}</style>

        {/* Breadcrumb */}
        <div className="eb-skel" style={{ width: 130, height: 14, marginBottom: 22 }} />

        {/* Hero */}
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 14,
            padding: '20px 22px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginBottom: 16,
              flexWrap: 'wrap',
            }}
          >
            <div>
              <div className="eb-skel" style={{ width: 320, height: 26, marginBottom: 8 }} />
              <div className="eb-skel" style={{ width: 440, height: 13 }} />
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <div className="eb-skel" style={{ width: 90, height: 22, borderRadius: 99 }} />
              <div className="eb-skel" style={{ width: 80, height: 22, borderRadius: 99 }} />
            </div>
          </div>
          <div
            style={{
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              padding: '14px 16px',
            }}
          >
            <div className="eb-skel" style={{ width: 110, height: 11, marginBottom: 10 }} />
            <div className="eb-skel" style={{ width: '100%', height: 14, marginBottom: 6 }} />
            <div className="eb-skel" style={{ width: '70%', height: 14 }} />
          </div>
        </div>

        {/* Session map placeholder */}
        <div className="eb-skel" style={{ height: 56, borderRadius: 10, marginBottom: 14 }} />

        {/* Pre-market intent panel */}
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: 18,
            }}
          >
            <div>
              <div className="eb-skel" style={{ width: 200, height: 20, marginBottom: 8 }} />
              <div className="eb-skel" style={{ width: 340, height: 13 }} />
            </div>
            <div className="eb-skel" style={{ width: 110, height: 32, borderRadius: 7 }} />
          </div>
          <div
            style={{
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 12,
              padding: '16px',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4,1fr)',
                gap: 14,
                marginBottom: 16,
              }}
            >
              {[100, 120, 90, 80].map((w, i) => (
                <div key={i}>
                  <div className="eb-skel" style={{ width: 70, height: 10, marginBottom: 8 }} />
                  <div className="eb-skel" style={{ width: w, height: 32, borderRadius: 8 }} />
                </div>
              ))}
            </div>
            <div className="eb-skel" style={{ width: 160, height: 10, marginBottom: 12 }} />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
              {[0, 1, 2].map((i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="eb-skel" style={{ width: 50, height: 11, borderRadius: 4 }} />
                  <div className="eb-skel" style={{ flex: 1, height: 4, borderRadius: 99 }} />
                  <div className="eb-skel" style={{ width: 36, height: 11, borderRadius: 4 }} />
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 6, marginTop: 12, flexWrap: 'wrap' }}>
              {[52, 60, 55, 68, 50, 64, 46].map((w, i) => (
                <div
                  key={i}
                  className="eb-skel"
                  style={{ width: w, height: 22, borderRadius: 99 }}
                />
              ))}
            </div>
          </div>
          {/* Token card skeletons */}
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: '14px 18px',
                marginTop: 12,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                className="eb-skel"
                style={{ width: 32, height: 32, borderRadius: 9, flexShrink: 0 }}
              />
              <div className="eb-skel" style={{ width: 140, height: 14 }} />
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <div className="eb-skel" style={{ width: 60, height: 20, borderRadius: 99 }} />
                <div className="eb-skel" style={{ width: 50, height: 20, borderRadius: 99 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Live session panel */}
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: '18px 20px',
            marginBottom: 14,
          }}
        >
          <div className="eb-skel" style={{ width: 120, height: 16, marginBottom: 14 }} />
          <div className="eb-skel" style={{ width: '100%', height: 13, marginBottom: 6 }} />
          <div className="eb-skel" style={{ width: '55%', height: 13 }} />
        </div>

        {/* EOD panel */}
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: '18px 20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
            <div className="eb-skel" style={{ width: 160, height: 16 }} />
            <div className="eb-skel" style={{ width: 70, height: 20, borderRadius: 99 }} />
          </div>
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}
          >
            {[0, 1].map((i) => (
              <div key={i}>
                <div className="eb-skel" style={{ width: 90, height: 10, marginBottom: 8 }} />
                <div className="eb-skel" style={{ width: '100%', height: 72, borderRadius: 8 }} />
              </div>
            ))}
          </div>
          <div className="eb-skel" style={{ width: '100%', height: 60, borderRadius: 8 }} />
        </div>
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{ padding: '22px 26px' }}>
        <Link
          href="/journal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: 'var(--eb-muted)',
            marginBottom: 20,
          }}
        >
          <ArrowLeft size={14} /> Back to journal
        </Link>
        <div style={{ color: 'var(--eb-muted-2)', fontSize: 14 }}>
          No entry found for {dateStr}.
        </div>
      </div>
    );
  }

  const full = entry as JournalEntry;

  return (
    <div style={{ padding: '22px 26px 80px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      {/* Breadcrumb + context toggle + delete */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <Link
          href="/journal"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: 'var(--eb-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} /> Back to journal
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            onClick={() => setDeleteConfirm(true)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              border: '1px solid rgba(239,68,68,.25)',
              background: 'rgba(239,68,68,.08)',
              color: '#ef4444',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Trash2 size={13} />
            Delete
          </button>
          <button
            type="button"
            onClick={() => setContextOpen(v => !v)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 7,
              border: contextOpen ? '1px solid rgba(6,182,212,.40)' : '1px solid var(--eb-border)',
              background: contextOpen ? 'rgba(6,182,212,.10)' : 'var(--eb-panel-2)',
              color: contextOpen ? 'var(--eb-cyan)' : 'var(--eb-muted-2)',
              fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Zap size={13} />
            Context
          </button>
        </div>
      </div>

      <Hero entry={full} dateStr={dateStr} isToday={today} stats={stats} />

      <div style={{ marginBottom: 14 }}>
        <SessionMap />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* ── STEP 1: Pre-market intent ── */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              flex: '0 0 28px',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: full.lockedAt ? 'rgba(245,165,36,.18)' : 'var(--panel-2)',
              border: full.lockedAt
                ? '1px solid rgba(245,165,36,.50)'
                : '1px solid var(--eb-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: full.lockedAt ? 'var(--eb-yellow)' : 'var(--eb-muted)',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            {full.lockedAt ? <Lock size={12} /> : <Unlock size={12} />}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <PremarketIntentEditor entry={full} dateStr={dateStr} dayPositions={dayPositions} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              flex: '0 0 28px',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'var(--panel-2)',
              border: '1px solid var(--eb-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: 'var(--eb-cyan)',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <Eye size={14} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <WatchlistEditor entry={full} dateStr={dateStr} locked={!!full.finalizedAt} />
          </div>
          </div>

          {/* ── STEP 2: Live session ── */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              flex: '0 0 28px',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: 'rgba(0,214,143,.15)',
              border: '1px solid rgba(0,214,143,.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              color: 'var(--green)',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <Radio size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <LiveSession
              entry={full}
              dateStr={dateStr}
              dayPositions={dayPositions}
              stats={stats}
              accountId={accountId}
              locked={!!full.finalizedAt}
            />
          </div>
          </div>

          {/* ── STEP 3: End-of-day review ── */}
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
          <div
            style={{
              flex: '0 0 28px',
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: full.finalizedAt ? 'rgba(0,214,143,.20)' : 'var(--panel-2)',
              border: full.finalizedAt
                ? '1px solid rgba(0,214,143,.50)'
                : '1px solid var(--eb-border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: full.finalizedAt ? 'var(--green)' : 'var(--eb-muted)',
              fontWeight: 600,
              fontFamily: 'inherit',
            }}
          >
            <Moon size={13} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <Panel>
              <SectionHeader
                icon={<Moon size={16} />}
                title="End-of-day review"
                chip={
                  full.finalizedAt ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <Chip
                        style={{
                          color: 'var(--green)',
                          borderColor: 'rgba(0,214,143,.3)',
                          background: 'rgba(0,214,143,.08)',
                          fontSize: 10.5,
                        }}
                      >
                        ✓ Finalized
                      </Chip>
                      <button
                        type="button"
                        onClick={() => unlockEodMutation.mutate()}
                        disabled={unlockEodMutation.isPending}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          padding: '4px 10px',
                          borderRadius: 6,
                          border: '1px solid var(--eb-border)',
                          background: 'var(--eb-panel-2)',
                          color: 'var(--eb-muted-2)',
                          fontSize: 11.5,
                          fontWeight: 500,
                          cursor: unlockEodMutation.isPending ? 'not-allowed' : 'pointer',
                          fontFamily: 'inherit',
                          opacity: unlockEodMutation.isPending ? 0.6 : 1,
                        }}
                      >
                        <Unlock size={11} /> Unlock full day
                      </button>
                    </span>
                  ) : (
                    <Chip style={{ fontSize: 10.5 }}>Draft</Chip>
                  )
                }
              />

              {full.eodMd && (
                <div style={{ marginBottom: 16 }}>
                  <FieldLabel>Closing note</FieldLabel>
                  <ReadonlyTextarea value={full.eodMd} placeholder="" />
                </div>
              )}

              <EodEditor entry={full} dateStr={dateStr} locked={!!full.finalizedAt} />

            </Panel>
          </div>
        </div>
      </div>

      <JournalContextPanel
        open={contextOpen}
        onClose={() => setContextOpen(false)}
        stats={stats}
      />

      {/* Delete entry button — fixed bottom-right */}
      <button
        type="button"
        onClick={() => setDeleteConfirm(true)}
        title="Delete this journal entry"
        style={{
          position: 'fixed',
          bottom: 28,
          right: 28,
          zIndex: 50,
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '9px 16px',
          borderRadius: 99,
          border: '1px solid rgba(239,68,68,.35)',
          background: 'rgba(239,68,68,.10)',
          color: '#ef4444',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 4px 20px rgba(0,0,0,.35)',
          transition: 'background .15s, border-color .15s, transform .1s',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.20)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,.6)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.background = 'rgba(239,68,68,.10)';
          (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(239,68,68,.35)';
          (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
        }}
      >
        <RiDeleteBin6Line size={15} />
        Delete entry
      </button>

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', zIndex: 60 }}
            onClick={() => setDeleteConfirm(false)}
            onKeyDown={(e) => e.key === 'Escape' && setDeleteConfirm(false)}
            role="button"
            tabIndex={-1}
            aria-label="Cancel"
          />
          <dialog
            open
            style={{
              position: 'fixed',
              top: '50%', left: '50%',
              transform: 'translate(-50%,-50%)',
              zIndex: 61,
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 12,
              padding: '22px 24px',
              width: 380,
              maxWidth: 'calc(100vw - 32px)',
              boxShadow: '0 20px 60px rgba(0,0,0,.55)',
              display: 'flex', flexDirection: 'column', gap: 14,
              margin: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239,68,68,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertTriangle size={16} style={{ color: '#ef4444' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>Delete journal entry?</div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 2 }}>This can&apos;t be undone.</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setDeleteConfirm(false)}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '7px 14px', borderRadius: 7, border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)', color: 'var(--eb-text)',
                  fontSize: 12.5, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                style={{
                  padding: '7px 14px', borderRadius: 7, border: 'none',
                  background: deleteMutation.isPending ? 'rgba(239,68,68,.5)' : '#ef4444',
                  color: '#fff', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  opacity: deleteMutation.isPending ? 0.7 : 1,
                }}
              >
                {deleteMutation.isPending ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </dialog>
        </>
      )}
    </div>
  );
}
