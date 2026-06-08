'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { journalApi } from '@/features/journal';
import type { JournalEntry, JournalStats, RecentEntry } from '@/features/journal';
import {
  NotebookPen, Compass, Zap, Moon, Star, SlidersHorizontal,
  Search, LayoutGrid, List, CalendarDays, Activity,
  ChevronLeft, ChevronRight, TrendingUp, TrendingDown,
  Radio, BookOpen, FileText,
} from 'lucide-react';
import Link from 'next/link';
import { PremarketModal } from './PremarketModal';
import { SessionMap } from '@/components/SessionMap';
import { JournalSidebar, DEFAULT_FILTERS } from './JournalSidebar';
import type { SidebarFilters } from './JournalSidebar';
import { getMoodTag } from './journal-constants';

// ─── types ────────────────────────────────────────────────────────────────────

type ViewMode = 'cards' | 'list' | 'calendar' | 'timeline';

// ─── helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().split('T')[0] ?? '';
}

function dateKey(s: string) {
  return s.slice(0, 10);
}

function fmtDate(dateStr: string) {
  const d = new Date(`${dateStr.slice(0, 10)}T00:00:00`);
  return {
    dow: d.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase(),
    day: d.getDate().toString().padStart(2, '0'),
    mon: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
  };
}

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getMondayOffset(year: number, month: number) {
  return (new Date(year, month, 1).getDay() + 6) % 7;
}

function weekStart(dateStr: string): string {
  const d = new Date(`${dateStr}T00:00:00`);
  const mon = new Date(d);
  mon.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return mon.toISOString().slice(0, 10);
}

function weekRangeLabel(ws: string, today: string): string {
  const tw = weekStart(today);
  if (ws === tw) return 'This week';
  const prev = new Date(`${tw}T00:00:00`);
  prev.setDate(prev.getDate() - 7);
  if (ws === prev.toISOString().slice(0, 10)) return 'Last week';
  const s = new Date(`${ws}T00:00:00`);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${s.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · ${fmt(s)} – ${fmt(e)}`;
}

function applyFilters(entries: RecentEntry[], today: string, filters: SidebarFilters): RecentEntry[] {
  let r = entries;
  switch (filters.quickView) {
    case 'week': {
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const c = cutoff.toISOString().slice(0, 10);
      r = r.filter(e => dateKey(e.date) >= c);
      break;
    }
    case 'month':
      r = r.filter(e => dateKey(e.date) >= `${today.slice(0, 7)}-01`);
      break;
    case 'lessons':
      r = r.filter(e => e.lesson != null && e.lesson !== '');
      break;
    case 'green':
      r = r.filter(e => e.bias === 'LONG');
      break;
    case 'red':
      r = r.filter(e => e.bias === 'SHORT');
      break;
  }
  return r;
}

function applySearch(entries: RecentEntry[], q: string): RecentEntry[] {
  const lq = q.toLowerCase();
  return entries.filter(e => {
    const full = e as unknown as JournalEntry;
    return (
      e.date.includes(lq) ||
      (e.lesson?.toLowerCase().includes(lq) ?? false) ||
      (full.intentMd?.toLowerCase().includes(lq) ?? false)
    );
  });
}

function biasChip(bias: string | null | undefined): React.CSSProperties {
  if (bias === 'LONG') return { color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', background: 'rgba(0,214,143,.08)' };
  if (bias === 'SHORT') return { color: 'var(--eb-red)', borderColor: 'rgba(255,91,108,.30)', background: 'rgba(255,91,108,.08)' };
  return { color: 'var(--eb-muted)', borderColor: 'var(--eb-border)', background: 'var(--eb-panel-2)' };
}

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      fontSize: 11, padding: '2px 8px', borderRadius: 99,
      border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)',
      color: 'var(--eb-muted-2)', ...style,
    }}>
      {children}
    </span>
  );
}

// ─── Cards view ───────────────────────────────────────────────────────────────

function EntryCard({ entry, isToday }: { entry: JournalEntry | RecentEntry; isToday: boolean }) {
  const full = entry as JournalEntry;
  const { dow, day, mon } = fmtDate(entry.date);
  const moods: string[] = Array.isArray(full.moodTagsJson) ? (full.moodTagsJson as string[]) : [];
  const borderLeft = entry.bias === 'LONG' ? '3px solid var(--green)' : entry.bias === 'SHORT' ? '3px solid #ef4444' : '3px solid var(--eb-muted)';
  const dk = entry.date.slice(0, 10);

  // Dynamic colors for "Today" highlight based on bias
  const todayColor = entry.bias === 'LONG' ? '0,214,143' : entry.bias === 'SHORT' ? '239,68,68' : '122,131,149';
  const todayBorder = isToday ? `rgba(${todayColor},.55)` : 'var(--eb-border)';
  const todayGlow = isToday ? `0 0 0 3px rgba(${todayColor},.10)` : undefined;

  return (
    <Link href={`/journal/${dk}`} style={{
      background: 'var(--eb-panel)',
      border: `1px solid ${todayBorder}`,
      borderLeft, borderRadius: 11, overflow: 'hidden',
      boxShadow: todayGlow,
      display: 'flex', flexDirection: 'column', textDecoration: 'none',
      color: 'inherit', cursor: 'pointer', transition: 'border-color .12s, transform .08s',
    }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'flex-start', gap: 10, background: 'linear-gradient(180deg,rgba(255,255,255,.02),transparent)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: '0 0 52px', textAlign: 'center' }}>
          <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{dow}</div>
          <div style={{ fontSize: 24, fontWeight: 700, lineHeight: 1, letterSpacing: '-.02em', fontFamily: 'var(--font-mono, monospace)' }}>{day}</div>
          <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{mon}</div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 5 }}>
            {entry.bias && <Chip style={biasChip(entry.bias)}>{entry.bias}</Chip>}
            {isToday && <Chip style={{ color: 'var(--eb-cyan)', borderColor: 'rgba(6,182,212,.30)', background: 'rgba(6,182,212,.08)' }}>● Today · in progress</Chip>}
          </div>
          <div style={{ fontSize: 11, color: 'var(--eb-muted)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {full.conviction != null && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                {([1, 2, 3, 4, 5] as const).map(n => (
                  <Star key={n} size={10} fill={n <= (full.conviction ?? 0) ? '#fbbf24' : 'none'} color={n <= (full.conviction ?? 0) ? '#fbbf24' : 'var(--eb-border)'} />
                ))}
              </span>
            )}
            {full.sleepHours != null && <span>Sleep {Number(full.sleepHours).toFixed(1)}h</span>}
          </div>
        </div>
      </div>
      <div style={{ padding: '0 14px 12px', fontSize: 12, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
        {full.intentMd && (
          <>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--eb-muted)', fontWeight: 600, marginBottom: 3 }}>Pre-market intent</div>
            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{full.intentMd}</div>
          </>
        )}
        {entry.lesson && (
          <>
            <div style={{ fontSize: 9.5, textTransform: 'uppercase', letterSpacing: '.06em', color: 'var(--eb-muted)', fontWeight: 600, marginTop: 8, marginBottom: 3 }}>Lesson</div>
            <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{entry.lesson}</div>
          </>
        )}
        {moods.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {moods.map(m => {
              const tag = getMoodTag(m);
              return (
                <Chip key={m} style={tag ? { color: tag.color, background: tag.bg, borderColor: tag.border } : {}}>
                  {m}
                </Chip>
              );
            })}
          </div>
        )}
      </div>
      <div style={{ padding: '8px 14px', borderTop: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', fontSize: 11, color: 'var(--eb-muted)', marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
        {isToday
          ? <><Radio size={11} style={{ color: 'var(--eb-cyan)' }} /> Live · intent saved</>
          : full.finalizedAt
            ? <><BookOpen size={11} /> Full entry</>
            : <><FileText size={11} /> Intent only</>
        }
      </div>
    </Link>
  );
}

// ─── List view ────────────────────────────────────────────────────────────────

function ListRow({ entry, isToday }: { entry: RecentEntry; isToday: boolean }) {
  const full = entry as unknown as JournalEntry;
  const dk = entry.date.slice(0, 10);
  const { dow, day, mon } = fmtDate(entry.date);
  const dotColor = entry.bias === 'LONG' ? 'var(--green)' : entry.bias === 'SHORT' ? '#ef4444' : 'var(--eb-muted)';
  const excerpt = full.intentMd || entry.lesson || null;

  // Dynamic background for "Today" based on bias
  const todayBgColor = entry.bias === 'LONG' ? '0,214,143' : entry.bias === 'SHORT' ? '239,68,68' : '122,131,149';
  const background = isToday ? `linear-gradient(90deg,rgba(${todayBgColor},.07),transparent)` : 'var(--eb-panel)';

  return (
    <Link href={`/journal/${dk}`} style={{
      display: 'grid',
      gridTemplateColumns: '10px 84px 1fr auto 18px',
      gap: 14, alignItems: 'center',
      padding: '11px 16px',
      background,
      textDecoration: 'none', color: 'inherit', cursor: 'pointer',
      transition: 'background .1s',
      borderBottom: '1px solid var(--eb-border)',
    }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: dotColor }} />
      <div style={{ fontFamily: 'var(--font-mono, monospace)' }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>{mon} {day}</div>
        <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{dow}{isToday ? ' · today' : ''}</div>
      </div>
      <div style={{ minWidth: 0 }}>
        {excerpt
          ? <div style={{ fontSize: 12.5, color: 'var(--eb-text)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{excerpt}</div>
          : <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', fontStyle: 'italic' }}>No entry yet</div>
        }
        {full.sleepHours != null && (
          <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>😴 {Number(full.sleepHours).toFixed(1)}h sleep</div>
        )}
      </div>
      {entry.bias
        ? <Chip style={biasChip(entry.bias)}>{entry.bias}</Chip>
        : <span />
      }
      <ChevronRight size={13} style={{ color: 'var(--eb-border)' }} />
    </Link>
  );
}

function ListView({ entries, todayEntry, today }: { entries: RecentEntry[]; todayEntry: JournalEntry | null; today: string }) {
  const rows = todayEntry
    ? [todayEntry as unknown as RecentEntry, ...entries.filter(e => e.date.slice(0, 10) !== today)]
    : entries;

  if (rows.length === 0) {
    return <EmptyResults />;
  }

  return (
    <div style={{ border: '1px solid var(--eb-border)', borderRadius: 10, overflow: 'hidden' }}>
      {rows.map(e => <ListRow key={e.id} entry={e} isToday={e.date.slice(0, 10) === today} />)}
    </div>
  );
}

// ─── Calendar view ────────────────────────────────────────────────────────────

const CAL_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function CalendarView({ entries, today }: { entries: RecentEntry[]; today: string }) {
  const now = new Date(`${today}T00:00:00`);
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const router = useRouter();

  const entryMap = useMemo(() => {
    const m: Record<string, RecentEntry> = {};
    for (const e of entries) m[e.date.slice(0, 10)] = e;
    return m;
  }, [entries]);

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
  for (let i = 0; i < offset; i++) cells.push(<div key={`gap-${i}`} />);

  for (let d = 1; d <= total; d++) {
    const ds = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const entry = entryMap[ds];
    const isToday = ds === today;
    const isFuture = ds > today;
    const isWin = entry?.bias === 'LONG';
    const isLoss = entry?.bias === 'SHORT';
    const isNeutral = entry?.bias === 'NEUTRAL';
    const full = entry as unknown as JournalEntry | undefined;
    const excerpt = full?.intentMd || entry?.lesson;

    // Dynamic colors for "Today" highlight based on bias
    const todayColor = entry?.bias === 'LONG' ? 'var(--green)' : entry?.bias === 'SHORT' ? 'var(--eb-red)' : 'var(--eb-muted)';
    const todayGlow = entry?.bias === 'LONG' ? 'rgba(0,214,143,.18)' : entry?.bias === 'SHORT' ? 'rgba(255,91,108,.18)' : 'rgba(122,131,149,.18)';

    cells.push(
      <div
        key={ds}
        role={entry && !isFuture ? 'button' : undefined}
        tabIndex={entry && !isFuture ? 0 : undefined}
        onClick={() => !isFuture && entry && router.push(`/journal/${ds}`)}
        onKeyDown={e => e.key === 'Enter' && !isFuture && entry && router.push(`/journal/${ds}`)}
        title={excerpt ? excerpt.slice(0, 80) : ds}
        style={{
          aspectRatio: '1.05',
          borderRadius: 9,
          border: isToday
            ? `2px solid ${todayColor}`
            : isWin ? '1px solid rgba(0,214,143,.30)'
            : isLoss ? '1px solid rgba(255,91,108,.30)'
            : '1px solid var(--eb-border)',
          background: isWin
            ? 'linear-gradient(180deg,rgba(0,214,143,.16),rgba(0,214,143,.04))'
            : isLoss
              ? 'linear-gradient(180deg,rgba(255,91,108,.12),rgba(255,91,108,.03))'
              : entry ? 'var(--eb-panel)' : 'transparent',
          padding: '7px 8px 6px',
          display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
          cursor: entry && !isFuture ? 'pointer' : 'default',
          opacity: isFuture ? 0.3 : 1,
          boxShadow: isToday ? `0 0 0 2px ${todayGlow}` : undefined,
          transition: 'transform .1s',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <span style={{
            fontSize: 11.5, fontWeight: isToday ? 700 : 500,
            color: isToday ? todayColor : isFuture ? 'var(--eb-border)' : 'var(--eb-muted-2)',
            fontFamily: 'var(--font-mono, monospace)',
          }}>{d}</span>
          {entry && (
            <div style={{ display: 'flex', gap: 2, paddingTop: 2 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--eb-cyan)', display: 'block' }} />
              {entry.lesson && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--eb-purple)', display: 'block' }} />}
            </div>
          )}
        </div>
        {entry && !isFuture && (
          <div style={{
            fontSize: 10.5, fontWeight: 600, lineHeight: 1,
            color: isWin ? 'var(--green)' : isLoss ? 'var(--eb-red)' : 'var(--eb-muted)',
            fontFamily: 'var(--font-mono, monospace)',
          }}>
            {isWin ? 'L' : isLoss ? 'S' : '·'}
            {isToday && <span style={{ fontSize: 9, color: 'var(--eb-cyan)', marginLeft: 3 }}>live</span>}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>{monthLabel}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--eb-muted)', marginRight: 4 }}>
            {[
              { bg: 'rgba(0,214,143,.40)', label: 'Long' },
              { bg: 'rgba(255,91,108,.35)', label: 'Short' },
              { bg: 'var(--eb-cyan)', label: 'Journaled', dot: true },
            ].map(({ bg, label, dot }) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: dot ? 6 : 9, height: dot ? 6 : 9, borderRadius: dot ? '50%' : 2, background: bg, display: 'inline-block', flexShrink: 0 }} />
                {label}
              </span>
            ))}
          </div>
          <button type="button" onClick={prev} style={{ background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <ChevronLeft size={14} />
          </button>
          <button type="button" onClick={next} style={{ background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 28, height: 28, borderRadius: 7, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 2, marginBottom: 4 }}>
        {CAL_DAYS.map(d => (
          <div key={d} style={{ textAlign: 'center', fontSize: 10, color: 'var(--eb-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em', padding: '4px 0' }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {cells}
      </div>
    </div>
  );
}

// ─── Timeline view ────────────────────────────────────────────────────────────

function TimelineView({ entries, todayEntry, today }: { entries: RecentEntry[]; todayEntry: JournalEntry | null; today: string }) {
  const all = useMemo(() => {
    return todayEntry
      ? [todayEntry as unknown as RecentEntry, ...entries.filter(e => e.date.slice(0, 10) !== today)]
      : [...entries];
  }, [entries, todayEntry, today]);

  const groups = useMemo(() => {
    const map = new Map<string, RecentEntry[]>();
    for (const e of all) {
      const ws = weekStart(e.date.slice(0, 10));
      const arr = map.get(ws) ?? [];
      arr.push(e);
      map.set(ws, arr);
    }
    return Array.from(map.entries()).map(([ws, items]) => ({ ws, label: weekRangeLabel(ws, today), items }));
  }, [all, today]);

  if (groups.length === 0) return <EmptyResults />;

  return (
    <div style={{ position: 'relative', paddingLeft: 34 }}>
      <div style={{ position: 'absolute', left: 10, top: 8, bottom: 8, width: 2, background: 'var(--eb-border)', borderRadius: 1 }} />
      {groups.map(({ ws, label, items }) => (
        <div key={ws} style={{ marginBottom: 26 }}>
          <div style={{ fontSize: 10.5, fontWeight: 600, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 10 }}>
            {label}
          </div>
          {items.map(e => {
            const full = e as unknown as JournalEntry;
            const dk = e.date.slice(0, 10);
            const isToday = dk === today;
            const isWin = e.bias === 'LONG';
            const isLoss = e.bias === 'SHORT';
            const dotBg = isToday
              ? (e.bias === 'LONG' ? 'linear-gradient(135deg,var(--green),var(--eb-cyan))' : e.bias === 'SHORT' ? 'linear-gradient(135deg,#ef4444,#b91c1c)' : 'linear-gradient(135deg,var(--eb-muted),var(--eb-border))')
              : isWin ? 'var(--green)' : isLoss ? '#ef4444' : 'var(--eb-muted)';
            const todayGlow = e.bias === 'LONG' ? 'rgba(0,214,143,.18)' : e.bias === 'SHORT' ? 'rgba(239,68,68,.18)' : 'rgba(122,131,149,.18)';
            const excerpt = full.intentMd || e.lesson;
            const moods: string[] = Array.isArray(full.moodTagsJson) ? (full.moodTagsJson as string[]) : [];
            const { dow, day, mon } = fmtDate(dk);

            return (
              <Link key={e.id} href={`/journal/${dk}`} style={{
                position: 'relative', display: 'flex', gap: 14,
                alignItems: 'flex-start', paddingBottom: 10, paddingTop: 2,
                textDecoration: 'none', color: 'inherit',
              }}>
                <div style={{
                  position: 'absolute', left: -28, top: 9,
                  width: 10, height: 10, borderRadius: '50%',
                  background: dotBg, border: '2px solid var(--eb-bg, #0a0e14)',
                  boxShadow: isToday ? `0 0 0 3px ${todayGlow}` : undefined,
                }} />
                <div style={{
                  flex: '0 0 60px', textAlign: 'center',
                  fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
                  color: 'var(--eb-muted)', paddingTop: 4, lineHeight: 1.4,
                }}>
                  <b style={{ display: 'block', fontSize: 13, color: 'var(--eb-text)', fontWeight: 700 }}>{dow} {day}</b>
                  {mon}
                </div>
                <div style={{
                  flex: 1, minWidth: 0,
                  background: 'var(--eb-panel)',
                  border: `1px solid ${isToday ? (e.bias === 'LONG' ? 'rgba(0,214,143,.35)' : e.bias === 'SHORT' ? 'rgba(239,68,68,.35)' : 'rgba(122,131,149,.35)') : 'var(--eb-border)'}`,
                  borderRadius: 9, padding: '10px 14px',
                  transition: 'border-color .12s',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: excerpt ? 6 : 0 }}>
                    {e.bias && <Chip style={biasChip(e.bias)}>{e.bias}</Chip>}
                    {isToday && <Chip style={{ color: 'var(--eb-cyan)', borderColor: 'rgba(6,182,212,.30)', background: 'rgba(6,182,212,.08)' }}>● live</Chip>}
                    {full.sleepHours != null && <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>😴 {Number(full.sleepHours).toFixed(1)}h</span>}
                  </div>
                  {excerpt && (
                    <div style={{
                      fontSize: 12, color: 'var(--eb-muted-2)', lineHeight: 1.5,
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
                    }}>{excerpt}</div>
                  )}
                  {moods.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 6 }}>
                      {moods.map(m => {
                        const tag = getMoodTag(m);
                        return (
                          <Chip key={m} style={tag ? { color: tag.color, background: tag.bg, borderColor: tag.border } : {}}>
                            {m}
                          </Chip>
                        );
                      })}
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Empty results (filtered) ─────────────────────────────────────────────────

function EmptyResults() {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--eb-muted)', fontSize: 13 }}>
      No entries match your filters.
    </div>
  );
}

// ─── Stats bar ────────────────────────────────────────────────────────────────

function StatsBar({ stats }: { stats: JournalStats | undefined }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
      {[
        { label: 'Journal streak', value: stats?.streak ? `${stats.streak}d` : '—', sub: stats?.streak ? 'Keep it going 🔥' : 'Start today', color: stats?.streak ? 'var(--green)' : 'var(--eb-muted)' },
        { label: 'Discipline avg (30D)', value: stats?.disciplineAvg != null ? String(stats.disciplineAvg) : '—', sub: 'Based on process scores', color: stats?.disciplineAvg != null ? 'var(--eb-text)' : 'var(--eb-muted)' },
        { label: 'Entries this month', value: stats?.entriesThisMonth != null ? String(stats.entriesThisMonth) : '—', sub: stats?.entriesThisMonth ? 'Keep it up' : 'Start today', color: stats?.entriesThisMonth ? 'var(--eb-text)' : 'var(--eb-muted)' },
      ].map(({ label, value, sub, color }) => (
        <div key={label} style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 10, padding: '12px 14px' }}>
          <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 4 }}>{label}</div>
          <div style={{ fontSize: 22, fontWeight: 600, color, fontFamily: 'var(--font-mono, monospace)' }}>{value}</div>
          <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>{sub}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Empty state (no entries at all) ─────────────────────────────────────────

const STEPS = [
  { Icon: Compass, title: 'Pre-market intent', desc: 'Lock in your bias, key levels, max risk, and plan before the first trade fires. Immutable once locked.', chip: 'Locked at first trade', chipColor: 'var(--eb-yellow)', chipBg: 'rgba(245,165,36,.08)', chipBorder: 'rgba(245,165,36,.3)' },
  { Icon: Zap, title: 'Live session', desc: 'Mid-session notes, rule event log, and trade-by-trade checklist. Timestamps preserved.', chip: 'Trading active', chipColor: 'var(--green)', chipBg: 'rgba(0,214,143,.08)', chipBorder: 'rgba(0,214,143,.3)' },
  { Icon: Moon, title: 'End-of-day review', desc: "Score the day on process, capture the lesson, and set tomorrow's prep. Unlocks after session close.", chip: 'Unlocks at EOD', chipColor: 'var(--eb-muted-2)', chipBg: 'var(--eb-panel-2)', chipBorder: 'var(--eb-border)' },
];

function EmptyState({ onWrite, stats }: { onWrite: () => void; stats: JournalStats | undefined }) {
  return (
    <>
      <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 13, padding: '52px 28px 40px', textAlign: 'center', marginBottom: 14 }}>
        <div style={{ marginBottom: 8, filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.18))', display: 'inline-flex', color: 'var(--green)' }}>
          <NotebookPen size={54} />
        </div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>Start your trading journal</h2>
        <p style={{ color: 'var(--eb-muted-2)', maxWidth: 500, margin: '0 auto 24px', lineHeight: 1.65, fontSize: 13.5 }}>
          Journaling is the single highest-ROI habit for active traders. Log your plan before the session, notes during, and review after. Edgebook locks entries after the first trade fires so you can&apos;t edit in hindsight.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 720, margin: '0 auto 28px' }}>
          {STEPS.map(({ Icon, title, desc, chip, chipColor, chipBg, chipBorder }, i) => (
            <div key={title} style={{ background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '16px 14px', textAlign: 'left', position: 'relative' }}>
              <div style={{ position: 'absolute', top: -12, left: 14, width: 28, height: 28, borderRadius: '50%', background: i === 1 ? 'linear-gradient(135deg,var(--green),#06b6d4)' : 'var(--eb-panel)', border: `1px solid ${i === 1 ? 'transparent' : 'var(--eb-border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 1 ? '#06140f' : 'var(--eb-muted)' }}>
                <Icon size={13} />
              </div>
              <div style={{ marginTop: 14 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5, marginBottom: 8 }}>{desc}</div>
                <span style={{ display: 'inline-flex', alignItems: 'center', fontSize: 11, padding: '2px 8px', borderRadius: 99, border: `1px solid ${chipBorder}`, background: chipBg, color: chipColor }}>{chip}</span>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={onWrite} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 9, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00e29a,#00b67a)', color: '#06140f', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <NotebookPen size={14} /> Write today&apos;s entry →
        </button>
      </div>
      <StatsBar stats={stats} />
    </>
  );
}

// ─── View toggle ──────────────────────────────────────────────────────────────

const VIEWS: { id: ViewMode; Icon: typeof LayoutGrid; label: string }[] = [
  { id: 'cards',    Icon: LayoutGrid,  label: 'Cards'    },
  { id: 'list',     Icon: List,        label: 'List'     },
  { id: 'calendar', Icon: CalendarDays, label: 'Cal'     },
  { id: 'timeline', Icon: Activity,    label: 'Timeline' },
];

// ─── Journal browser ──────────────────────────────────────────────────────────

function JournalBrowser({
  todayEntry, recentEntries, stats, onWrite, today,
  sidebarOpen, onSidebarToggle, filters, onFiltersChange,
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
  const [view, setView] = useState<ViewMode>('cards');
  const [search, setSearch] = useState('');

  const entryDates = useMemo(() => new Set(recentEntries.map(e => dateKey(e.date))), [recentEntries]);

  const filtered = useMemo(() => {
    let r = applyFilters(recentEntries, today, filters);
    if (search.trim()) r = applySearch(r, search.trim());
    return r;
  }, [recentEntries, today, filters, search]);

  const pastEntries = todayEntry
    ? filtered.filter(r => dateKey(r.date) !== today)
    : filtered;

  const displayCount = todayEntry ? pastEntries.length + 1 : pastEntries.length;

  const hasActiveFilters =
    filters.quickView !== 'all' || filters.moods.length > 0 ||
    filters.tags.length > 0 || filters.discipline !== null;

  const activeFilterCount = [
    filters.quickView !== 'all' ? 1 : 0,
    filters.moods.length,
    filters.tags.length,
    filters.discipline ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div>
      {/* Banner — today in progress */}
      {todayEntry && (() => {
        const bc = todayEntry.bias === 'LONG' ? '0,214,143' : todayEntry.bias === 'SHORT' ? '239,68,68' : '122,131,149';
        const accent = todayEntry.bias === 'LONG' ? 'var(--green)' : todayEntry.bias === 'SHORT' ? '#ef4444' : 'var(--eb-muted)';
        const Icon = todayEntry.bias === 'LONG' ? TrendingUp : todayEntry.bias === 'SHORT' ? TrendingDown : Activity;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 9, background: `linear-gradient(180deg,rgba(${bc},.08),rgba(${bc},.02))`, border: `1px solid rgba(${bc},.30)`, marginBottom: 14, fontSize: 12 }}>
            <Icon size={16} style={{ color: accent }} />
            <span><b style={{ color: 'var(--eb-text)' }}>Today&apos;s entry</b> is in progress · pre-market intent saved · live session active</span>
            <span style={{ marginLeft: 'auto' }} />
            <button
              type="button"
              onClick={onWrite}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 6,
                border: `1px solid ${accent}`,
                background: todayEntry.bias === 'LONG' ? 'linear-gradient(180deg,#00d68f,#00b67a)' : todayEntry.bias === 'SHORT' ? 'linear-gradient(180deg,#ef4444,#b91c1c)' : 'linear-gradient(180deg,var(--eb-muted-2),var(--eb-muted))',
                color: todayEntry.bias === 'NEUTRAL' ? 'var(--eb-text)' : '#06140f',
                fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit'
              }}
            >
              Update intent →
            </button>
          </div>
        );
      })()}

      {/* Stats */}
      <div style={{ marginBottom: 14 }}><StatsBar stats={stats} /></div>

      {/* Session map */}
      <div style={{ marginBottom: 14 }}><SessionMap compact /></div>

      {/* ── Toolbar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        marginBottom: 16, flexWrap: 'wrap',
        padding: '10px 14px',
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 10,
      }}>
        {/* Search */}
        <div style={{
          flex: 1, minWidth: 180, maxWidth: 360,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
          borderRadius: 8, padding: '6px 10px', color: 'var(--eb-muted)',
        }}>
          <Search size={13} style={{ flexShrink: 0 }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search entries…"
            style={{
              flex: 1, background: 'transparent', border: 0, outline: 'none',
              color: 'var(--eb-text)', fontSize: 12.5, fontFamily: 'inherit',
            }}
          />
          {search
            ? (
              <button type="button" onClick={() => setSearch('')} style={{ background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: '0 2px', fontSize: 13, lineHeight: 1 }}>✕</button>
            )
            : (
              <span style={{ fontSize: 10.5, padding: '1px 5px', border: '1px solid var(--eb-border)', borderRadius: 4, color: 'var(--eb-muted)', fontFamily: 'inherit', lineHeight: 1.6 }}>/</span>
            )
          }
        </div>

        {/* Result count */}
        <span style={{ fontSize: 12, color: 'var(--eb-muted)', whiteSpace: 'nowrap' }}>
          <b style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>{displayCount}</b>{' '}
          {hasActiveFilters || search ? 'filtered' : 'recent'} entries
        </span>

        <span style={{ marginLeft: 'auto' }} />

        {/* View toggle */}
        <div style={{
          display: 'inline-flex', background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)', borderRadius: 8,
          padding: 3, gap: 1,
        }}>
          {VIEWS.map(({ id, Icon, label }) => {
            const on = view === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setView(id)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                  background: on ? 'var(--eb-bg, #0a0e14)' : 'transparent',
                  border: on ? '1px solid var(--eb-border)' : '1px solid transparent',
                  color: on ? 'var(--eb-text)' : 'var(--eb-muted)',
                  padding: '5px 10px', borderRadius: 5, cursor: 'pointer',
                  fontSize: 12, fontFamily: 'inherit',
                  transition: 'background .1s, color .1s',
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,.25)' : undefined,
                }}
              >
                <Icon size={13} />
                {label}
              </button>
            );
          })}
        </div>

        {/* Write button */}
        {!todayEntry && (
          <button type="button" onClick={onWrite} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <NotebookPen size={12} /> Today
          </button>
        )}

        {/* Filters button */}
        <button
          type="button"
          onClick={onSidebarToggle}
          title={sidebarOpen ? 'Close filters' : 'Open filters & navigation'}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '5px 10px', borderRadius: 7,
            border: sidebarOpen || hasActiveFilters ? '1px solid rgba(0,214,143,.40)' : '1px solid var(--eb-border)',
            background: sidebarOpen || hasActiveFilters ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
            color: sidebarOpen || hasActiveFilters ? 'var(--green)' : 'var(--eb-muted-2)',
            fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && (
            <span style={{ fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 99, background: 'var(--green)', color: '#06140f', lineHeight: 1.4 }}>
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* ── Active view ──────────────────────────────────────────────────────── */}
      {view === 'cards' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
          {todayEntry && <EntryCard entry={todayEntry} isToday />}
          {pastEntries.length === 0 && !todayEntry && <EmptyResults />}
          {pastEntries.map(r => <EntryCard key={r.id} entry={r as unknown as JournalEntry} isToday={false} />)}
        </div>
      )}

      {view === 'list' && (
        <ListView entries={pastEntries} todayEntry={todayEntry} today={today} />
      )}

      {view === 'calendar' && (
        <CalendarView entries={filtered} today={today} />
      )}

      {view === 'timeline' && (
        <TimelineView entries={pastEntries} todayEntry={todayEntry} today={today} />
      )}

      {/* Sidebar overlay */}
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

  const { data: stats } = useQuery({ queryKey: ['journal-stats'], queryFn: () => journalApi.getStats() });
  const { data: todayEntry = null } = useQuery({ queryKey: ['journal-entry', today], queryFn: () => journalApi.getEntry(today) });
  const { data: recentEntries = [], isPending: recentPending } = useQuery({ queryKey: ['journal-recent'], queryFn: () => journalApi.listRecent() });

  const hasEntries = !recentPending && recentEntries.length > 0;

  return (
    <>
      <div style={{ padding: '22px 32px 60px', maxWidth: 1600, width: '100%', alignSelf: 'center' }}>
        <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>Coaching / Daily journal</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>Daily journal</h1>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)' }}>Three-step ritual — plan, trade, review.</p>
          </div>
          {!todayEntry && (
            <button type="button" onClick={() => setModalOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <NotebookPen size={13} /> Write today&apos;s entry
            </button>
          )}
        </div>

        {recentPending ? null : hasEntries ? (
          <JournalBrowser
            todayEntry={todayEntry as JournalEntry | null}
            recentEntries={recentEntries}
            stats={stats}
            onWrite={() => setModalOpen(true)}
            today={today}
            sidebarOpen={sidebarOpen}
            onSidebarToggle={() => setSidebarOpen(v => !v)}
            filters={filters}
            onFiltersChange={setFilters}
          />
        ) : (
          <EmptyState onWrite={() => setModalOpen(true)} stats={stats} />
        )}
      </div>

      <PremarketModal open={modalOpen} onClose={() => setModalOpen(false)} todayStr={today} existingEntry={todayEntry as JournalEntry | null} />
    </>
  );
}
