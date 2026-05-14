import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Playbooks — Edgebook' };

const TEMPLATES = [
  {
    icon: '💧',
    title: 'Liquidity sweep',
    badge: 'popular',
    desc: 'Sweep of session high/low into HTF level → reclaim → opposing liquidity. The bread-and-butter of ICT-style traders.',
    tags: ['EU · US', '5m · 15m', 'Risk 0.5%'],
    checklist: 6,
    rr: '1 : 2',
  },
  {
    icon: '🚀',
    title: 'Breakout retest',
    badge: null,
    desc: 'Break of HTF level → wait for the retest → enter on confirmation. Conservative but reliable when trend is clean.',
    tags: ['Any session', '15m · 1h', 'Risk 0.5%'],
    checklist: 5,
    rr: '1 : 2',
  },
  {
    icon: '🔄',
    title: 'Range fade',
    badge: null,
    desc: 'Fade the extremes of well-defined intraday ranges. Best in low-volatility, sideways tape — typically Asia session.',
    tags: ['Asia', '5m', 'Risk 0.4%'],
    checklist: 4,
    rr: '1 : 1.5',
  },
  {
    icon: '📈',
    title: 'Trend pullback',
    badge: null,
    desc: 'Buy or sell pullbacks to the 20-EMA in trending tape. Simple, robust, works across timeframes.',
    tags: ['US', '15m · 1h', 'Risk 0.5%'],
    checklist: 5,
    rr: '1 : 2',
  },
  {
    icon: '📰',
    title: 'News reversal',
    badge: null,
    desc: 'Fade the overreaction to scheduled high-impact news within 30 minutes. Smaller size, tighter stops.',
    tags: ['Any session', '1m · 5m', 'Risk 0.3%'],
    checklist: 5,
    rr: '1 : 1.5',
  },
];

const chipStyle: React.CSSProperties = {
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

const chipGreenStyle: React.CSSProperties = {
  ...chipStyle,
  color: 'var(--green)',
  borderColor: 'rgba(0,214,143,.30)',
  background: 'rgba(0,214,143,.08)',
};

export default function PlaybooksPage() {
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
            background: 'linear-gradient(135deg,rgba(0,214,143,.15),rgba(6,182,212,.10))',
            border: '1px solid rgba(0,214,143,.20)',
          }}
        >
          🎯
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
          Build your first playbook
        </h2>
        <p
          style={{ color: 'var(--eb-muted-2)', fontSize: 14, margin: '0 0 18px', lineHeight: 1.55 }}
        >
          Without a playbook, every trade is a one-off. With one, your edge becomes measurable. Pick
          a starter template — or write your own from scratch.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
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
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Create from scratch
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
            Skip — auto-tag my trades later
          </button>
        </div>
      </div>

      {/* Starter templates label */}
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
        Starter templates
      </div>

      {/* Template grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
        {TEMPLATES.map(({ icon, title, badge, desc, tags, checklist, rr }) => (
          <div
            key={title}
            style={{
              background: 'var(--eb-panel)',
              border: '1.5px solid var(--eb-border)',
              borderRadius: 12,
              padding: 16,
              cursor: 'pointer',
              transition: 'transform .08s, border-color .12s',
            }}
          >
            <h4
              style={{
                margin: '0 0 4px',
                fontSize: 13.5,
                fontWeight: 600,
                color: 'var(--eb-text)',
                display: 'flex',
                alignItems: 'center',
                gap: 7,
              }}
            >
              {icon} {title}
              {badge && <span style={chipGreenStyle}>{badge}</span>}
            </h4>
            <p
              style={{
                fontSize: 11.5,
                color: 'var(--eb-muted)',
                lineHeight: 1.5,
                margin: '0 0 10px',
              }}
            >
              {desc}
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
              {tags.map((tag) => (
                <span key={tag} style={chipStyle}>
                  {tag}
                </span>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                borderTop: '1px dashed var(--eb-border)',
                paddingTop: 8,
              }}
            >
              <span>{checklist} checklist items</span>
              <span>
                Min R:R <strong style={{ color: 'var(--eb-text)' }}>{rr}</strong>
              </span>
            </div>
          </div>
        ))}

        {/* Create from scratch blank card */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 6,
            padding: 20,
            background: 'var(--eb-panel)',
            border: '1.5px dashed var(--eb-border)',
            borderRadius: 12,
            cursor: 'pointer',
            color: 'var(--eb-muted)',
            fontSize: 12.5,
          }}
        >
          <span style={{ fontSize: 24 }}>＋</span>
          <div style={{ fontWeight: 500, color: 'var(--eb-text)' }}>Create from scratch</div>
          <div>Define your own thesis, criteria, and checklist.</div>
        </div>
      </div>

      {/* Separator */}
      <div style={{ border: 0, borderTop: '1px solid var(--eb-border)', margin: '18px 0' }} />

      {/* Community library */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h4
            style={{ margin: '0 0 4px', fontSize: 13.5, fontWeight: 600, color: 'var(--eb-text)' }}
          >
            📚 Browse the community library
          </h4>
          <p style={{ color: 'var(--eb-muted)', fontSize: 12, margin: 0 }}>
            42 verified playbooks shared by other Edgebook traders, sorted by sample size and PF.
          </p>
        </div>
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
            whiteSpace: 'nowrap',
          }}
        >
          Open library →
        </button>
      </div>
    </div>
  );
}
