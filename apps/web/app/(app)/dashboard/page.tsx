import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Dashboard — Edgebook' };

function SkeletonCard() {
  return (
    <div
      className="shimmer"
      style={{
        height: 64,
        background: 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 9,
        position: 'relative',
        overflow: 'hidden',
        opacity: 0.45,
      }}
    />
  );
}

function ChecklistCard({
  step,
  done,
  title,
  desc,
}: {
  step: number | '✓';
  done: boolean;
  title: string;
  desc: string;
}) {
  return (
    <div
      style={{
        padding: 12,
        border: `1px solid ${done ? 'var(--green)' : 'var(--eb-border)'}`,
        borderRadius: 10,
        background: done ? 'rgba(0,214,143,.06)' : 'var(--eb-panel-2)',
        textAlign: 'left',
      }}
    >
      <h4
        style={{
          margin: '0 0 4px',
          fontSize: 13,
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: 'var(--eb-text)',
        }}
      >
        <span
          style={{
            width: 18,
            height: 18,
            borderRadius: '50%',
            background: done ? 'rgba(0,214,143,.18)' : 'var(--eb-panel-2)',
            border: `1px solid ${done ? 'var(--green)' : 'var(--eb-border)'}`,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: done ? 'var(--green)' : 'var(--eb-muted)',
            flexShrink: 0,
          }}
        >
          {step}
        </span>
        {title}
      </h4>
      <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.45 }}>{desc}</div>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Dashboard
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 22,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--eb-text)' }}>
          Dashboard
        </h1>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            padding: '2px 9px',
            borderRadius: 99,
            border: '1px solid rgba(139,92,246,.3)',
            background: 'rgba(139,92,246,.08)',
            color: 'var(--eb-purple)',
          }}
        >
          No trades yet
        </span>
      </div>

      {/* Skeleton KPI row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(5,1fr)',
          gap: 10,
          marginBottom: 16,
        }}
      >
        {[0, 1, 2, 3, 4].map((id) => (
          <SkeletonCard key={`kpi-${id}`} />
        ))}
      </div>

      {/* Empty state */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: '48px 28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Skeleton chart behind */}
        <div
          style={{
            width: '100%',
            maxWidth: 640,
            height: 80,
            marginBottom: 28,
            display: 'grid',
            gridTemplateColumns: 'repeat(12,1fr)',
            gap: 6,
            opacity: 0.2,
          }}
        >
          {Array.from({ length: 12 }, (_, i) => i).map((id) => (
            <div
              key={`bar-${id}`}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 5,
                height: `${28 + Math.sin(id * 0.8) * 22}px`,
                alignSelf: 'flex-end',
              }}
            />
          ))}
        </div>

        <div
          style={{
            fontSize: 54,
            marginBottom: 8,
            filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.2))',
          }}
        >
          🌱
        </div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          Your edge starts with one trade
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            maxWidth: 480,
            margin: '0 0 20px',
            lineHeight: 1.6,
            fontSize: 13.5,
          }}
        >
          Connect an exchange, upload a CSV, or log your first trade manually. Once you have data,
          this dashboard lights up with your equity curve, win rate, and the first AI insight.
        </p>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: 28,
          }}
        >
          <Link
            href="/settings/connections"
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
              transition: 'filter .15s',
            }}
          >
            🔌 Connect exchange
          </Link>
          <Button
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
            📁 Upload CSV
          </Button>
          <Button
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
            ⌨ Log trade manually
          </Button>
        </div>

        {/* 3-step checklist */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
            width: '100%',
            maxWidth: 680,
            textAlign: 'left',
          }}
        >
          <ChecklistCard
            step="✓"
            done
            title="Account created"
            desc="Welcome aboard. Your workspace is ready and your data stays yours."
          />
          <ChecklistCard
            step={2}
            done={false}
            title="Connect data source"
            desc="Read-only API or CSV — pulls last 90 days automatically."
          />
          <ChecklistCard
            step={3}
            done={false}
            title="Define a playbook"
            desc="Without it, every trade is 'one-off.' With it, your edge becomes measurable."
          />
        </div>
      </div>
    </div>
  );
}
