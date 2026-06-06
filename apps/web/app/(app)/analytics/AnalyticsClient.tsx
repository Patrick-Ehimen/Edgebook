'use client';

import { positionsApi } from '@/features/positions/api';
import type { Position } from '@/features/positions/schemas';
import { useAccounts } from '@/features/accounts';
import { usePlaybooks } from '@/features/playbooks';
import type { Playbook } from '@/features/playbooks/schemas';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Lock, Plug, PenLine, Upload, TrendingUp } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// ─── Types & helpers ──────────────────────────────────────────────────────────

type DayRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

function parsePnl(n: string | null | undefined): number {
  if (!n) return 0;
  const v = Number.parseFloat(n);
  return Number.isNaN(v) ? 0 : v;
}

function fmtMoney(n: number): string {
  const sign = n >= 0 ? '+' : '−';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function pnlColor(n: number): string {
  return n > 0 ? 'var(--green)' : n < 0 ? 'var(--eb-red)' : 'var(--eb-muted)';
}

function cutoff(range: DayRange): Date | null {
  const now = new Date();
  if (range === '7d') return new Date(now.getTime() - 7 * 86_400_000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000);
  if (range === '90d') return new Date(now.getTime() - 90 * 86_400_000);
  if (range === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return null;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: 16,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function NoDataBox({ msg = 'Not enough data yet' }: { msg?: string }) {
  return (
    <div
      style={{ textAlign: 'center', padding: '28px 0', color: 'var(--eb-muted)', fontSize: 12 }}
    >
      {msg}
    </div>
  );
}

function Chip({
  color,
  children,
}: {
  color?: 'green' | 'red' | 'yellow' | 'purple' | 'cyan';
  children: React.ReactNode;
}) {
  const colorMap: Record<string, { bg: string; text: string; border: string }> = {
    green: { bg: 'rgba(0,214,143,.15)', text: 'var(--green)', border: 'rgba(0,214,143,.3)' },
    red: { bg: 'rgba(255,91,108,.15)', text: 'var(--eb-red)', border: 'rgba(255,91,108,.3)' },
    yellow: {
      bg: 'rgba(250,204,21,.15)',
      text: 'var(--eb-yellow)',
      border: 'rgba(250,204,21,.3)',
    },
    purple: {
      bg: 'rgba(139,92,246,.15)',
      text: 'var(--eb-purple)',
      border: 'rgba(139,92,246,.3)',
    },
    cyan: { bg: 'rgba(6,182,212,.15)', text: 'var(--eb-cyan)', border: 'rgba(6,182,212,.3)' },
  };
  const c = color ? colorMap[color] : colorMap['green'];
  if (!c) return null;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '2px 8px',
        borderRadius: 99,
        fontSize: 11,
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        border: `1px solid ${c.border}`,
      }}
    >
      {children}
    </span>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          style={{
            height: i === 1 ? 40 : 180,
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            marginBottom: 14,
            animation: 'pulse 1.4s ease-in-out infinite',
            opacity: 0.5,
          }}
        />
      ))}
      <style>{`@keyframes pulse { 0%,100%{opacity:.5} 50%{opacity:.25} }`}</style>
    </div>
  );
}

// ─── Empty state (ported from old page.tsx) ───────────────────────────────────

function EquityVisual() {
  return (
    <svg
      viewBox="0 0 360 60"
      preserveAspectRatio="none"
      aria-hidden="true"
      style={{ width: '100%', height: '100%', opacity: 0.55 }}
    >
      <path
        d="M0,52 C40,48 70,40 110,42 S180,28 220,22 S290,18 330,10 360,12 360,12"
        stroke="var(--green)"
        strokeWidth="2"
        fill="none"
      />
    </svg>
  );
}

const R_BARS = [
  { id: 'r1', h: '30%', color: 'var(--eb-red)' },
  { id: 'r2', h: '50%', color: 'var(--eb-red)' },
  { id: 'r3', h: '80%', color: 'var(--eb-red)' },
  { id: 'r4', h: '35%', color: 'var(--eb-muted)' },
  { id: 'r5', h: '90%', color: 'var(--green)' },
  { id: 'r6', h: '65%', color: 'var(--green)' },
  { id: 'r7', h: '40%', color: 'var(--green)' },
  { id: 'r8', h: '20%', color: 'var(--green)' },
];

function RMultipleVisual() {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: 6,
        height: '100%',
        opacity: 0.5,
        padding: 12,
      }}
    >
      {R_BARS.map((b) => (
        <div
          key={b.id}
          style={{ height: b.h, flex: 1, background: b.color, borderRadius: '2px 2px 0 0' }}
        />
      ))}
    </div>
  );
}

const HEAT_CELLS: { id: string; v: number }[] = [
  0.12, 0.72, 0.45, 0.88, 0.23, 0.61, 0.34, 0.95, 0.08, 0.55, 0.78, 0.19, 0.67, 0.41, 0.83, 0.29,
  0.56, 0.14, 0.91, 0.38, 0.72, 0.05, 0.63, 0.47, 0.82, 0.26, 0.59, 0.11, 0.75, 0.44, 0.88, 0.33,
  0.66, 0.22, 0.51, 0.79, 0.18, 0.93, 0.37, 0.64, 0.09, 0.71, 0.42, 0.85, 0.28, 0.57, 0.13, 0.96,
  0.35, 0.68, 0.21, 0.54, 0.8, 0.16, 0.89, 0.43, 0.73, 0.06, 0.62, 0.31, 0.77, 0.48, 0.87, 0.24,
  0.58, 0.15, 0.92, 0.39, 0.65, 0.1, 0.74, 0.46, 0.84, 0.27, 0.6, 0.12, 0.76, 0.45, 0.9, 0.36,
  0.69, 0.23, 0.53, 0.81,
].map((v, pos) => ({ id: `h${pos}`, v }));

function HeatmapVisual() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12,1fr)',
        gap: 2,
        height: '100%',
        opacity: 0.5,
        padding: 8,
      }}
    >
      {HEAT_CELLS.map(({ id, v }) => {
        const color = v < 0.3 ? '#ff5b6c' : v < 0.5 ? 'transparent' : '#00d68f';
        const alpha = Math.abs(v - 0.5) * 0.7;
        return <div key={id} style={{ background: color, opacity: alpha, borderRadius: 2 }} />;
      })}
    </div>
  );
}

const DECAY_ROWS = [{ id: 'dr1' }, { id: 'dr2' }, { id: 'dr3' }];

function EdgeDecayVisual() {
  return (
    <div style={{ padding: 12, fontSize: 11 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          color: 'var(--eb-muted)',
          marginBottom: 8,
        }}
      >
        <span>Playbook</span>
        <span>Win%</span>
        <span>Trend</span>
      </div>
      {DECAY_ROWS.map(({ id }) => (
        <div
          key={id}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            padding: '3px 0',
            color: 'var(--eb-muted-2)',
            opacity: 0.6,
          }}
        >
          <span>—</span>
          <span>—</span>
          <span>—</span>
        </div>
      ))}
    </div>
  );
}

const PREVIEW_CARDS = [
  {
    lock: 'needs trades',
    title: 'Equity curve',
    desc: 'Daily account balance with drawdown shading and a BTC-perp benchmark overlay.',
    visual: (
      <div
        style={{
          marginTop: 10,
          height: 78,
          background: 'var(--eb-panel-2)',
          borderRadius: 8,
          border: '1px dashed var(--eb-border)',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <EquityVisual />
      </div>
    ),
  },
  {
    lock: 'needs ≥30 trades',
    title: 'R-multiple distribution',
    desc: 'Histogram of your wins and losses by R. Are you cutting losses and letting winners run?',
    visual: (
      <div
        style={{
          marginTop: 10,
          height: 78,
          background: 'var(--eb-panel-2)',
          borderRadius: 8,
          border: '1px dashed var(--eb-border)',
          overflow: 'hidden',
        }}
      >
        <RMultipleVisual />
      </div>
    ),
  },
  {
    lock: 'needs ≥50 trades',
    title: 'P&L heatmap · hour × day',
    desc: 'Where in the week — and what time — your edge actually lives.',
    visual: (
      <div
        style={{
          marginTop: 10,
          height: 78,
          background: 'var(--eb-panel-2)',
          borderRadius: 8,
          border: '1px dashed var(--eb-border)',
          overflow: 'hidden',
        }}
      >
        <HeatmapVisual />
      </div>
    ),
  },
  {
    lock: 'needs ≥1 playbook',
    title: 'Edge decay watch',
    desc: 'Per-playbook rolling 30-trade win rate. We flag when a setup has stopped working.',
    visual: (
      <div
        style={{
          marginTop: 10,
          height: 78,
          background: 'var(--eb-panel-2)',
          borderRadius: 8,
          border: '1px dashed var(--eb-border)',
          overflow: 'hidden',
        }}
      >
        <EdgeDecayVisual />
      </div>
    ),
  },
];

function EmptyState() {
  return (
    <div
      style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}
    >
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
            marginBottom: 14,
            background: 'linear-gradient(135deg,rgba(0,214,143,.15),rgba(6,182,212,.10))',
            border: '1px solid rgba(0,214,143,.20)',
            color: 'var(--green)',
          }}
        >
          <TrendingUp size={36} />
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
          Your edge, quantified
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            fontSize: 14,
            margin: '0 0 18px',
            lineHeight: 1.55,
          }}
        >
          Once your trades are flowing in, this page shows your equity curve, win rate, profit
          factor, edge decay per playbook, and the slices that actually matter — by symbol, hour,
          session, and behavioral state.
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
            <Plug size={13} /> Connect exchange
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
            <Upload size={13} /> Upload CSV
          </button>
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 7,
              border: '1px solid transparent',
              background: 'transparent',
              color: 'var(--eb-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <PenLine size={13} /> Log trade manually
          </button>
        </div>
      </div>

      {/* What you'll see */}
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
        What you&apos;ll see
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {PREVIEW_CARDS.map(({ lock, title, desc, visual }) => (
          <div
            key={title}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              padding: 14,
              position: 'relative',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: 'var(--eb-muted)',
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 99,
                padding: '2px 7px',
              }}
            >
              <Lock size={10} /> {lock}
            </span>
            <h4
              style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}
            >
              {title}
            </h4>
            <p style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5, margin: 0 }}>
              {desc}
            </p>
            {visual}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Heatmap panel ────────────────────────────────────────────────────────────

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HeatmapPanel({ positions }: { positions: Position[] }) {
  // Build a 7x24 grid: grid[dayOfWeek][hour] = total pnl
  // dayOfWeek: 0=Mon..6=Sun  (getDay() returns 0=Sun, so remap)
  const grid: number[][] = Array.from({ length: 7 }, () => Array(24).fill(0) as number[]);
  const filled = new Set<string>();

  const now = new Date();
  for (const p of positions) {
    const dt = new Date(p.openedAt);
    if (dt > now) continue;
    const rawDay = dt.getDay(); // 0=Sun
    const dow = rawDay === 0 ? 6 : rawDay - 1; // 0=Mon..6=Sun
    const hour = dt.getHours();
    const pnl = parsePnl(p.netPnl);
    grid[dow]![hour]! += pnl;
    if (pnl !== 0) filled.add(`${dow}-${hour}`);
  }

  if (filled.size === 0) {
    return <NoDataBox />;
  }

  let maxAbsPnl = 0;
  for (const row of grid) {
    for (const v of row) {
      if (Math.abs(v) > maxAbsPnl) maxAbsPnl = Math.abs(v);
    }
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      {/* Hour header */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '40px repeat(24, 1fr)',
          gap: 2,
          marginBottom: 2,
        }}
      >
        <div />
        {HOURS.map((h) => (
          <div
            key={h}
            style={{
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--eb-muted)',
              fontFamily: 'var(--font-mono, monospace)',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {String(h).padStart(2, '0')}
          </div>
        ))}
      </div>
      {/* Rows */}
      {DAY_LABELS.map((day, di) => (
        <div
          key={day}
          style={{
            display: 'grid',
            gridTemplateColumns: '40px repeat(24, 1fr)',
            gap: 2,
            marginBottom: 2,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: 'var(--eb-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {day}
          </div>
          {HOURS.map((h) => {
            const pnl = grid[di]![h]!;
            const alpha = maxAbsPnl > 0 ? Math.min((Math.abs(pnl) / maxAbsPnl) * 0.85, 0.85) : 0;
            const bg =
              pnl > 0
                ? `rgba(0,214,143,${alpha})`
                : pnl < 0
                  ? `rgba(255,91,108,${alpha})`
                  : 'var(--eb-panel-2)';
            const fmt = pnl !== 0 ? `${day} ${String(h).padStart(2, '0')}:00  ${fmtMoney(pnl)}` : '';
            return (
              <div
                key={h}
                title={fmt}
                style={{
                  height: 16,
                  background: bg,
                  borderRadius: 2,
                  border: '1px solid var(--eb-border)',
                  opacity: pnl === 0 ? 0.3 : 1,
                }}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ─── Playbook performance panel ───────────────────────────────────────────────

function PlaybookPerfPanel({
  positions,
  playbooks,
}: {
  positions: Position[];
  playbooks: Playbook[];
}) {
  const playbookMap = new Map(playbooks.map((p) => [p.id, p.name]));

  interface PbStat {
    id: string;
    name: string;
    count: number;
    wins: number;
    totalPnl: number;
    expectancy: number;
  }

  const statsMap = new Map<string, PbStat>();

  for (const pos of positions) {
    if (!pos.playbookId) continue;
    const id = pos.playbookId;
    const existing = statsMap.get(id);
    const pnl = parsePnl(pos.netPnl);
    if (existing) {
      existing.count += 1;
      existing.totalPnl += pnl;
      if (pnl > 0) existing.wins += 1;
      existing.expectancy = existing.totalPnl / existing.count;
    } else {
      statsMap.set(id, {
        id,
        name: playbookMap.get(id) ?? id,
        count: 1,
        wins: pnl > 0 ? 1 : 0,
        totalPnl: pnl,
        expectancy: pnl,
      });
    }
  }

  const stats = Array.from(statsMap.values()).sort((a, b) => b.expectancy - a.expectancy);

  if (stats.length === 0) {
    return <NoDataBox msg="No trades with playbooks yet" />;
  }

  const maxExp = Math.max(...stats.map((s) => Math.abs(s.expectancy)), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {stats.map((s) => {
        const wr = s.count > 0 ? (s.wins / s.count) * 100 : 0;
        const barPct = (Math.abs(s.expectancy) / maxExp) * 100;
        const barColor = s.expectancy >= 0 ? 'var(--green)' : 'var(--eb-red)';
        return (
          <div key={s.id}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'baseline',
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--eb-text)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '55%',
                }}
              >
                {s.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  color: 'var(--eb-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmtMoney(s.expectancy)} · {wr.toFixed(0)}%
              </span>
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--eb-panel-2)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${barPct}%`,
                  background: barColor,
                  borderRadius: 2,
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Hold time distribution panel ─────────────────────────────────────────────

const HOLD_BUCKETS: { label: string; test: (ms: number) => boolean }[] = [
  { label: '<5m', test: (ms) => ms < 5 * 60_000 },
  { label: '5-15m', test: (ms) => ms >= 5 * 60_000 && ms < 15 * 60_000 },
  { label: '15-30m', test: (ms) => ms >= 15 * 60_000 && ms < 30 * 60_000 },
  { label: '30-60m', test: (ms) => ms >= 30 * 60_000 && ms < 60 * 60_000 },
  { label: '1-2h', test: (ms) => ms >= 60 * 60_000 && ms < 2 * 3_600_000 },
  { label: '2-4h', test: (ms) => ms >= 2 * 3_600_000 && ms < 4 * 3_600_000 },
  { label: '4h+', test: (ms) => ms >= 4 * 3_600_000 },
];

function HoldTimePanel({ positions }: { positions: Position[] }) {
  const counts = HOLD_BUCKETS.map(({ label, test }) => {
    const count = positions.filter((p) => {
      if (!p.closedAt) return false;
      const ms = new Date(p.closedAt).getTime() - new Date(p.openedAt).getTime();
      return test(ms);
    }).length;
    return { label, count };
  });

  const maxCount = Math.max(...counts.map((b) => b.count), 1);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6,
          height: 120,
          marginBottom: 6,
        }}
      >
        {counts.map(({ label, count }) => {
          const heightPct = (count / maxCount) * 100;
          return (
            <div
              key={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--eb-muted)',
                  marginBottom: 3,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count > 0 ? count : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: count > 0 ? 3 : 0,
                  background: '#06b6d4',
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {counts.map(({ label }) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--eb-muted)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── R-multiple distribution panel ────────────────────────────────────────────

const R_BINS = [
  { label: '≤−3', test: (r: number) => r <= -3 },
  { label: '−2', test: (r: number) => r > -3 && r <= -2 },
  { label: '−1', test: (r: number) => r > -2 && r <= -1 },
  { label: '0', test: (r: number) => r > -1 && r <= 0 },
  { label: '+1', test: (r: number) => r > 0 && r <= 1 },
  { label: '+2', test: (r: number) => r > 1 && r <= 2 },
  { label: '+3', test: (r: number) => r > 2 && r <= 3 },
  { label: '+4', test: (r: number) => r > 3 && r <= 4 },
  { label: '≥+5', test: (r: number) => r > 4 },
];

function rBinColor(label: string): string {
  if (label.startsWith('−') || label.startsWith('≤')) return 'var(--eb-red)';
  if (label === '0') return 'var(--eb-muted)';
  return 'var(--green)';
}

function RDistPanel({ positions }: { positions: Position[] }) {
  const eligible = positions.filter((p) => p.rRealized !== null && p.rRealized !== undefined);

  if (eligible.length < 3) {
    return <NoDataBox msg="Set R values on trades to see this" />;
  }

  const bins = R_BINS.map(({ label, test }) => ({
    label,
    count: eligible.filter((p) => {
      const v = Number.parseFloat(p.rRealized!);
      return !Number.isNaN(v) && test(v);
    }).length,
  }));

  const maxCount = Math.max(...bins.map((b) => b.count), 1);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 4,
          height: 120,
          marginBottom: 6,
        }}
      >
        {bins.map(({ label, count }) => {
          const heightPct = (count / maxCount) * 100;
          return (
            <div
              key={label}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--eb-muted)',
                  marginBottom: 3,
                  fontFamily: 'var(--font-mono, monospace)',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {count > 0 ? count : ''}
              </div>
              <div
                style={{
                  width: '100%',
                  height: `${heightPct}%`,
                  minHeight: count > 0 ? 3 : 0,
                  background: rBinColor(label),
                  borderRadius: '2px 2px 0 0',
                }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {bins.map(({ label }) => (
          <div
            key={label}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 9,
              color: 'var(--eb-muted)',
              fontFamily: 'var(--font-mono, monospace)',
            }}
          >
            {label}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MFE vs Realized R scatter ────────────────────────────────────────────────

function MfeScatterPanel({ positions }: { positions: Position[] }) {
  const pts = positions
    .filter((p) => p.mfe !== null && p.mfe !== undefined && p.rRealized !== null && p.rRealized !== undefined)
    .map((p) => ({
      x: Number.parseFloat(p.mfe!),
      y: Number.parseFloat(p.rRealized!),
    }))
    .filter((pt) => !Number.isNaN(pt.x) && !Number.isNaN(pt.y));

  if (pts.length < 3) {
    return <NoDataBox msg="Need MFE + R values on ≥3 trades" />;
  }

  const W = 300;
  const H = 160;
  const PAD_L = 36;
  const PAD_R = 10;
  const PAD_T = 10;
  const PAD_B = 28;

  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys, 0);
  const maxY = Math.max(...ys, 0);
  const rangeX = maxX - minX || 1;
  const rangeY = maxY - minY || 1;

  const toSvgX = (x: number) => PAD_L + ((x - minX) / rangeX) * (W - PAD_L - PAD_R);
  const toSvgY = (y: number) => H - PAD_B - ((y - minY) / rangeY) * (H - PAD_T - PAD_B);

  const zeroY = toSvgY(0);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: 160, overflow: 'visible' }}
      aria-label="MFE vs Realized R scatter plot"
    >
      {/* Grid */}
      <line x1={PAD_L} y1={PAD_T} x2={PAD_L} y2={H - PAD_B} stroke="var(--eb-border)" strokeWidth={1} />
      <line x1={PAD_L} y1={H - PAD_B} x2={W - PAD_R} y2={H - PAD_B} stroke="var(--eb-border)" strokeWidth={1} />
      {/* Zero line */}
      <line
        x1={PAD_L}
        y1={zeroY}
        x2={W - PAD_R}
        y2={zeroY}
        stroke="var(--eb-border)"
        strokeWidth={1}
        strokeDasharray="3 3"
      />
      {/* Axis labels */}
      <text x={W / 2} y={H - 4} textAnchor="middle" fill="var(--eb-muted)" fontSize={9}>
        MFE (R)
      </text>
      <text
        x={10}
        y={H / 2}
        textAnchor="middle"
        fill="var(--eb-muted)"
        fontSize={9}
        transform={`rotate(-90, 10, ${H / 2})`}
      >
        Realized R
      </text>
      {/* Dots */}
      {pts.map((pt, i) => (
        <circle
          key={i}
          cx={toSvgX(pt.x)}
          cy={toSvgY(pt.y)}
          r={3.5}
          fill="rgba(139,92,246,.65)"
          stroke="rgba(139,92,246,.3)"
          strokeWidth={1}
        />
      ))}
    </svg>
  );
}

// ─── Edge decay watch panel ───────────────────────────────────────────────────

function decayStatus(delta: number): { label: string; color: 'green' | 'red' | 'yellow' | 'purple' } {
  if (delta >= 10) return { label: 'Hot — investigate', color: 'purple' };
  if (delta >= -5) return { label: 'Healthy', color: 'green' };
  if (delta >= -15) return { label: 'Drift — review', color: 'yellow' };
  return { label: 'Decay — pause', color: 'red' };
}

function EdgeDecayPanel({
  allPositions,
  playbooks,
}: {
  allPositions: Position[];
  playbooks: Playbook[];
}) {
  const playbookMap = new Map(playbooks.map((p) => [p.id, p.name]));

  // Group ALL positions by playbookId (not range-filtered)
  const pbMap = new Map<string, Position[]>();
  for (const pos of allPositions) {
    if (!pos.playbookId || pos.status !== 'closed') continue;
    const arr = pbMap.get(pos.playbookId) ?? [];
    arr.push(pos);
    pbMap.set(pos.playbookId, arr);
  }

  if (pbMap.size === 0) {
    return <NoDataBox msg="No playbooks with trades yet" />;
  }

  const rows = Array.from(pbMap.entries()).map(([id, poss]) => {
    const sorted = [...poss].sort((a, b) => {
      const da = a.closedAt ?? a.openedAt;
      const db = b.closedAt ?? b.openedAt;
      return da < db ? -1 : da > db ? 1 : 0;
    });

    // All-time stats
    const allWins = sorted.filter((p) => parsePnl(p.netPnl) > 0).length;
    const allTimePct = sorted.length > 0 ? (allWins / sorted.length) * 100 : 0;
    const allExpectancy = sorted.length > 0
      ? sorted.reduce((s, p) => s + parsePnl(p.netPnl), 0) / sorted.length
      : 0;

    // Last 30
    const last30 = sorted.slice(-30);
    const l30Wins = last30.filter((p) => parsePnl(p.netPnl) > 0).length;
    const last30Pct = last30.length > 0 ? (l30Wins / last30.length) * 100 : 0;
    const last30Exp = last30.length > 0
      ? last30.reduce((s, p) => s + parsePnl(p.netPnl), 0) / last30.length
      : 0;

    const delta = last30Pct - allTimePct;
    const status = decayStatus(delta);

    return {
      id,
      name: playbookMap.get(id) ?? id,
      count: sorted.length,
      last30Pct,
      allTimePct,
      delta,
      last30Exp,
      allExpectancy,
      status,
    };
  });

  const thStyle: React.CSSProperties = {
    padding: '0 8px 8px',
    fontSize: 11,
    fontWeight: 500,
    color: 'var(--eb-muted)',
    textAlign: 'left' as const,
    whiteSpace: 'nowrap' as const,
    borderBottom: '1px solid var(--eb-border)',
  };
  const tdStyle: React.CSSProperties = {
    padding: '8px',
    fontSize: 12,
    color: 'var(--eb-text)',
    borderBottom: '1px solid var(--eb-border)',
    fontFamily: 'var(--font-mono, monospace)',
    fontVariantNumeric: 'tabular-nums',
    whiteSpace: 'nowrap' as const,
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ ...thStyle, fontFamily: 'inherit' }}>Playbook</th>
            <th style={thStyle}>Last 30T win%</th>
            <th style={thStyle}>All-time win%</th>
            <th style={thStyle}>Δ</th>
            <th style={thStyle}>Last 30T exp.</th>
            <th style={thStyle}>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td style={{ ...tdStyle, fontFamily: 'inherit', color: 'var(--eb-text)' }}>
                {r.name}
                <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--eb-muted)' }}>
                  ({r.count})
                </span>
              </td>
              <td style={tdStyle}>{r.last30Pct.toFixed(1)}%</td>
              <td style={tdStyle}>{r.allTimePct.toFixed(1)}%</td>
              <td style={{ ...tdStyle, color: pnlColor(r.delta) }}>
                {r.delta >= 0 ? '+' : ''}
                {r.delta.toFixed(1)}pp
              </td>
              <td style={{ ...tdStyle, color: pnlColor(r.last30Exp) }}>
                {fmtMoney(r.last30Exp)}
              </td>
              <td style={{ ...tdStyle, fontFamily: 'inherit' }}>
                <Chip color={r.status.color}>{r.status.label}</Chip>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Equity curve ─────────────────────────────────────────────────────────────

function EquityCurve({ data }: { data: { date: string; cum: number }[] }) {
  if (data.length < 2) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>Not enough data to plot curve</span>
      </div>
    );
  }
  const fmt = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  const lastCum = data[data.length - 1]?.cum ?? 0;
  const strokeColor = lastCum >= 0 ? '#00d68f' : '#f87171';
  const fillColor = lastCum >= 0 ? 'rgba(0,214,143,.40)' : 'rgba(248,113,113,.40)';

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data} margin={{ top: 6, right: 4, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="aFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fillColor} />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--eb-border)" strokeOpacity={0.6} />
        <XAxis dataKey="date" tickFormatter={fmt} tick={{ fontSize: 10.5, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} minTickGap={48} />
        <YAxis tickFormatter={(v: number) => `$${v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)}`} tick={{ fontSize: 10.5, fill: 'var(--eb-muted)', fontFamily: 'inherit' }} axisLine={false} tickLine={false} width={52} />
        <Tooltip
          cursor={{ stroke: 'var(--eb-border)', strokeWidth: 1 }}
          content={({ active, payload, label }) => {
            if (!active || !payload?.length) return null;
            const val = payload[0]?.value as number;
            return (
              <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', boxShadow: '0 4px 16px rgba(0,0,0,.3)' }}>
                <div style={{ color: 'var(--eb-muted)', marginBottom: 4 }}>{fmt(label)}</div>
                <div style={{ fontWeight: 600, color: val >= 0 ? '#00d68f' : '#f87171' }}>
                  {fmtMoney(val)} <span style={{ fontWeight: 400, color: 'var(--eb-muted)' }}>Cumulative P&L</span>
                </div>
              </div>
            );
          }}
        />
        <Area type="monotone" dataKey="cum" stroke={strokeColor} strokeWidth={2} fill="url(#aFill)" dot={false} activeDot={{ r: 4, fill: strokeColor, stroke: 'var(--eb-panel)', strokeWidth: 2 }} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

// ─── Main Analytics view ──────────────────────────────────────────────────────

const RANGES: DayRange[] = ['7d', '30d', '90d', 'ytd', 'all'];

function AnalyticsData({
  allPositions,
  accounts,
  playbooks,
}: {
  allPositions: Position[];
  accounts: { id: string; label: string }[];
  playbooks: Playbook[];
}) {
  const [range, setRange] = useState<DayRange>('30d');
  const [accountFilter, setAccountFilter] = useState<string>('all');

  const filtered = useMemo(() => {
    const cut = cutoff(range);
    let base = allPositions.filter((p) => p.status === 'closed');
    if (accountFilter !== 'all') base = base.filter((p) => p.accountId === accountFilter);
    if (cut) base = base.filter((p) => p.closedAt && new Date(p.closedAt) >= cut);
    return base;
  }, [allPositions, range, accountFilter]);

  // Summary stats
  const totalTrades = filtered.length;
  const wins = filtered.filter((p) => parsePnl(p.netPnl) > 0);
  const losses = filtered.filter((p) => parsePnl(p.netPnl) <= 0);
  const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;
  const totalPnl = filtered.reduce((s, p) => s + parsePnl(p.netPnl), 0);
  const sumPos = wins.reduce((s, p) => s + parsePnl(p.netPnl), 0);
  const sumNeg = Math.abs(losses.reduce((s, p) => s + parsePnl(p.netPnl), 0));
  const profitFactor = sumNeg > 0 ? sumPos / sumNeg : sumPos > 0 ? 999 : 0;

  // Max drawdown (peak-to-trough from cumulative equity)
  const maxDrawdown = useMemo(() => {
    const sorted = [...filtered].sort((a, b) => (a.closedAt ?? '') < (b.closedAt ?? '') ? -1 : 1);
    let peak = 0, cum = 0, dd = 0;
    for (const p of sorted) {
      cum += parsePnl(p.netPnl);
      if (cum > peak) peak = cum;
      if (peak - cum > dd) dd = peak - cum;
    }
    return dd;
  }, [filtered]);

  // Avg hold time in ms
  const avgHoldMs = useMemo(() => {
    const times = filtered.filter(p => p.closedAt).map(p => new Date(p.closedAt!).getTime() - new Date(p.openedAt).getTime());
    return times.length > 0 ? times.reduce((s, t) => s + t, 0) / times.length : 0;
  }, [filtered]);

  function fmtHold(ms: number): string {
    if (ms < 60_000) return '<1m';
    if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
    if (ms < 86_400_000) return `${Math.round(ms / 3_600_000)}h`;
    return `${Math.round(ms / 86_400_000)}d`;
  }

  function holdProfile(ms: number): string {
    if (ms < 5 * 60_000) return 'Scalper';
    if (ms < 60 * 60_000) return 'Day trader';
    if (ms < 24 * 3_600_000) return 'Swing intraday';
    return 'Swing';
  }

  // Equity curve data
  const equityData = useMemo(() => {
    const dailyMap = new Map<string, number>();
    for (const p of filtered) {
      if (!p.closedAt) continue;
      const d = p.closedAt.split('T')[0] ?? '';
      dailyMap.set(d, (dailyMap.get(d) ?? 0) + parsePnl(p.netPnl));
    }
    let cum = 0;
    return [...dailyMap.keys()].sort().map(date => {
      cum += dailyMap.get(date) ?? 0;
      return { date, cum };
    });
  }, [filtered]);

  const expectancy = totalTrades > 0 ? totalPnl / totalTrades : 0;
  const avgR = useMemo(() => {
    const withR = filtered.filter(p => p.rRealized != null);
    if (!withR.length) return null;
    return withR.reduce((s, p) => s + Number.parseFloat(p.rRealized!), 0) / withR.length;
  }, [filtered]);

  const rangeBtn = (r: DayRange) => ({
    padding: '4px 9px',
    borderRadius: 6,
    fontSize: 12,
    fontWeight: 500,
    border: '1px solid',
    cursor: 'pointer',
    fontFamily: 'inherit',
    background: range === r ? 'var(--eb-panel-2)' : 'transparent',
    borderColor: range === r ? 'var(--eb-border)' : 'transparent',
    color: range === r ? 'var(--eb-text)' : 'var(--eb-muted)',
  } as React.CSSProperties);

  return (
    <div
      style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--eb-text)' }}>
          Analytics
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {/* Account filter */}
          {accounts.length > 1 && (
            <select
              value={accountFilter}
              onChange={(e) => setAccountFilter(e.target.value)}
              style={{
                padding: '4px 8px',
                borderRadius: 6,
                fontSize: 12,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                color: 'var(--eb-text)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <option value="all">All accounts</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          )}
          {/* Range buttons */}
          <div
            style={{
              display: 'flex',
              gap: 2,
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 8,
              padding: 3,
            }}
          >
            {RANGES.map((r) => (
              <button key={r} type="button" style={rangeBtn(r)} onClick={() => setRange(r)}>
                {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 14 }}>
        {[
          {
            label: 'Net P&L',
            value: fmtMoney(totalPnl),
            valueColor: pnlColor(totalPnl),
            sub: avgR != null ? `${avgR >= 0 ? '+' : ''}${avgR.toFixed(2)}R avg` : `${expectancy >= 0 ? '+' : ''}$${Math.abs(expectancy).toFixed(2)} exp.`,
          },
          {
            label: 'Win rate',
            value: `${winRate.toFixed(1)}%`,
            valueColor: pnlColor(winRate - 50),
            sub: `${wins.length}W · ${losses.length}L`,
          },
          {
            label: 'Profit factor',
            value: profitFactor === 999 ? '∞' : profitFactor.toFixed(2),
            valueColor: pnlColor(profitFactor - 1),
            sub: `Exp. ${expectancy >= 0 ? '+' : ''}$${Math.abs(expectancy).toFixed(2)}`,
          },
          {
            label: 'Max drawdown',
            value: maxDrawdown > 0 ? `−$${maxDrawdown.toFixed(2)}` : '—',
            valueColor: maxDrawdown > 0 ? 'var(--eb-red)' : 'var(--eb-muted)',
            sub: `${totalTrades} trades`,
          },
          {
            label: 'Avg hold',
            value: avgHoldMs > 0 ? fmtHold(avgHoldMs) : '—',
            valueColor: 'var(--eb-text)',
            sub: avgHoldMs > 0 ? holdProfile(avgHoldMs) : 'No data',
          },
        ].map(({ label, value, valueColor, sub }) => (
          <div key={label} style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 10, padding: '12px 14px', minHeight: 78, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ color: 'var(--eb-muted)', fontSize: 11, letterSpacing: '.05em', textTransform: 'uppercase' as const }}>{label}</div>
            <div style={{ fontSize: 20, fontWeight: 600, letterSpacing: '-.01em', color: valueColor, fontFamily: 'var(--font-mono, monospace)', fontVariantNumeric: 'tabular-nums' as const }}>{value}</div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Equity curve */}
      {equityData.length >= 2 && (
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: 16, marginBottom: 14 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}>
            Equity curve
          </div>
          <div style={{ height: 200 }}>
            <EquityCurve data={equityData} />
          </div>
        </div>
      )}

      {/* Row 1: Heatmap + Playbook perf */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
        <Panel>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}
          >
            P&L by hour × day
          </div>
          <HeatmapPanel positions={filtered} />
        </Panel>
        <Panel>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}
          >
            Performance by Playbook
          </div>
          <PlaybookPerfPanel positions={filtered} playbooks={playbooks} />
        </Panel>
      </div>

      {/* Row 2: Hold time + R distribution + MFE scatter */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: 14,
          marginBottom: 14,
        }}
      >
        <Panel>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}
          >
            Hold time distribution
          </div>
          <HoldTimePanel positions={filtered} />
        </Panel>
        <Panel>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}
          >
            R-multiple distribution
          </div>
          <RDistPanel positions={filtered} />
        </Panel>
        <Panel>
          <div
            style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}
          >
            MFE vs Realized R
          </div>
          <MfeScatterPanel positions={filtered} />
        </Panel>
      </div>

      {/* Edge decay watch */}
      <Panel>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', letterSpacing: '.05em', textTransform: 'uppercase', marginBottom: 12 }}>
          Edge decay watch
        </div>
        <EdgeDecayPanel allPositions={allPositions} playbooks={playbooks} />
      </Panel>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AnalyticsClient() {
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: playbooks } = usePlaybooks();

  const positionQueries = useQueries({
    queries: (accounts ?? []).map((a) => ({
      queryKey: ['positions', a.id],
      queryFn: () => positionsApi.list(a.id),
      enabled: (accounts?.length ?? 0) > 0,
    })),
  });

  const loadingPositions = positionQueries.some((q) => q.isLoading);
  const loading = loadingAccounts || loadingPositions;

  const allPositions = useMemo(
    () => positionQueries.flatMap((q) => q.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionQueries.map((q) => q.dataUpdatedAt).join(',')],
  );

  const closedPositions = allPositions.filter((p) => p.status === 'closed');

  if (loading) return <Skeleton />;
  if (closedPositions.length === 0) return <EmptyState />;

  return (
    <AnalyticsData
      allPositions={allPositions}
      accounts={(accounts ?? []).map((a) => ({ id: a.id, label: a.label }))}
      playbooks={playbooks ?? []}
    />
  );
}
