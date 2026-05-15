import type { Metadata } from 'next';
import type { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  BarChart2,
  Bot,
  Brain,
  Inbox,
  Lightbulb,
  Settings,
  Target,
  Trophy,
} from 'lucide-react';

export const metadata: Metadata = { title: 'AI Weekly Review — Edgebook' };

const REVIEW_FEATURES: { Icon: LucideIcon; title: string; desc: string }[] = [
  { Icon: Trophy, title: 'What worked', desc: 'Your strongest playbook and why. Do more of this.' },
  {
    Icon: AlertTriangle,
    title: "What didn't",
    desc: 'Edge-decay signals and regime shifts to watch.',
  },
  { Icon: Brain, title: 'Behavioral pattern', desc: 'Sleep, session, day-of-week correlations.' },
  { Icon: Target, title: 'One recommendation', desc: 'Single, reversible action for next week.' },
];

export default function AiReviewPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Coaching / AI weekly review
      </div>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
            AI weekly review
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)' }}>
            Every Sunday 18:00 UTC — Claude analyses your week and makes one concrete
            recommendation.
          </p>
        </div>
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
          <Settings size={13} /> Review settings
        </Button>
      </div>

      {/* 2-column layout: inbox + reader */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 18, alignItems: 'start' }}
      >
        {/* Inbox sidebar */}
        <aside
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: 8,
            minHeight: 500,
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              margin: 0,
              fontSize: 11,
              color: 'var(--eb-muted)',
              textTransform: 'uppercase',
              letterSpacing: '.08em',
              fontWeight: 600,
            }}
          >
            Reviews
          </div>

          {/* Empty inbox state */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '40px 16px',
              textAlign: 'center',
              color: 'var(--eb-muted)',
            }}
          >
            <div style={{ marginBottom: 8, opacity: 0.5 }}>
              <Inbox size={32} />
            </div>
            <div style={{ fontSize: 12, lineHeight: 1.5 }}>
              No reviews yet.
              <br />
              First one arrives
              <br />
              Sunday at 18:00 UTC.
            </div>
          </div>
        </aside>

        {/* Review reader — empty state */}
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: '48px 32px',
            textAlign: 'center',
            minHeight: 500,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              marginBottom: 12,
              filter: 'drop-shadow(0 6px 14px rgba(6,182,212,.2))',
              color: 'var(--eb-cyan)',
            }}
          >
            <Bot size={54} />
          </div>
          <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
            No weekly reviews yet
          </h2>
          <p
            style={{
              color: 'var(--eb-muted-2)',
              maxWidth: 460,
              margin: '0 0 24px',
              lineHeight: 1.65,
              fontSize: 13.5,
            }}
          >
            Once you have trade data, Claude analyses your week every Sunday — what worked, what
            didn&apos;t, your behavioral patterns, and one specific recommendation. You&apos;ll get
            an unread badge here when it&apos;s ready.
          </p>

          {/* What you'll get */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2,1fr)',
              gap: 10,
              width: '100%',
              maxWidth: 520,
              marginBottom: 28,
              textAlign: 'left',
            }}
          >
            {REVIEW_FEATURES.map(({ Icon, title, desc }) => (
              <div
                key={title}
                style={{
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 10,
                  padding: '12px 14px',
                }}
              >
                <div style={{ marginBottom: 4, color: 'var(--eb-muted)' }}>
                  <Icon size={18} />
                </div>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 12.5,
                    color: 'var(--eb-text)',
                    marginBottom: 3,
                  }}
                >
                  {title}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.45 }}>
                  {desc}
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
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
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Enable weekly reviews
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
              <BarChart2 size={13} /> AI &amp; insights settings
            </Button>
          </div>

          <div
            style={{
              marginTop: 28,
              padding: '10px 16px',
              borderRadius: 9,
              background: 'rgba(6,182,212,.06)',
              border: '1px solid rgba(6,182,212,.2)',
              fontSize: 12,
              color: 'var(--eb-cyan)',
              maxWidth: 460,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              textAlign: 'left',
            }}
          >
            <Lightbulb size={13} style={{ flexShrink: 0, marginTop: 1 }} />
            Reviews use Claude Sonnet by default. Cached analyses don&apos;t count toward your
            token budget.
          </div>
        </div>
      </div>
    </div>
  );
}
