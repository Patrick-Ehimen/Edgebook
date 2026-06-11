import type { Metadata } from 'next';
import Link from 'next/link';
import { ClipboardList, Plus, RefreshCw, ShieldCheck, Zap } from 'lucide-react';

export const metadata: Metadata = { title: 'Rule library — Edgebook' };

const FEATURES = [
  {
    Icon: ClipboardList,
    iconBg: 'rgba(6,182,212,.12)',
    iconColor: 'var(--eb-cyan)',
    title: 'Versioned rule packs',
    desc: 'Each supported firm ships a versioned pack — profit target, daily loss, trailing DD, consistency rules, and more. Updated as firms change their terms.',
  },
  {
    Icon: Zap,
    iconBg: 'rgba(0,168,107,.12)',
    iconColor: 'var(--green)',
    title: 'One-click compliance',
    desc: 'Select a firm and account size and compliance arms automatically. No manual rule entry.',
  },
  {
    Icon: RefreshCw,
    iconBg: 'rgba(139,92,246,.12)',
    iconColor: 'var(--eb-purple)',
    title: 'Always up to date',
    desc: 'Rule packs are verified against each firm\'s official page weekly. You get notified if a firm changes its terms after you start an evaluation.',
  },
  {
    Icon: ShieldCheck,
    iconBg: 'rgba(245,165,36,.12)',
    iconColor: 'var(--eb-yellow)',
    title: 'Custom pack builder',
    desc: 'Private prop deal or a firm we don\'t yet support? Build your own rule set using the same DSL as tilt rules.',
  },
];

const COMING_SOON = [
  { initial: 'A', bg: '#f97316', name: 'Apex Trader Funding', sub: '1-step · crypto futures' },
  { initial: 'F', bg: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', name: 'FundedNext Crypto', sub: '2-step · crypto perp' },
  { initial: 'M', bg: '#10b981', name: 'MyFundedFutures', sub: '1-step · crypto perp' },
  { initial: 'H', bg: '#1e3a8a', name: 'Hola Prime Crypto', sub: '2-step / instant' },
  { initial: 'C', bg: '#06b6d4', name: 'Crypto Fund Trader', sub: '2-step / 1-step pro' },
  { initial: 'B', bg: '#0ea5e9', name: 'BlueGuardian Crypto', sub: '2-step / 1-step' },
  { initial: '5', bg: '#374151', name: 'The5%ers Crypto', sub: 'bootcamp / high stakes' },
  { initial: 'X', bg: '#a855f7', name: 'Fxify Crypto', sub: '2-step · crypto perp' },
];

export default function PropRulesPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Prop trading / Rule library
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
            Rule library
          </h1>
          <p style={{ margin: 0, color: 'var(--eb-muted-2)', fontSize: 13 }}>
            Versioned compliance rule packs for crypto perp prop firms. Pick one and compliance
            arms automatically.
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
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            color: 'var(--eb-text)',
            fontSize: 12.5,
            cursor: 'pointer',
            fontFamily: 'inherit',
            flexShrink: 0,
          }}
        >
          <Plus size={13} /> Submit a firm
        </button>
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
            background: 'linear-gradient(135deg,rgba(6,182,212,.12),rgba(139,92,246,.10))',
            border: '1px solid rgba(6,182,212,.25)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--eb-cyan)',
          }}
        >
          <ClipboardList size={30} />
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
          No rule packs loaded yet
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
          Add a prop account to load its firm&apos;s rule pack, or browse the library to explore
          compliance rules before you sign up for a challenge.
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
          <Link
            href="/prop/accounts"
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
              textDecoration: 'none',
            }}
          >
            <Plus size={13} /> Add prop account
          </Link>
          <button
            type="button"
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
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Browse all firms
          </button>
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
            What rule packs give you
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

      {/* Supported firms preview */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          padding: '16px 18px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
            gap: 12,
          }}
        >
          <div>
            <div
              style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 3 }}
            >
              8 crypto perp firms — coming soon
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
              All focused on perpetual futures. No forex.
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 10.5,
              padding: '3px 10px',
              borderRadius: 99,
              border: '1px solid rgba(139,92,246,.28)',
              background: 'rgba(139,92,246,.10)',
              color: 'var(--eb-purple)',
              flexShrink: 0,
            }}
          >
            Updated weekly
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 8,
          }}
        >
          {COMING_SOON.map(({ initial, bg, name, sub }) => (
            <div
              key={name}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 11px',
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 9,
                opacity: 0.7,
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 7,
                  flexShrink: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 13,
                  color: '#fff',
                  background: bg,
                }}
              >
                {initial}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: 'var(--eb-text)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {name}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
