import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';

export const metadata: Metadata = { title: 'Daily Journal — Edgebook' };

const STEPS = [
  {
    icon: '🌅',
    title: 'Pre-market intent',
    desc: 'Lock in your bias, key levels, max risk, and plan before the first trade fires. Immutable once locked — no hindsight edits.',
    chip: 'Locked at first trade',
    chipColor: 'var(--eb-yellow)',
    chipBg: 'rgba(245,165,36,.08)',
    chipBorder: 'rgba(245,165,36,.3)',
  },
  {
    icon: '⚡',
    title: 'Live session',
    desc: "Mid-session notes, rule event log, and trade-by-trade checklist. Timestamps are preserved — the tape doesn't lie.",
    chip: 'Trading active',
    chipColor: 'var(--green)',
    chipBg: 'rgba(0,214,143,.08)',
    chipBorder: 'rgba(0,214,143,.3)',
  },
  {
    icon: '🌙',
    title: 'End-of-day review',
    desc: "Score the day on process (not outcome), capture the lesson, and set tomorrow's prep. Unlocks after session close.",
    chip: 'Unlocks at EOD',
    chipColor: 'var(--eb-muted-2)',
    chipBg: 'var(--eb-panel-2)',
    chipBorder: 'var(--eb-border)',
  },
];

export default function JournalPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Coaching / Daily journal
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
            Daily journal
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)' }}>
            Three-step ritual — plan, trade, review.
          </p>
        </div>
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
          📓 Write today&apos;s entry
        </Button>
      </div>

      {/* Main empty state */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: '52px 28px 40px',
          textAlign: 'center',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            fontSize: 54,
            marginBottom: 8,
            filter: 'drop-shadow(0 6px 14px rgba(0,214,143,.18))',
          }}
        >
          📓
        </div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          Start your trading journal
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            maxWidth: 500,
            margin: '0 auto 24px',
            lineHeight: 1.65,
            fontSize: 13.5,
          }}
        >
          Journaling is the single highest-ROI habit for active traders. Log your plan before the
          session, notes during, and review after. Edgebook locks entries after the first trade
          fires so you can&apos;t edit in hindsight.
        </p>

        {/* 3-step flow */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 12,
            maxWidth: 720,
            margin: '0 auto 28px',
          }}
        >
          {STEPS.map(({ icon, title, desc, chip, chipColor, chipBg, chipBorder }, i) => (
            <div
              key={title}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 11,
                padding: '16px 14px',
                textAlign: 'left',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: -12,
                  left: 14,
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background:
                    i === 1 ? 'linear-gradient(135deg,var(--green),#06b6d4)' : 'var(--eb-panel)',
                  border: `1px solid ${i === 1 ? 'transparent' : 'var(--eb-border)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 13,
                  color: i === 1 ? '#06140f' : 'var(--eb-muted)',
                  fontWeight: 700,
                }}
              >
                {icon}
              </div>
              <div style={{ marginTop: 14 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13,
                    color: 'var(--eb-text)',
                    marginBottom: 4,
                  }}
                >
                  {title}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--eb-muted)',
                    lineHeight: 1.5,
                    marginBottom: 8,
                  }}
                >
                  {desc}
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    padding: '2px 8px',
                    borderRadius: 99,
                    border: `1px solid ${chipBorder}`,
                    background: chipBg,
                    color: chipColor,
                  }}
                >
                  {chip}
                </span>
              </div>
            </div>
          ))}
        </div>

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
          📓 Write today&apos;s entry →
        </Button>
      </div>

      {/* Sidebar stats preview */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Journal streak', value: '—', sub: 'Start today', color: 'var(--eb-muted)' },
          {
            label: 'Discipline avg (30D)',
            value: '—',
            sub: 'No data yet',
            color: 'var(--eb-muted)',
          },
          {
            label: 'Entries this month',
            value: '0',
            sub: 'Goal: trade days',
            color: 'var(--eb-muted)',
          },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: '12px 14px',
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
                color,
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
