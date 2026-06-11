import type { Metadata } from 'next';
import Link from 'next/link';
import { AlertTriangle, BarChart2, Building2, Plus, Shield, TrendingUp } from 'lucide-react';

export const metadata: Metadata = { title: 'Prop accounts — Edgebook' };

const FEATURES = [
  {
    Icon: Shield,
    iconBg: 'rgba(0,168,107,.12)',
    iconColor: 'var(--green)',
    title: 'Live compliance',
    desc: 'Daily loss headroom, trailing drawdown, and profit targets — updated every sync cycle.',
  },
  {
    Icon: AlertTriangle,
    iconBg: 'rgba(245,165,36,.12)',
    iconColor: 'var(--eb-yellow)',
    title: 'Breach prevention',
    desc: 'Auto-alerts when you approach a limit. Optional hard block to lock trading until the next reset.',
  },
  {
    Icon: BarChart2,
    iconBg: 'rgba(6,182,212,.12)',
    iconColor: 'var(--eb-cyan)',
    title: 'Multi-account view',
    desc: 'One dashboard for every eval and funded account across all prop firms.',
  },
  {
    Icon: TrendingUp,
    iconBg: 'rgba(139,92,246,.12)',
    iconColor: 'var(--eb-purple)',
    title: 'Pattern detection',
    desc: 'AI spots how and why you lose evaluations — then suggests tilt rules to plug the leak.',
  },
];

export default function PropAccountsPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Prop trading / Prop accounts
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 20,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 3px', color: 'var(--eb-text)' }}>
            Prop accounts
          </h1>
          <p style={{ margin: 0, color: 'var(--eb-muted-2)', fontSize: 13 }}>
            Live compliance across every funded and evaluation account.
          </p>
        </div>
        <button
          type="button"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '7px 13px',
            borderRadius: 8,
            border: '1px solid #00b67a',
            background: 'linear-gradient(180deg,#00d68f,#00b67a)',
            color: '#06140f',
            fontSize: 12.5,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <Plus size={13} /> Add prop account
        </button>
      </div>

      {/* KPI strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4,1fr)',
          gap: 10,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Total under evaluation', value: '—', sub: '0 accounts active' },
          { label: 'Profit-share earned 90D', value: '—', sub: 'No funded accounts yet' },
          { label: 'Evaluation cost YTD', value: '—', sub: '0 challenges purchased' },
          { label: 'Pass rate · personal', value: '—', sub: 'vs platform median 38%' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: '11px 13px',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.05em',
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-.01em',
                marginTop: 2,
                color: 'var(--eb-muted)',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: '56px 24px 48px',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: 'linear-gradient(135deg,rgba(0,214,143,.12),rgba(6,182,212,.10))',
            border: '1px solid rgba(0,214,143,.25)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--green)',
          }}
        >
          <Building2 size={30} />
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 600,
            margin: '0 0 8px',
            color: 'var(--eb-text)',
            letterSpacing: '-.01em',
          }}
        >
          No prop accounts yet
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            fontSize: 13.5,
            margin: '0 auto 24px',
            lineHeight: 1.55,
            maxWidth: 460,
          }}
        >
          Add your first evaluation or funded account to track live compliance, drawdown headroom,
          and profit targets across every firm — in one view.
        </p>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 40,
          }}
        >
          <button
            type="button"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> Add prop account
          </button>
          <Link
            href="/prop/rules"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 13,
              textDecoration: 'none',
            }}
          >
            Browse rule library
          </Link>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--eb-border)',
            paddingTop: 28,
            maxWidth: 780,
            margin: '0 auto',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.1em',
              marginBottom: 14,
              fontWeight: 600,
            }}
          >
            What you&apos;ll unlock
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: 10,
              textAlign: 'left',
            }}
          >
            {FEATURES.map(({ Icon, iconBg, iconColor, title, desc }) => (
              <div
                key={title}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '12px 14px',
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 10,
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 9,
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: iconBg,
                    color: iconColor,
                  }}
                >
                  <Icon size={15} />
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--eb-text)',
                      marginBottom: 3,
                    }}
                  >
                    {title}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
                    {desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Supported firms strip */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: '14px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 3 }}
            >
              9 prop firms supported out of the box
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
              Apex · FundedNext · MyFundedFutures · Hola Prime · Crypto Fund Trader · BlueGuardian
              · The5%ers · Fxify · + custom
            </div>
          </div>
          <Link
            href="/prop/rules"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 12,
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            View rule library →
          </Link>
        </div>
      </div>
    </div>
  );
}
