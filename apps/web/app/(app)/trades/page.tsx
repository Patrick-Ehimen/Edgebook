'use client';

import { useAccounts } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import { useState } from 'react';

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
  const { data: accounts, isLoading: loadingAccounts } = useAccounts();
  const [accountId, setAccountId] = useState<string | null>(null);

  const selectedId = accountId ?? accounts?.[0]?.id ?? null;
  const { data: positions, isLoading: loadingPositions } = usePositions(selectedId);

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
        </div>
      </div>

      {!hasAccounts && !loadingAccounts && (
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 11,
            padding: '56px 24px',
            textAlign: 'center',
          }}
        >
          <div style={{ marginBottom: 10, color: 'var(--green)', fontSize: 44 }}>📒</div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
            No trades imported yet
          </h2>
          <p style={{ color: 'var(--eb-muted-2)', margin: '0 auto 20px', maxWidth: 460, lineHeight: 1.6, fontSize: 13.5 }}>
            Connect an exchange in{' '}
            <a href="/settings" style={{ color: 'var(--green)', textDecoration: 'underline' }}>
              Settings → Connections
            </a>{' '}
            then trigger a sync to pull your trade history.
          </p>
        </div>
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
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <p style={{ color: 'var(--eb-muted-2)', margin: 0, fontSize: 13.5 }}>
                  No positions yet — trigger a sync from{' '}
                  <a href="/settings" style={{ color: 'var(--green)', textDecoration: 'underline' }}>
                    Settings → Connections
                  </a>
                  .
                </p>
              </div>
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
                        <tr key={pos.id} style={{ cursor: 'pointer' }}>
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
    </div>
  );
}
