'use client';

import { useAccounts } from '@/features/accounts';
import { positionsApi, type CreateFillBody, useLogFill } from '@/features/positions';
import { AlertCircle, X } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

// ── shared style atoms ────────────────────────────────────────────────────────

const inp: React.CSSProperties = {
  background: 'var(--eb-input)',
  border: '1px solid var(--eb-border)',
  borderRadius: 7,
  padding: '8px 10px',
  color: 'var(--eb-text)',
  fontSize: 12.5,
  fontFamily: 'inherit',
  outline: 0,
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color .12s',
};

const monoInp: React.CSSProperties = {
  ...inp,
  fontFamily: '"JetBrains Mono", ui-monospace, monospace',
};

const sel: React.CSSProperties = {
  ...inp,
  cursor: 'pointer',
  appearance: 'none' as React.CSSProperties['appearance'],
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='none' stroke='%237a8395' stroke-width='2.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

const lbl: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
  fontWeight: 500,
  marginBottom: 4,
  display: 'block',
};

const help: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  marginTop: 3,
};

// ── sub-components ────────────────────────────────────────────────────────────

function Field({ label, children, helpText }: { label: React.ReactNode; children: React.ReactNode; helpText?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 10 }}>
      <label style={lbl}>{label}</label>
      {children}
      {helpText && <span style={help}>{helpText}</span>}
    </div>
  );
}

function PrefixInput({ prefix, style: styleProp, ...rest }: React.InputHTMLAttributes<HTMLInputElement> & { prefix: string }) {
  return (
    <div style={{ position: 'relative' }}>
      <span style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>
        {prefix}
      </span>
      <input {...rest} style={{ ...monoInp, paddingLeft: 22, ...styleProp }} />
    </div>
  );
}

function Seg({ options, value, onChange }: {
  options: { label: string; value: string; color?: 'long' | 'short' | 'neut' }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--eb-input)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: 3, gap: 2 }}>
      {options.map((o) => {
        const active = o.value === value;
        const colorMap = {
          long: { bg: 'rgba(0,214,143,.15)', color: 'var(--green)' },
          short: { bg: 'rgba(255,91,108,.15)', color: 'var(--eb-red)' },
          neut: { bg: 'var(--eb-panel-2)', color: 'var(--eb-text)' },
        };
        const c = o.color ? colorMap[o.color] : colorMap.neut;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              background: active ? c.bg : 'transparent',
              border: 0,
              color: active ? c.color : 'var(--eb-muted)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontFamily: 'inherit',
              fontSize: 12,
              fontWeight: active ? 600 : 400,
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

function Stars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display: 'inline-flex', gap: 4, fontSize: 20 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          onClick={() => onChange(i)}
          onMouseEnter={() => setHov(i)}
          onMouseLeave={() => setHov(0)}
          style={{
            cursor: 'pointer',
            color: i <= (hov || value) ? '#fbbf24' : 'var(--eb-border)',
            textShadow: i <= (hov || value) ? '0 0 6px rgba(251,191,36,.35)' : 'none',
            transition: 'color .1s',
            userSelect: 'none',
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

const MOODS = ['Calm', 'Patient', 'Excited', 'Frustrated', 'Tired', 'Focused', 'Revenge', 'FOMO', 'Slept < 6.5h'] as const;
type Mood = (typeof MOODS)[number];
const WARN_MOODS: Mood[] = ['Frustrated', 'Revenge', 'FOMO', 'Slept < 6.5h'];

// ── main component ────────────────────────────────────────────────────────────

export function LogTradeDialog({ open, onOpenChange }: Props) {
  const { data: accounts } = useAccounts();
  const [accountId, setAccountId] = useState('');
  const logFill = useLogFill(accountId);

  // ── left-column state ─────────────────────────────────────────────────────
  const [symbol, setSymbol] = useState('');
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [qty, setQty] = useState('');
  const [leverage, setLeverage] = useState('');
  const [riskPct, setRiskPct] = useState('');
  const [entry, setEntry] = useState('');
  const [entryTime, setEntryTime] = useState('');
  const [sl, setSl] = useState('');
  const [tp, setTp] = useState('');
  const [status, setStatus] = useState<'open' | 'closed' | 'planned'>('open');
  const [exitPrice, setExitPrice] = useState('');
  const [exitTime, setExitTime] = useState('');
  const [thesis, setThesis] = useState('');
  const [invalidation, setInvalidation] = useState('');
  const [notes, setNotes] = useState('');

  // ── right-column state ────────────────────────────────────────────────────
  const [conviction, setConviction] = useState(0);
  const [moods, setMoods] = useState<Set<Mood>>(new Set());

  // Screenshots
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [dragOver, setDragOver] = useState(false);
  const screenshotRef = useRef<HTMLInputElement>(null);

  const MAX_SCREENSHOTS = 6;

  const handleScreenshots = useCallback((files: File[]) => {
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const result = ev.target?.result;
        if (typeof result === 'string') {
          setScreenshots((prev) => prev.length >= MAX_SCREENSHOTS ? prev : [...prev, result]);
        }
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const [error, setError] = useState('');

  // Default account
  useEffect(() => {
    if (accounts && accounts.length > 0 && !accountId) {
      setAccountId(accounts[0]!.id);
    }
  }, [accounts, accountId]);


  function reset() {
    setSymbol(''); setSide('buy'); setQty(''); setLeverage(''); setRiskPct('');
    setEntry(''); setEntryTime(''); setSl(''); setTp('');
    setStatus('open'); setExitPrice(''); setExitTime('');
    setThesis(''); setInvalidation(''); setNotes('');
    setConviction(0); setMoods(new Set());
    setScreenshots([]); setDragOver(false);
    setError('');
  }

  function handleClose(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  function toggleMood(m: Mood) {
    setMoods((prev) => {
      const next = new Set(prev);
      if (next.has(m)) next.delete(m); else next.add(m);
      return next;
    });
  }

  async function handleSubmit() {
    if (!accountId) { setError('Select an account.'); return; }
    if (!symbol.trim()) { setError('Symbol is required.'); return; }
    if (!qty || Number.isNaN(Number(qty))) { setError('Enter a valid quantity.'); return; }
    if (!entry || Number.isNaN(Number(entry))) { setError('Enter a valid avg entry price.'); return; }
    if (!entryTime) { setError('Entry time is required.'); return; }
    setError('');
    try {
      const body: CreateFillBody = {
        symbol: symbol.trim().toUpperCase(),
        side,
        qty: qty.trim(),
        price: entry.trim(),
        fee: '0',
        feeCcy: 'USDT',
        fundingFee: null,
        executedAt: new Date(entryTime.trim().replace(' ', 'T') + ':00Z').toISOString(),
        thesis: thesis.trim() || undefined,
        invalidation: invalidation.trim() || undefined,
        notes: notes.trim() || undefined,
        sl: sl.trim() || undefined,
        tp: tp.trim() || undefined,
        conviction: conviction > 0 ? conviction : undefined,
        moods: moods.size > 0 ? [...moods] : undefined,
      };
      await logFill.mutateAsync(body);

      // Persist screenshots to the resulting position
      if (screenshots.length > 0) {
        const list = await positionsApi.list(accountId);
        const sym = body.symbol;
        const newPos = list
          .filter((p) => p.symbol === sym && p.status === 'open')
          .sort((a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime())[0];
        if (newPos) {
          await positionsApi.updateMetrics(accountId, newPos.id, { images: screenshots });
        }
      }

      handleClose(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  }

  // ── live calc ─────────────────────────────────────────────────────────────
  const notional = useMemo(() => {
    const q = Number(qty); const p = Number(entry);
    return q && p ? q * p : null;
  }, [qty, entry]);

  const slDist = useMemo(() => {
    const p = Number(entry); const s = Number(sl);
    if (!p || !s) return null;
    const dist = Math.abs(p - s);
    return { dist: dist.toFixed(2), pct: ((dist / p) * 100).toFixed(2) };
  }, [entry, sl]);

  const rrPlanned = useMemo(() => {
    const p = Number(entry); const s = Number(sl); const t = Number(tp);
    if (!p || !s || !t) return null;
    const risk = Math.abs(p - s); const reward = Math.abs(t - p);
    return risk ? (reward / risk).toFixed(2) : null;
  }, [entry, sl, tp]);

  const pnlIfClosed = useMemo(() => {
    if (!exitPrice || !entry || !qty) return null;
    const diff = (Number(exitPrice) - Number(entry)) * (side === 'buy' ? 1 : -1);
    return (diff * Number(qty)).toFixed(2);
  }, [exitPrice, entry, qty, side]);

  // Keyboard shortcuts + paste
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') handleSubmit();
      if (e.key === 'Escape') handleClose(false);
    }
    function onPaste(e: ClipboardEvent) {
      const items = Array.from(e.clipboardData?.items ?? []);
      const imageItems = items.filter((it) => it.type.startsWith('image/'));
      if (imageItems.length > 0) {
        handleScreenshots(imageItems.map((it) => it.getAsFile()).filter(Boolean) as File[]);
      }
    }
    window.addEventListener('keydown', onKey);
    window.addEventListener('paste', onPaste);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('paste', onPaste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, accountId, symbol, qty, entry, entryTime, side, handleScreenshots]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(4,7,12,.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        zIndex: 50, padding: '48px 16px', overflowY: 'auto',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(false); }}
    >
      <div
        style={{
          width: 'min(980px, 100%)',
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,.55)',
          overflow: 'hidden',
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Log a trade"
      >
        {/* ── Header ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '14px 18px',
          borderBottom: '1px solid var(--eb-border)',
          background: 'linear-gradient(180deg,var(--eb-panel-2),var(--eb-panel))',
        }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: 'linear-gradient(135deg,#00d68f,#06b6d4)',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            color: '#06140f', fontWeight: 800, fontSize: 16, flexShrink: 0,
          }}>+</div>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>Log a trade</h2>
          <Chip color="purple">Manual entry</Chip>
          <button
            type="button" onClick={() => handleClose(false)} aria-label="Close"
            style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', padding: '6px 8px', borderRadius: 6, display: 'flex', alignItems: 'center' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20 }}>

          {/* ── LEFT column ── */}
          <div>
            {/* Row 1: Account · Symbol · Side */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr .9fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Account">
                <select style={sel} value={accountId} onChange={(e) => setAccountId(e.target.value)}>
                  {(!accounts || accounts.length === 0)
                    ? <option value="">No accounts</option>
                    : accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {`● ${a.venue.charAt(0).toUpperCase()}${a.venue.slice(1)} — ${a.label}`}
                        </option>
                      ))}
                </select>
              </Field>
              <Field label="Symbol">
                <input style={{ ...monoInp, textTransform: 'uppercase' }} placeholder="ETHUSDT" value={symbol} onChange={(e) => setSymbol(e.target.value)} autoFocus />
              </Field>
              <Field label="Side">
                <Seg
                  options={[
                    { label: 'LONG', value: 'buy', color: 'long' },
                    { label: 'SHORT', value: 'sell', color: 'short' },
                  ]}
                  value={side}
                  onChange={(v) => setSide(v as 'buy' | 'sell')}
                />
              </Field>
            </div>

            {/* Row 2: Qty · Leverage · Risk % */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Qty (contracts)">
                <input style={monoInp} placeholder="1.00" value={qty} onChange={(e) => setQty(e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="Leverage">
                <input style={monoInp} placeholder="10×" value={leverage} onChange={(e) => setLeverage(e.target.value)} />
              </Field>
              <Field label="Risk (% acct)">
                <input style={monoInp} placeholder="0.50" value={riskPct} onChange={(e) => setRiskPct(e.target.value)} inputMode="decimal" />
              </Field>
            </div>

            {/* Row 3: Avg entry · Entry time */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Avg entry">
                <PrefixInput prefix="$" placeholder="3041.20" value={entry} onChange={(e) => setEntry(e.target.value)} inputMode="decimal" />
              </Field>
              <Field label="Entry time (UTC)">
                <input style={monoInp} type="text" placeholder="2026-05-07 14:02" value={entryTime} onChange={(e) => setEntryTime(e.target.value)} />
              </Field>
            </div>

            {/* Row 4: Stop loss · Take profit */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field
                label="Stop loss"
                helpText={slDist ? <>Distance: <span style={{ fontFamily: 'monospace' }}>{slDist.dist}</span> ({slDist.pct}%)</> : undefined}
              >
                <PrefixInput prefix="$" placeholder="—" value={sl} onChange={(e) => setSl(e.target.value)} inputMode="decimal" />
              </Field>
              <Field
                label="Take profit"
                helpText={rrPlanned ? <>Planned R:R <span style={{ fontFamily: 'monospace' }}>1 : {rrPlanned}</span></> : undefined}
              >
                <PrefixInput prefix="$" placeholder="—" value={tp} onChange={(e) => setTp(e.target.value)} inputMode="decimal" />
              </Field>
            </div>

            {/* Thesis · Invalidation */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
              <Field label="Thesis at entry">
                <textarea
                  style={{ ...inp, minHeight: 60, resize: 'vertical', lineHeight: 1.55 }}
                  placeholder="Why are you taking this trade? What's the setup?"
                  value={thesis}
                  onChange={(e) => setThesis(e.target.value)}
                />
              </Field>
              <Field
                label="Invalidation"
                helpText="The condition that proves your thesis wrong."
              >
                <textarea
                  style={{ ...inp, minHeight: 60, resize: 'vertical', lineHeight: 1.55 }}
                  placeholder="e.g. Close below 3,022 (sweep wick) — reclaim failed."
                  value={invalidation}
                  onChange={(e) => setInvalidation(e.target.value)}
                />
              </Field>
            </div>

            {/* Status */}
            <Field label="Status">
              <Seg
                options={[
                  { label: 'Open', value: 'open', color: 'neut' },
                  { label: 'Closed', value: 'closed', color: 'neut' },
                  { label: 'Planned', value: 'planned', color: 'neut' },
                ]}
                value={status}
                onChange={(v) => setStatus(v as 'open' | 'closed' | 'planned')}
              />
            </Field>

            {/* Exit fields — only when Closed */}
            {status === 'closed' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
                <Field label="Avg exit">
                  <PrefixInput prefix="$" placeholder="3082.50" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} inputMode="decimal" />
                </Field>
                <Field label="Exit time (UTC)">
                  <input style={monoInp} type="text" placeholder="2026-05-07 14:48" value={exitTime} onChange={(e) => setExitTime(e.target.value)} />
                </Field>
              </div>
            )}

            {/* Notes */}
            <Field label="Notes">
              <textarea
                style={{ ...inp, minHeight: 72, resize: 'vertical', lineHeight: 1.55 }}
                placeholder="What's the thesis? What did you see?"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </Field>

            {/* Screenshots */}
            <Field label={`Screenshots${screenshots.length > 0 ? ` · ${screenshots.length} / ${MAX_SCREENSHOTS}` : ''}`}>
              <input
                ref={screenshotRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => { handleScreenshots(Array.from(e.target.files ?? [])); e.target.value = ''; }}
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                {screenshots.map((src, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable order
                  <div key={i} style={{ position: 'relative' }}>
                    <button
                      type="button"
                      onClick={() => setScreenshots((prev) => prev.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute', top: 3, right: 3, zIndex: 1,
                        background: 'rgba(0,0,0,.55)', border: 0, borderRadius: 4,
                        color: '#fff', cursor: 'pointer', padding: '1px 5px',
                        fontSize: 10, lineHeight: 1,
                      }}
                    >✕</button>
                    <img
                      src={src}
                      alt={`screenshot ${i + 1}`}
                      style={{
                        width: '100%', aspectRatio: '16/10', objectFit: 'cover',
                        borderRadius: 6, border: '1px solid var(--eb-border)', display: 'block',
                      }}
                    />
                  </div>
                ))}
                {screenshots.length < MAX_SCREENSHOTS && (
                  <button
                    type="button"
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); handleScreenshots(Array.from(e.dataTransfer.files)); }}
                    onClick={() => screenshotRef.current?.click()}
                    style={{
                      aspectRatio: '16/10',
                      border: `1.5px dashed ${dragOver ? 'var(--green)' : 'var(--eb-border)'}`,
                      borderRadius: 6, display: 'flex', flexDirection: 'column',
                      alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', gap: 3, padding: 6, textAlign: 'center',
                      background: dragOver ? 'rgba(0,214,143,.05)' : 'var(--eb-input)',
                      color: 'var(--eb-muted)', transition: 'border-color .12s, background .12s',
                      fontFamily: 'inherit',
                      gridColumn: screenshots.length === 0 ? '1 / -1' : undefined,
                    }}
                  >
                    <span style={{ fontSize: 16, opacity: 0.4, lineHeight: 1 }}>＋</span>
                    <span style={{ fontSize: 11, lineHeight: 1.4 }}>
                      {screenshots.length === 0 ? 'Drop or paste image' : 'Add image'}
                    </span>
                  </button>
                )}
              </div>
            </Field>
          </div>

          {/* ── RIGHT column ── */}
          <div>
            {/* Playbook */}
            <Field label="Playbook" helpText="Auto-loaded checklist + risk caps from this playbook.">
              <select style={sel} defaultValue="">
                <option value="" disabled>— select playbook —</option>
                <option>Liquidity sweep · PF 2.31 · 84 trades</option>
                <option>Range fade · PF 1.18 · 42 trades</option>
                <option>Breakout retest · PF 1.84 · 61 trades</option>
                <option>Funding squeeze · PF 0.82 (paused)</option>
                <option>Trend pullback · PF 1.61 · 38 trades</option>
                <option>+ New playbook…</option>
              </select>
            </Field>

            {/* Pre-trade checklist */}
            <Field label={<>Pre-trade checklist <span style={{ textTransform: 'none', letterSpacing: 0, fontWeight: 400, color: 'var(--eb-muted)' }}>— select a playbook to load</span></>}>
              <div style={{
                padding: '10px 12px', borderRadius: 7,
                border: '1px dashed var(--eb-border)',
                background: 'var(--eb-input)',
                color: 'var(--eb-muted)', fontSize: 12, textAlign: 'center',
              }}>
                No playbook selected
              </div>
            </Field>

            {/* Conviction */}
            <Field
              label="Conviction"
              helpText={conviction > 0 ? `${conviction}/5 — ${['very low', 'low', 'medium', 'high', 'very high'][conviction - 1]} conviction` : undefined}
            >
              <Stars value={conviction} onChange={setConviction} />
            </Field>

            {/* Mood & state */}
            <Field label="Mood & state">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {MOODS.map((m) => {
                  const on = moods.has(m);
                  const isWarn = WARN_MOODS.includes(m);
                  return (
                    <span
                      key={m}
                      onClick={() => toggleMood(m)}
                      style={{
                        fontSize: 11.5, padding: '3px 9px', borderRadius: 99,
                        border: `1px solid ${
                          on && isWarn ? 'rgba(245,165,36,.35)'
                          : on ? 'rgba(139,92,246,.35)'
                          : 'var(--eb-border)'
                        }`,
                        background: on && isWarn ? 'rgba(245,165,36,.15)'
                          : on ? 'rgba(139,92,246,.15)'
                          : 'var(--eb-input)',
                        color: on && isWarn ? 'var(--yellow, #f5a524)'
                          : on ? '#c4b5fd'
                          : 'var(--eb-muted-2)',
                        cursor: 'pointer',
                        userSelect: 'none',
                        transition: 'background .1s, border-color .1s, color .1s',
                      }}
                    >
                      {m}
                    </span>
                  );
                })}
              </div>
            </Field>

            {/* Live calc */}
            <Field label="Live calc">
              <div style={{
                background: 'var(--eb-input)',
                border: '1px dashed var(--eb-border)',
                borderRadius: 8, padding: '10px 12px',
              }}>
                <CalcRow label="Position notional" value={notional ? `$${notional.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '—'} />
                <CalcRow label="$ risked (to SL)" value={notional && slDist ? `-$${(notional * Number(slDist.pct) / 100).toFixed(2)}` : '—'} color="var(--eb-red)" />
                <CalcRow label="$ at TP" value={rrPlanned && notional && slDist ? `+$${(notional * Number(slDist.pct) / 100 * Number(rrPlanned)).toFixed(2)}` : '—'} color="var(--green)" />
                <CalcRow label="Planned R:R" value={rrPlanned ? `1 : ${rrPlanned}` : '—'} />
                {pnlIfClosed !== null && (
                  <div style={{ borderTop: '1px dashed var(--eb-border)', marginTop: 5, paddingTop: 8 }}>
                    <CalcRow
                      label="If closed @ exit"
                      value={`${Number(pnlIfClosed) >= 0 ? '+' : ''}$${pnlIfClosed}`}
                      color={Number(pnlIfClosed) >= 0 ? 'var(--green)' : 'var(--eb-red)'}
                    />
                  </div>
                )}
              </div>
            </Field>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div style={{
            margin: '0 18px 12px',
            display: 'flex', alignItems: 'center', gap: 7,
            padding: '9px 12px', borderRadius: 8,
            background: 'rgba(255,91,108,.06)',
            border: '1px solid rgba(255,91,108,.25)',
            fontSize: 12.5, color: 'var(--eb-red)',
          }}>
            <AlertCircle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── Footer ── */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 18px',
          borderTop: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
        }}>
          <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
            ⌘ Enter to save · ⌘ ⇧ Enter to save & new · Esc to close
          </span>
          <span style={{ marginLeft: 'auto' }} />
          <button type="button" onClick={() => handleClose(false)} style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--eb-border)', background: 'transparent', color: 'var(--eb-muted-2)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={logFill.isPending}
            style={{
              padding: '7px 18px', borderRadius: 8,
              border: '1px solid #00b67a',
              background: logFill.isPending ? 'rgba(0,182,122,.5)' : 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f', fontSize: 12.5, fontWeight: 600,
              cursor: logFill.isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
            }}
          >
            {logFill.isPending ? 'Saving…' : 'Save trade'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── helper components ─────────────────────────────────────────────────────────

function Chip({ children, color }: { children: React.ReactNode; color?: 'purple' }) {
  const purple = color === 'purple';
  return (
    <span style={{
      fontSize: 11, padding: '2px 7px', borderRadius: 99,
      border: `1px solid ${purple ? 'rgba(139,92,246,.35)' : 'var(--eb-border)'}`,
      background: purple ? 'rgba(139,92,246,.12)' : 'var(--eb-panel-2)',
      color: purple ? '#a78bfa' : 'var(--eb-muted-2)',
    }}>
      {children}
    </span>
  );
}

function CalcRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
      <span style={{ color: 'var(--eb-muted)' }}>{label}</span>
      <b style={{ fontFamily: '"JetBrains Mono", ui-monospace, monospace', fontWeight: 600, color: color ?? 'var(--eb-text)' }}>
        {value}
      </b>
    </div>
  );
}
