import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Mind Lab — Edgebook' };

const FEATURES = [
  {
    icon: '🎯',
    iconBg: 'rgba(139,92,246,.12)',
    iconColor: 'var(--eb-purple)',
    title: 'Conviction calibration',
    desc: 'Are you overconfident at low conviction or underconfident at high? We plot your stated vs realized R per conviction level.',
  },
  {
    icon: '📊',
    iconBg: 'rgba(0,214,143,.12)',
    iconColor: 'var(--green)',
    title: 'Behavioral × P&L',
    desc: '"Sleep < 6h reduces your expectancy by 42%." We surface correlations between your physical/mental state and your edge.',
  },
  {
    icon: '⚡',
    iconBg: 'rgba(6,182,212,.12)',
    iconColor: 'var(--eb-cyan)',
    title: 'Tilt detector',
    desc: 'Real-time guardrails: cooldowns after losses, revenge re-entry blocks, oversize confirms. Optional auto-pause.',
  },
  {
    icon: '🏆',
    iconBg: 'rgba(245,165,36,.12)',
    iconColor: 'var(--eb-yellow)',
    title: 'Discipline score',
    desc: 'Daily 0–100 from rule adherence + journal completion + risk discipline. Process over outcomes.',
  },
];

export default function MindLabPage() {
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
            fontSize: 36,
            marginBottom: 14,
            background: 'linear-gradient(135deg,rgba(139,92,246,.15),rgba(6,182,212,.10))',
            border: '1px solid rgba(139,92,246,.25)',
          }}
        >
          🧠
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
          Find what makes you tilt — before the tape does
        </h2>
        <p
          style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}
        >
          The differentiator. Mind Lab tracks your conviction calibration, mood × P&amp;L
          correlations, rule adherence, and discipline score over time. Most journals tell you what
          happened. We tell you why.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link
            href="/journal"
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
            📓 Start your daily journal
          </Link>
          <Link
            href="/goals"
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
              textDecoration: 'none',
            }}
          >
            ⚖ Review tilt rules
          </Link>
          <Link
            href="/settings/connections"
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
              textDecoration: 'none',
            }}
          >
            🔌 Connect exchange
          </Link>
        </div>
      </div>

      {/* What you'll unlock label */}
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
        What you&apos;ll unlock
      </div>

      {/* 4-column feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12 }}>
        {FEATURES.map(({ icon, iconBg, iconColor, title, desc }) => (
          <div
            key={title}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 11,
              padding: 14,
              textAlign: 'left',
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                marginBottom: 8,
                background: iconBg,
                color: iconColor,
              }}
            >
              {icon}
            </div>
            <h4
              style={{
                margin: '0 0 4px',
                fontSize: 12.5,
                fontWeight: 600,
                color: 'var(--eb-text)',
              }}
            >
              {title}
            </h4>
            <p style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5, margin: 0 }}>
              {desc}
            </p>
          </div>
        ))}
      </div>

      {/* Separator */}
      <div style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '18px 0' }} />

      {/* Journal CTA panel */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: 16,
          display: 'grid',
          gridTemplateColumns: '1fr 1.2fr',
          gap: 18,
          alignItems: 'center',
        }}
      >
        <div>
          <h4 style={{ margin: '0 0 6px', fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
            Start with the daily journal
          </h4>
          <p
            style={{
              color: 'var(--eb-muted-2)',
              fontSize: 13,
              margin: '0 0 12px',
              lineHeight: 1.55,
            }}
          >
            Even with zero trades imported, journaling builds the behavioral data Mind Lab needs. It
            takes 60 seconds before market open.
          </p>
          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href="/journal"
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
              📓 Open today&apos;s journal
            </Link>
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
              Learn more
            </button>
          </div>
        </div>

        {/* Sample insight box */}
        <div
          style={{
            background: 'var(--eb-panel-2)',
            border: '1px dashed var(--eb-border)',
            borderRadius: 10,
            padding: 14,
            fontSize: 12.5,
            lineHeight: 1.55,
            color: 'var(--eb-muted-2)',
          }}
        >
          <div
            style={{
              fontSize: 10.5,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.06em',
              marginBottom: 6,
            }}
          >
            Sample insight (with data)
          </div>
          <div>
            Your win rate drops <strong style={{ color: 'var(--eb-red)' }}>18%</strong> on revenge
            trades opened within 60s of a stop-out. We recommend a hard 5-min lockout — likely to
            recover an estimated <strong style={{ color: 'var(--green)' }}>+5.4R / 90 days</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}
