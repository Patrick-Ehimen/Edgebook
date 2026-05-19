'use client';

import { positionsApi, useDeletePosition, useLogFill, usePosition, useUpdatePosition } from '@/features/positions';
import type { PositionDetail } from '@/features/positions';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

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

// ─── Compute current open qty ────────────────────────────────────────────────

function openQty(position: PositionDetail): string {
  let net = 0;
  for (const { fill } of position.fills) {
    const q = Number(fill.qty);
    net += fill.side === 'buy' ? q : -q;
  }
  const abs = Math.abs(net);
  return abs > 0 ? abs.toFixed(4).replace(/\.?0+$/, '') : position.qtyMax;
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

function closingFill(position: PositionDetail) {
  if (position.fills.length < 2) return null;
  const sorted = [...position.fills].sort((a, b) =>
    new Date(b.fill.executedAt).getTime() - new Date(a.fill.executedAt).getTime(),
  );
  const last = sorted[0];
  return last ? last.fill : null;
}

// ─── Close trade dialog ───────────────────────────────────────────────────────

function CloseTradeDialog({
  position,
  accountId,
  onClose,
}: {
  position: PositionDetail;
  accountId: string;
  onClose: () => void;
}) {
  const logFill = useLogFill(accountId);
  const router = useRouter();

  const defaultQty = openQty(position);
  const exitSide = position.side === 'long' ? 'sell' : 'buy';

  const [qty, setQty] = useState(defaultQty);
  const [exitPrice, setExitPrice] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [fee, setFee] = useState('');
  const [feeCcy, setFeeCcy] = useState('USDT');
  const [funding, setFunding] = useState('');
  const [rRealized, setRRealized] = useState('');
  const [mfe, setMfe] = useState('');
  const [mae, setMae] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Price-mode state — pre-fill SL from the opening fill if the user set one
  const firstFill = openingFill(position);
  const [perfMode, setPerfMode] = useState<'r' | 'price'>('r');
  const [slPrice, setSlPrice] = useState(firstFill?.sl ?? '');
  const [mfePrice, setMfePrice] = useState('');
  const [maePrice, setMaePrice] = useState('');

  const isPending = logFill.isPending || saving;

  // Price → R conversion: (price − entry) / (entry − sl) for longs, flipped for shorts
  const isLong = position.side === 'long';
  const entryNum = Number(position.avgEntry);
  const slNum = Number(slPrice);
  const slValid = slNum > 0 && !Number.isNaN(slNum) && slPrice.trim() !== '';

  function priceToR(priceLevel: number): string {
    const risk = isLong ? entryNum - slNum : slNum - entryNum;
    if (risk <= 0) return '';
    const move = isLong ? priceLevel - entryNum : entryNum - priceLevel;
    return (move / risk).toFixed(2);
  }

  const rFromExit = perfMode === 'price' && exitPrice && slValid
    ? priceToR(Number(exitPrice)) : '';
  const mfeR = perfMode === 'price' && mfePrice && slValid
    ? priceToR(Number(mfePrice)) : '';
  const maeR = perfMode === 'price' && maePrice && slValid
    ? priceToR(Number(maePrice)) : '';

  // Live P&L preview
  const pnlPreview = (() => {
    const p = Number(position.avgEntry);
    const x = Number(exitPrice);
    const q = Number(qty);
    if (!p || !x || !q) return null;
    const diff = (x - p) * (position.side === 'long' ? 1 : -1);
    return (diff * q).toFixed(2);
  })();

  async function handleSubmit() {
    if (!exitPrice.trim() || Number.isNaN(Number(exitPrice))) {
      setError('Avg exit price is required.'); return;
    }
    if (!exitTime.trim()) { setError('Exit time is required.'); return; }
    if (!qty.trim() || Number.isNaN(Number(qty))) {
      setError('Quantity is required.'); return;
    }
    setError('');
    setSaving(true);
    try {
      await logFill.mutateAsync({
        symbol: position.symbol,
        side: exitSide,
        qty: qty.trim(),
        price: exitPrice.trim(),
        fee: fee.trim() || '0',
        feeCcy: feeCcy.trim().toUpperCase() || 'USDT',
        fundingFee: funding.trim() || null,
        executedAt: new Date(`${exitTime.trim().replace(' ', 'T')}:00Z`).toISOString(),
        notes: notes.trim() || undefined,
      });

      // After recompute the old position ID is gone (sourceHash changed).
      // Find the newly-created closed position to save metrics on.
      const finalR = perfMode === 'price' ? rFromExit : rRealized.trim();
      const finalMfe = perfMode === 'price' ? mfeR : mfe.trim();
      const finalMae = perfMode === 'price' ? maeR : mae.trim();
      const hasMetrics = finalR || finalMfe || finalMae;
      if (hasMetrics) {
        const list = await positionsApi.list(accountId);
        const newPos = list
          .filter((p) => p.symbol === position.symbol && p.status === 'closed')
          .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())[0];

        if (newPos) {
          await positionsApi.updateMetrics(accountId, newPos.id, {
            rRealized: finalR || undefined,
            mfe: finalMfe || undefined,
            mae: finalMae || undefined,
          });
        }
      }

      router.push(`/trades?account=${accountId}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
      setSaving(false);
    }
  }

  const inp: React.CSSProperties = {
    background: 'var(--eb-input, var(--eb-panel-2))',
    border: '1px solid var(--eb-border)',
    borderRadius: 7, padding: '7px 10px',
    color: 'var(--eb-text)', fontSize: 12.5,
    fontFamily: 'inherit', outline: 0, width: '100%',
    boxSizing: 'border-box',
  };
  const monoInp: React.CSSProperties = {
    ...inp, fontFamily: '"JetBrains Mono", ui-monospace, monospace',
  };
  const lbl: React.CSSProperties = {
    fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase',
    letterSpacing: '.06em', fontWeight: 600, marginBottom: 4, display: 'block',
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,7,12,.65)', backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 100, padding: '48px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          width: 'min(640px, 100%)', background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)', borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,.55)', overflow: 'hidden',
        }}
        role="dialog" aria-modal="true" aria-label="Close trade"
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '14px 18px', borderBottom: '1px solid var(--eb-border)',
          background: 'linear-gradient(180deg,var(--eb-panel-2),var(--eb-panel))',
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: 'linear-gradient(135deg,#00d68f,#06b6d4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#06140f', fontWeight: 800, fontSize: 14,
          }}>✓</div>
          <div>
            <h2 style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>
              Close trade — {position.symbol}
            </h2>
            <p style={{ margin: 0, fontSize: 11.5, color: 'var(--eb-muted)' }}>
              {position.side.toUpperCase()} · logging {exitSide.toUpperCase()} exit fill
            </p>
          </div>
          <button
            type="button" onClick={onClose} aria-label="Close"
            style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: '4px 6px', borderRadius: 5, display: 'flex' }}
          >✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Row 1: Qty · Avg exit · Exit time */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1.4fr', gap: 10 }}>
            <div>
              <label style={lbl}>Qty (contracts)</label>
              <input style={monoInp} value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" />
            </div>
            <div>
              <label style={lbl}>Avg exit price</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                <input style={{ ...monoInp, paddingLeft: 20 }} value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} placeholder="0.00" inputMode="decimal" autoFocus />
              </div>
            </div>
            <div>
              <label style={lbl}>Exit time (UTC)</label>
              <input style={monoInp} placeholder="2026-05-18 14:30" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
            </div>
          </div>

          {/* Row 2: Fees · Funding */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>Fees</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                <input style={{ ...monoInp, paddingLeft: 20 }} value={fee} onChange={(e) => setFee(e.target.value)} placeholder="0.00" inputMode="decimal" />
              </div>
            </div>
            <div>
              <label style={lbl}>Funding paid/received</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                <input style={{ ...monoInp, paddingLeft: 20 }} value={funding} onChange={(e) => setFunding(e.target.value)} placeholder="-0.00" inputMode="decimal" />
              </div>
            </div>
          </div>

          {/* Row 3: Performance — R or Price mode */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em', fontWeight: 600 }}>
                Performance (optional)
              </p>
              <div style={{ display: 'inline-flex', background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 6, padding: 2, gap: 2 }}>
                {(['r', 'price'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setPerfMode(m)}
                    style={{
                      padding: '3px 10px', borderRadius: 4, border: 0,
                      background: perfMode === m ? 'var(--eb-panel)' : 'transparent',
                      color: perfMode === m ? 'var(--eb-text)' : 'var(--eb-muted)',
                      fontSize: 11, fontWeight: perfMode === m ? 600 : 400,
                      cursor: 'pointer', fontFamily: 'inherit',
                      boxShadow: perfMode === m ? '0 1px 3px rgba(0,0,0,.2)' : 'none',
                    }}
                  >
                    {m === 'r' ? 'Enter R' : 'Enter price'}
                  </button>
                ))}
              </div>
            </div>

            {/* SL price — only shown in price mode */}
            {perfMode === 'price' && (
              <div style={{ marginBottom: 10 }}>
                <label style={lbl}>Stop loss price</label>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                  <input
                    style={{ ...monoInp, paddingLeft: 20 }}
                    value={slPrice}
                    onChange={(e) => setSlPrice(e.target.value)}
                    placeholder="e.g. 95.00"
                    inputMode="decimal"
                  />
                </div>
                {slPrice && !slValid && (
                  <span style={{ fontSize: 10.5, color: 'var(--eb-red)', marginTop: 2, display: 'block' }}>Enter a valid SL price to compute R</span>
                )}
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {/* R-realized */}
              <div>
                <label style={lbl}>R-multiple</label>
                {perfMode === 'r' ? (
                  <>
                    <input style={monoInp} value={rRealized} onChange={(e) => setRRealized(e.target.value)} placeholder="e.g. 1.84" inputMode="decimal" />
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2, display: 'block' }}>Realized R achieved</span>
                  </>
                ) : (
                  <>
                    <div style={{
                      ...monoInp, display: 'flex', alignItems: 'center',
                      color: rFromExit ? (Number(rFromExit) >= 0 ? 'var(--green)' : 'var(--eb-red)') : 'var(--eb-muted)',
                    }}>
                      {rFromExit ? `${Number(rFromExit) >= 0 ? '+' : ''}${rFromExit}R` : '—'}
                    </div>
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2, display: 'block' }}>From exit price + SL</span>
                  </>
                )}
              </div>

              {/* MFE */}
              <div>
                <label style={lbl}>{perfMode === 'price' ? 'MFE price' : 'MFE'}</label>
                {perfMode === 'r' ? (
                  <>
                    <input style={monoInp} value={mfe} onChange={(e) => setMfe(e.target.value)} placeholder="e.g. 2.31" inputMode="decimal" />
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2, display: 'block' }}>Peak in your favour (R)</span>
                  </>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                      <input style={{ ...monoInp, paddingLeft: 20 }} value={mfePrice} onChange={(e) => setMfePrice(e.target.value)} placeholder="peak high" inputMode="decimal" />
                    </div>
                    <span style={{ fontSize: 10.5, color: mfeR ? 'var(--green)' : 'var(--eb-muted)', marginTop: 2, display: 'block' }}>
                      {mfeR ? `= +${mfeR}R` : 'Peak in your favour'}
                    </span>
                  </>
                )}
              </div>

              {/* MAE */}
              <div>
                <label style={lbl}>{perfMode === 'price' ? 'MAE price' : 'MAE'}</label>
                {perfMode === 'r' ? (
                  <>
                    <input style={monoInp} value={mae} onChange={(e) => setMae(e.target.value)} placeholder="e.g. -0.54" inputMode="decimal" />
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2, display: 'block' }}>Peak against you (R)</span>
                  </>
                ) : (
                  <>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>$</span>
                      <input style={{ ...monoInp, paddingLeft: 20 }} value={maePrice} onChange={(e) => setMaePrice(e.target.value)} placeholder="peak low" inputMode="decimal" />
                    </div>
                    <span style={{ fontSize: 10.5, color: maeR ? 'var(--eb-red)' : 'var(--eb-muted)', marginTop: 2, display: 'block' }}>
                      {maeR ? `= ${maeR}R` : 'Peak against you'}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Post-trade notes */}
          <div>
            <label style={lbl}>Post-trade notes</label>
            <textarea
              style={{ ...inp, minHeight: 64, resize: 'vertical', lineHeight: 1.55 }}
              placeholder="What happened? Execution thoughts, lessons…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Live P&L preview */}
          {pnlPreview !== null && (
            <div style={{
              display: 'flex', gap: 14, padding: '9px 12px', borderRadius: 8,
              background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)',
              fontSize: 12,
            }}>
              <span style={{ color: 'var(--eb-muted)' }}>Avg entry</span>
              <strong style={{ fontFamily: 'monospace' }}>${fmt(position.avgEntry)}</strong>
              <span style={{ color: 'var(--eb-muted)', marginLeft: 'auto' }}>Gross P&L preview</span>
              <strong style={{
                fontFamily: 'monospace',
                color: Number(pnlPreview) > 0 ? 'var(--green)' : Number(pnlPreview) < 0 ? 'var(--eb-red)' : 'var(--eb-muted)',
              }}>
                {Number(pnlPreview) >= 0 ? '+' : ''}${pnlPreview}
              </strong>
            </div>
          )}

          {/* Error */}
          {error && (
            <div style={{
              padding: '9px 12px', borderRadius: 8,
              background: 'rgba(255,91,108,.06)', border: '1px solid rgba(255,91,108,.25)',
              fontSize: 12.5, color: 'var(--eb-red)', display: 'flex', alignItems: 'center', gap: 7,
            }}>
              ⚠ {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
          padding: '12px 18px', borderTop: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
        }}>
          <span style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginRight: 'auto' }}>
            ⌘ Enter to save
          </span>
          <button
            type="button" onClick={onClose} disabled={isPending}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid var(--eb-border)', background: 'transparent', color: 'var(--eb-muted-2)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleSubmit} disabled={isPending}
            style={{
              padding: '7px 20px', borderRadius: 8,
              border: '1px solid #00b67a',
              background: isPending ? 'rgba(0,214,143,.4)' : 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f', fontSize: 12.5, fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Closing…' : 'Close trade'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Confirm-delete popup ─────────────────────────────────────────────────────

function ConfirmDeletePopup({
  symbol,
  onConfirm,
  onCancel,
  isPending,
}: {
  symbol: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,7,12,.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        style={{
          width: 360,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,.55)',
          padding: 24,
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Confirm delete"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
          <span style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: 'rgba(255,91,108,.14)',
            border: '1px solid rgba(255,91,108,.30)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 15,
          }}>🗑</span>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--eb-text)' }}>
            Delete trade
          </h3>
        </div>

        <p style={{ margin: '0 0 6px', fontSize: 13, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
          This will permanently delete{' '}
          <strong style={{ color: 'var(--eb-text)' }}>{symbol}</strong>{' '}
          and all its fills. This cannot be undone.
        </p>

        <div style={{
          margin: '16px 0 0',
          padding: '10px 12px',
          borderRadius: 8,
          background: 'rgba(255,91,108,.06)',
          border: '1px solid rgba(255,91,108,.20)',
          fontSize: 12,
          color: 'var(--eb-red)',
        }}>
          All fills linked to this position will be removed.
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 20, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'transparent',
              color: 'var(--eb-muted-2)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              padding: '8px 18px', borderRadius: 8,
              border: '1px solid rgba(255,91,108,.5)',
              background: isPending ? 'rgba(255,91,108,.3)' : 'rgba(255,91,108,.18)',
              color: 'var(--eb-red)', fontSize: 13, fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {isPending ? 'Deleting…' : 'Yes, delete'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Detail view ─────────────────────────────────────────────────────────────

function Detail({ position, accountId }: { position: PositionDetail; accountId: string }) {
  const router = useRouter();
  const deletePosition = useDeletePosition(accountId);
  const updateMetrics = useUpdatePosition(accountId, position.id);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);

  // Editable metrics state
  const [rPlanned, setRPlanned] = useState(position.rPlanned ?? '');
  const [rRealized, setRRealized] = useState(position.rRealized ?? '');
  const [mfe, setMfe] = useState(position.mfe ?? '');
  const [mae, setMae] = useState(position.mae ?? '');
  const metricsDirty =
    rPlanned !== (position.rPlanned ?? '') ||
    rRealized !== (position.rRealized ?? '') ||
    mfe !== (position.mfe ?? '') ||
    mae !== (position.mae ?? '');

  async function saveMetrics() {
    const toVal = (s: string) => s.trim() || undefined;
    await updateMetrics.mutateAsync({
      rPlanned: toVal(rPlanned),
      rRealized: toVal(rRealized),
      mfe: toVal(mfe),
      mae: toVal(mae),
    });
  }

  // Editable reflection state
  const [wentRight, setWentRight] = useState(position.wentRight ?? '');
  const [wentWrong, setWentWrong] = useState(position.wentWrong ?? '');
  const [lesson, setLesson] = useState(position.lesson ?? '');
  const [planAdherence, setPlanAdherence] = useState(position.planAdherence ?? '');
  const [processScore, setProcessScore] = useState(position.processScore ?? '');
  const [outcomeScore, setOutcomeScore] = useState(position.outcomeScore ?? '');
  const reflectionDirty =
    wentRight !== (position.wentRight ?? '') ||
    wentWrong !== (position.wentWrong ?? '') ||
    lesson !== (position.lesson ?? '') ||
    planAdherence !== (position.planAdherence ?? '') ||
    processScore !== (position.processScore ?? '') ||
    outcomeScore !== (position.outcomeScore ?? '');

  async function saveReflection() {
    const toVal = (s: string) => s.trim() || undefined;
    await updateMetrics.mutateAsync({
      wentRight: toVal(wentRight),
      wentWrong: toVal(wentWrong),
      lesson: toVal(lesson),
      planAdherence: toVal(planAdherence),
      processScore: toVal(processScore),
      outcomeScore: toVal(outcomeScore),
    });
  }

  const pnl = fmtPnl(position.netPnl);
  const pnlV = Number.parseFloat(position.netPnl);
  const hold = holdTime(position.openedAt, position.closedAt);
  const isLong = position.side === 'long';
  const firstFill = openingFill(position);
  const lastFill = closingFill(position);

  return (
    <>
      {showCloseDialog && (
        <CloseTradeDialog
          position={position}
          accountId={accountId}
          onClose={() => setShowCloseDialog(false)}
        />
      )}

      {showDeleteConfirm && (
        <ConfirmDeletePopup
          symbol={position.symbol}
          isPending={deletePosition.isPending}
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={async () => {
            await deletePosition.mutateAsync(position.id);
            router.push(`/trades?account=${accountId}`);
          }}
        />
      )}

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
            {position.status === 'open' && (
              <button
                type="button"
                onClick={() => setShowCloseDialog(true)}
                style={{
                  ...btn,
                  background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                  borderColor: '#00b67a',
                  color: '#06140f',
                  fontWeight: 600,
                }}
              >
                ✓ Close trade
              </button>
            )}
            <button type="button" style={btn}>
              ✏️ Edit
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 10 }}>
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
            <div>
              <label style={fieldLabel}>
                Notes
                <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--eb-muted)', marginLeft: 6 }}>
                  — trade narrative, observations
                </span>
              </label>
              <textarea
                style={{ ...textareaStyle, minHeight: 100 }}
                readOnly
                value={firstFill?.notes ?? ''}
                placeholder="No notes recorded."
              />
            </div>
          </div>

          {/* Post-trade reflection */}
          <div style={panel}>
            <PanelH3
              left="🪞 Post-trade reflection"
              right={
                reflectionDirty ? (
                  <button
                    type="button"
                    onClick={saveReflection}
                    disabled={updateMetrics.isPending}
                    style={{
                      padding: '4px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                      border: '1px solid #00b67a',
                      background: updateMetrics.isPending ? 'rgba(0,214,143,.3)' : 'linear-gradient(180deg,#00d68f,#00b67a)',
                      color: '#06140f', cursor: updateMetrics.isPending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {updateMetrics.isPending ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <span style={{ ...chip, fontSize: 11 }}>click to edit</span>
                )
              }
            />

            {/* Post-trade notes — read-only, from the closing fill */}
            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>
                Post-trade notes
                <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--eb-muted)', marginLeft: 6 }}>
                  — from close
                </span>
              </label>
              <textarea
                style={{ ...textareaStyle, minHeight: 80 }}
                readOnly
                value={lastFill?.notes ?? ''}
                placeholder="No post-trade notes recorded."
              />
            </div>

            {/* What went right / wrong */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <label style={fieldLabel}>What went right</label>
                <textarea
                  style={textareaStyle}
                  placeholder="—"
                  value={wentRight}
                  onChange={(e) => setWentRight(e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>What went wrong</label>
                <textarea
                  style={textareaStyle}
                  placeholder="—"
                  value={wentWrong}
                  onChange={(e) => setWentWrong(e.target.value)}
                />
              </div>
            </div>

            {/* Lesson */}
            <div style={{ marginBottom: 10 }}>
              <label style={fieldLabel}>Lesson · one sentence</label>
              <input
                style={inputStyle}
                placeholder="—"
                value={lesson}
                onChange={(e) => setLesson(e.target.value)}
              />
            </div>

            {/* Scores */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              <div>
                <label style={fieldLabel}>Plan adherence (%)</label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                  placeholder="0 – 100"
                  inputMode="decimal"
                  value={planAdherence}
                  onChange={(e) => setPlanAdherence(e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Process score (/ 10)</label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                  placeholder="0 – 10"
                  inputMode="decimal"
                  value={processScore}
                  onChange={(e) => setProcessScore(e.target.value)}
                />
              </div>
              <div>
                <label style={fieldLabel}>Outcome score (/ 10)</label>
                <input
                  style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                  placeholder="0 – 10"
                  inputMode="decimal"
                  value={outcomeScore}
                  onChange={(e) => setOutcomeScore(e.target.value)}
                />
              </div>
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

          {/* Performance metrics — editable */}
          <div style={panel}>
            <PanelH3
              left="📊 Performance"
              right={
                metricsDirty ? (
                  <button
                    type="button"
                    onClick={saveMetrics}
                    disabled={updateMetrics.isPending}
                    style={{
                      padding: '4px 12px', borderRadius: 7, fontSize: 11.5, fontWeight: 600,
                      border: '1px solid #00b67a',
                      background: updateMetrics.isPending ? 'rgba(0,214,143,.3)' : 'linear-gradient(180deg,#00d68f,#00b67a)',
                      color: '#06140f', cursor: updateMetrics.isPending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    {updateMetrics.isPending ? 'Saving…' : 'Save'}
                  </button>
                ) : (
                  <span style={{ ...chip, fontSize: 11 }}>click to edit</span>
                )
              }
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {([
                { label: 'Planned R:R', val: rPlanned, set: setRPlanned, placeholder: 'e.g. 2.5', hint: 'Before entry' },
                { label: 'Realized R', val: rRealized, set: setRRealized, placeholder: 'e.g. 1.84', hint: 'Actual outcome' },
                { label: 'MFE', val: mfe, set: setMfe, placeholder: 'e.g. 2.31', hint: 'Peak in your favour' },
                { label: 'MAE', val: mae, set: setMae, placeholder: 'e.g. -0.54', hint: 'Peak against you' },
              ] as { label: string; val: string; set: (v: string) => void; placeholder: string; hint: string }[]).map(({ label, val, set, placeholder, hint }) => (
                <div key={label}>
                  <label style={fieldLabel}>{label}</label>
                  <input
                    style={{ ...inputStyle, fontFamily: 'var(--font-mono, monospace)' }}
                    value={val}
                    onChange={(e) => set(e.target.value)}
                    placeholder={placeholder}
                    inputMode="decimal"
                  />
                  <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2, display: 'block' }}>{hint}</span>
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
