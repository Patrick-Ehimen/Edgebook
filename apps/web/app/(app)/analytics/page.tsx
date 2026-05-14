import type { Metadata } from 'next';
import Link from 'next/link';
import { Lock, PenLine, Plug, TrendingUp, Upload } from 'lucide-react';

export const metadata: Metadata = { title: 'Analytics — Edgebook' };

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
  0.58, 0.15, 0.92, 0.39, 0.65, 0.1, 0.74, 0.46, 0.84, 0.27, 0.6, 0.12, 0.76, 0.45, 0.9, 0.36, 0.69,
  0.23, 0.53, 0.81,
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

const CARDS = [
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

export default function AnalyticsPage() {
  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 1280, width: '100%', alignSelf: 'center' }}>
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
          style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}
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
        {CARDS.map(({ lock, title, desc, visual }) => (
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
