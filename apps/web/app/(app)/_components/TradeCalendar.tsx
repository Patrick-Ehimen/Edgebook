'use client';

import { useMemo, useState } from 'react';

export const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const DAY_HEADERS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function fmtCalPnl(v: number): string {
  const sign = v >= 0 ? '+' : '-';
  const abs = Math.abs(v);
  if (abs >= 10000) return `${sign}${(abs / 1000).toFixed(0)}k`;
  if (abs >= 1000) return `${sign}${(abs / 1000).toFixed(1)}k`;
  return `${sign}${abs.toFixed(0)}`;
}

type CalPos = { closedAt: string | null; status: string; netPnl: string; rRealized?: string | null };

export function TradeCalendar({ positions }: { positions: CalPos[] }) {
  const today = new Date();

  const [{ year, month }, setCal] = useState(() => {
    const latest = [...positions]
      .filter((p) => p.closedAt && p.status === 'closed')
      .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())[0];
    if (latest?.closedAt) {
      const d = new Date(latest.closedAt);
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() };
    }
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  function prevMonth() {
    setCal((s) => s.month === 0 ? { year: s.year - 1, month: 11 } : { year: s.year, month: s.month - 1 });
  }
  function nextMonth() {
    setCal((s) => s.month === 11 ? { year: s.year + 1, month: 0 } : { year: s.year, month: s.month + 1 });
  }

  const dayMap = useMemo(() => {
    const map = new Map<string, { pnl: number; r: number; rCount: number; count: number }>();
    for (const p of positions) {
      if (!p.closedAt || p.status !== 'closed') continue;
      const d = new Date(p.closedAt);
      const key = `${d.getUTCFullYear()}-${d.getUTCMonth()}-${d.getUTCDate()}`;
      const prev = map.get(key) ?? { pnl: 0, r: 0, rCount: 0, count: 0 };
      const rVal = p.rRealized ? Number.parseFloat(p.rRealized) : Number.NaN;
      map.set(key, {
        pnl: prev.pnl + Number.parseFloat(p.netPnl || '0'),
        r: prev.r + (Number.isNaN(rVal) ? 0 : rVal),
        rCount: prev.rCount + (Number.isNaN(rVal) ? 0 : 1),
        count: prev.count + 1,
      });
    }
    return map;
  }, [positions]);

  const monthStats = useMemo(() => {
    let totalPnl = 0;
    let greenDays = 0;
    let redDays = 0;
    let totalTrades = 0;
    for (const [k, v] of dayMap) {
      const [ky, km] = k.split('-').map(Number);
      if (ky !== year || km !== month) continue;
      totalPnl += v.pnl;
      totalTrades += v.count;
      if (v.pnl > 0) greenDays++;
      else if (v.pnl < 0) redDays++;
    }
    const daysInMo = new Date(year, month + 1, 0).getDate();
    let bestStreak = 0;
    let streak = 0;
    for (let d = 1; d <= daysInMo; d++) {
      const key = `${year}-${month}-${d}`;
      const v = dayMap.get(key);
      if (v && v.pnl > 0) { streak++; bestStreak = Math.max(bestStreak, streak); }
      else streak = 0;
    }
    return { totalPnl, greenDays, redDays, totalTrades, bestStreak };
  }, [dayMap, year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayUTC = { y: today.getUTCFullYear(), m: today.getUTCMonth(), d: today.getUTCDate() };
  const isCurrentOrFuture = year > todayUTC.y || (year === todayUTC.y && month > todayUTC.m);

  const kpiStyle: React.CSSProperties = {
    background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
    borderRadius: 10, padding: '10px 14px',
    display: 'flex', flexDirection: 'column', gap: 3,
  };

  const navBtn: React.CSSProperties = {
    background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
    borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
    color: 'var(--eb-muted-2)', fontFamily: 'inherit', fontSize: 13,
  };

  return (
    <div>
      {/* Month nav */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button type="button" onClick={prevMonth} style={navBtn}>‹</button>
          <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--eb-text)', minWidth: 160, textAlign: 'center' }}>
            {MONTH_NAMES[month]} {year}
          </span>
          <button type="button" onClick={nextMonth} style={navBtn}>›</button>
        </div>
        <button
          type="button"
          onClick={() => setCal({ year: today.getFullYear(), month: today.getMonth() })}
          style={navBtn}
        >
          Today
        </button>
      </div>

      {/* Month KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 14 }}>
        <div style={kpiStyle}>
          <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Month P&L</span>
          <span style={{ fontSize: 18, fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: monthStats.totalPnl > 0 ? 'var(--green)' : monthStats.totalPnl < 0 ? 'var(--eb-red)' : 'var(--eb-muted)' }}>
            {monthStats.totalTrades === 0 ? '—' : `${monthStats.totalPnl >= 0 ? '+' : ''}${monthStats.totalPnl.toFixed(2)}`}
          </span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>USDT</span>
        </div>
        <div style={kpiStyle}>
          <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Green days</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--eb-text)' }}>
            {monthStats.greenDays}
            <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--eb-muted)' }}> / {monthStats.greenDays + monthStats.redDays}</span>
          </span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
            {monthStats.greenDays + monthStats.redDays > 0
              ? `${((monthStats.greenDays / (monthStats.greenDays + monthStats.redDays)) * 100).toFixed(0)}% win days`
              : 'no trades'}
          </span>
        </div>
        <div style={kpiStyle}>
          <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Trades taken</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: 'var(--eb-text)' }}>{monthStats.totalTrades}</span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>closed positions</span>
        </div>
        <div style={kpiStyle}>
          <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Red days</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: monthStats.redDays > 0 ? 'var(--eb-red)' : 'var(--eb-muted)' }}>{monthStats.redDays}</span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>losing days</span>
        </div>
        <div style={kpiStyle}>
          <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>Best streak</span>
          <span style={{ fontSize: 18, fontWeight: 600, color: monthStats.bestStreak > 0 ? 'var(--green)' : 'var(--eb-muted)' }}>
            {monthStats.bestStreak > 0 ? `+${monthStats.bestStreak}` : '—'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>green days in a row</span>
        </div>
      </div>

      {/* Grid panel */}
      <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: 14 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6, marginBottom: 6 }}>
          {DAY_HEADERS.map((h) => (
            <div key={h} style={{ textAlign: 'center', fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em', padding: '4px 0' }}>{h}</div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 6 }}>
          {/* biome-ignore lint/suspicious/noArrayIndexKey: stable offset cells */}
          {Array.from({ length: startOffset }, (_, i) => <div key={`off-${i}`} />)}

          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const key = `${year}-${month}-${day}`;
            const data = dayMap.get(key);
            const isToday = year === todayUTC.y && month === todayUTC.m && day === todayUTC.d;
            const isFuture = isCurrentOrFuture
              ? !(year === todayUTC.y && month === todayUTC.m) || day > todayUTC.d
              : false;
            const isWin = data && data.pnl > 0;
            const isLoss = data && data.pnl < 0;

            return (
              <div
                key={key}
                style={{
                  aspectRatio: '1 / 1.05',
                  border: `1px solid ${isWin ? 'rgba(0,214,143,.35)' : isLoss ? 'rgba(255,91,108,.35)' : isToday ? 'rgba(139,92,246,.5)' : 'var(--eb-border)'}`,
                  borderRadius: 7,
                  padding: '5px 6px',
                  display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                  fontSize: 10.5,
                  background: isWin
                    ? 'linear-gradient(180deg,rgba(0,214,143,.12),rgba(0,214,143,.04))'
                    : isLoss
                    ? 'linear-gradient(180deg,rgba(255,91,108,.10),rgba(255,91,108,.03))'
                    : isToday
                    ? 'rgba(139,92,246,.07)'
                    : 'var(--eb-panel-2)',
                  opacity: isFuture ? 0.25 : data ? 1 : 0.45,
                  minHeight: 0,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span style={{ color: 'var(--eb-muted)', fontWeight: isToday ? 600 : 400 }}>{day}</span>
                  {data && (
                    <span style={{ fontSize: 9.5, color: 'var(--eb-muted)' }}>{data.count}t</span>
                  )}
                </div>
                {data && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <span style={{ fontWeight: 700, fontSize: 12, color: isWin ? 'var(--green)' : 'var(--eb-red)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                      {fmtCalPnl(data.pnl)}
                    </span>
                    {data.rCount > 0 && (
                      <span style={{ fontSize: 9.5, color: 'var(--eb-muted)', fontFamily: 'var(--font-mono, monospace)', lineHeight: 1 }}>
                        {`${data.r >= 0 ? '+' : ''}${data.r.toFixed(1)}R`}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
