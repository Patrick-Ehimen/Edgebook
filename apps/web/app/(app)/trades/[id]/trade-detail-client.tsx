'use client';

import { usePosition } from '@/features/positions';
import type { PositionDetail } from '@/features/positions';
import Link from 'next/link';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: string | null | undefined, decimals = 2) {
  if (!n) return '—';
  const v = Number.parseFloat(n);
  return Number.isNaN(v) ? '—' : v.toFixed(decimals);
}

function fmtPnl(n: string | null | undefined): { text: string; color: string } {
  if (!n) return { text: '—', color: 'var(--eb-muted)' };
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return { text: '—', color: 'var(--eb-muted)' };
  const abs = Math.abs(v).toFixed(2);
  return {
    text: `${v >= 0 ? '+' : '−'}$${abs}`,
    color: v > 0 ? 'var(--green)' : v < 0 ? 'var(--eb-red)' : 'var(--eb-muted)',
  };
}

function fmtR(n: string | null | undefined): string {
  if (!n) return '—';
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return '—';
  return `${v >= 0 ? '+' : ''}${v.toFixed(2)}R`;
}

function holdTime(openedAt: string, closedAt: string | null): string {
  if (!closedAt) return 'open';
  const ms = new Date(closedAt).getTime() - new Date(openedAt).getTime();
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function utcTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'UTC',
  });
}

function utcDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

// ─── Shared style constants ───────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 11,
  padding: 16,
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
};

const btn: React.CSSProperties = {
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
  textDecoration: 'none',
};

const chip: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11.5,
  padding: '3px 9px',
  borderRadius: 99,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-muted-2)',
};

const chipGreen: React.CSSProperties = {
  ...chip,
  color: 'var(--green)',
  borderColor: 'rgba(0,214,143,.30)',
  background: 'rgba(0,214,143,.08)',
};

const inputStyle: React.CSSProperties = {
  background: 'var(--eb-panel-2)',
  border: '1px solid var(--eb-border)',
  borderRadius: 7,
  padding: '7px 10px',
  color: 'var(--eb-text)',
  outline: 0,
  fontSize: 12.5,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inputStyle,
  minHeight: 74,
  resize: 'vertical',
};

const fieldLabel: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  fontWeight: 600,
  marginBottom: 5,
  display: 'block',
};

const sep: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--eb-border)',
  margin: '14px 0',
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function PanelH3({ left, right }: { left: React.ReactNode; right?: React.ReactNode }) {
  return (
    <h3 style={panelTitle}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>{left}</span>
      {right && <span>{right}</span>}
    </h3>
  );
}

function Kpi({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string | undefined;
  color?: string | undefined;
}) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 10,
        padding: '10px 12px',
      }}
    >
      <div
        style={{
          color: 'var(--eb-muted)',
          fontSize: 10.5,
          textTransform: 'uppercase',
          letterSpacing: '.05em',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 17,
          fontWeight: 600,
          letterSpacing: '-.01em',
          fontVariantNumeric: 'tabular-nums',
          color: color ?? 'var(--eb-text)',
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{sub}</div>}
    </div>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div
      style={{
        padding: '18px 0 4px',
        textAlign: 'center',
        color: 'var(--eb-muted)',
        fontSize: 12.5,
      }}
    >
      {text}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TradeDetailClient({
  positionId,
  accountId,
}: {
  positionId: string;
  accountId: string | null;
}) {
  const { data: position, isLoading, error } = usePosition(accountId, positionId);

  if (!accountId) {
    return (
      <div style={{ padding: '60px 26px', textAlign: 'center', color: 'var(--eb-muted)' }}>
        Missing account context.{' '}
        <Link href="/trades" style={{ color: 'var(--green)' }}>
          ← Back to trades
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div style={{ padding: '60px 26px', textAlign: 'center', color: 'var(--eb-muted)' }}>
        Loading trade…
      </div>
    );
  }

  if (error || !position) {
    return (
      <div style={{ padding: '60px 26px', textAlign: 'center', color: 'var(--eb-muted)' }}>
        Trade not found.{' '}
        <Link href="/trades" style={{ color: 'var(--green)' }}>
          ← Back to trades
        </Link>
      </div>
    );
  }

  return <Detail position={position} accountId={accountId} />;
}

// ─── Parse per-fill text from the opening fill ───────────────────────────────

function openingFill(position: PositionDetail) {
  if (position.fills.length === 0) return null;
  const sorted = [...position.fills].sort((a, b) =>
    new Date(a.fill.executedAt).getTime() - new Date(b.fill.executedAt).getTime(),
  );
  const first = sorted[0];
  return first ? first.fill : null;
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function Detail({ position, accountId }: { position: PositionDetail; accountId: string }) {
  const pnl = fmtPnl(position.netPnl);
  const pnlV = Number.parseFloat(position.netPnl);
  const hold = holdTime(position.openedAt, position.closedAt);
  const isLong = position.side === 'long';
  const firstFill = openingFill(position);

  return (
    <>
      {/* ── Sticky page head ────────────────────────────────────────────── */}
      <div
        style={{
          padding: '20px 26px 14px',
          borderBottom: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
          position: 'sticky',
          top: 53,
          zIndex: 4,
        }}
        className="dark:bg-[#10151d] bg-white"
      >
        <div
          style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flexWrap: 'wrap' }}
        >
          {/* title */}
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 600,
                margin: 0,
                letterSpacing: '-0.01em',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--eb-text)',
              }}
            >
              {position.symbol}
              <span
                style={{
                  fontSize: 11,
                  padding: '2px 8px',
                  borderRadius: 5,
                  letterSpacing: '.05em',
                  fontWeight: 600,
                  background: isLong ? 'rgba(0,214,143,.14)' : 'rgba(255,91,108,.14)',
                  color: isLong ? 'var(--green)' : 'var(--eb-red)',
                }}
              >
                {position.side.toUpperCase()}
              </span>
              <span
                style={{
                  color: 'var(--eb-muted)',
                  fontFamily: 'var(--font-mono, monospace)',
                  fontWeight: 400,
                  fontSize: 18,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {fmt(position.qtyMax, 4)}
              </span>
            </h1>
            <div style={{ color: 'var(--eb-muted)', fontSize: 12.5, marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: '2px 14px', alignItems: 'center' }}>
              <span>
                Opened:{' '}
                <strong style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>
                  {utcDate(position.openedAt)} {utcTime(position.openedAt)} UTC
                </strong>
              </span>
              <span>
                Close:{' '}
                {position.closedAt ? (
                  <strong style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)' }}>
                    {utcDate(position.closedAt)} {utcTime(position.closedAt)} UTC
                  </strong>
                ) : (
                  <strong
                    className="pulse-dot"
                    style={{ color: 'var(--green)', fontFamily: 'var(--font-mono, monospace)' }}
                  >
                    Active
                  </strong>
                )}
              </span>
              <span>
                Hold:{' '}
                {position.closedAt ? (
                  <strong style={{ color: 'var(--eb-text)' }}>{hold}</strong>
                ) : (
                  <strong
                    className="pulse-dot"
                    style={{ color: 'var(--green)' }}
                  >
                    Running
                  </strong>
                )}
              </span>
              <span style={{ color: 'var(--eb-muted)', fontSize: 11.5 }}>
                ID{' '}
                <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {position.id.slice(0, 16)}
                </span>
              </span>
            </div>
          </div>

          {/* actions */}
          <div
            style={{
              marginLeft: 'auto',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
          >
            {position.rRealized && (
              <span style={chipGreen}>{fmtR(position.rRealized)}</span>
            )}
            <span
              style={{
                ...chip,
                color: pnl.color,
                borderColor:
                  pnlV > 0
                    ? 'rgba(0,214,143,.30)'
                    : pnlV < 0
                      ? 'rgba(255,91,108,.30)'
                      : 'var(--eb-border)',
                background:
                  pnlV > 0
                    ? 'rgba(0,214,143,.08)'
                    : pnlV < 0
                      ? 'rgba(255,91,108,.08)'
                      : 'var(--eb-panel-2)',
              }}
            >
              {pnl.text}
            </span>
            <span style={{ width: 8 }} />
            <Link href={`/trades?account=${accountId}`} style={btn}>
              ← Trades
            </Link>
            <button type="button" style={btn}>
              ✏️ Edit
            </button>
            <button
              type="button"
              style={{
                ...btn,
                background: 'rgba(255,91,108,.12)',
                borderColor: 'rgba(255,91,108,.35)',
                color: 'var(--eb-red)',
              }}
            >
              🗑 Delete
            </button>
          </div>
        </div>
      </div>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          padding: '14px 26px 0',
        }}
      >
        <Kpi
          label="Net P&L"
          value={pnl.text}
          sub="After fees + funding"
          color={pnl.color}
        />
        <Kpi
          label="R-multiple"
          value={fmtR(position.rRealized)}
          sub={position.rPlanned ? `Planned ${position.rPlanned}R` : 'Planned —'}
          color={
            position.rRealized
              ? Number.parseFloat(position.rRealized) >= 0
                ? 'var(--green)'
                : 'var(--eb-red)'
              : undefined
          }
        />
        <Kpi
          label="MFE"
          value={position.mfe ? `+${Number.parseFloat(position.mfe).toFixed(2)}R` : '—'}
          sub="Peak favorable"
          color={position.mfe ? 'var(--green)' : undefined}
        />
        <Kpi
          label="MAE"
          value={
            position.mae
              ? `${Number.parseFloat(position.mae) > 0 ? '+' : ''}${Number.parseFloat(position.mae).toFixed(2)}R`
              : '—'
          }
          sub="Peak adverse"
          color={position.mae ? 'var(--eb-red)' : undefined}
        />
        <Kpi label="Hold time" value={hold} sub={position.closedAt ? 'Closed' : 'Open'} />
        <Kpi
          label="Fees"
          value={`$${fmt(position.fees)}`}
          sub="Maker + taker"
          color={
            Number.parseFloat(position.fees ?? '0') > 0 ? 'var(--eb-muted)' : undefined
          }
        />
        <Kpi
          label="Funding"
          value={
            position.funding
              ? `${Number.parseFloat(position.funding) >= 0 ? '+' : '−'}$${Math.abs(Number.parseFloat(position.funding)).toFixed(2)}`
              : '—'
          }
          sub="Intervals accrued"
          color={
            position.funding
              ? Number.parseFloat(position.funding) < 0
                ? 'var(--eb-red)'
                : 'var(--eb-muted)'
              : undefined
          }
        />
      </div>

      {/* ── Two-column body ─────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 340px',
          gap: 14,
          padding: '14px 26px 60px',
          maxWidth: 1500,
          width: '100%',
          alignSelf: 'center',
          boxSizing: 'border-box',
        }}
      >
        {/* ── LEFT COLUMN ─────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Pre-trade plan */}
          <div style={panel}>
            <PanelH3
              left="📋 Pre-trade plan"
              right={<span style={chip}>Locked at open</span>}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <label style={fieldLabel}>Thesis at entry</label>
                <textarea
                  style={textareaStyle}
                  readOnly
                  value={firstFill?.thesis ?? ''}
                  placeholder="No thesis recorded."
                />
              </div>
              <div>
                <label style={fieldLabel}>Invalidation</label>
                <textarea
                  style={textareaStyle}
                  readOnly
                  value={firstFill?.invalidation ?? ''}
                  placeholder="No invalidation recorded."
                />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Planned entry</label>
                <input style={inputStyle} readOnly value={fmt(firstFill?.price)} placeholder="—" />
              </div>
              <div>
                <label style={fieldLabel}>Planned stop</label>
                <input style={inputStyle} readOnly value={firstFill?.sl ? `$${fmt(firstFill.sl)}` : ''} placeholder="—" />
              </div>
              <div>
                <label style={fieldLabel}>Planned target</label>
                <input style={inputStyle} readOnly value={firstFill?.tp ? `$${fmt(firstFill.tp)}` : ''} placeholder="—" />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div style={panel}>
            <PanelH3
              left="📝 Notes"
              right={
                <span style={{ ...chip, cursor: 'pointer' }}>
                  Markdown · paste images · Cmd+V
                </span>
              }
            />
            <textarea
              style={{ ...textareaStyle, minHeight: 120 }}
              readOnly
              value={firstFill?.notes ?? ''}
              placeholder="No notes yet. Click Edit to add your trade narrative, lessons, and observations."
            />
          </div>

          {/* Post-trade reflection */}
          <div style={panel}>
            <PanelH3
              left="🪞 Post-trade reflection"
              right={<span style={chip}>Locked after EOD</span>}
            />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: 10,
              }}
            >
              <div>
                <label style={fieldLabel}>What went right</label>
                <textarea style={textareaStyle} readOnly placeholder="—" />
              </div>
              <div>
                <label style={fieldLabel}>What went wrong</label>
                <textarea style={textareaStyle} readOnly placeholder="—" />
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Lesson · one sentence</label>
              <input style={inputStyle} readOnly placeholder="—" />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
              }}
            >
              {[
                { label: 'Plan adherence', value: '—' },
                { label: 'Process score', value: '— / 10' },
                { label: 'Outcome score', value: '— / 10' },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 0',
                    fontSize: 12,
                  }}
                >
                  <span style={{ flex: '0 0 110px', color: 'var(--eb-muted)', fontSize: 12 }}>
                    {label}
                  </span>
                  <span
                    style={{
                      fontFamily: 'var(--font-mono, monospace)',
                      fontSize: 12.5,
                      fontWeight: 500,
                      color: 'var(--eb-muted)',
                    }}
                  >
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Rule events */}
          <div style={panel}>
            <PanelH3
              left="⚖️ Rule events"
              right={<span style={chip}>0 fired</span>}
            />
            <EmptyHint text="No rule events — tilt engine found no violations for this trade." />
          </div>

          {/* Linked trades */}
          <div style={panel}>
            <PanelH3
              left="🔗 Linked trades"
              right={
                <button type="button" style={{ ...btn, padding: '4px 9px', fontSize: 11.5 }}>
                  + Link a trade
                </button>
              }
            />
            <EmptyHint text="No linked trades." />
          </div>
        </div>

        {/* ── RIGHT COLUMN ────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Summary */}
          <div style={panel}>
            <PanelH3 left="Summary" />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px 10px',
                fontSize: 12,
              }}
            >
              {[
                ['Status', position.status.charAt(0).toUpperCase() + position.status.slice(1)],
                [
                  'Result',
                  pnlV > 0
                    ? `Win · ${fmtR(position.rRealized)}`
                    : pnlV < 0
                      ? `Loss · ${fmtR(position.rRealized)}`
                      : 'Flat',
                ],
                ['Symbol', position.symbol],
                ['Side', position.side.toUpperCase()],
                ['Avg entry', fmt(position.avgEntry)],
                ['Avg exit', position.avgExit ? fmt(position.avgExit) : '—'],
                ['Gross P&L', `$${fmt(position.grossPnl)}`],
                ['Net P&L', pnl.text],
              ].map(([label, value]) => (
                <div key={label}>
                  <div style={{ color: 'var(--eb-muted)' }}>{label}</div>
                  <div
                    style={{
                      color:
                        label === 'Result'
                          ? pnlV > 0
                            ? 'var(--green)'
                            : pnlV < 0
                              ? 'var(--eb-red)'
                              : 'var(--eb-muted)'
                          : label === 'Net P&L'
                            ? pnl.color
                            : 'var(--eb-text)',
                      fontWeight: label === 'Result' || label === 'Net P&L' ? 600 : 400,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conviction & state */}
          <div style={panel}>
            <PanelH3
              left="🧠 Conviction & state"
              right={<span style={chip}>At open</span>}
            />

            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Conviction</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[1, 2, 3, 4, 5].map((i) => {
                  const filled = firstFill?.conviction != null && i <= firstFill.conviction;
                  return (
                    <span
                      key={i}
                      style={{
                        fontSize: 17,
                        color: filled ? '#fbbf24' : 'var(--eb-border)',
                        textShadow: filled ? '0 0 6px rgba(251,191,36,.35)' : 'none',
                      }}
                    >
                      ★
                    </span>
                  );
                })}
                {firstFill?.conviction != null ? (
                  <span style={{ color: 'var(--eb-muted)', fontSize: 11.5 }}>
                    {['very low', 'low', 'medium', 'high', 'very high'][firstFill.conviction - 1]} conviction
                  </span>
                ) : (
                  <span style={{ color: 'var(--eb-muted)', fontSize: 11.5 }}>not recorded</span>
                )}
              </div>
            </div>

            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Mood &amp; state</label>
              {firstFill?.moods && firstFill.moods.length > 0 ? (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 4 }}>
                  {firstFill.moods.map((m) => {
                    const warnMoods = ['Frustrated', 'Revenge', 'FOMO', 'Slept < 6.5h'];
                    const isWarn = warnMoods.includes(m);
                    return (
                      <span
                        key={m}
                        style={{
                          fontSize: 11.5, padding: '3px 9px', borderRadius: 99,
                          border: `1px solid ${isWarn ? 'rgba(245,165,36,.35)' : 'rgba(139,92,246,.35)'}`,
                          background: isWarn ? 'rgba(245,165,36,.15)' : 'rgba(139,92,246,.15)',
                          color: isWarn ? 'var(--yellow, #f5a524)' : '#c4b5fd',
                        }}
                      >
                        {m}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div style={{ color: 'var(--eb-muted)', fontSize: 12, fontStyle: 'italic', marginTop: 4 }}>
                  Not recorded
                </div>
              )}
            </div>

            {[
              { label: 'Sleep', value: '— h' },
              { label: 'Energy', value: '— / 10' },
              { label: 'Focus', value: '— / 10' },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0' }}
              >
                <span
                  style={{
                    flex: '0 0 60px',
                    fontSize: 11.5,
                    color: 'var(--eb-muted)',
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    flex: 1,
                    height: 4,
                    background: 'var(--eb-panel-2)',
                    borderRadius: 99,
                    border: '1px solid var(--eb-border)',
                  }}
                />
                <span
                  style={{
                    flex: '0 0 48px',
                    textAlign: 'right',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: 'var(--eb-muted)',
                  }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Playbook */}
          <div style={panel}>
            <PanelH3
              left="🎯 Playbook"
              right={
                position.playbookId ? (
                  <span style={{ ...chip, cursor: 'pointer' }}>Open ↗</span>
                ) : undefined
              }
            />
            {position.playbookId ? (
              <div style={{ fontSize: 12, color: 'var(--eb-muted-2)' }}>
                Playbook ID:{' '}
                <span style={{ fontFamily: 'var(--font-mono, monospace)' }}>
                  {position.playbookId}
                </span>
              </div>
            ) : (
              <EmptyHint text="No playbook tagged. Link one via Edit to track edge decay." />
            )}
          </div>

          {/* Tags */}
          <div style={panel}>
            <PanelH3
              left="🏷️ Tags"
              right={
                <span style={{ color: 'var(--eb-muted)', fontSize: 11 }}>type to add</span>
              }
            />
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 5,
                padding: 5,
                border: '1px solid var(--eb-border)',
                borderRadius: 7,
                background: 'var(--eb-panel-2)',
                minHeight: 36,
                alignItems: 'center',
              }}
            >
              <input
                placeholder="Add tag…"
                style={{
                  flex: 1,
                  minWidth: 80,
                  background: 'transparent',
                  border: 0,
                  color: 'var(--eb-text)',
                  outline: 0,
                  fontSize: 12,
                  fontFamily: 'inherit',
                  padding: '2px 5px',
                }}
              />
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
