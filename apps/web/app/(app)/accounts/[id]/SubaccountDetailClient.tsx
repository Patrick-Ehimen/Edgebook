'use client';

import { EditAccountDialog, useAccount } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import type { Position } from '@/features/positions';
import { ArrowLeft, Pencil } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// ─── venue / category meta (mirrors accounts list page) ────────────────────────

const VENUE_META: Record<string, { logo: string; color: string; bg: string; gradient: string }> = {
  binance: {
    logo: '/assets/binance-logo.svg',
    color: '#F0B90B',
    bg: 'rgba(240,185,11,.1)',
    gradient: 'linear-gradient(135deg,#f7931a,#ffc371)',
  },
  bybit: {
    logo: '/assets/bybit-logo.svg',
    color: '#F7A600',
    bg: 'rgba(247,166,0,.1)',
    gradient: 'linear-gradient(135deg,#f7a600,#f5b944)',
  },
};

const CATEGORY_META: Record<string, { label: string; color: string; bg: string; border: string }> =
  {
    live: {
      label: 'Live',
      color: 'var(--green)',
      bg: 'rgba(0,214,143,.1)',
      border: 'rgba(0,214,143,.25)',
    },
    demo: {
      label: 'Demo',
      color: 'var(--eb-cyan)',
      bg: 'rgba(6,182,212,.1)',
      border: 'rgba(6,182,212,.25)',
    },
    prop: {
      label: 'Prop',
      color: 'var(--eb-purple)',
      bg: 'rgba(139,92,246,.1)',
      border: 'rgba(139,92,246,.25)',
    },
  };

function venueMeta(venue: string) {
  return (
    VENUE_META[venue] ?? {
      logo: '',
      color: 'var(--eb-muted)',
      bg: 'var(--eb-panel-2)',
      gradient: 'var(--eb-panel-2)',
    }
  );
}
const DEFAULT_CATEGORY_META = {
  label: 'Live',
  color: 'var(--green)',
  bg: 'rgba(0,214,143,.1)',
  border: 'rgba(0,214,143,.25)',
};

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? DEFAULT_CATEGORY_META;
}

// ─── formatting helpers ─────────────────────────────────────────────────────────

function money(n: number, opts?: { signed?: boolean }): string {
  const abs = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  if (opts?.signed) return `${n > 0 ? '+' : n < 0 ? '−' : ''}$${abs}`;
  return `$${abs}`;
}

function pnlColor(n: number): string {
  return n > 0 ? 'var(--green)' : n < 0 ? 'var(--eb-red)' : 'var(--eb-muted)';
}

function fmtQty(s: string): string {
  const v = Number.parseFloat(s);
  return Number.isNaN(v) ? s : v.toFixed(4).replace(/\.?0+$/, '') || '0';
}

function daysAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const d = Math.floor(ms / 86_400_000);
  if (d <= 0) return 'today';
  if (d === 1) return '1 day ago';
  return `${d} days ago`;
}

// ─── shared styles ──────────────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 11,
  padding: 16,
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '8px 10px',
  borderBottom: '1px solid var(--eb-border)',
  fontSize: 10.5,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: 'var(--eb-muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
};

const tdStyle: React.CSSProperties = {
  padding: '8px 10px',
  borderBottom: '1px solid var(--eb-border)',
  fontSize: 12.5,
  whiteSpace: 'nowrap',
};

// ─── main component ─────────────────────────────────────────────────────────────

export function SubaccountDetailClient({ accountId }: { accountId: string }) {
  const { data: account, isLoading: loadingAccount, isError } = useAccount(accountId);
  const { data: positions, isLoading: loadingPositions } = usePositions(accountId);
  const [editOpen, setEditOpen] = useState(false);

  const stats = useMemo(() => {
    const list = positions ?? [];
    const closed = list.filter((p) => p.status === 'closed');
    const open = list.filter((p) => p.status === 'open');

    const totalNetPnl = list.reduce((sum, p) => sum + Number.parseFloat(p.netPnl), 0);
    const totalFees = list.reduce((sum, p) => sum + Number.parseFloat(p.fees), 0);
    const totalFunding = list.reduce((sum, p) => sum + Number.parseFloat(p.funding), 0);
    const wins = closed.filter((p) => Number.parseFloat(p.netPnl) > 0).length;
    const losses = closed.filter((p) => Number.parseFloat(p.netPnl) < 0).length;
    const winRate = wins + losses > 0 ? (wins / (wins + losses)) * 100 : null;

    const closedSortedAsc = [...closed]
      .filter((p): p is Position & { closedAt: string } => !!p.closedAt)
      .sort((a, b) => new Date(a.closedAt).getTime() - new Date(b.closedAt).getTime());

    const recentTrades = [...closed].sort(
      (a, b) => new Date(b.closedAt ?? 0).getTime() - new Date(a.closedAt ?? 0).getTime(),
    );

    const openNotional = open.reduce(
      (sum, p) => sum + Number.parseFloat(p.qtyMax) * Number.parseFloat(p.avgEntry),
      0,
    );
    const largestOpen = open.reduce<{ position: Position; notional: number } | null>((best, p) => {
      const notional = Number.parseFloat(p.qtyMax) * Number.parseFloat(p.avgEntry);
      return !best || notional > best.notional ? { position: p, notional } : best;
    }, null);

    return {
      closed,
      open,
      totalNetPnl,
      totalFees,
      totalFunding,
      wins,
      losses,
      winRate,
      closedSortedAsc,
      recentTrades,
      openNotional,
      largestOpen,
    };
  }, [positions]);

  if (isError) {
    return (
      <div style={{ padding: '18px 26px 60px', maxWidth: 960, width: '100%', alignSelf: 'center' }}>
        <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
          Workspace / Accounts
        </div>
        <div style={panel}>
          <p style={{ margin: 0, color: 'var(--eb-muted-2)', fontSize: 13.5 }}>
            This subaccount couldn't be found, or you don't have access to it.
          </p>
          <Link
            href="/accounts"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              marginTop: 12,
              fontSize: 12.5,
              color: 'var(--green)',
            }}
          >
            <ArrowLeft size={13} /> Back to accounts
          </Link>
        </div>
      </div>
    );
  }

  if (loadingAccount || !account) {
    return <DetailSkeleton />;
  }

  const startingBalance = Number.parseFloat(account.startingBalance);
  const equity = startingBalance + stats.totalNetPnl;
  const equityPct = startingBalance > 0 ? (stats.totalNetPnl / startingBalance) * 100 : null;

  // Margin health / balance composition are derived from open-position notional vs. equity —
  // this account doesn't sync live leverage, mark price, or liquidation data from the exchange,
  // so these are estimates (assuming 1x exposure), not exchange-reported margin/PnL figures.
  const cash = equity - stats.openNotional;
  const exposurePct = equity > 0 ? (stats.openNotional / equity) * 100 : 0;
  const WARN_PCT = 50;
  const CRIT_PCT = 80;
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - exposurePct)));
  const healthStatus =
    exposurePct >= CRIT_PCT ? 'critical' : exposurePct >= WARN_PCT ? 'warning' : 'healthy';
  const healthColor =
    healthStatus === 'critical'
      ? 'var(--eb-red)'
      : healthStatus === 'warning'
        ? 'var(--eb-yellow)'
        : 'var(--green)';
  const healthLabel =
    healthStatus === 'critical'
      ? 'High exposure'
      : healthStatus === 'warning'
        ? 'Elevated'
        : 'Healthy';
  const avgOpenSize = stats.open.length > 0 ? stats.openNotional / stats.open.length : 0;
  const budgetToCritical = equity * (CRIT_PCT / 100) - stats.openNotional;
  const additionalPositions =
    avgOpenSize > 0 ? Math.max(0, Math.floor(budgetToCritical / avgOpenSize)) : null;

  const compSegments =
    equity > 0
      ? [
          {
            key: 'cash',
            label: 'Cash',
            value: cash,
            bar: 'linear-gradient(180deg,#00d68f,#00b67a)',
            dot: '#00d68f',
          },
          {
            key: 'exposure',
            label: 'Open exposure',
            value: stats.openNotional,
            bar: 'linear-gradient(180deg,#f5a524,#d97706)',
            dot: '#f5a524',
          },
        ]
      : [];

  const { logo, color, gradient } = venueMeta(account.venue);
  const {
    label: catLabel,
    color: catColor,
    bg: catBg,
    border: catBorder,
  } = categoryMeta(account.category);

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1300, width: '100%', alignSelf: 'center' }}>
      {/* breadcrumb */}
      <div
        style={{
          color: 'var(--eb-muted)',
          fontSize: 12,
          marginBottom: 6,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <Link href="/accounts" style={{ color: 'var(--eb-muted)' }}>
          Accounts
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--eb-text)' }}>{account.label}</span>
      </div>

      <Link
        href="/accounts"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 14,
          fontSize: 12.5,
          color: 'var(--eb-muted-2)',
        }}
      >
        <ArrowLeft size={13} /> All accounts
      </Link>

      {/* header card */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(0,214,143,.08), rgba(6,182,212,.03))',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: '20px 22px',
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: gradient,
              flexShrink: 0,
              boxShadow: '0 12px 32px rgba(0,0,0,.25)',
            }}
          >
            {logo ? (
              <Image
                src={logo}
                alt={account.venue}
                width={30}
                height={30}
                style={{ objectFit: 'contain' }}
              />
            ) : (
              <span style={{ fontSize: 22, fontWeight: 700, color: '#fff' }}>
                {account.venue[0]?.toUpperCase()}
              </span>
            )}
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 22,
                fontWeight: 600,
                letterSpacing: '-.015em',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                flexWrap: 'wrap',
                color: 'var(--eb-text)',
              }}
            >
              {account.label}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: `${color}1A`,
                }}
              >
                {account.venue.charAt(0).toUpperCase() + account.venue.slice(1)}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: catColor,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: catBg,
                  border: `1px solid ${catBorder}`,
                }}
              >
                {catLabel}
              </span>
              <button
                type="button"
                onClick={() => setEditOpen(true)}
                title="Edit label / account size"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted)',
                  cursor: 'pointer',
                }}
              >
                <Pencil size={12} />
              </button>
            </h1>
            <div
              style={{
                fontSize: 12,
                color: 'var(--eb-muted-2)',
                display: 'flex',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <span>
                Connected{' '}
                <b style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {daysAgo(account.createdAt)}
                </b>
              </span>
              <span>
                Base currency{' '}
                <b style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {account.baseCurrency}
                </b>
              </span>
              <span>
                Account size{' '}
                <b style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {money(startingBalance)}
                </b>
              </span>
            </div>
          </div>

          <div style={{ textAlign: 'right', flex: '0 0 auto' }}>
            <div
              style={{
                fontSize: 10,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                fontWeight: 600,
              }}
            >
              Current equity
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 30,
                fontWeight: 600,
                letterSpacing: '-.02em',
                lineHeight: 1,
                marginTop: 4,
                color: 'var(--eb-text)',
              }}
            >
              {money(equity)}
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontSize: 12.5,
                marginTop: 6,
                color: pnlColor(stats.totalNetPnl),
              }}
            >
              {money(stats.totalNetPnl, { signed: true })}
              {equityPct !== null && ` · ${equityPct >= 0 ? '+' : ''}${equityPct.toFixed(2)}%`}
              {' · all-time'}
            </div>
          </div>
        </div>
      </div>

      {loadingPositions ? (
        <StatsSkeleton />
      ) : (
        <>
          {/* KPI strip */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(6, 1fr)',
              gap: 8,
              marginBottom: 16,
            }}
          >
            <Kpi label="Account size" value={money(startingBalance)} />
            <Kpi
              label="Total P&L"
              value={money(stats.totalNetPnl, { signed: true })}
              color={pnlColor(stats.totalNetPnl)}
            />
            <Kpi label="Current equity" value={money(equity)} />
            <Kpi label="Open positions" value={String(stats.open.length)} />
            <Kpi
              label="Closed trades"
              value={String(stats.closed.length)}
              sub={stats.winRate !== null ? `${stats.winRate.toFixed(0)}% win rate` : undefined}
            />
            <Kpi
              label="Fees + funding"
              value={money(-stats.totalFees + stats.totalFunding, { signed: true })}
              color={pnlColor(-stats.totalFees + stats.totalFunding)}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              {/* equity curve */}
              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Equity curve · this account only</span>
                </h3>
                <EquityCurve startingBalance={startingBalance} closedAsc={stats.closedSortedAsc} />
              </div>

              {/* balance composition */}
              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Balance composition</span>
                </h3>
                {compSegments.length === 0 ? (
                  <EmptyRow text="No equity to display a composition breakdown yet." />
                ) : (
                  <BalanceComposition equity={equity} segments={compSegments} />
                )}
              </div>

              {/* open positions */}
              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Open positions · {stats.open.length}</span>
                </h3>
                {stats.open.length === 0 ? (
                  <EmptyRow text="No open positions on this account." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Symbol', 'Side', 'Qty', 'Avg entry', 'Opened', 'P&L so far'].map(
                            (h) => (
                              <th key={h} style={thStyle}>
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.open.map((p) => (
                          <PositionRow key={p.id} position={p} kind="open" />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* recent trades */}
              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Recent trades · this account</span>
                </h3>
                {stats.recentTrades.length === 0 ? (
                  <EmptyRow text="No closed trades yet." />
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          {['Closed', 'Symbol', 'Side', 'Qty', 'Net P&L', 'Fees', 'Funding'].map(
                            (h) => (
                              <th key={h} style={thStyle}>
                                {h}
                              </th>
                            ),
                          )}
                        </tr>
                      </thead>
                      <tbody>
                        {stats.recentTrades.slice(0, 20).map((p) => (
                          <PositionRow key={p.id} position={p} kind="closed" />
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* right sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Margin health</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: healthColor,
                      padding: '2px 8px',
                      borderRadius: 99,
                      background: `${healthColor}1A`,
                      border: `1px solid ${healthColor}55`,
                    }}
                  >
                    {healthLabel} · {exposurePct.toFixed(1)}%
                  </span>
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
                  <HealthRing score={healthScore} color={healthColor} />
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 5,
                      fontSize: 12,
                      minWidth: 0,
                    }}
                  >
                    <StatRow
                      label="Exposure used"
                      value={`${exposurePct.toFixed(1)}%`}
                      color={healthColor}
                    />
                    <StatRow
                      label="Warning threshold"
                      value={`${WARN_PCT}%`}
                      color="var(--eb-yellow)"
                    />
                    <StatRow
                      label="Critical threshold"
                      value={`${CRIT_PCT}%`}
                      color="var(--eb-red)"
                    />
                    <StatRow
                      label="Largest open position"
                      value={
                        stats.largestOpen && equity > 0
                          ? `${stats.largestOpen.position.symbol} · ${((stats.largestOpen.notional / equity) * 100).toFixed(1)}%`
                          : '—'
                      }
                    />
                    <StatRow label="Available buffer" value={money(cash)} color={pnlColor(cash)} />
                  </div>
                </div>
                <hr
                  style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '12px 0' }}
                />
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
                  {stats.open.length === 0 ? (
                    'No open positions right now — full equity is available as buffer.'
                  ) : additionalPositions !== null ? (
                    <>
                      You could take roughly{' '}
                      <b style={{ color: 'var(--eb-text)' }}>
                        ~{additionalPositions} more position{additionalPositions === 1 ? '' : 's'}
                      </b>{' '}
                      at your current average size before crossing the {CRIT_PCT}% exposure
                      threshold.
                    </>
                  ) : (
                    'Estimated exposure headroom based on open positions.'
                  )}
                </div>
              </div>

              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Fees &amp; funding · all-time</span>
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <FeesItem
                    label="Fees paid"
                    value={money(stats.totalFees)}
                    color="var(--eb-red)"
                  />
                  <FeesItem
                    label="Funding"
                    value={money(Math.abs(stats.totalFunding), {
                      signed: stats.totalFunding !== 0,
                    })}
                    color={pnlColor(stats.totalFunding)}
                  />
                </div>
              </div>

              <div style={panel}>
                <h3 style={panelTitle}>
                  <span>Performance</span>
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5 }}>
                  <StatRow label="Wins" value={String(stats.wins)} color="var(--green)" />
                  <StatRow label="Losses" value={String(stats.losses)} color="var(--eb-red)" />
                  <StatRow
                    label="Win rate"
                    value={stats.winRate !== null ? `${stats.winRate.toFixed(1)}%` : '—'}
                  />
                  <StatRow
                    label="Trades total"
                    value={String(stats.closed.length + stats.open.length)}
                  />
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {editOpen && (
        <EditAccountDialog account={account} onOpenChange={(open) => setEditOpen(open)} />
      )}
    </div>
  );
}

// ─── small pieces ───────────────────────────────────────────────────────────────

function Kpi({
  label,
  value,
  sub,
  color,
}: { label: string; value: string; sub?: string | undefined; color?: string | undefined }) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 10,
        padding: '11px 12px',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: 'var(--eb-muted)',
          textTransform: 'uppercase',
          letterSpacing: '.05em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 16,
          fontWeight: 600,
          fontFamily: 'var(--font-mono, monospace)',
          marginTop: 3,
          letterSpacing: '-.01em',
          color: color ?? 'var(--eb-text)',
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 1 }}>{sub}</div>}
    </div>
  );
}

function FeesItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div
      style={{
        padding: '11px 12px',
        borderRadius: 9,
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
      }}
    >
      <div
        style={{
          fontSize: 9.5,
          color: 'var(--eb-muted)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontSize: 16,
          fontWeight: 600,
          marginTop: 3,
          letterSpacing: '-.01em',
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <span style={{ color: 'var(--eb-muted)' }}>{label}</span>
      <b
        style={{
          fontFamily: 'var(--font-mono, monospace)',
          fontWeight: 600,
          color: color ?? 'var(--eb-text)',
        }}
      >
        {value}
      </b>
    </div>
  );
}

function HealthRing({ score, color }: { score: number; color: string }) {
  const r = 46;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  return (
    <div style={{ position: 'relative', width: 110, height: 110, flex: '0 0 110px' }}>
      <svg
        width={110}
        height={110}
        viewBox="0 0 110 110"
        style={{ transform: 'rotate(-90deg)' }}
        role="img"
        aria-label={`Margin health score ${score} of 100`}
      >
        <title>Margin health score</title>
        <circle cx={55} cy={55} r={r} fill="none" stroke="var(--eb-panel-2)" strokeWidth={9} />
        <circle
          cx={55}
          cy={55}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <b
          style={{
            fontSize: 22,
            fontFamily: 'var(--font-mono, monospace)',
            fontWeight: 600,
            color: 'var(--eb-text)',
            lineHeight: 1,
          }}
        >
          {score}
        </b>
        <span
          style={{
            fontSize: 9.5,
            color: 'var(--eb-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginTop: 3,
          }}
        >
          of 100
        </span>
      </div>
    </div>
  );
}

interface CompSegment {
  key: string;
  label: string;
  value: number;
  bar: string;
  dot: string;
}

function BalanceComposition({ equity, segments }: { equity: number; segments: CompSegment[] }) {
  const barSegments = segments.filter((s) => s.value > 0 && (s.value / equity) * 100 >= 0.5);

  return (
    <>
      <div
        style={{
          height: 30,
          borderRadius: 9,
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          display: 'flex',
          overflow: 'hidden',
          margin: '8px 0 10px',
        }}
      >
        {barSegments.map((s, i) => {
          const pct = (s.value / equity) * 100;
          return (
            <div
              key={s.key}
              style={{
                width: `${pct}%`,
                height: '100%',
                background: s.bar,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 600,
                color: '#06140f',
                fontFamily: 'var(--font-mono, monospace)',
                borderRight: i === barSegments.length - 1 ? 0 : '2px solid var(--eb-panel)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {pct > 12 ? `${s.label} · ${pct.toFixed(1)}%` : ''}
            </div>
          );
        })}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, fontSize: 11.5 }}>
        {segments.map((s) => (
          <div
            key={s.key}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}
          >
            <span
              style={{ width: 9, height: 9, borderRadius: 2, background: s.dot, flexShrink: 0 }}
            />
            <span style={{ flex: 1, color: 'var(--eb-muted-2)' }}>{s.label}</span>
            <b
              style={{
                fontFamily: 'var(--font-mono, monospace)',
                fontWeight: 600,
                color: s.value < 0 ? 'var(--eb-red)' : 'var(--eb-text)',
              }}
            >
              {money(s.value, { signed: s.value < 0 })}
            </b>
          </div>
        ))}
      </div>
    </>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div
      style={{ padding: '20px 4px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 12.5 }}
    >
      {text}
    </div>
  );
}

function PositionRow({ position, kind }: { position: Position; kind: 'open' | 'closed' }) {
  const netPnl = Number.parseFloat(position.netPnl);
  const fees = Number.parseFloat(position.fees);
  const funding = Number.parseFloat(position.funding);

  return (
    <tr>
      {kind === 'closed' && (
        <td
          style={{
            ...tdStyle,
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--eb-muted)',
            fontSize: 11.5,
          }}
        >
          {position.closedAt
            ? new Date(position.closedAt).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
              })
            : '—'}
        </td>
      )}
      <td style={{ ...tdStyle, fontWeight: 600 }}>{position.symbol}</td>
      <td
        style={{
          ...tdStyle,
          color: position.side === 'long' ? 'var(--green)' : 'var(--eb-red)',
          fontWeight: 600,
        }}
      >
        {position.side.toUpperCase()}
      </td>
      <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)' }}>
        {fmtQty(position.qtyMax)}
      </td>
      {kind === 'open' ? (
        <>
          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)' }}>
            {fmtQty(position.avgEntry)}
          </td>
          <td
            style={{
              ...tdStyle,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--eb-muted)',
              fontSize: 11.5,
            }}
          >
            {new Date(position.openedAt).toLocaleDateString('en-GB', {
              day: '2-digit',
              month: 'short',
            })}
          </td>
          <td
            style={{
              ...tdStyle,
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: pnlColor(netPnl),
            }}
          >
            {money(netPnl, { signed: true })}
          </td>
        </>
      ) : (
        <>
          <td
            style={{
              ...tdStyle,
              fontFamily: 'var(--font-mono, monospace)',
              fontWeight: 600,
              color: pnlColor(netPnl),
            }}
          >
            {money(netPnl, { signed: true })}
          </td>
          <td
            style={{
              ...tdStyle,
              fontFamily: 'var(--font-mono, monospace)',
              color: 'var(--eb-red)',
            }}
          >
            {fees > 0 ? `−${money(fees)}` : money(0)}
          </td>
          <td
            style={{
              ...tdStyle,
              fontFamily: 'var(--font-mono, monospace)',
              color: pnlColor(funding),
            }}
          >
            {money(funding, { signed: true })}
          </td>
        </>
      )}
    </tr>
  );
}

function EquityCurve({
  startingBalance,
  closedAsc,
}: { startingBalance: number; closedAsc: Position[] }) {
  if (closedAsc.length < 2) {
    return <EmptyRow text="Not enough closed trades yet to draw an equity curve." />;
  }

  let running = startingBalance;
  const series = [
    { equity: startingBalance },
    ...closedAsc.map((p) => {
      running += Number.parseFloat(p.netPnl);
      return { equity: running };
    }),
  ];

  const values = series.map((s) => s.equity);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const W = 800;
  const H = 200;
  const lastIndex = series.length - 1;

  const points = series.map((s, i) => ({
    x: (i / lastIndex) * W,
    y: H - ((s.equity - min) / range) * (H - 20) - 10,
    equity: s.equity,
  }));

  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(' ');
  const areaPath = `${path} L${W},${H} L0,${H} Z`;
  const startEquity = startingBalance;
  const endEquity = running;
  const lastPoint = points[lastIndex] ?? { x: W, y: H / 2 };
  const netAllTime = endEquity - startEquity;

  return (
    <>
      <div
        style={{
          display: 'flex',
          gap: 16,
          fontSize: 11,
          color: 'var(--eb-muted)',
          marginBottom: 8,
        }}
      >
        <span>
          <b style={{ color: 'var(--eb-text)' }}>Start</b> {money(startEquity)}
        </span>
        <span>
          <b style={{ color: 'var(--eb-text)' }}>Now</b> {money(endEquity)}
        </span>
        <span style={{ color: pnlColor(netAllTime) }}>
          <b style={{ color: pnlColor(netAllTime) }}>Net</b> {money(netAllTime, { signed: true })}
        </span>
      </div>
      <div
        style={{
          height: 200,
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        <svg
          viewBox={`0 0 ${W} ${H}`}
          preserveAspectRatio="none"
          width="100%"
          height="100%"
          role="img"
          aria-label="Equity curve"
        >
          <title>Equity curve</title>
          <defs>
            <linearGradient id="eqFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#00d68f" stopOpacity=".22" />
              <stop offset="1" stopColor="#00d68f" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={areaPath} fill="url(#eqFill)" />
          <path d={path} stroke="#00d68f" strokeWidth={2} fill="none" />
          <circle
            cx={lastPoint.x}
            cy={lastPoint.y}
            r={4}
            fill="#00d68f"
            stroke="var(--eb-panel-2)"
            strokeWidth={2}
          />
        </svg>
      </div>
    </>
  );
}

// ─── skeletons ───────────────────────────────────────────────────────────────────

function Sk({
  h = 14,
  w,
  r = 6,
  style: s,
}: { h?: number; w?: string | number; r?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: h,
        width: w ?? '100%',
        borderRadius: r,
        background: 'var(--eb-panel-2)',
        animation: 'eb-sk 1.6s ease-in-out infinite',
        flexShrink: 0,
        ...s,
      }}
    />
  );
}

function DetailSkeleton() {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1300, width: '100%', alignSelf: 'center' }}>
      <style>{'@keyframes eb-sk{0%,100%{opacity:1}50%{opacity:.35}}'}</style>
      <Sk w={140} h={12} style={{ marginBottom: 18 }} />
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: 20,
          marginBottom: 16,
        }}
      >
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <Sk w={56} h={56} r={14} />
          <div style={{ flex: 1 }}>
            <Sk w="40%" h={20} style={{ marginBottom: 8 }} />
            <Sk w="60%" h={12} />
          </div>
          <Sk w={120} h={36} />
        </div>
      </div>
      <StatsSkeleton />
    </div>
  );
}

function SkPanel({
  titleWidth = '35%',
  badgeWidth,
  children,
}: {
  titleWidth?: string | number;
  badgeWidth?: number;
  children: React.ReactNode;
}) {
  return (
    <div style={panel}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Sk w={titleWidth} h={11} />
        {badgeWidth && <Sk w={badgeWidth} h={18} r={99} />}
      </div>
      {children}
    </div>
  );
}

function SkRow({
  labelWidth = '40%',
  valueWidth = '20%',
}: { labelWidth?: string | number; valueWidth?: string | number }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <Sk w={labelWidth} h={11} />
      <Sk w={valueWidth} h={11} />
    </div>
  );
}

function SkTableRows({ rows, cols }: { rows: number; cols: number[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
      {Array.from({ length: rows }, (_, i) => `row-${i}`).map((key) => (
        <div key={key} style={{ display: 'flex', gap: 16 }}>
          {cols.map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: fixed column layout
            <Sk key={i} w={w} h={11} />
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <>
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8, marginBottom: 16 }}
      >
        {['size', 'pnl', 'equity', 'open', 'closed', 'fees'].map((k) => (
          <div
            key={k}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: 12,
            }}
          >
            <Sk w="60%" h={9} style={{ marginBottom: 6 }} />
            <Sk w="80%" h={16} />
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 14 }}>
        {/* left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <SkPanel titleWidth="45%">
            <Sk h={200} r={10} />
          </SkPanel>

          <SkPanel titleWidth="35%">
            <Sk h={30} r={9} style={{ marginBottom: 10 }} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <Sk h={11} w="80%" />
              <Sk h={11} w="80%" />
            </div>
          </SkPanel>

          <SkPanel titleWidth="30%">
            <SkTableRows rows={2} cols={[60, 50, 40, 60, 60, 70]} />
          </SkPanel>

          <SkPanel titleWidth="35%">
            <SkTableRows rows={4} cols={[50, 60, 40, 40, 60, 50, 50]} />
          </SkPanel>
        </div>

        {/* right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
          <SkPanel titleWidth="30%" badgeWidth={90}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '8px 0' }}>
              <Sk w={110} h={110} r={110} style={{ flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkRow />
                <SkRow />
                <SkRow />
                <SkRow />
                <SkRow />
              </div>
            </div>
          </SkPanel>

          <SkPanel titleWidth="40%">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Sk h={54} r={9} />
              <Sk h={54} r={9} />
            </div>
          </SkPanel>

          <SkPanel titleWidth="30%">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <SkRow />
              <SkRow />
              <SkRow />
              <SkRow />
            </div>
          </SkPanel>
        </div>
      </div>
    </>
  );
}
