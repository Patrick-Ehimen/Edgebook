'use client';

import Link from 'next/link';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function buildEmptyCalendar(year: number, month: number) {
  const firstDay = new Date(year, month, 1).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((offset + daysInMonth) / 7) * 7;
  const today = new Date();
  const todayDate =
    today.getFullYear() === year && today.getMonth() === month ? today.getDate() : -1;

  const cells: { day: number | null; isToday: boolean }[] = [];
  for (let i = 0; i < totalCells; i++) {
    const day = i - offset + 1;
    if (day < 1 || day > daysInMonth) {
      cells.push({ day: null, isToday: false });
    } else {
      cells.push({ day, isToday: day === todayDate });
    }
  }
  return cells;
}

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

const SAMPLE_DAYS: Record<number, { pnl: string; pos: boolean }> = {
  5: { pnl: '+$420', pos: true },
  6: { pnl: '−$95', pos: false },
  7: { pnl: '+$612', pos: true },
  8: { pnl: '+$155', pos: true },
  9: { pnl: '−$220', pos: false },
};

export default function CalendarPage() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const cells = buildEmptyCalendar(year, month);

  const calGridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(7,1fr)',
    gap: 6,
  };

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
      {/* Hero */}
      <div
        style={{ textAlign: 'center', padding: '42px 24px 32px', maxWidth: 640, margin: '0 auto' }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 36,
            marginBottom: 14,
            background: 'linear-gradient(135deg,rgba(6,182,212,.15),rgba(139,92,246,.08))',
            border: '1px solid rgba(6,182,212,.25)',
          }}
        >
          🗓️
        </div>
        <h2
          style={{
            fontSize: 24,
            letterSpacing: '-.015em',
            margin: '0 0 8px',
            fontWeight: 600,
            color: 'var(--eb-text)',
          }}
        >
          Your trading calendar
        </h2>
        <p
          style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}
        >
          P&amp;L by day, color-coded. Spot streaks, find your weakest weekday, link a click into
          the day&apos;s journal entry, mood, and trades.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/settings/connections"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 7,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12,
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            🔌 Connect exchange
          </Link>
          <button
            type="button"
            style={{
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
            }}
          >
            📁 Upload CSV
          </button>
        </div>
      </div>

      {/* Empty calendar */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: 16,
          maxWidth: 760,
          margin: '8px auto 0',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 10,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
            {MONTH_NAMES[month]} {year} · empty
          </h3>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              padding: '3px 9px',
              borderRadius: 99,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted-2)',
            }}
          >
            No trades imported yet
          </span>
        </div>

        {/* Weekday headers */}
        <div style={calGridStyle}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                padding: '4px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div style={{ ...calGridStyle, marginTop: 6 }}>
          {cells.map((cell, i) => {
            const key = cell.day ? `day-${cell.day}` : `empty-${i}`;
            if (!cell.day) {
              return (
                <div
                  key={key}
                  style={{
                    aspectRatio: '1.05',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 7,
                    padding: '6px 7px',
                    background:
                      'repeating-linear-gradient(45deg,transparent,transparent 3px,var(--eb-border) 3px,var(--eb-border) 4px)',
                    opacity: 0.3,
                  }}
                />
              );
            }
            return (
              <div
                key={key}
                style={{
                  aspectRatio: '1.05',
                  border: `1px solid ${cell.isToday ? 'var(--green)' : 'var(--eb-border)'}`,
                  borderRadius: 7,
                  padding: '6px 7px',
                  background: 'var(--eb-panel)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: cell.isToday ? '0 0 0 2px rgba(0,214,143,.12)' : undefined,
                }}
              >
                <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{cell.day}</div>
                <div
                  style={{
                    fontSize: 9,
                    color: cell.isToday ? 'var(--green)' : 'var(--eb-muted)',
                    fontWeight: cell.isToday ? 500 : 400,
                  }}
                >
                  {cell.isToday ? 'today' : 'no trades'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* When you have data */}
      <div
        style={{
          fontSize: 11.5,
          fontWeight: 600,
          color: 'var(--eb-muted-2)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          margin: '24px 0 10px',
          textAlign: 'center',
        }}
      >
        When you have data
      </div>

      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: 16,
          maxWidth: 760,
          margin: '0 auto',
        }}
      >
        <div style={calGridStyle}>
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              style={{
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                textAlign: 'center',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
                padding: '4px 0',
              }}
            >
              {d}
            </div>
          ))}
        </div>
        <div style={{ ...calGridStyle, marginTop: 6 }}>
          {Object.entries(SAMPLE_DAYS).map(([day, data]) => (
            <div
              key={day}
              style={{
                aspectRatio: '1.05',
                borderRadius: 7,
                padding: '6px 7px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: data.pos
                  ? 'linear-gradient(180deg,rgba(0,214,143,.16),rgba(0,214,143,.04))'
                  : 'linear-gradient(180deg,rgba(255,91,108,.12),rgba(255,91,108,.03))',
                border: `1px solid ${data.pos ? 'rgba(0,214,143,.30)' : 'rgba(255,91,108,.30)'}`,
              }}
            >
              <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{day}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: data.pos ? 'var(--green)' : 'var(--eb-red)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {data.pnl}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 10,
            fontSize: 11.5,
            color: 'var(--eb-muted)',
          }}
        >
          <span>Click any day for trades + journal entry</span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11.5,
              padding: '3px 9px',
              borderRadius: 99,
              color: 'var(--green)',
              border: '1px solid rgba(0,214,143,.30)',
              background: 'rgba(0,214,143,.08)',
            }}
          >
            3 green · 2 red
          </span>
        </div>
      </div>
    </div>
  );
}
