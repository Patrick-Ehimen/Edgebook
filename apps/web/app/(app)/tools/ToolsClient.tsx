'use client';

import { useEffect, useState } from 'react';
import {
  Clock,
  DollarSign,
  LayoutGrid,
  Scale,
  Target,
  TrendingDown,
  TrendingUp,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type ToolId =
  | 'position-size'
  | 'rr-calculator'
  | 'r-multiple'
  | 'pnl-calculator'
  | 'liquidation'
  | 'compound';

type Tool = {
  id: ToolId;
  label: string;
  shortLabel: string;
  desc: string;
  quickDesc: string;
  Icon: LucideIcon;
  color: string;
  bg: string;
  borderColor: string;
};

// ─── Tool registry ────────────────────────────────────────────────────────────

const TOOLS: Tool[] = [
  {
    id: 'position-size',
    label: 'Position Size Calculator',
    shortLabel: 'Position Size',
    desc: 'Calculate exact position size based on account equity, risk %, and stop distance.',
    quickDesc: 'Risk-based sizing',
    Icon: Scale,
    color: '#00d68f',
    bg: 'rgba(0,214,143,.12)',
    borderColor: 'rgba(0,214,143,.25)',
  },
  {
    id: 'rr-calculator',
    label: 'Risk / Reward Calculator',
    shortLabel: 'Risk / Reward',
    desc: 'Compute R:R ratio, expected value, and break-even win rate for any setup.',
    quickDesc: 'R:R + break-even WR',
    Icon: Target,
    color: '#06b6d4',
    bg: 'rgba(6,182,212,.12)',
    borderColor: 'rgba(6,182,212,.25)',
  },
  {
    id: 'r-multiple',
    label: 'R-Multiple Converter',
    shortLabel: 'R-Multiple',
    desc: 'Convert raw P&L into R-multiples given your planned risk per trade.',
    quickDesc: 'P&L → R converter',
    Icon: Zap,
    color: '#8b5cf6',
    bg: 'rgba(139,92,246,.12)',
    borderColor: 'rgba(139,92,246,.25)',
  },
  {
    id: 'pnl-calculator',
    label: 'PnL Calculator',
    shortLabel: 'PnL',
    desc: 'Estimate gross and net P&L for long/short perp positions with fees.',
    quickDesc: 'Gross + net P&L',
    Icon: DollarSign,
    color: '#00d68f',
    bg: 'rgba(0,214,143,.12)',
    borderColor: 'rgba(0,214,143,.25)',
  },
  {
    id: 'liquidation',
    label: 'Liquidation Price',
    shortLabel: 'Liquidation',
    desc: 'Find your liquidation price for isolated or cross margin futures.',
    quickDesc: 'Isolated · cross margin',
    Icon: TrendingDown,
    color: '#ff5b6c',
    bg: 'rgba(255,91,108,.12)',
    borderColor: 'rgba(255,91,108,.25)',
  },
  {
    id: 'compound',
    label: 'Compound Growth',
    shortLabel: 'Compound Growth',
    desc: 'Project account growth over N trades given a fixed win rate, R:R, and risk %.',
    quickDesc: 'Project your edge',
    Icon: TrendingUp,
    color: '#f97316',
    bg: 'rgba(249,115,22,.12)',
    borderColor: 'rgba(249,115,22,.25)',
  },
];

// ─── Shared mini-components ───────────────────────────────────────────────────

function CalcField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 10 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          color: 'var(--eb-muted)',
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}

function NumInput({
  value,
  onChange,
  placeholder,
  suffix,
  step,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  suffix?: string;
  step?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          flex: 1,
          background: 'transparent',
          border: 0,
          outline: 'none',
          color: 'var(--eb-text)',
          padding: '9px 11px',
          fontFamily: '"JetBrains Mono", ui-monospace, monospace',
          fontSize: 14,
          width: '100%',
        }}
      />
      {suffix && (
        <span
          style={{
            padding: '0 11px',
            color: 'var(--eb-muted)',
            fontSize: 12,
            borderLeft: '1px solid var(--eb-border)',
            background: 'var(--eb-panel)',
            height: 38,
            display: 'flex',
            alignItems: 'center',
            flexShrink: 0,
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
}

function SideToggle({
  side,
  onChange,
}: { side: 'long' | 'short'; onChange: (s: 'long' | 'short') => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        padding: 3,
        gap: 2,
        width: '100%',
      }}
    >
      {(['long', 'short'] as const).map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => onChange(s)}
          style={{
            flex: 1,
            background:
              side === s
                ? s === 'long'
                  ? 'rgba(0,214,143,.16)'
                  : 'rgba(255,91,108,.16)'
                : 'transparent',
            border: 0,
            color: side === s ? (s === 'long' ? '#00d68f' : '#ff5b6c') : 'var(--eb-muted)',
            padding: '7px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: 'inherit',
            textTransform: 'uppercase',
          }}
        >
          {s}
        </button>
      ))}
    </div>
  );
}

function MarginToggle({
  type,
  onChange,
}: { type: 'isolated' | 'cross'; onChange: (m: 'isolated' | 'cross') => void }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        padding: 3,
        gap: 2,
        width: '100%',
      }}
    >
      {(['isolated', 'cross'] as const).map((m) => (
        <button
          key={m}
          type="button"
          onClick={() => onChange(m)}
          style={{
            flex: 1,
            background: type === m ? 'rgba(139,92,246,.16)' : 'transparent',
            border: 0,
            color: type === m ? '#8b5cf6' : 'var(--eb-muted)',
            padding: '7px 10px',
            borderRadius: 6,
            cursor: 'pointer',
            fontSize: 12.5,
            fontWeight: 500,
            fontFamily: 'inherit',
            textTransform: 'capitalize',
          }}
        >
          {m}
        </button>
      ))}
    </div>
  );
}

function ResRow({
  label,
  value,
  color,
}: { label: string; value: string; color?: string | undefined }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '7px 0',
        borderBottom: '1px dashed var(--eb-border)',
        fontSize: 12.5,
      }}
    >
      <span style={{ color: 'var(--eb-muted-2)' }}>{label}</span>
      <b
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 600,
          color: color ?? 'var(--eb-text)',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </b>
    </div>
  );
}

function ResultsPanel({ children, valid }: { children: React.ReactNode; valid?: boolean }) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(0,214,143,.04), transparent)',
        border: '1px solid rgba(0,214,143,.25)',
        borderRadius: 10,
        padding: 14,
      }}
    >
      <div
        style={{
          marginBottom: 10,
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--eb-muted-2)',
          letterSpacing: '.06em',
          textTransform: 'uppercase',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span>Result</span>
        {valid && (
          <span
            style={{
              fontSize: 10.5,
              padding: '2px 8px',
              borderRadius: 99,
              background: 'rgba(0,214,143,.18)',
              color: '#00d68f',
            }}
          >
            ✓ calculated
          </span>
        )}
      </div>
      {children}
    </div>
  );
}

function ResHighlight({
  label,
  value,
  sub,
}: { label: string; value: string; sub?: string | undefined }) {
  return (
    <div
      style={{
        padding: 12,
        background: 'rgba(0,214,143,.08)',
        border: '1px solid rgba(0,214,143,.30)',
        borderRadius: 9,
        marginBottom: 8,
      }}
    >
      <div
        style={{
          fontSize: 10,
          color: '#00d68f',
          textTransform: 'uppercase',
          letterSpacing: '.07em',
          fontWeight: 600,
          marginBottom: 3,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: '"JetBrains Mono", monospace',
          fontSize: 22,
          fontWeight: 600,
          letterSpacing: '-.02em',
          color: 'var(--eb-text)',
          display: 'flex',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        {value}
        {sub && (
          <span style={{ fontSize: 12, color: 'var(--eb-muted)', fontWeight: 400 }}>{sub}</span>
        )}
      </div>
    </div>
  );
}

function RRBar({ rr }: { rr: number }) {
  const riskW = (1 / (1 + rr)) * 100;
  const rewardW = 100 - riskW;
  return (
    <div>
      <div
        style={{
          height: 18,
          background: 'var(--eb-panel-2)',
          borderRadius: 99,
          overflow: 'hidden',
          display: 'flex',
          marginTop: 8,
        }}
      >
        <div
          style={{
            width: `${riskW}%`,
            background: 'linear-gradient(90deg, #ff5b6c, #ff8585)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: '#fff',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          1R
        </div>
        <div
          style={{
            width: `${rewardW}%`,
            background: 'linear-gradient(90deg, #00d68f, #06b6d4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 600,
            color: '#06140f',
            fontFamily: '"JetBrains Mono", monospace',
          }}
        >
          {rr.toFixed(2)}R
        </div>
      </div>
    </div>
  );
}

// ─── Calculators ──────────────────────────────────────────────────────────────

function PositionSizeCalc() {
  const [equity, setEquity] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [tp, setTp] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [feePct, setFeePct] = useState('0.04');
  const [side, setSide] = useState<'long' | 'short'>('long');

  const e = Number.parseFloat(equity) || 0;
  const r = Number.parseFloat(riskPct) / 100 || 0;
  const ep = Number.parseFloat(entry) || 0;
  const sp = Number.parseFloat(stop) || 0;
  const tpp = Number.parseFloat(tp) || 0;
  const lev = Number.parseFloat(leverage) || 1;
  const fee = Number.parseFloat(feePct) / 100 || 0;

  const riskUsd = e * r;
  const stopDist = ep > 0 && sp > 0 ? Math.abs(ep - sp) : 0;
  const stopPct = ep > 0 && stopDist > 0 ? (stopDist / ep) * 100 : 0;
  const posUsd = stopDist > 0 && ep > 0 ? riskUsd / (stopDist / ep) : 0;
  const posContracts = ep > 0 ? posUsd / ep : 0;
  const marginReq = posUsd / lev;
  const rewardUsd = ep > 0 && tpp > 0 ? Math.abs(tpp - ep) * posContracts : 0;
  const rr = riskUsd > 0 && rewardUsd > 0 ? rewardUsd / riskUsd : 0;
  const feesTotal = posUsd * fee * 2;
  const netAtTp = rewardUsd - feesTotal;
  const liqPrice =
    ep > 0 ? (side === 'long' ? ep * (1 - 1 / lev + 0.005) : ep * (1 + 1 / lev - 0.005)) : 0;

  const fmt = (n: number, d = 2) =>
    n > 0 ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CalcField label="Account size">
            <NumInput value={equity} onChange={setEquity} placeholder="10000" suffix="USD" />
          </CalcField>
          <CalcField label="Side">
            <SideToggle side={side} onChange={setSide} />
          </CalcField>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <CalcField label="Risk per trade">
            <NumInput value={riskPct} onChange={setRiskPct} placeholder="1" suffix="%" />
          </CalcField>
          <CalcField label="Leverage">
            <NumInput value={leverage} onChange={setLeverage} placeholder="10" suffix="×" />
          </CalcField>
          <CalcField label="Fee per side">
            <NumInput value={feePct} onChange={setFeePct} placeholder="0.04" suffix="%" />
          </CalcField>
        </div>

        <hr style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '4px 0 12px' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <CalcField label="Entry price">
            <NumInput value={entry} onChange={setEntry} placeholder="e.g. 65000" suffix="USD" />
          </CalcField>
          <CalcField label="Stop loss">
            <NumInput value={stop} onChange={setStop} placeholder="e.g. 64200" suffix="USD" />
          </CalcField>
          <CalcField label="Take profit">
            <NumInput value={tp} onChange={setTp} placeholder="e.g. 67000" suffix="USD" />
          </CalcField>
        </div>
      </div>

      <ResultsPanel valid={posUsd > 0}>
        <ResHighlight
          label="Position size · enter this many"
          value={
            posContracts > 0
              ? posContracts.toLocaleString(undefined, { maximumFractionDigits: 4 })
              : '—'
          }
          sub={posUsd > 0 ? `≈ $${fmt(posUsd)} notional` : undefined}
        />
        <ResRow
          label="Stop distance"
          value={stopPct > 0 ? `$${fmt(stopDist)} · ${fmt(stopPct, 2)}%` : '—'}
        />
        <ResRow
          label="$ risked (to SL)"
          value={riskUsd > 0 ? `−$${fmt(riskUsd)}` : '—'}
          color="#ff5b6c"
        />
        {tpp > 0 && (
          <ResRow
            label="$ at TP"
            value={rewardUsd > 0 ? `+$${fmt(rewardUsd)}` : '—'}
            color="#00d68f"
          />
        )}
        {rr > 0 && <ResRow label="Planned R:R" value={`1 : ${rr.toFixed(2)}`} />}
        <ResRow
          label={`Margin used (${lev}×)`}
          value={marginReq > 0 ? `$${fmt(marginReq)}` : '—'}
        />
        {liqPrice > 0 && (
          <ResRow
            label="Liquidation price"
            value={`$${fmt(liqPrice)} (−${((Math.abs(ep - liqPrice) / ep) * 100).toFixed(2)}%)`}
            color="#f5a524"
          />
        )}
        {feesTotal > 0 && <ResRow label="Fees round-trip" value={`$${fmt(feesTotal)}`} />}
        {tpp > 0 && netAtTp > 0 && (
          <ResRow label="Net at TP after fees" value={`+$${fmt(netAtTp)}`} color="#00d68f" />
        )}
        {rr > 0 && <RRBar rr={rr} />}
      </ResultsPanel>
    </div>
  );
}

function RRCalc() {
  const [entry, setEntry] = useState('');
  const [stop, setStop] = useState('');
  const [target, setTarget] = useState('');
  const [riskUsd, setRiskUsd] = useState('100');
  const [side, setSide] = useState<'long' | 'short'>('long');

  const ep = Number.parseFloat(entry) || 0;
  const sp = Number.parseFloat(stop) || 0;
  const tp = Number.parseFloat(target) || 0;
  const risk = Number.parseFloat(riskUsd) || 0;

  const rawRisk = ep > 0 && sp > 0 ? Math.abs(ep - sp) : 0;
  const rawReward = ep > 0 && tp > 0 ? Math.abs(tp - ep) : 0;
  const validDir = side === 'long' ? tp > ep && ep > sp : tp < ep && ep < sp;
  const rr = rawRisk > 0 ? rawReward / rawRisk : 0;
  const breakEvenWr = rr > 0 ? (1 / (1 + rr)) * 100 : 0;
  const rewardUsd = rr > 0 ? risk * rr : 0;
  const ev = rr > 0 ? 0.5 * rewardUsd - 0.5 * risk : 0;

  const fmt = (n: number, d = 2) =>
    n > 0 ? n.toLocaleString(undefined, { maximumFractionDigits: d }) : '—';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <CalcField label="Side">
          <SideToggle side={side} onChange={setSide} />
        </CalcField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <CalcField label="Entry price">
            <NumInput value={entry} onChange={setEntry} placeholder="e.g. 65000" suffix="USD" />
          </CalcField>
          <CalcField label="Stop loss">
            <NumInput value={stop} onChange={setStop} placeholder="e.g. 64200" suffix="USD" />
          </CalcField>
          <CalcField label="Take profit">
            <NumInput value={target} onChange={setTarget} placeholder="e.g. 67000" suffix="USD" />
          </CalcField>
        </div>
        <CalcField label="Risk amount">
          <NumInput value={riskUsd} onChange={setRiskUsd} placeholder="100" suffix="USD" />
        </CalcField>
      </div>

      <ResultsPanel valid={rr > 0}>
        {!validDir && ep > 0 && tp > 0 && sp > 0 && (
          <div
            style={{
              fontSize: 11.5,
              color: '#f5a524',
              background: 'rgba(245,158,11,.1)',
              border: '1px solid rgba(245,158,11,.2)',
              borderRadius: 7,
              padding: '6px 10px',
              marginBottom: 10,
            }}
          >
            TP/SL direction mismatch for {side}
          </div>
        )}
        <ResHighlight label="Risk : Reward" value={rr > 0 ? `1 : ${rr.toFixed(2)}` : '—'} />
        <ResRow
          label="Break-even win rate"
          value={breakEvenWr > 0 ? `${fmt(breakEvenWr, 1)}%` : '—'}
        />
        <ResRow
          label="Potential profit"
          value={rewardUsd > 0 ? `$${fmt(rewardUsd)}` : '—'}
          color={rewardUsd > 0 ? '#00d68f' : undefined}
        />
        <ResRow
          label="Expected value (50% WR)"
          value={ev !== 0 ? `$${ev.toFixed(2)}` : '—'}
          color={ev > 0 ? '#00d68f' : ev < 0 ? '#ff5b6c' : undefined}
        />
        {rr > 0 && <RRBar rr={rr} />}
      </ResultsPanel>
    </div>
  );
}

function RMultipleCalc() {
  const [pnl, setPnl] = useState('');
  const [plannedRisk, setPlannedRisk] = useState('100');
  const [fee, setFee] = useState('0');

  const p = Number.parseFloat(pnl) || 0;
  const r = Number.parseFloat(plannedRisk) || 0;
  const f = Number.parseFloat(fee) || 0;
  const netPnl = p - f;
  const rMultiple = r > 0 ? netPnl / r : 0;
  const outcome = rMultiple > 0 ? 'Win' : rMultiple < 0 ? 'Loss' : '—';
  const outcomeColor = rMultiple > 0 ? '#00d68f' : rMultiple < 0 ? '#ff5b6c' : 'var(--eb-muted)';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <CalcField label="Realized P&L">
          <NumInput value={pnl} onChange={setPnl} placeholder="e.g. 250 or -80" suffix="USD" />
        </CalcField>
        <CalcField label="Planned risk">
          <NumInput value={plannedRisk} onChange={setPlannedRisk} placeholder="100" suffix="USD" />
        </CalcField>
        <CalcField label="Total fees paid">
          <NumInput value={fee} onChange={setFee} placeholder="0" suffix="USD" />
        </CalcField>
      </div>

      <ResultsPanel valid={r > 0 && pnl !== ''}>
        <div
          style={{
            padding: 12,
            background: `${outcomeColor}14`,
            border: `1px solid ${outcomeColor}4d`,
            borderRadius: 9,
            marginBottom: 8,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: outcomeColor,
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            R-Multiple
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 28,
              fontWeight: 700,
              color: outcomeColor,
            }}
          >
            {r > 0 ? `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R` : '—'}
          </div>
          <div style={{ fontSize: 12, color: outcomeColor, fontWeight: 600, marginTop: 2 }}>
            {outcome}
          </div>
        </div>
        <ResRow label="Gross P&L" value={`$${p.toFixed(2)}`} />
        <ResRow label="Fees" value={`$${f.toFixed(2)}`} />
        <ResRow
          label="Net P&L"
          value={`$${netPnl.toFixed(2)}`}
          color={netPnl > 0 ? '#00d68f' : netPnl < 0 ? '#ff5b6c' : undefined}
        />
      </ResultsPanel>
    </div>
  );
}

function PnLCalc() {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [exitP, setExitP] = useState('');
  const [qty, setQty] = useState('');
  const [feePct, setFeePct] = useState('0.055');

  const ep = Number.parseFloat(entry) || 0;
  const xp = Number.parseFloat(exitP) || 0;
  const q = Number.parseFloat(qty) || 0;
  const feeRate = Number.parseFloat(feePct) / 100 || 0;

  const entryNotional = ep * q;
  const exitNotional = xp * q;
  const rawPnl = side === 'long' ? (xp - ep) * q : (ep - xp) * q;
  const entryFee = entryNotional * feeRate;
  const exitFee = exitNotional * feeRate;
  const totalFees = entryFee + exitFee;
  const netPnl = rawPnl - totalFees;
  const pnlPct = entryNotional > 0 ? (rawPnl / entryNotional) * 100 : 0;

  const fmt = (n: number, d = 2) => n.toFixed(d);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <CalcField label="Side">
          <SideToggle side={side} onChange={setSide} />
        </CalcField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CalcField label="Entry price">
            <NumInput value={entry} onChange={setEntry} placeholder="e.g. 65000" suffix="USD" />
          </CalcField>
          <CalcField label="Exit price">
            <NumInput value={exitP} onChange={setExitP} placeholder="e.g. 67000" suffix="USD" />
          </CalcField>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CalcField label="Quantity">
            <NumInput value={qty} onChange={setQty} placeholder="e.g. 0.5" suffix="contracts" />
          </CalcField>
          <CalcField label="Fee rate per side">
            <NumInput
              value={feePct}
              onChange={setFeePct}
              placeholder="0.055"
              step="0.001"
              suffix="%"
            />
          </CalcField>
        </div>
      </div>

      <ResultsPanel valid={ep > 0 && xp > 0 && q > 0}>
        <ResHighlight
          label="Net P&L"
          value={ep > 0 && xp > 0 && q > 0 ? `${netPnl >= 0 ? '+' : ''}$${fmt(netPnl)}` : '—'}
        />
        <ResRow label="Entry notional" value={entryNotional > 0 ? `$${fmt(entryNotional)}` : '—'} />
        <ResRow
          label="Gross P&L"
          value={ep > 0 && xp > 0 && q > 0 ? `$${fmt(rawPnl)}` : '—'}
          color={rawPnl > 0 ? '#00d68f' : rawPnl < 0 ? '#ff5b6c' : undefined}
        />
        <ResRow label="Total fees" value={totalFees > 0 ? `$${fmt(totalFees)}` : '—'} />
        <ResRow
          label="P&L %"
          value={pnlPct !== 0 ? `${pnlPct >= 0 ? '+' : ''}${fmt(pnlPct)}%` : '—'}
          color={pnlPct > 0 ? '#00d68f' : pnlPct < 0 ? '#ff5b6c' : undefined}
        />
      </ResultsPanel>
    </div>
  );
}

function LiquidationCalc() {
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [entry, setEntry] = useState('');
  const [leverage, setLeverage] = useState('10');
  const [marginType, setMarginType] = useState<'isolated' | 'cross'>('isolated');
  const [mmr, setMmr] = useState('0.5');

  const ep = Number.parseFloat(entry) || 0;
  const lev = Number.parseFloat(leverage) || 1;
  const maintenanceRate = Number.parseFloat(mmr) / 100 || 0;

  const liqPrice =
    ep > 0
      ? side === 'long'
        ? ep * (1 - 1 / lev + maintenanceRate)
        : ep * (1 + 1 / lev - maintenanceRate)
      : 0;

  const distancePct = ep > 0 && liqPrice > 0 ? (Math.abs(ep - liqPrice) / ep) * 100 : 0;

  const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { maximumFractionDigits: d });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <CalcField label="Side">
          <SideToggle side={side} onChange={setSide} />
        </CalcField>
        <CalcField label="Margin type">
          <MarginToggle type={marginType} onChange={setMarginType} />
        </CalcField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          <CalcField label="Entry price">
            <NumInput value={entry} onChange={setEntry} placeholder="e.g. 65000" suffix="USD" />
          </CalcField>
          <CalcField label="Leverage">
            <NumInput value={leverage} onChange={setLeverage} placeholder="10" suffix="×" />
          </CalcField>
          <CalcField label="Maint. margin rate">
            <NumInput value={mmr} onChange={setMmr} placeholder="0.5" step="0.01" suffix="%" />
          </CalcField>
        </div>
      </div>

      <ResultsPanel valid={liqPrice > 0}>
        {marginType === 'cross' && (
          <div
            style={{
              fontSize: 11.5,
              color: '#f5a524',
              background: 'rgba(245,158,11,.1)',
              border: '1px solid rgba(245,158,11,.2)',
              borderRadius: 7,
              padding: '6px 10px',
              marginBottom: 8,
            }}
          >
            Cross margin liq price depends on total wallet balance — estimate only.
          </div>
        )}
        <div
          style={{
            padding: 12,
            background: 'rgba(255,91,108,.08)',
            border: '1px solid rgba(255,91,108,.30)',
            borderRadius: 9,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#ff5b6c',
              textTransform: 'uppercase',
              letterSpacing: '.07em',
              fontWeight: 600,
              marginBottom: 3,
            }}
          >
            Liquidation price
          </div>
          <div
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 22,
              fontWeight: 600,
              color: '#ff5b6c',
            }}
          >
            {liqPrice > 0 ? `$${fmt(liqPrice)}` : '—'}
          </div>
        </div>
        <ResRow label="Entry price" value={ep > 0 ? `$${fmt(ep)}` : '—'} />
        <ResRow
          label="Distance from entry"
          value={distancePct > 0 ? `${fmt(distancePct, 2)}%` : '—'}
          color={distancePct > 0 ? '#f5a524' : undefined}
        />
        <ResRow label="Leverage" value={`${lev}×`} />
      </ResultsPanel>
    </div>
  );
}

function CompoundCalc() {
  const [startEquity, setStartEquity] = useState('10000');
  const [riskPct, setRiskPct] = useState('1');
  const [winRate, setWinRate] = useState('55');
  const [avgWin, setAvgWin] = useState('2');
  const [avgLoss, setAvgLoss] = useState('1');
  const [numTrades, setNumTrades] = useState('100');

  const equity = Number.parseFloat(startEquity) || 0;
  const risk = Number.parseFloat(riskPct) / 100 || 0;
  const wr = Number.parseFloat(winRate) / 100 || 0;
  const wins = Number.parseFloat(avgWin) || 0;
  const losses = Number.parseFloat(avgLoss) || 0;
  const n = Math.min(Math.round(Number.parseFloat(numTrades) || 0), 500);

  const expectancy = wr * wins - (1 - wr) * losses;

  let balance = equity;
  for (let i = 0; i < n; i++) {
    const tradeRisk = balance * risk;
    balance += expectancy * tradeRisk;
  }
  const finalBalance = balance;
  const totalReturn = equity > 0 ? ((finalBalance - equity) / equity) * 100 : 0;
  const cagrProxy =
    n > 0 && equity > 0 ? ((finalBalance / equity) ** (1 / (n / 252)) - 1) * 100 : 0;

  const fmt = (n: number, d = 2) => n.toLocaleString(undefined, { maximumFractionDigits: d });

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 18 }}>
      <div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CalcField label="Starting equity">
            <NumInput
              value={startEquity}
              onChange={setStartEquity}
              placeholder="10000"
              suffix="USD"
            />
          </CalcField>
          <CalcField label="Risk per trade">
            <NumInput value={riskPct} onChange={setRiskPct} placeholder="1" step="0.1" suffix="%" />
          </CalcField>
        </div>
        <CalcField label="Win rate">
          <NumInput value={winRate} onChange={setWinRate} placeholder="55" suffix="%" />
        </CalcField>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <CalcField label="Avg win">
            <NumInput value={avgWin} onChange={setAvgWin} placeholder="2" step="0.1" suffix="R" />
          </CalcField>
          <CalcField label="Avg loss">
            <NumInput value={avgLoss} onChange={setAvgLoss} placeholder="1" step="0.1" suffix="R" />
          </CalcField>
        </div>
        <CalcField label="Number of trades">
          <NumInput value={numTrades} onChange={setNumTrades} placeholder="100" />
        </CalcField>
      </div>

      <ResultsPanel valid={equity > 0 && n > 0}>
        <ResHighlight
          label="Final equity"
          value={equity > 0 ? `$${fmt(finalBalance)}` : '—'}
          sub={
            totalReturn !== 0
              ? `${totalReturn >= 0 ? '+' : ''}${fmt(totalReturn, 1)}% return`
              : undefined
          }
        />
        <ResRow
          label="Expectancy"
          value={
            expectancy !== 0
              ? `${expectancy >= 0 ? '+' : ''}${expectancy.toFixed(3)}R / trade`
              : '—'
          }
          color={expectancy > 0 ? '#00d68f' : '#ff5b6c'}
        />
        <ResRow label="Starting equity" value={`$${fmt(equity)}`} />
        <ResRow
          label="Total return"
          value={totalReturn !== 0 ? `${totalReturn >= 0 ? '+' : ''}${fmt(totalReturn, 1)}%` : '—'}
          color={totalReturn > 0 ? '#00d68f' : '#ff5b6c'}
        />
        <ResRow
          label="Ann. proxy (252/yr)"
          value={equity > 0 && n > 0 ? `${fmt(cagrProxy, 1)}%` : '—'}
          color={cagrProxy > 0 ? '#00d68f' : '#ff5b6c'}
        />
        {expectancy <= 0 && equity > 0 && (
          <div
            style={{
              fontSize: 11,
              color: '#ff5b6c',
              marginTop: 8,
              padding: '6px 0',
              borderTop: '1px solid var(--eb-border)',
            }}
          >
            Negative expectancy — this system loses money over time.
          </div>
        )}
      </ResultsPanel>
    </div>
  );
}

// ─── Session clock ────────────────────────────────────────────────────────────

const SESSIONS = [
  { name: 'Asia session', start: 0, end: 8, hours: '00:00 → 08:00 UTC' },
  { name: 'EU session', start: 8, end: 16, hours: '08:00 → 16:00 UTC' },
  { name: 'US session', start: 14, end: 24, hours: '14:00 → 00:00 UTC · overlap 14–16' },
] as const;

function fmtDuration(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function SessionClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const utcH = now?.getUTCHours() ?? 0;
  const utcM = now?.getUTCMinutes() ?? 0;
  const utcS = now?.getUTCSeconds() ?? 0;
  const totalMin = utcH * 60 + utcM;

  const utcStr = now
    ? `${String(utcH).padStart(2, '0')}:${String(utcM).padStart(2, '0')}:${String(utcS).padStart(2, '0')} UTC · ${now.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' })}`
    : '—';

  return (
    <section
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: '16px 18px',
        marginBottom: 14,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--eb-text)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <Clock size={14} style={{ flexShrink: 0 }} /> Session clock · UTC
        </h3>
        <div
          style={{
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--eb-text)',
          }}
        >
          {utcStr}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {SESSIONS.map((sess) => {
          const startMin = sess.start * 60;
          const endMin = sess.end * 60;
          const isActive = totalMin >= startMin && totalMin < endMin;
          let statusText: string;
          if (isActive) {
            statusText = `Active · ${fmtDuration(endMin - totalMin)} remaining`;
          } else {
            let until = startMin - totalMin;
            if (until < 0) until += 24 * 60;
            statusText = `Closed · opens in ${fmtDuration(until)}`;
          }

          return (
            <div
              key={sess.name}
              style={{
                padding: 12,
                borderRadius: 9,
                border: isActive ? '1px solid rgba(6,182,212,.35)' : '1px solid var(--eb-border)',
                background: isActive
                  ? 'linear-gradient(180deg, rgba(6,182,212,.10), rgba(6,182,212,.02))'
                  : 'var(--eb-panel-2)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  color: 'var(--eb-text)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isActive ? '#06b6d4' : 'var(--eb-muted)',
                    flexShrink: 0,
                    boxShadow: isActive ? '0 0 0 3px rgba(6,182,212,.20)' : 'none',
                  }}
                />
                {sess.name}
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10.5,
                  color: 'var(--eb-muted)',
                  marginTop: 3,
                }}
              >
                {sess.hours}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  marginTop: 8,
                  color: isActive ? '#06b6d4' : 'var(--eb-muted)',
                }}
              >
                {now ? statusText : '—'}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

// ─── Panel map ────────────────────────────────────────────────────────────────

const PANELS: Record<ToolId, React.ReactElement> = {
  'position-size': <PositionSizeCalc />,
  'rr-calculator': <RRCalc />,
  'r-multiple': <RMultipleCalc />,
  'pnl-calculator': <PnLCalc />,
  liquidation: <LiquidationCalc />,
  compound: <CompoundCalc />,
};

// ─── Root component ───────────────────────────────────────────────────────────

export function ToolsClient() {
  const [activeTool, setActiveTool] = useState<ToolId>('position-size');
  const active = TOOLS.find((t) => t.id === activeTool) as Tool;

  return (
    <div style={{ padding: '18px 26px 80px', maxWidth: 1100, margin: '0 auto' }}>
      {/* ── Hero ── */}
      <section
        style={{
          background:
            'linear-gradient(135deg, rgba(0,214,143,.06), rgba(6,182,212,.03) 50%, rgba(139,92,246,.05))',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: '24px 28px',
          marginBottom: 14,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'radial-gradient(500px 240px at 90% 10%, rgba(0,214,143,.10), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'relative',
            zIndex: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <h1
              style={{
                margin: '0 0 4px',
                fontSize: 24,
                fontWeight: 600,
                letterSpacing: '-.015em',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                color: 'var(--eb-text)',
              }}
            >
              <Wrench size={26} /> Tools
            </h1>
            <div style={{ color: 'var(--eb-muted-2)', fontSize: 13 }}>
              Calculators and utilities for sizing, risk management, and projection.
            </div>
          </div>
          <div
            style={{
              marginLeft: 'auto',
              padding: '8px 14px',
              borderRadius: 9,
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              width: 140,
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                Tools
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: '"JetBrains Mono", monospace', color: 'var(--eb-text)' }}>
                6
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--eb-border)', margin: '6px 0' }} />
            <div style={{ fontSize: 10, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 2 }}>
              Active
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: active.color, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {active.shortLabel}
            </div>
          </div>
        </div>
      </section>

      {/* ── Quick access ── */}
      <div style={{ marginBottom: 14 }}>
        <h3
          style={{
            margin: '0 0 10px',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--eb-muted-2)',
            letterSpacing: '.05em',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <LayoutGrid size={12} /> Quick access · your tools
          </span>
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
          {TOOLS.map((tool) => {
            const isActive = tool.id === activeTool;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => setActiveTool(tool.id)}
                style={{
                  padding: '10px 12px',
                  border: isActive ? `1px solid ${tool.color}66` : '1px solid var(--eb-border)',
                  borderRadius: 10,
                  background: isActive ? `${tool.bg}` : 'var(--eb-panel)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 9,
                  cursor: 'pointer',
                  transition: 'transform .08s, border-color .12s',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  width: '100%',
                  outline: 'none',
                }}
              >
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 14,
                    flexShrink: 0,
                    background: tool.bg,
                    color: tool.color,
                    border: `1px solid ${tool.borderColor}`,
                  }}
                >
                  <tool.Icon size={15} strokeWidth={1.8} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      display: 'block',
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      color: 'var(--eb-text)',
                    }}
                  >
                    {tool.shortLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: 'var(--eb-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {tool.quickDesc}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <SessionClock />

      {/* ── Featured calculator ── */}
      <section
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: 18,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `radial-gradient(700px 240px at 0% 0%, ${active.bg}, transparent 60%)`,
            pointerEvents: 'none',
          }}
        />

        {/* Section header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 18,
            position: 'relative',
            zIndex: 2,
          }}
        >
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 11,
              background: `linear-gradient(135deg, ${active.color}, ${active.color}aa)`,
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <active.Icon size={22} strokeWidth={1.8} />
          </div>
          <div>
            <h2
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 600,
                letterSpacing: '-.01em',
                color: 'var(--eb-text)',
              }}
            >
              {active.label}
            </h2>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
              {active.desc}
            </div>
          </div>
        </div>

        {/* Calculator */}
        <div style={{ position: 'relative', zIndex: 2 }}>{PANELS[activeTool]}</div>
      </section>
    </div>
  );
}
