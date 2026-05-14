import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Check, ClipboardList, Plus, Shield, Target, TrendingUp, Zap } from 'lucide-react';

export const metadata: Metadata = { title: 'Goals & Rules — Edgebook' };

const PRESETS: {
  Icon: LucideIcon;
  name: string;
  desc: string;
  features: string[];
  badge: string | null;
  badgeColor: string;
}[] = [
  {
    Icon: Zap,
    name: 'Active scalper',
    desc: 'Tight cooldowns, aggressive revenge-trade blocking, soft news alerts.',
    features: [
      'Cooldown 30m after 3 losses',
      '60s revenge block',
      'Oversize confirm at 2×',
      'News flag (soft)',
      '0.5% risk cap',
    ],
    badge: null,
    badgeColor: 'var(--green)',
  },
  {
    Icon: Shield,
    name: 'Funded / prop firm',
    desc: 'Hard halt on max-loss, leverage cap, news block. Built to keep your account.',
    features: [
      'Daily max loss −2%',
      'Monthly DD −5% kill switch',
      'News block (hard)',
      'Leverage cap 10×',
      'Min R:R 1:2',
    ],
    badge: 'Strict',
    badgeColor: 'var(--eb-yellow)',
  },
  {
    Icon: TrendingUp,
    name: 'Conservative swing',
    desc: 'Looser cooldowns, no revenge block for low-cadence trading, tighter sizing.',
    features: [
      'Cooldown 60m after 2 losses',
      'No revenge block',
      'Oversize confirm at 1.5×',
      '0.7% risk cap',
      'Min R:R 1:2',
    ],
    badge: 'Coach',
    badgeColor: 'var(--eb-cyan)',
  },
];

export default function GoalsPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Coaching / Goals &amp; rules
      </div>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
            Goals &amp; rules
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)' }}>
            Performance targets and discipline guardrails. Soft alerts ping you; hard rules can
            pause your account.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <ClipboardList size={13} /> Apply preset ▾
          </Button>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '8px 14px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> New rule
          </Button>
        </div>
      </div>

      {/* Main empty state */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: '48px 28px 40px',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            marginBottom: 8,
            filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.18))',
            display: 'inline-flex',
            color: 'var(--green)',
          }}
        >
          <Target size={54} />
        </div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          No rules configured
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            maxWidth: 480,
            margin: '0 auto 24px',
            lineHeight: 1.65,
            fontSize: 13.5,
          }}
        >
          Rules protect your P&amp;L from your emotions. Soft alerts warn you; hard rules pause the
          account. Start with a preset, then tune the numbers to fit your style.
        </p>

        {/* Preset cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
            maxWidth: 720,
            margin: '0 auto 28px',
            textAlign: 'left',
          }}
        >
          {PRESETS.map(({ Icon, name, desc, features, badge, badgeColor }) => (
            <div
              key={name}
              style={{
                padding: 16,
                border: '1.5px solid var(--eb-border)',
                borderRadius: 11,
                background: 'var(--eb-panel-2)',
                cursor: 'pointer',
                position: 'relative',
                transition: 'border-color .15s',
              }}
            >
              {badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    fontSize: 10,
                    padding: '2px 7px',
                    borderRadius: 99,
                    background: 'rgba(0,0,0,.15)',
                    color: badgeColor,
                    border: `1px solid ${badgeColor}40`,
                  }}
                >
                  {badge}
                </span>
              )}
              <div style={{ marginBottom: 6, color: 'var(--eb-muted)' }}>
                <Icon size={22} />
              </div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 13.5,
                  color: 'var(--eb-text)',
                  marginBottom: 4,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--eb-muted)',
                  lineHeight: 1.45,
                  marginBottom: 10,
                }}
              >
                {desc}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {features.map((f) => (
                  <span
                    key={f}
                    style={{
                      fontSize: 11.5,
                      color: 'var(--eb-muted-2)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    <Check size={10} style={{ flexShrink: 0, color: 'var(--green)' }} /> {f}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 20px',
              borderRadius: 9,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00e29a,#00b67a)',
              color: '#06140f',
              fontSize: 13.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Choose a preset →
          </Button>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '10px 14px',
              borderRadius: 9,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> Add custom rule
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
        {[
          { label: 'Active rules', value: '0', sub: 'None configured' },
          { label: 'Triggers (90D)', value: '—', sub: 'Awaiting data' },
          { label: 'Est. R saved', value: '—', sub: 'Counterfactual' },
          { label: 'Discipline avg', value: '—', sub: 'No trades yet' },
        ].map(({ label, value, sub }) => (
          <div
            key={label}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: '12px 14px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color: 'var(--eb-muted)',
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
