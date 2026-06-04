'use client';

import { positionsApi } from '@/features/positions/api';
import type { Position } from '@/features/positions/schemas';
import { useAccounts } from '@/features/accounts';
import { usePlaybooks } from '@/features/playbooks';
import { useSession } from '@/features/auth';
import { useLogTrade } from '@/providers/log-trade-provider';
import { useQueries } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Plug, PenLine, FileUp, TrendingUp, RefreshCw } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parsePnl(n: string | null | undefined): number {
  if (!n) return 0;
  const v = Number.parseFloat(n);
  return Number.isNaN(v) ? 0 : v;
}

function fmtMoney(n: number, prefix = true): string {
  const sign = n >= 0 ? (prefix ? '+' : '') : '−';
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function fmtR(n: string | null): string {
  if (!n) return '—';
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;
}

function pnlColor(n: number): string {
  return n > 0 ? 'var(--green)' : n < 0 ? 'var(--eb-red)' : 'var(--eb-muted)';
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0] ?? '';
}

function holdTime(openedAt: string, closedAt: string | null): string {
  if (!closedAt) return 'live';
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

type DayRange = '7d' | '30d' | '90d' | 'ytd' | 'all';

function cutoff(range: DayRange): Date | null {
  const now = new Date();
  if (range === '7d') return new Date(now.getTime() - 7 * 86_400_000);
  if (range === '30d') return new Date(now.getTime() - 30 * 86_400_000);
  if (range === '90d') return new Date(now.getTime() - 90 * 86_400_000);
  if (range === 'ytd') return new Date(now.getFullYear(), 0, 1);
  return null;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

interface DashStats {
  closed: Position[];
  open: Position[];
  todayPnl: number;
  todayTrades: number;
  todayWins: number;
  totalPnl: number;
  wins: number;
  losses: number;
  winRate: number;
  profitFactor: number;
  expectancy: number;
  maxDD: number;
  avgHoldMin: number;
  dailyPnl: { date: string; pnl: number }[];
  cumulative: { date: string; cum: number }[];
}

function computeStats(positions: Position[], range: DayRange): DashStats {
  const today = todayStr();
  const cut = cutoff(range);
  const allClosed = positions.filter((p) => p.status === 'closed');
  const open = positions.filter((p) => p.status === 'open');

  const closed = cut
    ? allClosed.filter((p) => p.closedAt && new Date(p.closedAt) >= cut)
    : allClosed;

  const todayTrades = allClosed.filter((p) => p.closedAt?.startsWith(today));
  const todayPnl = todayTrades.reduce((s, p) => s + parsePnl(p.netPnl), 0);
  const todayWins = todayTrades.filter((p) => parsePnl(p.netPnl) > 0).length;

  const totalPnl = closed.reduce((s, p) => s + parsePnl(p.netPnl), 0);
  const wins = closed.filter((p) => parsePnl(p.netPnl) > 0);
  const losses = closed.filter((p) => parsePnl(p.netPnl) <= 0);
  const winRate = wins.length + losses.length > 0 ? (wins.length / (wins.length + losses.length)) * 100 : 0;

  const sumPos = wins.reduce((s, p) => s + parsePnl(p.netPnl), 0);
  const sumNeg = Math.abs(losses.reduce((s, p) => s + parsePnl(p.netPnl), 0));
  const profitFactor = sumNeg > 0 ? sumPos / sumNeg : sumPos > 0 ? 999 : 0;
  const expectancy = closed.length > 0 ? totalPnl / closed.length : 0;

  // Hold time in minutes
  const avgHoldMin =
    closed.length > 0
      ? closed.reduce((s, p) => {
          if (!p.closedAt) return s;
          const ms = new Date(p.closedAt).getTime() - new Date(p.openedAt).getTime();
          return s + ms / 60_000;
        }, 0) / closed.length
      : 0;

  // Daily P&L grouped by closedAt date
  const dailyMap = new Map<string, number>();
  for (const p of closed) {
    if (!p.closedAt) continue;
    const d = p.closedAt.split('T')[0] ?? '';
    dailyMap.set(d, (dailyMap.get(d) ?? 0) + parsePnl(p.netPnl));
  }
  const sortedDates = Array.from(dailyMap.keys()).sort();
  const dailyPnl = sortedDates.map((date) => ({ date, pnl: dailyMap.get(date) ?? 0 }));

  // Cumulative
  let cum = 0;
  const cumulative = dailyPnl.map(({ date, pnl }) => {
    cum += pnl;
    return { date, cum };
  });

  // Max drawdown from peak on cumulative series
  let peak = 0;
  let maxDD = 0;
  for (const { cum: c } of cumulative) {
    if (c > peak) peak = c;
    const dd = peak - c;
    if (dd > maxDD) maxDD = dd;
  }

  return {
    closed,
    open,
    todayPnl,
    todayTrades: todayTrades.length,
    todayWins,
    totalPnl,
    wins: wins.length,
    losses: losses.length,
    winRate,
    profitFactor,
    expectancy,
    maxDD,
    avgHoldMin,
    dailyPnl,
    cumulative,
  };
}

// ─── Equity SVG ───────────────────────────────────────────────────────────────

function EquitySvg({ data }: { data: { date: string; cum: number }[] }) {
  const W = 800;
  const H = 200;
  const PAD = 20;

  if (data.length < 2) {
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
        <line x1={0} y1={H / 2} x2={W} y2={H / 2} stroke="var(--eb-border)" strokeWidth={1.5} strokeDasharray="4 4" />
        <text x={W / 2} y={H / 2 - 10} fill="var(--eb-muted)" fontSize={11} textAnchor="middle">
          Not enough data to plot curve
        </text>
      </svg>
    );
  }

  const values = data.map((d) => d.cum);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const toY = (v: number) => H - PAD - ((v - min) / range) * (H - PAD * 2);
  const toX = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);

  const pts = data.map((d, i) => `${toX(i)},${toY(d.cum)}`).join(' ');
  const areaPath = `M${toX(0)},${toY(data[0]!.cum)} ${data
    .slice(1)
    .map((d, i) => `L${toX(i + 1)},${toY(d.cum)}`)
    .join(' ')} L${toX(data.length - 1)},${H} L${toX(0)},${H} Z`;

  const linePath = `M${toX(0)},${toY(data[0]!.cum)} ${data
    .slice(1)
    .map((d, i) => `L${toX(i + 1)},${toY(d.cum)}`)
    .join(' ')}`;

  const lastX = toX(data.length - 1);
  const lastY = toY(data[data.length - 1]!.cum);
  const lastCum = data[data.length - 1]!.cum;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%' }}>
      <defs>
        <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#00d68f" stopOpacity={0.22} />
          <stop offset="1" stopColor="#00d68f" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="eqStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#00d68f" />
          <stop offset="1" stopColor="#06b6d4" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75].map((frac) => (
        <line key={frac} x1={0} x2={W} y1={PAD + frac * (H - PAD * 2)} y2={PAD + frac * (H - PAD * 2)} stroke="var(--eb-border)" strokeWidth={1} />
      ))}
      {/* Area fill */}
      <path d={areaPath} fill="url(#eqFill)" />
      {/* Stroke */}
      <polyline points={pts} stroke="url(#eqStroke)" strokeWidth={2.5} fill="none" strokeLinejoin="round" />
      {/* Current point */}
      <circle cx={lastX} cy={lastY} r={5} fill="#00d68f" stroke="var(--eb-panel)" strokeWidth={2} />
      <text x={Math.min(lastX + 8, W - 60)} y={Math.max(lastY - 6, 14)} fill="#00d68f" fontSize={10} fontFamily="monospace">
        {fmtMoney(lastCum)}
      </text>
    </svg>
  );
}

// ─── Week strip ───────────────────────────────────────────────────────────────

function WeekStrip({ positions }: { positions: Position[] }) {
  const today = new Date();
  const dow = today.getDay(); // 0=Sun
  const mondayOffset = dow === 0 ? 6 : dow - 1;
  const monday = new Date(today);
  monday.setDate(today.getDate() - mondayOffset);

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });

  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

  const dailyPnl = new Map<string, number>();
  for (const p of positions) {
    if (p.status !== 'closed' || !p.closedAt) continue;
    const d = p.closedAt.split('T')[0] ?? '';
    dailyPnl.set(d, (dailyPnl.get(d) ?? 0) + parsePnl(p.netPnl));
  }

  const weekTotal = days.reduce((s, d) => {
    const k = d.toISOString().split('T')[0] ?? '';
    return s + (dailyPnl.get(k) ?? 0);
  }, 0);

  const todayISO = today.toISOString().split('T')[0] ?? '';

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 6 }}>
        {days.map((d, i) => {
          const k = d.toISOString().split('T')[0] ?? '';
          const pnl = dailyPnl.get(k);
          const isFuture = d > today && k !== todayISO;
          const isToday = k === todayISO;
          const isWin = pnl !== undefined && pnl > 0;
          const isLoss = pnl !== undefined && pnl < 0;

          return (
            <div
              key={k}
              style={{
                aspectRatio: '1.1',
                border: `1px solid ${isWin ? 'rgba(0,214,143,.30)' : isLoss ? 'rgba(255,91,108,.30)' : 'var(--eb-border)'}`,
                borderRadius: 8,
                padding: 6,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                background: isWin
                  ? 'linear-gradient(180deg,rgba(0,214,143,.12),rgba(0,214,143,.02))'
                  : isLoss
                    ? 'linear-gradient(180deg,rgba(255,91,108,.08),rgba(255,91,108,.02))'
                    : 'var(--eb-panel)',
                opacity: isFuture ? 0.35 : 1,
                boxShadow: isToday ? '0 0 0 2px rgba(0,214,143,.25)' : 'none',
              }}
            >
              <div style={{ fontSize: 10, color: 'var(--eb-muted)' }}>
                {dayLabels[i]} {isToday ? d.getDate() : ''}
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-mono, monospace)',
                  fontSize: 11,
                  fontWeight: 600,
                  color: pnl !== undefined ? pnlColor(pnl) : 'var(--eb-muted)',
                }}
              >
                {pnl !== undefined ? fmtMoney(pnl, true) : '·'}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 11.5 }}>
        <span style={{ color: 'var(--eb-muted)' }}>Week total</span>
        <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: pnlColor(weekTotal) }}>
          {fmtMoney(weekTotal)}
        </strong>
      </div>
    </div>
  );
}

// ─── Sparkline ────────────────────────────────────────────────────────────────

function Spark({ values, color }: { values: number[]; color: string }) {
  if (values.length < 2) return <svg width={60} height={18} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * 58 + 1;
      const y = 16 - ((v - min) / range) * 14;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg width={60} height={18} style={{ flexShrink: 0 }}>
      <polyline points={pts} stroke={color} fill="none" strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function Sk({ h = 14, w, r = 6 }: { h?: number; w?: string | number; r?: number }) {
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

function DashboardSkeleton() {
  return (
    <>
      <style>{'@keyframes eb-pulse{0%,100%{opacity:1}50%{opacity:.3}}'}</style>
      {/* Cockpit row skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr', gap: 12, marginBottom: 14 }}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: 18, height: 140 }}>
            <Sk h={12} w={80} r={4} />
            <div style={{ marginTop: 16 }}><Sk h={28} w={120} r={6} /></div>
            <div style={{ marginTop: 10 }}><Sk h={10} w="80%" r={4} /></div>
          </div>
        ))}
      </div>
      {/* Spine skeleton */}
      <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '12px 14px', marginBottom: 14 }}>
        <Sk h={10} w="100%" r={4} />
      </div>
      {/* Main grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: 14, height: 320 }}>
          <Sk h={12} w={160} r={4} />
          <div style={{ marginTop: 16 }}><Sk h={220} r={8} /></div>
        </div>
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: 14, height: 320 }}>
          <Sk h={12} w={120} r={4} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 16 }}>
            {[0, 1, 2].map((i) => <Sk key={i} h={40} r={8} />)}
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Panel wrapper ────────────────────────────────────────────────────────────

function Panel({
  children,
  style,
}: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 11,
        padding: 14,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function PanelH3({
  left,
  right,
}: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
        fontSize: 11.5,
        fontWeight: 600,
        color: 'var(--eb-muted-2)',
        letterSpacing: '.04em',
        textTransform: 'uppercase',
      }}
    >
      <span>{left}</span>
      {right && <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{right}</span>}
    </div>
  );
}

// ─── Chip ────────────────────────────────────────────────────────────────────

function Chip({
  children,
  color,
}: { children: React.ReactNode; color?: 'green' | 'red' | 'yellow' | 'purple' | 'cyan' }) {
  const colors: Record<string, { border: string; bg: string; text: string }> = {
    green: { border: 'rgba(0,214,143,.30)', bg: 'rgba(0,214,143,.08)', text: 'var(--green)' },
    red: { border: 'rgba(255,91,108,.30)', bg: 'rgba(255,91,108,.08)', text: 'var(--eb-red)' },
    yellow: { border: 'rgba(245,165,36,.30)', bg: 'rgba(245,165,36,.08)', text: 'var(--eb-yellow)' },
    purple: { border: 'rgba(139,92,246,.30)', bg: 'rgba(139,92,246,.08)', text: 'var(--eb-purple)' },
    cyan: { border: 'rgba(6,182,212,.30)', bg: 'rgba(6,182,212,.08)', text: 'var(--eb-cyan)' },
  };
  const c = color ? colors[color] : { border: 'var(--eb-border)', bg: 'var(--eb-panel-2)', text: 'var(--eb-muted-2)' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 10.5,
        padding: '2px 8px',
        borderRadius: 99,
        border: `1px solid ${c?.border}`,
        background: c?.bg,
        color: c?.text,
        fontWeight: 500,
      }}
    >
      {children}
    </span>
  );
}

// ─── Btn ─────────────────────────────────────────────────────────────────────

function BtnSm({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '4px 10px',
        borderRadius: 7,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        color: 'var(--eb-muted-2)',
        fontSize: 11.5,
        cursor: 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {children}
    </button>
  );
}

// ─── Empty state ─────────────────────────────────────────────────────────────

function EmptyState({ onLog }: { onLog: () => void }) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 13,
        padding: '56px 28px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 52, marginBottom: 16, filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.2))', color: 'var(--green)' }}>
        <TrendingUp size={52} />
      </div>
      <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
        Your edge starts with one trade
      </h2>
      <p style={{ color: 'var(--eb-muted-2)', maxWidth: 460, margin: '0 0 24px', lineHeight: 1.6, fontSize: 13.5 }}>
        Connect an exchange, upload a CSV, or log your first trade manually. Once you have data, this dashboard lights up.
      </p>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link
          href="/settings"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 16px',
            borderRadius: 9,
            border: '1px solid #00b67a',
            background: 'linear-gradient(180deg,#00e29a,#00b67a)',
            color: '#06140f',
            fontSize: 13,
            fontWeight: 600,
            textDecoration: 'none',
            cursor: 'pointer',
          }}
        >
          <Plug size={14} /> Connect exchange
        </Link>
        <button
          type="button"
          onClick={onLog}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 14px',
            borderRadius: 9,
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            color: 'var(--eb-text)',
            fontSize: 13,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <PenLine size={14} /> Log trade
        </button>
        <button
          type="button"
          disabled
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '9px 14px',
            borderRadius: 9,
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            color: 'var(--eb-muted)',
            fontSize: 13,
            cursor: 'not-allowed',
            fontFamily: 'inherit',
            opacity: 0.6,
          }}
        >
          <FileUp size={14} /> Import CSV
        </button>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function DashboardClient() {
  const router = useRouter();
  const { data: session } = useSession();
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const { data: playbooks } = usePlaybooks();
  const logTrade = useLogTrade();

  const [selectedAccountId, setSelectedAccountId] = useState<string | 'all'>('all');
  const [equityRange, setEquityRange] = useState<DayRange>('30d');

  // Fetch positions for all accounts in parallel
  const positionQueries = useQueries({
    queries: (accounts ?? []).map((a) => ({
      queryKey: ['positions', a.id],
      queryFn: () => positionsApi.list(a.id),
      enabled: (accounts?.length ?? 0) > 0,
    })),
  });

  const loadingPositions = positionQueries.some((q) => q.isLoading);
  const loading = loadingAccounts || loadingPositions;

  // All positions flat list
  const allPositions = useMemo(
    () => positionQueries.flatMap((q) => q.data ?? []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [positionQueries.map((q) => q.dataUpdatedAt).join(',')],
  );

  // Positions for the selected account filter
  const positions = useMemo(
    () =>
      selectedAccountId === 'all'
        ? allPositions
        : allPositions.filter((p) => p.accountId === selectedAccountId),
    [allPositions, selectedAccountId],
  );

  // Compute stats for selected view
  const stats = useMemo(() => computeStats(positions, equityRange), [positions, equityRange]);

  // Per-account today P&L for the spine
  const todayKey = todayStr();
  const acctTodayPnl = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of allPositions) {
      if (p.status !== 'closed' || !p.closedAt?.startsWith(todayKey)) continue;
      m.set(p.accountId, (m.get(p.accountId) ?? 0) + parsePnl(p.netPnl));
    }
    return m;
  }, [allPositions, todayKey]);

  const hasAccounts = (accounts?.length ?? 0) > 0;
  const hasPositions = allPositions.length > 0;

  // Playbook performance
  const playbookStats = useMemo(() => {
    if (!playbooks?.length) return [];
    const closed = allPositions.filter((p) => p.status === 'closed' && p.playbookId);
    return playbooks
      .map((pb) => {
        const trades = closed.filter((p) => p.playbookId === pb.id);
        if (trades.length === 0) return null;
        const wins = trades.filter((p) => parsePnl(p.netPnl) > 0);
        const wr = (wins.length / trades.length) * 100;
        const avgR =
          trades.reduce((s, p) => s + parsePnl(p.rRealized), 0) / trades.length;
        // Sparkline: last 8 trades' P&L
        const spark = trades
          .slice(-8)
          .map((p) => parsePnl(p.netPnl));
        return { id: pb.id, name: pb.name, count: trades.length, wr, avgR, spark };
      })
      .filter(Boolean)
      .sort((a, b) => b!.count - a!.count)
      .slice(0, 5);
  }, [allPositions, playbooks]);

  // Session shape: { handle, email, userId, isOnboarded, ... }
  const userName = session?.handle?.split(' ')[0] ?? session?.email?.split('@')[0] ?? 'Trader';

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ padding: '18px 26px 80px', maxWidth: 1500, width: '100%', alignSelf: 'center' }}>
      <style>{`
        @keyframes eb-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
        @keyframes eb-glow { 0%,100%{box-shadow:0 0 0 0 rgba(0,214,143,0)} 50%{box-shadow:0 0 0 4px rgba(0,214,143,.18)} }
        @keyframes eb-spin { to{transform:rotate(360deg)} }
        .dash-btn-sm:hover { filter: brightness(1.1); }
        .dash-acct-pill:hover { border-color: rgba(0,214,143,.4) !important; }
        .dash-range-btn:hover { color: var(--eb-text) !important; }
        .dash-sg:hover { transform: translateY(-1px); border-color: rgba(0,214,143,.4) !important; }
      `}</style>

      {/* ── Loading ── */}
      {loading && <DashboardSkeleton />}

      {/* ── No accounts ── */}
      {!loading && !hasAccounts && <EmptyState onLog={logTrade.open} />}

      {/* ── Has accounts ── */}
      {!loading && hasAccounts && (
        <>
          {/* ══ COCKPIT ROW ══ */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1fr 1fr 1fr',
              gap: 12,
              marginBottom: 14,
            }}
          >
            {/* Greeting card */}
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(0,214,143,.07), rgba(6,182,212,.03))',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: '18px 20px',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(400px 200px at 90% 0%, rgba(0,214,143,.09), transparent 60%)',
                  pointerEvents: 'none',
                }}
              />
              <h1
                style={{
                  margin: '0 0 6px',
                  fontSize: 19,
                  fontWeight: 600,
                  letterSpacing: '-.01em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  color: 'var(--eb-text)',
                }}
              >
                {greeting()}, {userName}
              </h1>
              <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 14 }}>
                {stats.closed.length > 0 ? (
                  <>
                    <strong style={{ color: 'var(--eb-text)' }}>{stats.closed.length}</strong> closed trades ·{' '}
                    <strong style={{ color: 'var(--eb-text)' }}>{stats.open.length}</strong> open ·{' '}
                    {stats.todayTrades > 0 && (
                      <>
                        <strong style={{ color: 'var(--green)' }}>{stats.todayTrades}</strong> today
                      </>
                    )}
                  </>
                ) : (
                  'No trades yet — log your first position to get started'
                )}
              </div>
              <div
                style={{
                  padding: '10px 13px',
                  borderRadius: 9,
                  background: 'rgba(10,14,20,.35)',
                  border: '1px solid var(--eb-border)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    textTransform: 'uppercase',
                    letterSpacing: '.08em',
                    color: 'var(--eb-muted)',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Quick access
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    onClick={logTrade.open}
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 7,
                      border: '1px solid rgba(0,214,143,.4)',
                      background: 'rgba(0,214,143,.1)',
                      color: 'var(--green)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    + Log trade
                  </button>
                  <Link
                    href="/trades"
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 7,
                      border: '1px solid var(--eb-border)',
                      background: 'transparent',
                      color: 'var(--eb-muted-2)',
                      textDecoration: 'none',
                    }}
                  >
                    Trade log →
                  </Link>
                  <Link
                    href="/playbooks"
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 7,
                      border: '1px solid var(--eb-border)',
                      background: 'transparent',
                      color: 'var(--eb-muted-2)',
                      textDecoration: 'none',
                    }}
                  >
                    Playbooks →
                  </Link>
                </div>
              </div>
            </div>

            {/* Discipline ring (stub) */}
            <div
              style={{
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--eb-muted)',
                  fontWeight: 600,
                  marginBottom: 10,
                }}
              >
                Discipline score
              </div>
              <div style={{ position: 'relative', width: 88, height: 88 }}>
                <svg width={88} height={88} viewBox="0 0 88 88" style={{ transform: 'rotate(-90deg)' }}>
                  <defs>
                    <linearGradient id="discGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0" stopColor="#00d68f" />
                      <stop offset="1" stopColor="#06b6d4" />
                    </linearGradient>
                  </defs>
                  <circle cx={44} cy={44} r={36} fill="none" strokeWidth={8} stroke="var(--eb-panel-2)" />
                  <circle
                    cx={44}
                    cy={44}
                    r={36}
                    fill="none"
                    strokeWidth={8}
                    stroke="url(#discGrad)"
                    strokeLinecap="round"
                    strokeDasharray={226}
                    strokeDashoffset={226}
                  />
                </svg>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <span style={{ fontSize: 20, fontWeight: 600, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)' }}>—</span>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 8, lineHeight: 1.4 }}>
                Tilt engine in V2
              </div>
            </div>

            {/* Tilt watch (stub) */}
            <div
              style={{
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--eb-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                Tilt risk · live <Chip color="green">calm</Chip>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '-.02em',
                    marginBottom: 4,
                    color: 'var(--green)',
                  }}
                >
                  0<span style={{ fontSize: 13, color: 'var(--eb-muted)', marginLeft: 3 }}>/ 100</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 10 }}>
                  No tilt signals detected
                </div>
              </div>
              <div>
                <div
                  style={{
                    height: 5,
                    background: 'var(--eb-panel-2)',
                    borderRadius: 99,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: '5%',
                      background: 'linear-gradient(90deg,var(--green),var(--eb-cyan))',
                      borderRadius: 99,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    fontSize: 9.5,
                    color: 'var(--eb-muted)',
                    marginTop: 3,
                  }}
                >
                  <span>cool</span><span>watch</span><span>hot</span>
                </div>
              </div>
            </div>

            {/* Today P&L */}
            <div
              style={{
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: 14,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  letterSpacing: '.08em',
                  color: 'var(--eb-muted)',
                  fontWeight: 600,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                Today's P&L
                {stats.todayTrades > 0 && (
                  <Chip color={stats.todayWins / stats.todayTrades >= 0.5 ? 'green' : 'red'}>
                    {stats.todayTrades}T · {Math.round((stats.todayWins / stats.todayTrades) * 100)}% WR
                  </Chip>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontSize: 28,
                    fontWeight: 600,
                    letterSpacing: '-.02em',
                    fontFamily: 'var(--font-mono, monospace)',
                    color: pnlColor(stats.todayPnl),
                    margin: '6px 0 2px',
                  }}
                >
                  {stats.todayTrades > 0 ? fmtMoney(stats.todayPnl) : '—'}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
                  {stats.todayTrades > 0
                    ? `${stats.todayTrades} trade${stats.todayTrades !== 1 ? 's' : ''} today`
                    : 'No trades today yet'}
                </div>
              </div>
              {/* Goal bar (placeholder) */}
              <div
                style={{
                  height: 4,
                  background: 'var(--eb-panel-2)',
                  borderRadius: 99,
                  overflow: 'hidden',
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: stats.todayPnl > 0 ? `${Math.min(100, (stats.todayPnl / 400) * 100)}%` : '0%',
                    background: 'linear-gradient(90deg,var(--green),var(--eb-cyan))',
                    borderRadius: 99,
                    transition: 'width .3s',
                  }}
                />
              </div>
            </div>
          </div>

          {/* ══ ACCOUNTS SPINE ══ */}
          <div
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              padding: '10px 14px',
              marginBottom: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flexWrap: 'wrap',
            }}
          >
            <span
              style={{
                fontSize: 10,
                textTransform: 'uppercase',
                letterSpacing: '.08em',
                color: 'var(--eb-muted)',
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              Accounts
            </span>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', flex: 1 }}>
              {/* All pill */}
              {(() => {
                const allTodayPnl = Array.from(acctTodayPnl.values()).reduce((s, v) => s + v, 0);
                const isOn = selectedAccountId === 'all';
                return (
                  <button
                    key="all"
                    type="button"
                    className="dash-acct-pill"
                    onClick={() => setSelectedAccountId('all')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '5px 10px',
                      borderRadius: 9,
                      border: `1px solid ${isOn ? 'rgba(0,214,143,.30)' : 'var(--eb-border)'}`,
                      background: isOn ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: 'var(--eb-text)',
                      transition: 'border-color .12s',
                    }}
                  >
                    <span
                      style={{
                        width: 7,
                        height: 7,
                        borderRadius: '50%',
                        background: 'var(--green)',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontWeight: 500 }}>All</span>
                    {allPositions.length > 0 && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          color: pnlColor(allTodayPnl),
                          fontSize: 11.5,
                        }}
                      >
                        {allTodayPnl !== 0 ? fmtMoney(allTodayPnl) : '—'}
                      </span>
                    )}
                  </button>
                );
              })()}

              {/* Per-account pills */}
              {accounts?.map((a) => {
                const pnl = acctTodayPnl.get(a.id) ?? 0;
                const isOn = selectedAccountId === a.id;
                const dotColor =
                  a.venue === 'binance' ? '#f0b90b' : a.venue === 'bybit' ? '#f7a600' : '#8b5cf6';
                return (
                  <button
                    key={a.id}
                    type="button"
                    className="dash-acct-pill"
                    onClick={() => setSelectedAccountId(a.id)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      padding: '5px 10px',
                      borderRadius: 9,
                      border: `1px solid ${isOn ? 'rgba(0,214,143,.30)' : 'var(--eb-border)'}`,
                      background: isOn ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
                      fontSize: 12,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      color: 'var(--eb-text)',
                      transition: 'border-color .12s',
                    }}
                  >
                    <span
                      style={{ width: 7, height: 7, borderRadius: '50%', background: dotColor, flexShrink: 0 }}
                    />
                    <span style={{ fontWeight: 500 }}>{a.label}</span>
                    {acctTodayPnl.has(a.id) && (
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          fontWeight: 500,
                          color: pnlColor(pnl),
                          fontSize: 11.5,
                        }}
                      >
                        {fmtMoney(pnl)}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Aggregate stats */}
            {stats.closed.length > 0 && (
              <div style={{ display: 'flex', gap: 16, fontSize: 11, marginLeft: 'auto', flexShrink: 0 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Net P&L</span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontWeight: 600,
                      fontSize: 14,
                      color: pnlColor(stats.totalPnl),
                    }}
                  >
                    {fmtMoney(stats.totalPnl)}
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Win rate</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, fontSize: 14 }}>
                    {stats.winRate.toFixed(0)}%
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Trades</span>
                  <span style={{ fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, fontSize: 14 }}>
                    {stats.closed.length}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* ── No positions yet ── */}
          {!hasPositions && <EmptyState onLog={logTrade.open} />}

          {/* ── Has positions ── */}
          {hasPositions && (
            <>
              {/* ══ EQUITY CURVE + LIVE POSITIONS ══ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Equity curve */}
                <Panel>
                  <PanelH3
                    left={
                      <>
                        Equity curve{' '}
                        <Chip>{selectedAccountId === 'all' ? 'all accounts' : (accounts?.find((a) => a.id === selectedAccountId)?.label ?? '')}</Chip>
                      </>
                    }
                    right={
                      <div
                        style={{
                          display: 'inline-flex',
                          background: 'var(--eb-panel-2)',
                          border: '1px solid var(--eb-border)',
                          borderRadius: 7,
                          padding: 2,
                          gap: 1,
                        }}
                      >
                        {(['7d', '30d', '90d', 'ytd', 'all'] as DayRange[]).map((r) => (
                          <button
                            key={r}
                            type="button"
                            className="dash-range-btn"
                            onClick={() => setEquityRange(r)}
                            style={{
                              background: equityRange === r ? 'var(--eb-nav-active)' : 'transparent',
                              border: 0,
                              color: equityRange === r ? 'var(--green)' : 'var(--eb-muted)',
                              padding: '4px 9px',
                              borderRadius: 5,
                              cursor: 'pointer',
                              fontSize: 11,
                              fontFamily: 'inherit',
                              fontWeight: equityRange === r ? 600 : 400,
                            }}
                          >
                            {r.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    }
                  />
                  <div style={{ height: 220 }}>
                    <EquitySvg data={stats.cumulative} />
                  </div>
                  {/* Date labels */}
                  {stats.cumulative.length >= 2 && (
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginTop: 6,
                        fontSize: 10.5,
                        color: 'var(--eb-muted)',
                      }}
                    >
                      <span>{new Date(stats.cumulative[0]!.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      <span>{new Date(stats.cumulative[stats.cumulative.length - 1]!.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                    </div>
                  )}
                  <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '12px 0' }} />
                  {/* Summary stats */}
                  <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11.5, color: 'var(--eb-muted)' }}>
                    <span>
                      Net{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: pnlColor(stats.totalPnl) }}>
                        {fmtMoney(stats.totalPnl)}
                      </strong>
                    </span>
                    <span>
                      Win rate{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-text)' }}>
                        {stats.winRate.toFixed(1)}%
                      </strong>
                    </span>
                    <span>
                      PF{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-text)' }}>
                        {stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : '—'}
                      </strong>
                    </span>
                    <span>
                      Expectancy{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: pnlColor(stats.expectancy) }}>
                        {stats.expectancy !== 0 ? fmtMoney(stats.expectancy) : '—'}
                      </strong>
                    </span>
                    <span>
                      Max DD{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-red)' }}>
                        {stats.maxDD > 0 ? `−$${stats.maxDD.toFixed(2)}` : '—'}
                      </strong>
                    </span>
                    <span>
                      Avg hold{' '}
                      <strong style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-text)' }}>
                        {stats.avgHoldMin > 0
                          ? stats.avgHoldMin >= 60
                            ? `${(stats.avgHoldMin / 60).toFixed(1)}h`
                            : `${Math.round(stats.avgHoldMin)}m`
                          : '—'}
                      </strong>
                    </span>
                  </div>
                </Panel>

                {/* Live positions */}
                <Panel>
                  <PanelH3
                    left={
                      <>
                        <span
                          style={{
                            display: 'inline-block',
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: 'var(--green)',
                            animation: 'eb-pulse 1.6s infinite',
                            boxShadow: '0 0 0 3px rgba(0,214,143,.18)',
                            marginRight: 6,
                            verticalAlign: 'middle',
                          }}
                        />
                        Live positions{' '}
                        {stats.open.length > 0
                          ? <Chip color="green">{stats.open.length} open</Chip>
                          : <Chip>{stats.open.length} open</Chip>}
                      </>
                    }
                    right={
                      <BtnSm onClick={() => router.push('/trades')}>All →</BtnSm>
                    }
                  />

                  {stats.open.length === 0 ? (
                    <div
                      style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        color: 'var(--eb-muted)',
                        fontSize: 13,
                      }}
                    >
                      No open positions
                    </div>
                  ) : (
                    <div>
                      {stats.open.slice(0, 5).map((pos) => (
                        <div
                          key={pos.id}
                          style={{
                            display: 'grid',
                            gridTemplateColumns: 'auto 1fr auto auto',
                            gap: 8,
                            padding: '8px 0',
                            borderBottom: '1px dashed var(--eb-border)',
                            fontSize: 12.5,
                            alignItems: 'center',
                            cursor: 'pointer',
                          }}
                          onClick={() => router.push(`/trades/${pos.id}?account=${pos.accountId}`)}
                        >
                          <span
                            style={{
                              fontSize: 10,
                              padding: '1px 6px',
                              borderRadius: 4,
                              fontWeight: 600,
                              letterSpacing: '.04em',
                              background:
                                pos.side === 'long'
                                  ? 'rgba(0,214,143,.14)'
                                  : 'rgba(255,91,108,.14)',
                              color: pos.side === 'long' ? 'var(--green)' : 'var(--eb-red)',
                            }}
                          >
                            {pos.side === 'long' ? 'L' : 'S'}
                          </span>
                          <div>
                            <strong>{pos.symbol}</strong>
                            <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>
                              {holdTime(pos.openedAt, null)} · {Number.parseFloat(pos.avgEntry).toFixed(2)}
                            </div>
                          </div>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4,
                              fontSize: 10,
                              color: 'var(--green)',
                              padding: '1px 7px',
                              borderRadius: 99,
                              background: 'rgba(0,214,143,.08)',
                              border: '1px solid rgba(0,214,143,.25)',
                            }}
                          >
                            LIVE
                          </span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: 'var(--eb-muted)',
                            }}
                          >
                            —
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {stats.open.length > 0 && (
                    <>
                      <hr style={{ border: 0, borderTop: '1px dashed var(--eb-border)', margin: '10px 0' }} />
                      <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginBottom: 6 }}>Open exposure</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                        <span>Positions</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>{stats.open.length}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginTop: 3 }}>
                        <span>Symbols</span>
                        <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                          {new Set(stats.open.map((p) => p.symbol)).size}
                        </strong>
                      </div>
                    </>
                  )}
                </Panel>
              </div>

              {/* ══ RECENT TRADES + WEEK ══ */}
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14, marginBottom: 14 }}>
                {/* Recent trades */}
                <Panel>
                  <PanelH3
                    left="Recent trades · last 10"
                    right={<BtnSm onClick={() => router.push('/trades')}>Full log →</BtnSm>}
                  />
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5 }}>
                      <thead>
                        <tr>
                          {['Time', 'Symbol', 'Side', 'R', 'Net P&L', 'Playbook'].map((h) => (
                            <th
                              key={h}
                              style={{
                                textAlign: 'left',
                                padding: '6px 8px',
                                borderBottom: '1px solid var(--eb-border)',
                                fontSize: 10.5,
                                textTransform: 'uppercase',
                                letterSpacing: '.05em',
                                color: 'var(--eb-muted)',
                                fontWeight: 500,
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.closed
                          .slice()
                          .sort((a, b) => new Date(b.closedAt!).getTime() - new Date(a.closedAt!).getTime())
                          .slice(0, 10)
                          .map((pos) => {
                            const pnl = parsePnl(pos.netPnl);
                            const pb = playbooks?.find((p) => p.id === pos.playbookId);
                            return (
                              <tr
                                key={pos.id}
                                style={{ cursor: 'pointer' }}
                                onClick={() => router.push(`/trades/${pos.id}?account=${pos.accountId}`)}
                              >
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    borderBottom: '1px solid var(--eb-border)',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    color: 'var(--eb-muted)',
                                    fontSize: 11.5,
                                  }}
                                >
                                  {pos.closedAt
                                    ? new Date(pos.closedAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })
                                    : '—'}
                                </td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--eb-border)', fontWeight: 600 }}>
                                  {pos.symbol}
                                </td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--eb-border)' }}>
                                  <span
                                    style={{
                                      fontSize: 10,
                                      padding: '1px 6px',
                                      borderRadius: 4,
                                      fontWeight: 600,
                                      letterSpacing: '.04em',
                                      background:
                                        pos.side === 'long'
                                          ? 'rgba(0,214,143,.14)'
                                          : 'rgba(255,91,108,.14)',
                                      color: pos.side === 'long' ? 'var(--green)' : 'var(--eb-red)',
                                    }}
                                  >
                                    {pos.side === 'long' ? 'L' : 'S'}
                                  </span>
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    borderBottom: '1px solid var(--eb-border)',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontWeight: 600,
                                    color: pos.rRealized
                                      ? parsePnl(pos.rRealized) >= 0 ? 'var(--green)' : 'var(--eb-red)'
                                      : 'var(--eb-muted)',
                                  }}
                                >
                                  {fmtR(pos.rRealized)}
                                </td>
                                <td
                                  style={{
                                    padding: '7px 8px',
                                    borderBottom: '1px solid var(--eb-border)',
                                    fontFamily: 'var(--font-mono, monospace)',
                                    fontWeight: 600,
                                    color: pnlColor(pnl),
                                  }}
                                >
                                  {fmtMoney(pnl)}
                                </td>
                                <td style={{ padding: '7px 8px', borderBottom: '1px solid var(--eb-border)' }}>
                                  {pb ? (
                                    <span
                                      style={{
                                        fontSize: 10.5,
                                        padding: '2px 8px',
                                        borderRadius: 99,
                                        color: '#ea580c',
                                        background: 'rgba(194,65,12,.10)',
                                        border: '1px solid rgba(194,65,12,.30)',
                                        maxWidth: 110,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        display: 'inline-block',
                                      }}
                                    >
                                      {pb.name}
                                    </span>
                                  ) : (
                                    <span style={{ color: 'var(--eb-muted)', fontSize: 12 }}>—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </Panel>

                {/* This week */}
                <Panel>
                  <PanelH3
                    left="This week"
                    right={<BtnSm onClick={() => router.push('/calendar')}>Calendar →</BtnSm>}
                  />
                  <WeekStrip positions={positions} />
                </Panel>
              </div>

              {/* ══ PLAYBOOK EDGE + GOALS + WIDGET ══ */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14, marginBottom: 14 }}>
                {/* Playbook edge decay */}
                <Panel>
                  <PanelH3
                    left="Playbook edge"
                    right={<BtnSm onClick={() => router.push('/playbooks')}>All →</BtnSm>}
                  />
                  {playbookStats.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--eb-muted)', fontSize: 12.5 }}>
                      {playbooks?.length === 0
                        ? 'No playbooks yet'
                        : 'No trades tagged with playbooks yet'}
                    </div>
                  ) : (
                    playbookStats.map((pb) => {
                      if (!pb) return null;
                      const sparkColor =
                        pb.wr >= 55 ? 'var(--green)' : pb.wr >= 45 ? 'var(--eb-cyan)' : 'var(--eb-yellow)';
                      return (
                        <div
                          key={pb.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '7px 0',
                            borderBottom: '1px dashed var(--eb-border)',
                            fontSize: 12.5,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0 }}>
                            <strong
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                maxWidth: 100,
                              }}
                            >
                              {pb.name}
                            </strong>
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              gap: 10,
                              fontSize: 11,
                              color: 'var(--eb-muted)',
                              fontFamily: 'var(--font-mono, monospace)',
                              alignItems: 'center',
                            }}
                          >
                            <span>
                              <strong style={{ color: pb.wr >= 50 ? 'var(--green)' : 'var(--eb-red)' }}>
                                {pb.wr.toFixed(0)}%
                              </strong>
                            </span>
                            {pb.avgR !== 0 && (
                              <span>
                                <strong style={{ color: pnlColor(pb.avgR) }}>
                                  {fmtR(pb.avgR.toFixed(2))}
                                </strong>
                              </span>
                            )}
                            <Spark values={pb.spark} color={sparkColor} />
                          </div>
                        </div>
                      );
                    })
                  )}
                </Panel>

                {/* Goals stub */}
                <Panel>
                  <PanelH3 left="Goals · today" />
                  {stats.closed.length > 0 ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {/* Auto-computed "today trades" goal */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span>Daily P&L</span>
                          <strong
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              color: pnlColor(stats.todayPnl),
                            }}
                          >
                            {stats.todayTrades > 0 ? fmtMoney(stats.todayPnl) : '—'}
                          </strong>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--eb-panel-2)',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width:
                                stats.todayPnl > 0
                                  ? `${Math.min(100, (stats.todayPnl / 400) * 100)}%`
                                  : '0%',
                              background: 'linear-gradient(90deg,var(--green),var(--eb-cyan))',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span>Win rate (all time)</span>
                          <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                            {stats.winRate.toFixed(0)}%
                          </strong>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--eb-panel-2)',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, stats.winRate)}%`,
                              background:
                                stats.winRate >= 50
                                  ? 'linear-gradient(90deg,var(--green),var(--eb-cyan))'
                                  : 'linear-gradient(90deg,var(--eb-yellow),var(--eb-red))',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 5 }}>
                          <span>Profit factor</span>
                          <strong style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                            {stats.profitFactor > 0 ? stats.profitFactor.toFixed(2) : '—'}
                          </strong>
                        </div>
                        <div
                          style={{
                            height: 5,
                            background: 'var(--eb-panel-2)',
                            borderRadius: 99,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(100, (stats.profitFactor / 3) * 100)}%`,
                              background:
                                stats.profitFactor >= 1.5
                                  ? 'linear-gradient(90deg,var(--green),var(--eb-cyan))'
                                  : 'linear-gradient(90deg,var(--eb-yellow),var(--eb-red))',
                              borderRadius: 99,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: '28px 0', color: 'var(--eb-muted)', fontSize: 12.5 }}>
                      No closed trades yet
                    </div>
                  )}
                </Panel>

                {/* Add widget placeholder */}
                <div
                  style={{
                    border: '1.5px dashed var(--eb-border)',
                    borderRadius: 11,
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--eb-muted)',
                    fontSize: 12.5,
                    cursor: 'default',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                  }}
                >
                  <div style={{ fontSize: 28 }}>＋</div>
                  <div style={{ fontWeight: 600, color: 'var(--eb-text)' }}>Add widget</div>
                  <div style={{ fontSize: 11.5 }}>Customisable widgets coming in V2</div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
