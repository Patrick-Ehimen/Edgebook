'use client';

import { AddAccountDialog, useAccounts, useTriggerSync } from '@/features/accounts';
import { usePlaybooks } from '@/features/playbooks';
import { usePositions } from '@/features/positions';
import { useLogTrade } from '@/providers/log-trade-provider';
import { TradeCalendar } from '../_components/TradeCalendar';
import { CalendarDays, FileUp, LayoutList, Link2, PenLine, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

const PLAYBOOK_PALETTE: { text: string; bg: string; border: string }[] = [
  { text: '#60a5fa', bg: 'rgba(59,130,246,.12)', border: 'rgba(59,130,246,.30)' },
  { text: '#a78bfa', bg: 'rgba(139,92,246,.12)', border: 'rgba(139,92,246,.30)' },
  { text: '#34d399', bg: 'rgba(16,185,129,.12)', border: 'rgba(16,185,129,.30)' },
  { text: '#f472b6', bg: 'rgba(236,72,153,.12)', border: 'rgba(236,72,153,.30)' },
  { text: '#fb923c', bg: 'rgba(249,115,22,.12)', border: 'rgba(249,115,22,.30)' },
  { text: '#facc15', bg: 'rgba(234,179,8,.12)',  border: 'rgba(234,179,8,.30)'  },
  { text: '#22d3ee', bg: 'rgba(6,182,212,.12)',  border: 'rgba(6,182,212,.30)'  },
  { text: '#f87171', bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.30)'  },
];

function playbookColor(id: string) {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return PLAYBOOK_PALETTE[hash % PLAYBOOK_PALETTE.length];
}

const POLL_INTERVAL = 3_000;
const POLL_TIMEOUT = 90_000;
const PAGE_SIZE = 50;

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
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
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
  const { data: playbooks } = usePlaybooks();
  const logTrade = useLogTrade();
  const [accountId, setAccountId] = useState<string | null>(null);
  const [polling, setPolling] = useState(false);
  const [page, setPage] = useState(0);
  const [connectOpen, setConnectOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  // Filters
  const [filterSymbol, setFilterSymbol] = useState('');
  const [filterSide, setFilterSide] = useState<'any' | 'long' | 'short'>('any');
  const [filterStatus, setFilterStatus] = useState<'any' | 'open' | 'closed'>('any');
  const [filterResult, setFilterResult] = useState<'any' | 'win' | 'loss'>('any');
  const [filterDate, setFilterDate] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerSync = useTriggerSync();

  const selectedId = accountId ?? accounts?.[0]?.id ?? null;
  const prevCountRef = useRef<number | null>(null);

  // Reset to first page whenever account or filters change
  useEffect(() => { setPage(0); }, [selectedId, filterSymbol, filterSide, filterStatus, filterResult, filterDate]);

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

  const filtered = useMemo(() => {
    let list = positions ?? [];
    if (filterSymbol.trim()) {
      const q = filterSymbol.trim().toUpperCase();
      list = list.filter((p) => p.symbol.toUpperCase().includes(q));
    }
    if (filterSide !== 'any') list = list.filter((p) => p.side === filterSide);
    if (filterStatus !== 'any') list = list.filter((p) => p.status === filterStatus);
    if (filterResult !== 'any') {
      list = list.filter((p) => {
        if (p.status === 'open') return false;
        const v = Number.parseFloat(p.netPnl);
        return filterResult === 'win' ? v > 0 : v < 0;
      });
    }
    if (filterDate !== 'all') {
      const days = filterDate === '7d' ? 7 : filterDate === '30d' ? 30 : 90;
      const cutoff = Date.now() - days * 86_400_000;
      list = list.filter((p) => new Date(p.openedAt).getTime() >= cutoff);
    }
    return list;
  }, [positions, filterSymbol, filterSide, filterStatus, filterResult, filterDate]);

  const isFiltered = filterSymbol.trim() || filterSide !== 'any' || filterStatus !== 'any' || filterResult !== 'any' || filterDate !== 'all';

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Summary stats reflect filtered results
  const closed = filtered.filter((p) => p.status === 'closed');
  const openCount = filtered.filter((p) => p.status === 'open').length;
  const pnlTotal = closed.reduce((sum, p) => sum + Number.parseFloat(p.netPnl), 0);
  const wins = closed.filter((p) => Number.parseFloat(p.netPnl) > 0).length;
  const losses = closed.filter((p) => Number.parseFloat(p.netPnl) < 0).length;

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
          <button
            type="button"
            onClick={() => setCsvOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '6px 11px', borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted-2)', fontSize: 12,
              fontFamily: 'inherit', cursor: 'pointer',
            }}
          >
            <FileUp size={12} />
            Import CSV
          </button>
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

      {loading && <TradesPageSkeleton />}

      {!loading && !hasAccounts && (
        <EmptyState onConnect={() => setConnectOpen(true)} onLog={logTrade.open} />
      )}

      {!loading && hasAccounts && (
        <>
          {/* Filter bar + view toggle */}
          {positions && positions.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <div style={{ flex: 1, minWidth: 0, visibility: view === 'calendar' ? 'hidden' : 'visible' }}>
                <FilterBar
                  symbol={filterSymbol} onSymbol={setFilterSymbol}
                  side={filterSide} onSide={setFilterSide}
                  status={filterStatus} onStatus={setFilterStatus}
                  result={filterResult} onResult={setFilterResult}
                  date={filterDate} onDate={setFilterDate}
                  matchCount={filtered.length}
                  onClear={() => {
                    setFilterSymbol(''); setFilterSide('any');
                    setFilterStatus('any'); setFilterResult('any'); setFilterDate('all');
                  }}
                />
              </div>
              <div style={{
                display: 'flex', padding: 3, gap: 2,
                background: 'var(--eb-panel)', border: '1px solid var(--eb-border)',
                borderRadius: 8, flexShrink: 0,
              }}>
                {(['list', 'calendar'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    title={v === 'list' ? 'List view' : 'Calendar view'}
                    onClick={() => setView(v)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      padding: '5px 8px', borderRadius: 6, cursor: 'pointer',
                      border: `1px solid ${view === v ? 'var(--eb-border)' : 'transparent'}`,
                      background: view === v ? 'var(--eb-panel-2)' : 'transparent',
                      color: view === v ? 'var(--eb-text)' : 'var(--eb-muted)',
                      fontFamily: 'inherit',
                    }}
                  >
                    {v === 'list' ? <LayoutList size={13} /> : <CalendarDays size={13} />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Calendar view */}
          {positions && positions.length > 0 && view === 'calendar' && (
            <TradeCalendar positions={filtered} />
          )}

          {/* List view — also shown when no positions (empty state) */}
          {(view === 'list' || !positions || positions.length === 0) && (
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
                <strong style={{ color: 'var(--eb-text)' }}>{filtered.length}</strong> trades
              </span>
              <span style={{ color: 'var(--eb-border)' }}>·</span>
              <span>
                <strong style={{ color: 'var(--green)' }}>{closed.length}</strong> closed
              </span>
              <span>
                <strong style={{ color: openCount > 0 ? '#a78bfa' : 'var(--eb-muted)' }}>{openCount}</strong> open
              </span>
              <span style={{ color: 'var(--eb-border)' }}>·</span>
              <span>
                <strong style={{ color: 'var(--green)' }}>{wins}W</strong>
                {' / '}
                <strong style={{ color: 'var(--eb-red)' }}>{losses}L</strong>
              </span>
              {filtered.length > 0 && wins + losses > 0 && (
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
            {!positions || positions.length === 0 ? (
              <EmptyState onConnect={() => setConnectOpen(true)} onLog={logTrade.open} />
            ) : filtered.length === 0 ? (
              <div style={{ padding: '48px', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 13 }}>
                No trades match the current filters.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Closed', 'Symbol', 'Side', 'Qty', 'Avg entry', 'Avg exit', 'R-multiple', 'MFE', 'Net P&L', 'Funding', 'Hold', 'Playbook', 'Status'].map((h) => (
                        <th key={h} style={thStyle}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((pos) => {
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
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: (() => { const v = Number.parseFloat(pos.rRealized ?? ''); return pos.rRealized && !Number.isNaN(v) ? (v >= 0 ? 'var(--green)' : 'var(--eb-red)') : 'var(--eb-muted)'; })() }}>
                            {pos.rRealized && !Number.isNaN(Number.parseFloat(pos.rRealized))
                              ? `${Number.parseFloat(pos.rRealized) >= 0 ? '+' : ''}${Number.parseFloat(pos.rRealized).toFixed(2)}R`
                              : '—'}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', color: pos.mfe ? 'var(--green)' : 'var(--eb-muted)' }}>
                            {pos.mfe && !Number.isNaN(Number.parseFloat(pos.mfe))
                              ? `+${Number.parseFloat(pos.mfe).toFixed(2)}R`
                              : '—'}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', fontWeight: 600, color: pos.status === 'open' ? 'var(--eb-muted)' : pnl.color }}>
                            {pos.status === 'open' ? '—' : pnl.text}
                          </td>
                          <td style={{ ...tdStyle, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)' }}>
                            {fmt(pos.funding)}
                          </td>
                          <td style={{ ...tdStyle, color: 'var(--eb-muted)' }}>
                            {holdTime(pos.openedAt, pos.closedAt)}
                          </td>
                          <td style={{ ...tdStyle, maxWidth: 140 }}>
                            {pos.playbookId ? (
                              <span style={{
                                display: 'inline-flex', alignItems: 'center',
                                fontSize: 11, padding: '2px 8px', borderRadius: 99,
                                color: playbookColor(pos.playbookId).text,
                                background: playbookColor(pos.playbookId).bg,
                                border: `1px solid ${playbookColor(pos.playbookId).border}`,
                                maxWidth: 130, overflow: 'hidden', textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {playbooks?.find((p) => p.id === pos.playbookId)?.name ?? `${pos.playbookId.slice(0, 10)}…`}
                              </span>
                            ) : (
                              <span style={{ color: 'var(--eb-muted)', fontSize: 12 }}>—</span>
                            )}
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

          {/* Pagination */}
          {pageCount > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 12,
              padding: '8px 4px',
            }}>
              <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
                Showing {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, filtered.length)} of{' '}
                <strong style={{ color: 'var(--eb-text)' }}>{filtered.length}</strong>
                {isFiltered && <span style={{ color: 'var(--eb-muted)' }}> (filtered)</span>} trades
              </span>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <PageBtn onClick={() => setPage(0)} disabled={page === 0} label="«" />
                <PageBtn onClick={() => setPage((p) => p - 1)} disabled={page === 0} label="‹ Prev" />
                {Array.from({ length: pageCount }, (_, i) => i)
                  .filter((i) => Math.abs(i - page) <= 2)
                  .map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setPage(i)}
                      style={{
                        minWidth: 32, height: 30, borderRadius: 7,
                        border: `1px solid ${i === page ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
                        background: i === page ? 'rgba(0,214,143,.12)' : 'var(--eb-panel-2)',
                        color: i === page ? 'var(--green)' : 'var(--eb-muted-2)',
                        fontSize: 12, fontWeight: i === page ? 600 : 400,
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {i + 1}
                    </button>
                  ))}
                <PageBtn onClick={() => setPage((p) => p + 1)} disabled={page === pageCount - 1} label="Next ›" />
                <PageBtn onClick={() => setPage(pageCount - 1)} disabled={page === pageCount - 1} label="»" />
              </div>
            </div>
          )}
            </>
          )}
        </>
      )}

      <AddAccountDialog open={connectOpen} onOpenChange={setConnectOpen} />
      {csvOpen && <CsvImportDialog onClose={() => setCsvOpen(false)} />}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function Sk({ h = 14, w, r = 6, style: s }: { h?: number; w?: string | number; r?: number; style?: React.CSSProperties }) {
  return (
    <div style={{
      height: h, width: w ?? '100%', borderRadius: r,
      background: 'var(--eb-panel-2)',
      animation: 'eb-sk 1.6s ease-in-out infinite',
      flexShrink: 0,
      ...s,
    }} />
  );
}

const SK_HDR_W = [58, 72, 44, 52, 72, 68, 72, 52, 68, 60, 44, 70, 44, 52];
const SK_ROW_W = [50, 80, 38, 55, 65, 62, 60, 48, 62, 52, 40, 45, 20, 45];

function TradesPageSkeleton() {
  return (
    <>
      <style>{'@keyframes eb-sk{0%,100%{opacity:1}50%{opacity:.35}}'}</style>

      {/* Filter bar skeleton */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10, alignItems: 'center' }}>
        {([130, 95, 105, 100, 115] as number[]).map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton order
          <Sk key={i} h={28} w={w} r={99} />
        ))}
      </div>

      {/* Summary strip skeleton */}
      <div style={{
        display: 'flex', gap: 16, alignItems: 'center',
        padding: '9px 14px',
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 9,
        marginBottom: 14,
      }}>
        {([55, 65, 50, 70, 60, 80, 100] as number[]).map((w, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton order
          <Sk key={i} h={12} w={w} r={4} />
        ))}
      </div>

      {/* Table skeleton */}
      <div style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 11,
        overflow: 'hidden',
      }}>
        {/* Header row */}
        <div style={{
          display: 'flex',
          padding: '9px 0',
          borderBottom: '1px solid var(--eb-border)',
        }}>
          {SK_HDR_W.map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton order
            <div key={i} style={{ padding: '0 12px', flexShrink: 0 }}>
              <Sk h={11} w={w} r={3} />
            </div>
          ))}
        </div>
        {/* Data rows */}
        {Array.from({ length: 15 }, (_, row) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton order
          <div key={row} style={{
            display: 'flex',
            alignItems: 'center',
            padding: '9px 0',
            borderBottom: '1px solid var(--eb-border)',
          }}>
            {SK_ROW_W.map((w, i) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton order
              <div key={i} style={{ padding: '0 12px', flexShrink: 0 }}>
                <Sk h={14} w={w} r={4} />
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

// ─── CSV Import Dialog ────────────────────────────────────────────────────────

function CsvImportDialog({ onClose }: { onClose: () => void }) {
  const [dragOver, setDragOver] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  function handleFile(f: File) {
    if (f.name.endsWith('.csv') || f.type === 'text/csv') setFile(f);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,7,12,.62)', backdropFilter: 'blur(5px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        width: 480, background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)', borderRadius: 14,
        boxShadow: '0 24px 60px rgba(0,0,0,.5)', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', borderBottom: '1px solid var(--eb-border)',
          background: 'linear-gradient(180deg,var(--eb-panel-2),var(--eb-panel))',
        }}>
          <span style={{
            width: 28, height: 28, borderRadius: 7, flexShrink: 0,
            background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 14,
          }}>
            <FileUp size={14} style={{ color: 'var(--eb-muted)' }} />
          </span>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>Import CSV</h2>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--eb-muted)' }}>
              Binance, Bybit, or generic trade history export
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: 4, borderRadius: 6, display: 'flex' }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Drop zone */}
          <label
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              justifyContent: 'center', gap: 8,
              border: `2px dashed ${dragOver ? 'var(--green)' : file ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
              borderRadius: 10, padding: '32px 20px', cursor: 'pointer',
              background: dragOver ? 'rgba(0,214,143,.06)' : file ? 'rgba(0,214,143,.03)' : 'var(--eb-panel-2)',
              transition: 'border-color .15s, background .15s',
            }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault(); setDragOver(false);
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
          >
            {file ? (
              <>
                <span style={{ fontSize: 28 }}>📄</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--green)' }}>{file.name}</span>
                <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
                  {(file.size / 1024).toFixed(1)} KB · Click to replace
                </span>
              </>
            ) : (
              <>
                <span style={{ fontSize: 28 }}>⤓</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--eb-muted-2)' }}>
                  Drop your CSV here, or <span style={{ color: 'var(--green)', textDecoration: 'underline' }}>browse</span>
                </span>
                <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
                  .csv files only · Binance, Bybit, and generic formats
                </span>
              </>
            )}
            <input
              type="file" accept=".csv,text/csv" style={{ display: 'none' }}
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
            />
          </label>

          {/* Format guide */}
          <div style={{ marginTop: 14 }}>
            <p style={{ fontSize: 11, color: 'var(--eb-muted)', margin: '0 0 8px', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
              Expected columns (generic format)
            </p>
            <div style={{
              fontFamily: 'var(--font-mono, monospace)', fontSize: 11,
              color: 'var(--eb-muted-2)', background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)', borderRadius: 7,
              padding: '8px 12px', lineHeight: 1.7,
            }}>
              symbol, side, qty, price, fee, fee_ccy, executed_at
            </div>
          </div>

          {/* Coming soon notice */}
          <div style={{
            marginTop: 14, padding: '10px 12px', borderRadius: 8,
            background: 'rgba(167,139,250,.07)', border: '1px solid rgba(167,139,250,.2)',
            fontSize: 12, color: '#a78bfa', display: 'flex', gap: 8, alignItems: 'flex-start',
          }}>
            <span style={{ flexShrink: 0 }}>🚧</span>
            <span>CSV parsing is coming soon. You can select your file now — import will be enabled in the next release.</span>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', justifyContent: 'flex-end', gap: 8,
          padding: '12px 18px', borderTop: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
        }}>
          <button
            type="button" onClick={onClose}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--eb-border)', background: 'transparent', color: 'var(--eb-muted-2)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button" disabled
            style={{ padding: '7px 18px', borderRadius: 8, border: '1px solid rgba(0,182,122,.4)', background: 'rgba(0,214,143,.12)', color: 'rgba(0,214,143,.5)', fontSize: 12.5, fontWeight: 600, cursor: 'not-allowed', fontFamily: 'inherit' }}
          >
            Import trades
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Filter bar ───────────────────────────────────────────────────────────────

type Side = 'any' | 'long' | 'short';
type StatusF = 'any' | 'open' | 'closed';
type ResultF = 'any' | 'win' | 'loss';
type DateF = 'all' | '7d' | '30d' | '90d';

const SIDE_OPTS: { value: Side; label: string }[] = [
  { value: 'any', label: 'Side: any' },
  { value: 'long', label: 'Side: Long' },
  { value: 'short', label: 'Side: Short' },
];
const STATUS_OPTS: { value: StatusF; label: string }[] = [
  { value: 'any', label: 'Status: any' },
  { value: 'open', label: 'Status: open' },
  { value: 'closed', label: 'Status: closed' },
];
const RESULT_OPTS: { value: ResultF; label: string }[] = [
  { value: 'any', label: 'Win/Loss: any' },
  { value: 'win', label: 'Win/Loss: wins' },
  { value: 'loss', label: 'Win/Loss: losses' },
];
const DATE_OPTS: { value: DateF; label: string }[] = [
  { value: 'all', label: 'Date: all time' },
  { value: '7d', label: 'Date: last 7D' },
  { value: '30d', label: 'Date: last 30D' },
  { value: '90d', label: 'Date: last 90D' },
];

function cycle<T>(opts: { value: T }[], current: T): T {
  const idx = opts.findIndex((o) => o.value === current);
  const next = opts[(idx + 1) % opts.length];
  return next ? next.value : opts[0]?.value ?? current;
}

function FilterChip<T extends string>({
  opts,
  value,
  onChange,
  activeColor,
}: {
  opts: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  activeColor?: string | undefined;
}) {
  const label = opts.find((o) => o.value === value)?.label ?? '';
  const isActive = value !== opts[0]?.value;
  return (
    <button
      type="button"
      onClick={() => onChange(cycle(opts, value))}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 4,
        padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
        fontFamily: 'inherit', fontSize: 12, whiteSpace: 'nowrap',
        border: `1px solid ${isActive ? (activeColor ?? 'rgba(0,214,143,.45)') : 'var(--eb-border)'}`,
        background: isActive ? (activeColor ? `${activeColor}18` : 'rgba(0,214,143,.09)') : 'var(--eb-panel-2)',
        color: isActive ? (activeColor ?? 'var(--green)') : 'var(--eb-muted-2)',
        fontWeight: isActive ? 600 : 400,
        transition: 'background .12s, border-color .12s, color .12s',
      }}
    >
      {label} {isActive ? '✕' : '▾'}
    </button>
  );
}

function FilterBar({
  symbol, onSymbol,
  side, onSide,
  status, onStatus,
  result, onResult,
  date, onDate,
  matchCount,
  onClear,
}: {
  symbol: string; onSymbol: (v: string) => void;
  side: Side; onSide: (v: Side) => void;
  status: StatusF; onStatus: (v: StatusF) => void;
  result: ResultF; onResult: (v: ResultF) => void;
  date: DateF; onDate: (v: DateF) => void;
  matchCount: number;
  onClear: () => void;
}) {
  const anyActive = symbol.trim() || side !== 'any' || status !== 'any' || result !== 'any' || date !== 'all';

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 6, marginBottom: 10,
    }}>
      {/* Symbol search */}
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '5px 11px', borderRadius: 99,
        border: `1px solid ${symbol.trim() ? 'rgba(0,214,143,.45)' : 'var(--eb-border)'}`,
        background: symbol.trim() ? 'rgba(0,214,143,.09)' : 'var(--eb-panel-2)',
        minWidth: 130,
      }}>
        <span style={{ fontSize: 11, color: 'var(--eb-muted)', flexShrink: 0 }}>Symbol:</span>
        <input
          value={symbol}
          onChange={(e) => onSymbol(e.target.value)}
          placeholder="any"
          style={{
            background: 'transparent', border: 0, outline: 0,
            color: symbol.trim() ? 'var(--green)' : 'var(--eb-muted-2)',
            fontSize: 12, fontFamily: 'inherit', fontWeight: symbol.trim() ? 600 : 400,
            width: 72,
          }}
        />
        {symbol.trim() && (
          <button
            type="button"
            onClick={() => onSymbol('')}
            style={{ background: 'none', border: 0, color: 'var(--green)', cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 11 }}
          >✕</button>
        )}
      </div>

      <FilterChip opts={SIDE_OPTS} value={side} onChange={onSide}
        activeColor={side === 'long' ? 'var(--green)' : side === 'short' ? 'var(--eb-red)' : undefined}
      />
      <FilterChip opts={STATUS_OPTS} value={status} onChange={onStatus}
        activeColor="rgba(139,92,246,1)"
      />
      <FilterChip opts={RESULT_OPTS} value={result} onChange={onResult}
        activeColor={result === 'win' ? 'var(--green)' : result === 'loss' ? 'var(--eb-red)' : undefined}
      />
      <FilterChip opts={DATE_OPTS} value={date} onChange={onDate}
        activeColor="#a78bfa"
      />

      {anyActive && (
        <button
          type="button"
          onClick={onClear}
          style={{
            padding: '5px 11px', borderRadius: 99, cursor: 'pointer',
            border: '1px solid var(--eb-border)', background: 'transparent',
            color: 'var(--eb-muted)', fontSize: 12, fontFamily: 'inherit',
          }}
        >
          Clear filters
        </button>
      )}

      <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--eb-muted)' }}>
        <strong style={{ color: 'var(--eb-text)' }}>{matchCount}</strong> trade{matchCount !== 1 ? 's' : ''}
        {anyActive ? ' matched' : ''}
      </span>
    </div>
  );
}

// ─── Pagination button ────────────────────────────────────────────────────────

function PageBtn({ onClick, disabled, label }: { onClick: () => void; disabled: boolean; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0 10px', height: 30, borderRadius: 7,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        color: disabled ? 'var(--eb-border)' : 'var(--eb-muted-2)',
        fontSize: 12, cursor: disabled ? 'default' : 'pointer',
        fontFamily: 'inherit',
      }}
    >
      {label}
    </button>
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


