'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, X, CalendarDays, BookOpen,
  TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Moon, MailX, Tag, Smile, Award, RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { JournalStats, RecentEntry } from '@/features/journal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SidebarFilters {
  quickView: string;
  moods: string[];
  tags: string[];
  discipline: string | null;
}

export const DEFAULT_FILTERS: SidebarFilters = {
  quickView: 'all',
  moods: [],
  tags: [],
  discipline: null,
};

export interface JournalSidebarProps {
  open: boolean;
  onClose: () => void;
  filters: SidebarFilters;
  onChange: (f: SidebarFilters) => void;
  entryDates: Set<string>;
  stats: JournalStats | undefined;
  entries: RecentEntry[];
  today: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

type TagColor = { color: string; border: string; bg: string };

const MOODS: { label: string; c: TagColor }[] = [
  { label: 'Calm',       c: { color: '#2dd4bf', border: 'rgba(45,212,191,.30)',  bg: 'rgba(45,212,191,.12)'  } },
  { label: 'Focused',    c: { color: '#00d68f', border: 'rgba(0,214,143,.30)',   bg: 'rgba(0,214,143,.12)'   } },
  { label: 'Patient',    c: { color: '#38bdf8', border: 'rgba(56,189,248,.30)',  bg: 'rgba(56,189,248,.12)'  } },
  { label: 'Frustrated', c: { color: '#ff5b6c', border: 'rgba(255,91,108,.30)', bg: 'rgba(255,91,108,.12)'  } },
  { label: 'Excited',    c: { color: '#f5a524', border: 'rgba(245,165,36,.30)',  bg: 'rgba(245,165,36,.12)'  } },
  { label: 'Tired',      c: { color: '#94a3b8', border: 'rgba(148,163,184,.30)', bg: 'rgba(148,163,184,.12)' } },
  { label: 'Anxious',    c: { color: '#fb923c', border: 'rgba(251,146,60,.30)',  bg: 'rgba(251,146,60,.12)'  } },
  { label: 'Confident',  c: { color: '#a3e635', border: 'rgba(163,230,53,.30)',  bg: 'rgba(163,230,53,.12)'  } },
];

const TAGS: { label: string; c: TagColor }[] = [
  { label: 'EU session',     c: { color: '#38bdf8', border: 'rgba(56,189,248,.30)',  bg: 'rgba(56,189,248,.12)'  } },
  { label: 'US session',     c: { color: '#fbbf24', border: 'rgba(251,191,36,.30)',  bg: 'rgba(251,191,36,.12)'  } },
  { label: 'Asia',           c: { color: '#a78bfa', border: 'rgba(167,139,250,.30)', bg: 'rgba(167,139,250,.12)' } },
  { label: 'Liq sweep',      c: { color: '#22d3ee', border: 'rgba(34,211,238,.30)',  bg: 'rgba(34,211,238,.12)'  } },
  { label: 'News rev',       c: { color: '#fb923c', border: 'rgba(251,146,60,.30)',  bg: 'rgba(251,146,60,.12)'  } },
  { label: 'Funding sqz',    c: { color: '#f472b6', border: 'rgba(244,114,182,.30)', bg: 'rgba(244,114,182,.12)' } },
  { label: 'Rule violation', c: { color: '#ff5b6c', border: 'rgba(255,91,108,.30)',  bg: 'rgba(255,91,108,.12)'  } },
  { label: 'Revenge trade',  c: { color: '#f43f5e', border: 'rgba(244,63,94,.30)',   bg: 'rgba(244,63,94,.12)'   } },
];

const DISCIPLINE_RANGES = [
  { label: '≥ 90', value: '90+', color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', bg: 'rgba(0,214,143,.08)' },
  { label: '70–89', value: '70-89', color: 'var(--eb-text)', borderColor: 'var(--eb-border)', bg: 'transparent' },
  { label: '40–69', value: '40-69', color: 'var(--eb-yellow)', borderColor: 'rgba(245,165,36,.30)', bg: 'rgba(245,165,36,.08)' },
  { label: '< 40', value: '<40', color: 'var(--eb-red)', borderColor: 'rgba(255,91,108,.30)', bg: 'rgba(255,91,108,.08)' },
];

const QUICK_VIEWS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'all', label: 'All entries', Icon: BookOpen },
  { id: 'week', label: 'This week', Icon: CalendarDays },
  { id: 'month', label: 'This month', Icon: CalendarDays },
  { id: 'green', label: 'Green days', Icon: TrendingUp },
  { id: 'red', label: 'Red days', Icon: TrendingDown },
  { id: 'violations', label: 'Rule violations', Icon: AlertTriangle },
  { id: 'lessons', label: 'Lessons captured', Icon: Lightbulb },
  { id: 'low-sleep', label: 'Low-sleep days', Icon: Moon },
  { id: 'missed', label: 'Missed entries', Icon: MailX },
];

// ─── Mini Calendar ─────────────────────────────────────────────────────────────

const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function getMondayOffset(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  return (firstDay + 6) % 7;
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function MiniCalendar({ entryDates, onDateClick }: { entryDates: Set<string>; onDateClick: (date: string) => void }) {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  const todayStr = toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
  const offset = getMondayOffset(viewYear, viewMonth);
  const total = daysInMonth(viewYear, viewMonth);
  const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  function prev() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function next() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }

  const cells: React.ReactNode[] = [];
  for (let i = 0; i < offset; i++) cells.push(<div key={`e-${i}`} />);

  for (let d = 1; d <= total; d++) {
    const ds = toDateStr(viewYear, viewMonth, d);
    const isToday = ds === todayStr;
    const hasEntry = entryDates.has(ds);
    const isFuture = ds > todayStr;

    cells.push(
      <button
        key={ds}
        type="button"
        onClick={() => !isFuture && hasEntry && onDateClick(ds)}
        style={{
          aspectRatio: '1',
          borderRadius: 5,
          border: isToday ? '2px solid var(--green)' : hasEntry ? '1px solid rgba(0,214,143,.35)' : '1px solid transparent',
          background: hasEntry && !isToday ? 'rgba(0,214,143,.12)' : 'transparent',
          color: isToday ? 'var(--eb-text)' : hasEntry ? 'var(--green)' : isFuture ? 'var(--eb-border)' : 'var(--eb-muted-2)',
          fontSize: 11,
          fontWeight: isToday || hasEntry ? 600 : 400,
          fontFamily: 'var(--font-mono, monospace)',
          cursor: hasEntry && !isFuture ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
          transition: 'background .1s',
        }}
      >
        {d}
      </button>
    );
  }

  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 10,
        padding: 10,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button
          type="button"
          onClick={prev}
          style={{ background: 'transparent', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <ChevronLeft size={12} />
        </button>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>{monthLabel}</span>
        <button
          type="button"
          onClick={next}
          style={{ background: 'transparent', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 22, height: 22, borderRadius: 5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Day headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 2 }}>
        {WEEK_DAYS.map((d, i) => (
          <div key={`${d}-${i}`} style={{ textAlign: 'center', fontSize: 9, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '2px 0' }}>
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells}
      </div>
    </div>
  );
}

// ─── Section Header ────────────────────────────────────────────────────────────

function SectionHeader({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
      <Icon size={12} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
      <span style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.07em', textTransform: 'uppercase' }}>
        {label}
      </span>
    </div>
  );
}

// ─── DiscAvg inline ─────────────────────────────────────────────────────────────

function DiscAvg({ value }: { value: number }) {
  const color = value >= 70 ? 'var(--eb-text)' : value >= 40 ? 'var(--eb-yellow)' : 'var(--eb-red)';
  return <span style={{ color }}>Avg D {value}</span>;
}

// ─── Count helpers ────────────────────────────────────────────────────────────

function getTags(e: RecentEntry): string[] {
  const raw = (e as unknown as Record<string, unknown>).tagsJson;
  return Array.isArray(raw) ? (raw as string[]) : [];
}

function getMoods(e: RecentEntry): string[] {
  return Array.isArray(e.moodTagsJson) ? (e.moodTagsJson as string[]) : [];
}

function quickViewCount(entries: RecentEntry[], id: string, today: string): number {
  switch (id) {
    case 'all': return entries.length;
    case 'week': {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const c = cutoff.toISOString().slice(0, 10);
      return entries.filter(e => e.date.slice(0, 10) >= c).length;
    }
    case 'month':
      return entries.filter(e => e.date.slice(0, 10) >= `${today.slice(0, 7)}-01`).length;
    case 'lessons':
      return entries.filter(e => e.lesson != null && e.lesson !== '').length;
    case 'green': return entries.filter(e => e.bias === 'LONG').length;
    case 'red':   return entries.filter(e => e.bias === 'SHORT').length;
    case 'violations':
      return entries.filter(e => {
        const tags = getTags(e);
        return tags.some(t => t.toLowerCase().includes('rule') || t.toLowerCase().includes('revenge'))
          || (e.discipline != null && e.discipline < 40);
      }).length;
    case 'low-sleep': return entries.filter(e => e.sleepHours != null && Number(e.sleepHours) < 6).length;
    case 'missed':    return entries.filter(e => e.finalizedAt == null).length;
    default: return 0;
  }
}

function CountBadge({ n }: { n: number }) {
  if (n === 0) return null;
  return (
    <span style={{
      marginLeft: 'auto',
      fontSize: 10,
      fontFamily: 'var(--font-mono, monospace)',
      fontWeight: 600,
      color: 'var(--eb-muted)',
      background: 'var(--eb-panel-2)',
      border: '1px solid var(--eb-border)',
      borderRadius: 99,
      padding: '0px 5px',
      lineHeight: '16px',
      minWidth: 18,
      textAlign: 'center',
    }}>
      {n}
    </span>
  );
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export function JournalSidebar({ open, onClose, filters, onChange, entryDates, stats, entries, today }: JournalSidebarProps) {
  const router = useRouter();

  const hasActiveFilters =
    filters.quickView !== 'all' ||
    filters.moods.length > 0 ||
    filters.tags.length > 0 ||
    filters.discipline !== null;

  function toggleMood(mood: string) {
    const moods = filters.moods.includes(mood)
      ? filters.moods.filter(m => m !== mood)
      : [...filters.moods, mood];
    onChange({ ...filters, moods });
  }

  function toggleTag(tag: string) {
    const tags = filters.tags.includes(tag)
      ? filters.tags.filter(t => t !== tag)
      : [...filters.tags, tag];
    onChange({ ...filters, tags });
  }

  function toggleDiscipline(value: string) {
    onChange({ ...filters, discipline: filters.discipline === value ? null : value });
  }

  function clearAll() {
    onChange(DEFAULT_FILTERS);
  }

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close filters"
        onClick={onClose}
        onKeyDown={(e) => e.key === 'Escape' && onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 49,
          background: 'rgba(0,0,0,.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .2s ease',
        }}
      />

      {/* Sliding panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 300,
          zIndex: 50,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .22s ease',
          background: 'var(--eb-bg, #0a0f0d)',
          borderLeft: '1px solid var(--eb-border)',
          overflowY: 'auto',
          padding: '16px 14px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--eb-text)' }}>Filters &amp; Navigation</span>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Streak card */}
        {stats && (
          <div
            style={{
              padding: '10px 12px',
              background: 'linear-gradient(135deg,rgba(0,214,143,.10),rgba(6,182,212,.04))',
              border: '1px solid rgba(0,214,143,.25)',
              borderRadius: 9,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-.02em' }}>
                {stats.streak}
              </span>
              <span style={{ fontSize: 12, color: 'var(--eb-muted-2)' }}>day journal streak 🔥</span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 4, display: 'flex', justifyContent: 'space-between' }}>
              <span>{stats.entriesThisMonth ?? 0} entries this month</span>
              {stats.disciplineAvg != null && <DiscAvg value={stats.disciplineAvg} />}
            </div>
          </div>
        )}

        {/* Calendar */}
        <div>
          <SectionHeader icon={CalendarDays} label="Calendar · jump to date" />
          <MiniCalendar
            entryDates={entryDates}
            onDateClick={(date) => router.push(`/journal/${date}`)}
          />
        </div>

        {/* Quick views */}
        <div>
          <SectionHeader icon={BookOpen} label="Quick views" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {QUICK_VIEWS.map(({ id, label, Icon }) => {
              const isOn = filters.quickView === id;
              const count = quickViewCount(entries, id, today);
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => onChange({ ...filters, quickView: id })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 7,
                    background: isOn ? 'rgba(0,214,143,.10)' : 'transparent',
                    border: 'none',
                    boxShadow: isOn ? 'inset 2px 0 0 var(--green)' : undefined,
                    color: isOn ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    textAlign: 'left',
                    fontFamily: 'inherit',
                    width: '100%',
                    transition: 'background .1s',
                  }}
                >
                  <Icon size={13} style={{ flexShrink: 0, color: isOn ? 'var(--green)' : 'var(--eb-muted)' }} />
                  {label}
                  <CountBadge n={count} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by mood */}
        <div>
          <SectionHeader icon={Smile} label="Filter by mood" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {MOODS.map(({ label, c }) => {
              const isOn = filters.moods.includes(label);
              const count = entries.filter(e => getMoods(e).includes(label)).length;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleMood(label)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isOn ? `1px solid ${c.border}` : '1px solid var(--eb-border)',
                    background: isOn ? c.bg : 'var(--eb-panel-2)',
                    color: isOn ? c.color : 'var(--eb-muted-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .1s, color .1s',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono, monospace)', opacity: 0.7 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by tag */}
        <div>
          <SectionHeader icon={Tag} label="Filter by tag" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {TAGS.map(({ label, c }) => {
              const isOn = filters.tags.includes(label);
              const count = entries.filter(e => getTags(e).includes(label)).length;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleTag(label)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isOn ? `1px solid ${c.border}` : '1px solid var(--eb-border)',
                    background: isOn ? c.bg : 'var(--eb-panel-2)',
                    color: isOn ? c.color : 'var(--eb-muted-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .1s, color .1s',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono, monospace)', opacity: 0.7 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Discipline score */}
        <div>
          <SectionHeader icon={Award} label="Discipline score" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {DISCIPLINE_RANGES.map(({ label, value, color, borderColor, bg }) => {
              const isOn = filters.discipline === value;
              const count = entries.filter(e => {
                if (e.discipline == null) return false;
                const d = e.discipline;
                if (value === '90+') return d >= 90;
                if (value === '70-89') return d >= 70 && d < 90;
                if (value === '40-69') return d >= 40 && d < 70;
                if (value === '<40') return d < 40;
                return false;
              }).length;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDiscipline(value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isOn ? borderColor : '1px solid var(--eb-border)',
                    background: isOn ? bg : 'var(--eb-panel-2)',
                    color: isOn ? color : 'var(--eb-muted-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .1s, color .1s',
                  }}
                >
                  {label}
                  {count > 0 && (
                    <span style={{ fontSize: 9.5, fontFamily: 'var(--font-mono, monospace)', opacity: 0.7 }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Clear all */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearAll}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              width: '100%',
              padding: '7px 0',
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'transparent',
              color: 'var(--eb-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <RotateCcw size={12} />
            Clear all filters
          </button>
        )}
      </div>
    </>
  );
}
