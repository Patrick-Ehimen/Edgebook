'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { journalApi } from '@/features/journal';
import type { JournalEntry, JournalStats, RecentEntry } from '@/features/journal';
import { NotebookPen, Sunrise, Zap, Moon, Star, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { PremarketModal } from './PremarketModal';
import { SessionMap } from '@/components/SessionMap';
import { JournalSidebar, DEFAULT_FILTERS } from './JournalSidebar';
import type { SidebarFilters } from './JournalSidebar';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0] ?? '';
}

function dateKey(dateStr: string) {
  return dateStr.slice(0, 10);
}

function fmtDate(dateStr: string) {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate().toString().padStart(2, '0'),
    mon: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

function biasChipStyle(bias: string | null | undefined): React.CSSProperties {
  if (bias === 'LONG')
    return { color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', background: 'rgba(0,214,143,.08)' };
  if (bias === 'SHORT')
    return { color: 'var(--eb-red)', borderColor: 'rgba(255,91,108,.30)', background: 'rgba(255,91,108,.08)' };
  return { color: 'var(--eb-muted)', borderColor: 'var(--eb-border)', background: 'var(--eb-panel-2)' };
}

// ─── sub-components ───────────────────────────────────────────────────────────

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
        ...style,
      }}
    >
      {children}
    </span>
  );
}

function EntryCard({
  entry,
  isToday,
}: {
  entry: JournalEntry | RecentEntry;
  isToday: boolean;
}) {
  const full = entry as JournalEntry;
  const { dow, day, mon } = fmtDate(entry.date);
  const moods: string[] = Array.isArray(full.moodTagsJson) ? (full.moodTagsJson as string[]) : [];
  const borderLeft =
    entry.bias === 'LONG'
      ? '3px solid var(--green)'
      : entry.bias === 'SHORT'
        ? '3px solid var(--eb-red)'
        : '3px solid var(--eb-muted)';

  const dateKey = entry.date.slice(0, 10);

  return (
    <Link
      href={`/journal/${dateKey}`}
      style={{
        background: 'var(--eb-panel)',
        border: `1px solid ${isToday ? 'rgba(0,214,143,.55)' : 'var(--eb-border)'}`,
        borderLeft,
        borderRadius: 11,
        overflow: 'hidden',
        boxShadow: isToday ? '0 0 0 3px rgba(0,214,143,.10)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        textDecoration: 'none',
        color: 'inherit',
        cursor: 'pointer',
        transition: 'border-color .12s, transform .08s',
      }}
    >
      {/* Head */}
      <div
        style={{
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          background: 'linear-gradient(180deg,rgba(255,255,255,.02),transparent)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: '0 0 52px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{dow}</div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em', fontFamily: 'var(--font-mono, monospace)' }}>{day}</div>
          <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{mon}</div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
            {entry.bias && <Chip style={biasChipStyle(entry.bias)}>{entry.bias}</Chip>}
            {isToday && (
              <Chip style={{ color: 'var(--eb-cyan)', borderColor: 'rgba(6,182,212,.30)', background: 'rgba(6,182,212,.08)' }}>
                ● Today · in progress
              </Chip>
            )}
          </div>
          <div style={{ fontSize: 11, color: 'var(--eb-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {full.conviction != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <Star
                    key={n}
                    size={10}
                    fill={n <= (full.conviction ?? 0) ? '#fbbf24' : 'none'}
                    color={n <= (full.conviction ?? 0) ? '#fbbf24' : 'var(--eb-border)'}
                  />
                ))}
              </span>
            )}
            {full.sleepHours != null && (
              <span>Sleep {Number(full.sleepHours).toFixed(1)}h</span>
            )}
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
        {full.intentMd && (
          <>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--eb-muted)', fontWeight: 600, marginBottom: 3 }}>
              Pre-market intent
            </div>
            <div
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {full.intentMd}
            </div>
          </>
        )}
        {entry.lesson && (
          <>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--eb-muted)', fontWeight: 600, marginTop: 8, marginBottom: 3 }}>
              Lesson
            </div>
            <div
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {entry.lesson}
            </div>
          </>
        )}
        {moods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {moods.map((m) => <Chip key={m}>{m}</Chip>)}
          </div>
        )}
      </div>

      {/* Foot */}
      <div
        style={{
          padding: '8px 14px',
          borderTop: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
          fontSize: 11,
          color: 'var(--eb-muted)',
          marginTop: 'auto',
        }}
      >
        {isToday ? '📊 Live · intent saved' : full.finalizedAt ? '📓 Full entry' : '📋 Intent only'}
      </div>
    </Link>
  );
}

function StatsBar({ stats }: { stats: JournalStats | undefined }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      {[
        {
          label: 'Journal streak',
          value: stats?.streak ? `${stats.streak}d` : '—',
          sub: stats?.streak ? 'Keep it going 🔥' : 'Start today',
          color: stats?.streak ? 'var(--green)' : 'var(--eb-muted)',
        },
        {
          label: 'Discipline avg (30D)',
          value: stats?.disciplineAvg != null ? String(stats.disciplineAvg) : '—',
          sub: 'Based on process scores',
          color: stats?.disciplineAvg != null ? 'var(--eb-text)' : 'var(--eb-muted)',
        },
        {
          label: 'Entries this month',
          value: stats?.entriesThisMonth != null ? String(stats.entriesThisMonth) : '—',
          sub: stats?.entriesThisMonth ? 'Keep it up' : 'Start today',
          color: stats?.entriesThisMonth ? 'var(--eb-text)' : 'var(--eb-muted)',
        },
      ].map(({ label, value, sub, color }) => (
        <div
          key={label}
          style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 10, padding: '12px 14px' }}
        >
          <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>
            {label}
          </div>
          <div style={{ fontSize: 22, fontWeight: 600, color, fontFamily: 'var(--font-mono, monospace)' }}>
            {value}
          </div>
          <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: Sunrise,
    title: 'Pre-market intent',
    desc: 'Lock in your bias, key levels, max risk, and plan before the first trade fires. Immutable once locked.',
    chip: 'Locked at first trade',
    chipColor: 'var(--eb-yellow)',
    chipBg: 'rgba(245,165,36,.08)',
    chipBorder: 'rgba(245,165,36,.3)',
  },
  {
    Icon: Zap,
    title: 'Live session',
    desc: "Mid-session notes, rule event log, and trade-by-trade checklist. Timestamps preserved.",
    chip: 'Trading active',
    chipColor: 'var(--green)',
    chipBg: 'rgba(0,214,143,.08)',
    chipBorder: 'rgba(0,214,143,.3)',
  },
  {
    Icon: Moon,
    title: 'End-of-day review',
    desc: "Score the day on process, capture the lesson, and set tomorrow's prep. Unlocks after session close.",
    chip: 'Unlocks at EOD',
    chipColor: 'var(--eb-muted-2)',
    chipBg: 'var(--eb-panel-2)',
    chipBorder: 'var(--eb-border)',
  },
];

function EmptyState({ onWrite, stats }: { onWrite: () => void; stats: JournalStats | undefined }) {
  return (
    <>
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: '52px 28px 40px',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.18))',
            display: 'inline-flex',
            color: 'var(--green)',
          }}
        >
          <NotebookPen size={54} />
        </div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          Start your trading journal
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            maxWidth: 500,
            margin: '0 auto 24px',
            lineHeight: 1.65,
            fontSize: 13.5,
          }}
        >
          Journaling is the single highest-ROI habit for active traders. Log your plan before the session, notes during, and review after. Edgebook locks entries after the first trade fires so you can&apos;t edit in hindsight.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
            maxWidth: 720,
            margin: '0 auto 28px',
          }}
        >
          {STEPS.map(({ Icon, title, desc, chip, chipColor, chipBg, chipBorder }, i) => (
            <div
              key={title}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 11,
                padding: '16px 14px',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: 14,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: i === 1 ? 'linear-gradient(135deg,var(--green),#06b6d4)' : 'var(--eb-panel)',
                  border: `1px solid ${i === 1 ? 'transparent' : 'var(--eb-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: i === 1 ? '#06140f' : 'var(--eb-muted)',
                }}
              >
                <Icon size={13} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5, marginBottom: 8 }}>{desc}</div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    border: `1px solid ${chipBorder}`,
                    background: chipBg,
                    color: chipColor,
                  }}
                >
                  {chip}
                </span>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={onWrite}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 20px',
            borderRadius: 9,
            border: '1px solid #00b67a',
            background: 'linear-gradient(180deg,#00e29a,#00b67a)',
            color: '#06140f',
            fontSize: 13.5,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <NotebookPen size={14} /> Write today&apos;s entry →
        </button>
      </div>

      <StatsBar stats={stats} />
    </>
  );
}

// ─── Journal browser ──────────────────────────────────────────────────────────

function applyFilters(
  entries: RecentEntry[],
  today: string,
  filters: SidebarFilters,
): RecentEntry[] {
  let result = entries;

  switch (filters.quickView) {
    case 'week': {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const cutoff = weekAgo.toISOString().slice(0, 10);
      result = result.filter((e) => dateKey(e.date) >= cutoff);
      break;
    }
    case 'month': {
      const monthStart = `${today.slice(0, 7)}-01`;
      result = result.filter((e) => dateKey(e.date) >= monthStart);
      break;
    }
    case 'lessons':
      result = result.filter((e) => e.lesson != null && e.lesson !== '');
      break;
    case 'green':
      result = result.filter((e) => e.bias === 'LONG');
      break;
    case 'red':
      result = result.filter((e) => e.bias === 'SHORT');
      break;
    case 'pinned':
    case 'violations':
    case 'low-sleep':
    case 'missed':
      break;
  }

  return result;
}

function JournalBrowser({
  todayEntry,
  recentEntries,
  stats,
  onWrite,
  today,
  sidebarOpen,
  onSidebarToggle,
  filters,
  onFiltersChange,
}: {
  todayEntry: JournalEntry | null;
  recentEntries: RecentEntry[];
  stats: JournalStats | undefined;
  onWrite: () => void;
  today: string;
  sidebarOpen: boolean;
  onSidebarToggle: () => void;
  filters: SidebarFilters;
  onFiltersChange: (f: SidebarFilters) => void;
}) {
  const filtered = useMemo(
    () => applyFilters(recentEntries, today, filters),
    [recentEntries, today, filters],
  );

  // deduplicate: don't show today in the recent list if we already have the full todayEntry
  const pastEntries = todayEntry
    ? filtered.filter((r) => dateKey(r.date) !== today)
    : filtered;

  const entryDates = useMemo(
    () => new Set(recentEntries.map((e) => dateKey(e.date))),
    [recentEntries],
  );

  const hasActiveFilters =
    filters.quickView !== 'all' ||
    filters.moods.length > 0 ||
    filters.tags.length > 0 ||
    filters.discipline !== null;

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 0 }}>
      {/* Main content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Banner */}
        {todayEntry && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '10px 14px',
              borderRadius: 9,
              background: 'linear-gradient(180deg,rgba(0,214,143,.08),rgba(0,214,143,.02))',
              border: '1px solid rgba(0,214,143,.30)',
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <span style={{ fontSize: 16 }}>📓</span>
            <span>
              <b style={{ color: 'var(--eb-text)' }}>Today&apos;s entry</b> is in progress · pre-market intent saved · live session active
            </span>
            <span style={{ marginLeft: 'auto' }} />
            <button
              type="button"
              onClick={onWrite}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #00b67a',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 11.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Update intent →
            </button>
          </div>
        )}

        {/* Stats */}
        <div style={{ marginBottom: 14 }}>
          <StatsBar stats={stats} />
        </div>

        {/* Session map */}
        <div style={{ marginBottom: 14 }}>
          <SessionMap compact />
        </div>

        {/* Toolbar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
            Showing <b style={{ color: 'var(--eb-text)' }}>
              {todayEntry ? pastEntries.length + 1 : pastEntries.length}
            </b>
            {hasActiveFilters ? ' filtered' : ' recent'} entries
          </span>
          <span style={{ marginLeft: 'auto' }} />
          {!todayEntry && (
            <button
              type="button"
              onClick={onWrite}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                borderRadius: 7,
                border: '1px solid #00b67a',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <NotebookPen size={12} /> Write today&apos;s entry
            </button>
          )}
          <button
            type="button"
            onClick={onSidebarToggle}
            title={sidebarOpen ? 'Close filters' : 'Open filters & navigation'}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '5px 10px',
              borderRadius: 7,
              border: sidebarOpen
                ? '1px solid rgba(0,214,143,.40)'
                : hasActiveFilters
                  ? '1px solid rgba(0,214,143,.40)'
                  : '1px solid var(--eb-border)',
              background: sidebarOpen
                ? 'rgba(0,214,143,.10)'
                : hasActiveFilters
                  ? 'rgba(0,214,143,.08)'
                  : 'var(--eb-panel-2)',
              color: sidebarOpen || hasActiveFilters ? 'var(--green)' : 'var(--eb-muted-2)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <SlidersHorizontal size={13} />
            Filters
            {hasActiveFilters && (
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: '1px 5px',
                  borderRadius: 99,
                  background: 'var(--green)',
                  color: '#06140f',
                  lineHeight: 1.4,
                }}
              >
                {[filters.quickView !== 'all' ? 1 : 0, filters.moods.length, filters.tags.length, filters.discipline ? 1 : 0].reduce((a, b) => a + b, 0)}
              </span>
            )}
          </button>
        </div>

        {/* Cards grid — today always first */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {todayEntry && <EntryCard entry={todayEntry} isToday />}
          {pastEntries.map((r) => (
            <EntryCard key={r.id} entry={r as unknown as JournalEntry} isToday={false} />
          ))}
        </div>
      </div>

      {/* Right sidebar */}
      <JournalSidebar
        open={sidebarOpen}
        onClose={onSidebarToggle}
        filters={filters}
        onChange={onFiltersChange}
        entryDates={entryDates}
        stats={stats}
      />
    </div>
  );
}

// ─── Root client ──────────────────────────────────────────────────────────────

export function JournalClient() {
  const today = todayStr();
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [filters, setFilters] = useState<SidebarFilters>(DEFAULT_FILTERS);

  const { data: stats } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.getStats(),
  });

  const { data: todayEntry = null } = useQuery({
    queryKey: ['journal-entry', today],
    queryFn: () => journalApi.getEntry(today),
  });

  const { data: recentEntries = [], isPending: recentPending } = useQuery({
    queryKey: ['journal-recent'],
    queryFn: () => journalApi.listRecent(),
  });

  // Wait for the entries query to settle before deciding which view to show.
  // Without this, recentEntries defaults to [] and the empty state flashes on every load.
  const hasEntries = !recentPending && recentEntries.length > 0;

  return (
    <>
      <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
        {/* Page header */}
        <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
          Coaching / Daily journal
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
              Daily journal
            </h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)' }}>
              Three-step ritual — plan, trade, review.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <NotebookPen size={13} /> Write today&apos;s entry
          </button>
        </div>

        {recentPending ? null : hasEntries ? (
          <JournalBrowser
            todayEntry={todayEntry as JournalEntry | null}
            recentEntries={recentEntries}
            stats={stats}
            onWrite={() => setModalOpen(true)}
            today={today}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen((v) => !v)}
            filters={filters}
            onFiltersChange={setFilters}
          />
        ) : (
          <EmptyState onWrite={() => setModalOpen(true)} stats={stats} />
        )}
      </div>

      <PremarketModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        todayStr={today}
      />
    </>
  );
}
