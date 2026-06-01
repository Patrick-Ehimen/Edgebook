'use client';

import { useAccounts } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import { TradeCalendar } from '../_components/TradeCalendar';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const calDayBase: React.CSSProperties = {
  aspectRatio: '1.05', borderRadius: 7, padding: '6px 7px',
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
  fontSize: 10.5,
};

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '6px 11px', borderRadius: 7,
  border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)',
  color: 'var(--eb-text)', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
};

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 12,
  padding: 16,
};

export default function CalendarPage() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const selectedId = accounts?.[0]?.id ?? null;
  const { data: positions, isLoading: loadingPositions } = usePositions(selectedId);

  const loading = loadingAccounts || loadingPositions;
  const hasTrades = (positions?.length ?? 0) > 0;

  if (loading) {
    return (
      <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <div style={{ height: 28, width: 180, borderRadius: 6, background: 'var(--eb-panel-2)', marginBottom: 18, animation: 'eb-sk 1.6s ease-in-out infinite' }} />
        <style>{'@keyframes eb-sk{0%,100%{opacity:1}50%{opacity:.35}}'}</style>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
          {[1,2,3,4].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 10, background: 'var(--eb-panel-2)', animation: 'eb-sk 1.6s ease-in-out infinite' }} />
          ))}
        </div>
        <div style={{ borderRadius: 11, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', padding: 14, height: 420, animation: 'eb-sk 1.6s ease-in-out infinite' }} />
      </div>
    );
  }

  if (hasTrades) {
    return (
      <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
        <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>Workspace / Calendar</div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--eb-text)' }}>Calendar</h1>
        </div>
        <TradeCalendar positions={positions ?? []} />
      </div>
    );
  }

  // Empty state — no trades yet
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDow = new Date(year, month, 1).getDay();
  const offset = firstDow === 0 ? 6 : firstDow - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const todayDate = now.getDate();
  const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const cells = Array.from({ length: totalCells }, (_, i) => {
    const day = i - offset + 1;
    const inMonth = day >= 1 && day <= daysInMonth;
    return { id: inMonth ? `day-${day}` : `pad-${i}`, day: inMonth ? day : null, isToday: day === todayDate, isFuture: !inMonth || day > todayDate };
  });

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
      {/* Hero */}
      <div style={{ textAlign: 'center', padding: '42px 24px 32px', maxWidth: 640, margin: '0 auto' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 18,
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 36, marginBottom: 14,
          background: 'linear-gradient(135deg,rgba(6,182,212,.15),rgba(139,92,246,.08))',
          border: '1px solid rgba(6,182,212,.25)',
        }}>🗓️</div>
        <h2 style={{ fontSize: 24, letterSpacing: '-0.015em', margin: '0 0 8px', fontWeight: 600, color: 'var(--eb-text)' }}>
          Your trading calendar
        </h2>
        <p style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}>
          P&amp;L by day, color-coded. Spot streaks, find your weakest weekday, and link each day to its journal entry, mood, and trades.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button type="button" style={{
            ...btn,
            background: 'linear-gradient(180deg,#00d68f,#00b67a)',
            borderColor: '#00b67a', color: '#06140f', fontWeight: 600,
          }}>🔌 Connect exchange</button>
          <button type="button" style={btn}>📁 Upload CSV</button>
        </div>
      </div>

      {/* Empty calendar */}
      <div style={{ ...panel, maxWidth: 760, margin: '8px auto 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
            {MONTH_NAMES[month]} {year}
          </h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, padding: '3px 9px', borderRadius: 99, border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)' }}>
            No trades yet
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ fontSize: 10.5, color: 'var(--eb-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.05em', padding: '4px 0' }}>
              {d}
            </div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginTop: 6 }}>
          {cells.map((cell) => {
            if (!cell.day || cell.isFuture) {
              return <div key={cell.id} style={{ ...calDayBase, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', opacity: 0.3 }}><div style={{ color: 'var(--eb-muted)' }}>·</div></div>;
            }
            return (
              <div key={cell.id} style={{
                ...calDayBase,
                border: `1px solid ${cell.isToday ? 'var(--green)' : 'var(--eb-border)'}`,
                background: 'linear-gradient(135deg, transparent 49%, var(--eb-border) 49%, var(--eb-border) 51%, transparent 51%) 0 0 / 8px 8px',
                boxShadow: cell.isToday ? '0 0 0 2px rgba(0,214,143,.12)' : undefined,
              }}>
                <div style={{ color: 'var(--eb-muted)' }}>{cell.day}</div>
                <div style={{ fontSize: 9, color: cell.isToday ? 'var(--green)' : 'var(--eb-muted)' }}>
                  {cell.isToday ? 'today' : 'no trades'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sample preview */}
      <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.06em', textTransform: 'uppercase', margin: '24px 0 10px', textAlign: 'center' }}>
        Preview with data
      </div>
      <div style={{ ...panel, maxWidth: 760, margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
          {WEEKDAYS.map(d => (
            <div key={d} style={{ fontSize: 10.5, color: 'var(--eb-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '.05em', padding: '4px 0' }}>{d}</div>
          ))}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6, marginTop: 6 }}>
          {[
            { day: 5, pnl: '+$420', win: true }, { day: 6, pnl: '−$95', win: false },
            { day: 7, pnl: '+$612', win: true }, { day: 8, pnl: '+$155', win: true },
            { day: 9, pnl: '−$220', win: false },
          ].map(({ day, pnl, win }) => (
            <div key={day} style={{
              ...calDayBase,
              background: win ? 'linear-gradient(180deg,rgba(0,214,143,.16),rgba(0,214,143,.04))' : 'linear-gradient(180deg,rgba(255,91,108,.12),rgba(255,91,108,.03))',
              border: `1px solid ${win ? 'rgba(0,214,143,.30)' : 'rgba(255,91,108,.30)'}`,
            }}>
              <div style={{ color: 'var(--eb-muted)' }}>{day}</div>
              <div style={{ fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums', color: win ? 'var(--green)' : 'var(--eb-red)' }}>{pnl}</div>
            </div>
          ))}
          {[10, 11].map(day => (
            <div key={day} style={{ ...calDayBase, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', opacity: 0.3 }}>
              <div style={{ color: 'var(--eb-muted)' }}>{day}</div>
              <div style={{ fontSize: 9, color: 'var(--eb-muted)' }}>·</div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5, color: 'var(--eb-muted)' }}>
          <span>Click any day for trades + journal entry</span>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 11.5, padding: '3px 9px', borderRadius: 99, border: '1px solid rgba(0,214,143,.30)', background: 'rgba(0,214,143,.08)', color: 'var(--green)' }}>
            3 green · 2 red
          </span>
        </div>
      </div>
    </div>
  );
}
