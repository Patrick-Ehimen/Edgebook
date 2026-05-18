'use client';

import { AddAccountDialog, useAccounts, useTriggerSync } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import { useLogTrade } from '@/providers/log-trade-provider';
import { FileUp, Link2, PenLine, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const POLL_INTERVAL = 3_000;
const POLL_TIMEOUT = 90_000;

function fmt(n: string | null | undefined, decimals = 2) {
  if (!n) return '—';
  const v = Number.parseFloat(n);
  return Number.isNaN(v) ? '—' : v.toFixed(decimals);
}

function fmtPnl(n: string | null | undefined) {
  if (!n) return { text: '—', color: 'var(--eb-muted)' };
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return { text: '—', color: 'var(--eb-muted)' };
  return {
    text: `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
    color: v > 0 ? 'var(--green)' : v < 0 ? 'var(--eb-red)' : 'var(--eb-muted)',
  };
}

function holdTime(openedAt: string, closedAt: string | null) {
  if (!closedAt) return 'open';
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const thStyle: React.CSSProperties = {
  textAlign: 'left',
  padding: '9px 12px',
  borderBottom: '1px solid var(--eb-border)',
  fontSize: 11,
  textTransform: 'uppercase',
  letterSpacing: '.05em',
  color: 'var(--eb-muted)',
  fontWeight: 600,
  whiteSpace: 'nowrap',
  background: 'var(--eb-panel)',
};

const tdStyle: React.CSSProperties = {
  padding: '9px 12px',
  borderBottom: '1px solid var(--eb-border)',
  fontSize: 12.5,
  whiteSpace: 'nowrap',
};

export default function TradesPage() {
  const router = useRouter();
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const logTrade = useLogTrade();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [connectOpen, setConnectOpen] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSync = useTriggerSync();

  const selectedId = accountId ?? accounts?.[0]?.id ?? null;
  const prevCountRef = useRef<number | null>(null);

  const { data: positions, isLoading: loadingPositions } = usePositions(selectedId, {
    refetchInterval: polling ? POLL_INTERVAL : false,
  });

  // Stop polling once new positions arrive or timeout expires
  useEffect(() => {
    if (!polling) return;
    const count = positions?.length ?? 0;
    if (prevCountRef.current !== null && count > prevCountRef.current) {
      setPolling(false);
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    }
    prevCountRef.current = count;
  }, [positions, polling]);

  // Auto-poll when account exists but has no positions yet (first sync in flight)
  useEffect(() => {
    if (!selectedId || loadingPositions) return;
    if ((positions?.length ?? 0) === 0 && !polling) {
      startPolling();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, loadingPositions]);

  function startPolling() {
    setPolling(true);
    prevCountRef.current = positions?.length ?? 0;
    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    pollTimerRef.current = setTimeout(() => setPolling(false), POLL_TIMEOUT);
  }

  async function handleResync() {
    if (!selectedId) return;
    await triggerSync.mutateAsync(selectedId);
    startPolling();
  }

  const hasAccounts = (accounts?.length ?? 0) > 0;
  const loading = loadingAccounts || loadingPositions;

  const pnlTotal = positions?.reduce((sum, p) => sum + Number.parseFloat(p.netPnl), 0) ?? 0;
  const wins = positions?.filter((p) => Number.parseFloat(p.netPnl) > 0).length ?? 0;
  const losses = positions?.filter((p) => Number.parseFloat(p.netPnl) < 0).length ?? 0;

  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Trade log
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--eb-text)' }}>
          Trade log
        </h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {hasAccounts && (
            <select
              value={selectedId ?? ''}
              onChange={(e) => setAccountId(e.target.value)}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 8,
                padding: '6px 10px',
                color: 'var(--eb-text)',
                fontSize: 12.5,
                fontFamily: 'inherit',
                outline: 0,
                cursor: 'pointer',
              }}
            >
              {accounts?.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          )}
          {hasAccounts && (
            <button
              type="button"
              onClick={handleResync}
              disabled={triggerSync.isPending || polling}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                padding: '6px 11px',
                borderRadius: 8,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                color: polling ? 'var(--green)' : 'var(--eb-muted-2)',
                fontSize: 12,
                fontFamily: 'inherit',
                cursor: triggerSync.isPending || polling ? 'not-allowed' : 'pointer',
                opacity: triggerSync.isPending ? 0.6 : 1,
                transition: 'color .15s',
              }}
            >
              <RefreshCw
                size={12}
                style={{ animation: polling ? 'spin 1s linear infinite' : 'none' }}
              />
              {polling ? 'Syncing…' : 'Resync'}
            </button>
          )}
        </div>
      </div>

      {!hasAccounts && !loadingAccounts && (
        <EmptyState onConnect={() => setConnectOpen(true)} onLog={logTrade.open} />
      )}

      {hasAccounts && (
        <>
          {/* Summary strip */}
          {positions && positions.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 20,
                marginBottom: 14,
                padding: '9px 14px',
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 9,
                fontSize: 12.5,
                color: 'var(--eb-muted)',
                alignItems: 'center',
              }}
            >
              <span>
                <strong style={{ color: 'var(--eb-text)' }}>{positions.length}</strong> positions
              </span>
              <span>
                <strong style={{ color: 'var(--green)' }}>{wins}W</strong>
                {' / '}
                <strong style={{ color: 'var(--eb-red)' }}>{losses}L</strong>
              </span>
              {positions.length > 0 && wins + losses > 0 && (
                <span>
                  Win rate{' '}
                  <strong style={{ color: 'var(--eb-text)' }}>
                    {((wins / (wins + losses)) * 100).toFixed(0)}%
                  </strong>
                </span>
              )}
              <span style={{ marginLeft: 'auto', ...fmtPnl(pnlTotal.toString()) as React.CSSProperties }}>
                Net P&L{' '}
                <strong>{fmtPnl(pnlTotal.toString()).text} USDT</strong>
              </span>
            </div>
          )}

          {/* Positions table */}
          <div
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              overflow: 'hidden',
            }}
          >
            {loading ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 13 }}>
                Loading positions…
              </div>
            ) : !positions || positions.length === 0 ? (
              <EmptyState onConnect={() => setConnectOpen(true)} onLog={logTrade.open} />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Closed', 'Symbol', 'Side', 'Qty', 'Avg entry', 'Avg exit', 'Net P&L', 'Funding', 'Hold', 'Status'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {positions.map((pos) => {
                      const pnl = fmtPnl(pos.netPnl);
                      return (
                        <tr
                          key={pos.id}
                          style={{ cursor: 'pointer' }}
                          onClick={() => router.push(`/trades/${pos.id}?account=${selectedId}`)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ')
                              router.push(`/trades/${pos.id}?account=${selectedId}`);
                          }}
                          tabIndex={0}
                        >
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)', fontSize: 11.5 }}>
                            {pos.closedAt ? new Date(pos.closedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : '—'}
                          </td>
                          <td style={{ ...tdStyle, fontWeight: 600 }}>{pos.symbol}</td>
                          <td style={{ ...tdStyle, color: pos.side === 'long' ? 'var(--green)' : 'var(--eb-red)', fontWeight: 600 }}>
                            {pos.side.toUpperCase()}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)' }}>
                            {fmt(pos.qtyMax, 4)}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)' }}>
                            {fmt(pos.avgEntry)}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)' }}>
                            {fmt(pos.avgExit)}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: pnl.color }}>
                            {pnl.text}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)' }}>
                            {fmt(pos.funding)}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--eb-muted)' }}>
                            {holdTime(pos.openedAt, pos.closedAt)}
                          </td>
                          <td style={tdStyle}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 99,
                                color: pos.status === 'open' ? 'var(--eb-purple)' : 'var(--eb-muted)',
                                background: pos.status === 'open' ? 'rgba(139,92,246,.1)' : 'var(--eb-panel-2)',
                                border: `1px solid ${pos.status === 'open' ? 'rgba(139,92,246,.3)' : 'var(--eb-border)'}`,
                              }}
                            >
                              {pos.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      <AddAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
    </div>
  );
}

// ─── Empty State ─────────────────────────────────────────────────────────────

function EmptyState({
  onConnect,
  onLog,
}: {
  onConnect: () => void;
  onLog: () => void;
}) {
  const [hovered, setHovered] = useState<number | null>(null);
  const options = [
    {
      icon: <Link2 size={22} />,
      title: 'Connect exchange',
      desc: 'Auto-sync fills via read-only API. Supports Binance and Bybit.',
      action: onConnect,
      primary: true,
      cta: 'Connect →',
    },
    {
      icon: <PenLine size={22} />,
      title: 'Log manually',
      desc: 'Enter fills one at a time. Good for prop firm accounts or paper trading.',
      action: onLog,
      primary: false,
      cta: 'Add fill →',
    },
    {
      icon: <FileUp size={22} />,
      title: 'Import CSV',
      desc: 'Upload a trade history export. Binance, Bybit, and generic formats.',
      action: () => {},
      primary: false,
      cta: 'Coming soon',
      disabled: true,
    },
  ];

  return (
    <div style={{ padding: '48px 0 24px' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 44, marginBottom: 12 }}>📒</div>
        <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 8px', color: 'var(--eb-text)' }}>
          No trades yet
        </h2>
        <p style={{ color: 'var(--eb-muted-2)', margin: 0, fontSize: 13.5 }}>
          Choose how you want to get your trade history into Edgebook.
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: 14,
        maxWidth: 820,
        margin: '0 auto',
      }}>
        {options.map((opt, i) => {
          const isHovered = hovered === i && !opt.disabled;
          return (
          <button
            key={opt.title}
            type="button"
            onClick={opt.action}
            disabled={opt.disabled}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12,
              padding: '22px 20px',
              borderRadius: 12,
              border: `1.5px solid ${
                isHovered && !opt.disabled ? 'rgba(0,214,143,.7)'
                : opt.primary ? 'rgba(0,214,143,.35)'
                : 'var(--eb-border)'
              }`,
              background: opt.primary
                ? isHovered ? 'rgba(0,214,143,.09)' : 'rgba(0,214,143,.04)'
                : isHovered ? 'rgba(0,214,143,.04)' : 'var(--eb-panel)',
              cursor: opt.disabled ? 'default' : 'pointer',
              opacity: opt.disabled ? 0.5 : 1,
              textAlign: 'left',
              fontFamily: 'inherit',
              transition: 'border-color .15s, background .15s',
              transform: isHovered ? 'translateY(-2px)' : 'translateY(0)',
              boxShadow: isHovered ? '0 6px 24px rgba(0,0,0,.18)' : 'none',
            }}
          >
            <div style={{
              width: 40, height: 40, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: opt.primary ? 'rgba(0,214,143,.12)' : 'var(--eb-panel-2)',
              color: opt.primary ? 'var(--green)' : 'var(--eb-muted)',
            }}>
              {opt.icon}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 5 }}>
                {opt.title}
              </div>
              <div style={{ fontSize: 12.5, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
                {opt.desc}
              </div>
            </div>
            <div style={{
              marginTop: 'auto',
              fontSize: 12,
              fontWeight: 600,
              color: opt.primary ? 'var(--green)' : opt.disabled ? 'var(--eb-muted)' : 'var(--eb-muted-2)',
            }}>
              {opt.cta}
            </div>
          </button>
          );
        })}
      </div>
    </div>
  );
}


