'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft, ChevronRight, X, CalendarDays, BookOpen,
  Star, TrendingUp, TrendingDown, AlertTriangle, Lightbulb,
  Moon, MailX, Tag, Smile, Award, RotateCcw,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { JournalStats } from '@/features/journal';

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
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOODS = ['Calm', 'Focused', 'Patient', 'Frustrated', 'Excited', 'Tired', 'Anxious', 'Confident'];

const TAGS = ['EU session', 'US session', 'Asia', 'Liq sweep', 'News rev', 'Funding sqz', 'Rule violation', 'Revenge trade'];

const DISCIPLINE_RANGES = [
  { label: '≥ 90', value: '90+', color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', bg: 'rgba(0,214,143,.08)' },
  { label: '70–89', value: '70-89', color: 'var(--eb-text)', borderColor: 'var(--eb-border)', bg: 'transparent' },
  { label: '50–69', value: '50-69', color: 'var(--eb-yellow)', borderColor: 'rgba(245,165,36,.30)', bg: 'rgba(245,165,36,.08)' },
  { label: '< 50', value: '<50', color: 'var(--eb-red)', borderColor: 'rgba(255,91,108,.30)', bg: 'rgba(255,91,108,.08)' },
];

const QUICK_VIEWS: { id: string; label: string; Icon: LucideIcon }[] = [
  { id: 'all', label: 'All entries', Icon: BookOpen },
  { id: 'week', label: 'This week', Icon: CalendarDays },
  { id: 'month', label: 'This month', Icon: CalendarDays },
  { id: 'pinned', label: 'Pinned', Icon: Star },
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

// ─── Sidebar ───────────────────────────────────────────────────────────────────

export function JournalSidebar({ open, onClose, filters, onChange, entryDates, stats }: JournalSidebarProps) {
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
    <div
      style={{
        width: open ? 280 : 0,
        minWidth: open ? 280 : 0,
        overflow: 'hidden',
        transition: 'width .2s ease, min-width .2s ease',
        borderLeft: open ? '1px solid var(--eb-border)' : 'none',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: 280,
          height: '100%',
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
              {stats.disciplineAvg != null && <span>Avg D {stats.disciplineAvg}</span>}
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
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by mood */}
        <div>
          <SectionHeader icon={Smile} label="Filter by mood" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {MOODS.map((mood) => {
              const isOn = filters.moods.includes(mood);
              return (
                <button
                  key={mood}
                  type="button"
                  onClick={() => toggleMood(mood)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isOn ? '1px solid rgba(0,214,143,.30)' : '1px solid var(--eb-border)',
                    background: isOn ? 'rgba(0,214,143,.14)' : 'var(--eb-panel-2)',
                    color: isOn ? 'var(--green)' : 'var(--eb-muted-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .1s, color .1s',
                  }}
                >
                  {mood}
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter by tag */}
        <div>
          <SectionHeader icon={Tag} label="Filter by tag" />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {TAGS.map((tag) => {
              const isOn = filters.tags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: 11,
                    padding: '3px 9px',
                    borderRadius: 99,
                    border: isOn ? '1px solid rgba(139,92,246,.30)' : '1px solid var(--eb-border)',
                    background: isOn ? 'rgba(139,92,246,.14)' : 'var(--eb-panel-2)',
                    color: isOn ? 'var(--eb-purple)' : 'var(--eb-muted-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'background .1s, color .1s',
                  }}
                >
                  {tag}
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
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => toggleDiscipline(value)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
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
    </div>
  );
}
