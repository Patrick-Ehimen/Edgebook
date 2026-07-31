'use client';

import { usePlans } from '@/features/plans';
import { PLAN_FIELDS } from '@/features/plans/schemas';
import {
  CalendarClock,
  Compass,
  Gauge,
  ListChecks,
  Pencil,
  Plus,
  ScrollText,
  ShieldCheck,
  Target,
} from 'lucide-react';
import Link from 'next/link';

// ── accent cycle — matches the playbooks page ─────────────────────────────────

const ACCENTS = ['#00d68f', '#06b6d4', '#818cf8', '#f472b6', '#fb923c', '#facc15'];

const MONO = '"JetBrains Mono",monospace';

// The section groups a plan is built from — mirrors the trading-plan spec.
const COVERAGE: { Icon: typeof Compass; accent: string; title: string; body: string }[] = [
  {
    Icon: Compass,
    accent: '#00d68f',
    title: 'Scope & timeframes',
    body: 'The universe you are allowed to trade, and which timeframe sets bias, structure, and trigger.',
  },
  {
    Icon: Target,
    accent: '#06b6d4',
    title: 'Location & confirmation',
    body: 'Supply/demand and S&R as the non-negotiable filter, with momentum and volatility as confirmation only.',
  },
  {
    Icon: ShieldCheck,
    accent: '#f472b6',
    title: 'Risk management',
    body: 'Risk per trade, daily loss limit, minimum R:R, and a leverage ceiling that overrides every other section.',
  },
  {
    Icon: Gauge,
    accent: '#818cf8',
    title: 'Confluence scoring',
    body: 'The weighted go / no-go score, its hard vetoes, and the grade that decides your position size.',
  },
  {
    Icon: ListChecks,
    accent: '#fb923c',
    title: 'Checklist & playbooks',
    body: 'The pre-trade gate you run before every entry, linked to the playbooks that qualify as a trade.',
  },
  {
    Icon: CalendarClock,
    accent: '#facc15',
    title: 'Routine & review',
    body: 'Weekly prep, daily pre- and post-session blocks, and the metrics that decide whether the plan works.',
  },
];

// ── ghost document preview ────────────────────────────────────────────────────

function bar(width: string | number, color = 'var(--eb-border)', height = 7) {
  return { height, width, borderRadius: 2, background: color } as const;
}

function GhostPlan() {
  return (
    <div
      aria-hidden
      style={{
        display: 'flex',
        gap: 18,
        width: '100%',
        maxWidth: 560,
        padding: 20,
        borderRadius: 12,
        border: '1px solid var(--eb-border)',
        background: 'var(--eb-panel-2)',
        opacity: 0.55,
        marginBottom: 40,
      }}
    >
      {/* section rail */}
      <div
        style={{
          width: 96,
          display: 'flex',
          flexDirection: 'column',
          gap: 9,
          paddingRight: 14,
          borderRight: '1px solid var(--eb-border)',
          flexShrink: 0,
        }}
      >
        {['70%', '86%', '60%', '78%', '52%', '68%'].map((w, i) => (
          <div key={w} style={bar(w, i === 0 ? '#00d68f' : 'var(--eb-border)', 6)} />
        ))}
      </div>

      {/* panels */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        {ACCENTS.slice(0, 2).map((accent) => (
          <div
            key={accent}
            style={{
              borderRadius: 10,
              border: '1px solid var(--eb-border)',
              borderLeft: `3px solid ${accent}`,
              background: 'var(--eb-panel)',
              padding: '13px 15px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
            }}
          >
            <div style={bar('44%', accent, 9)} />
            <div style={bar('92%')} />
            <div style={bar('74%')} />
            <div style={{ display: 'flex', gap: 5, marginTop: 2 }}>
              {[44, 60, 36].map((w) => (
                <div
                  key={w}
                  style={{
                    height: 16,
                    width: w,
                    borderRadius: 99,
                    background: `${accent}26`,
                    border: `1px solid ${accent}40`,
                  }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

function PlanRow({
  plan,
}: {
  plan: {
    id: string;
    name: string;
    owner: string;
    version: string;
    status: string;
    valuesJson: Record<string, unknown>;
    updatedAt: string;
  };
}) {
  const answered = PLAN_FIELDS.filter((f) => f.id in plan.valuesJson).length;
  const pct = Math.round((answered / PLAN_FIELDS.length) * 100);

  // Outer element is a plain div — the row holds two separate links (open / edit),
  // and nesting anchors is invalid.
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderLeft: '3px solid #00d68f',
        borderRadius: '0 12px 12px 0',
        padding: '14px 18px',
        marginBottom: 10,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: 'rgba(0,214,143,.1)',
          border: '1px solid rgba(0,214,143,.28)',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--green)',
          flexShrink: 0,
        }}
      >
        <ScrollText size={17} strokeWidth={1.7} />
      </div>

      <Link href={`/plans/${plan.id}`} style={{ minWidth: 0, flex: 1, textDecoration: 'none' }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 3 }}>
          {plan.name}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
          {plan.owner ? `${plan.owner} · ` : ''}v{plan.version} · updated{' '}
          {new Date(plan.updatedAt).toLocaleDateString()}
        </div>
      </Link>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 700, fontFamily: MONO, color: 'var(--eb-text)' }}>
          {pct}%
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--eb-muted)' }}>
          {answered}/{PLAN_FIELDS.length} filled
        </div>
      </div>

      <span
        style={{
          fontSize: 11,
          padding: '2px 9px',
          borderRadius: 99,
          border: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
          color: 'var(--eb-muted-2)',
          textTransform: 'capitalize',
          flexShrink: 0,
        }}
      >
        {plan.status}
      </span>

      <Link
        href={`/plans/${plan.id}/edit`}
        title="Edit plan"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 11px',
          borderRadius: 7,
          border: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
          color: 'var(--eb-muted-2)',
          fontSize: 11.5,
          textDecoration: 'none',
          flexShrink: 0,
        }}
      >
        <Pencil size={12} />
        Edit
      </Link>
    </div>
  );
}

export function PlansClient() {
  const { data: plans, isLoading } = usePlans();
  const hasPlans = !isLoading && (plans?.length ?? 0) > 0;

  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      {/* ── page header ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 6px',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-.02em',
              color: 'var(--eb-text)',
            }}
          >
            Plans
          </h1>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)', maxWidth: 620 }}>
            Your trading plan — the written rules every trade is measured against.
          </p>
        </div>

        <Link
          href="/plans/new"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '8px 13px',
            borderRadius: 8,
            border: 0,
            background: 'var(--green)',
            color: '#00251a',
            fontSize: 12.5,
            fontWeight: 600,
            textDecoration: 'none',
            flexShrink: 0,
          }}
        >
          <Plus size={14} />
          New plan
        </Link>
      </div>

      {/* ── existing plans ── */}
      {hasPlans && (
        <div style={{ marginBottom: 26 }}>
          {plans?.map((plan) => (
            <PlanRow key={plan.id} plan={plan} />
          ))}
        </div>
      )}

      {/* ── empty state ── */}
      {!hasPlans && (
        <div
          style={{
            border: '1px solid var(--eb-border)',
            borderRadius: 14,
            overflow: 'hidden',
            background: 'var(--eb-panel)',
            marginBottom: 26,
          }}
        >
          {/* 6-colour accent stripe */}
          <div style={{ display: 'flex', height: 3 }}>
            {ACCENTS.map((c) => (
              <div key={c} style={{ flex: 1, background: c }} />
            ))}
          </div>

          <div
            style={{
              padding: '72px 64px 68px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 66,
                height: 66,
                marginBottom: 26,
                borderRadius: 18,
                background: 'linear-gradient(135deg,rgba(0,214,143,.18),rgba(6,182,212,.10))',
                border: '1px solid var(--eb-border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--green)',
              }}
            >
              <ScrollText size={28} strokeWidth={1.6} />
            </div>

            <GhostPlan />

            <h2
              style={{
                margin: '0 0 12px',
                fontSize: 20,
                fontWeight: 600,
                letterSpacing: '-.02em',
                color: 'var(--eb-text)',
              }}
            >
              No trading plan yet
            </h2>
            <p
              style={{
                margin: '0 0 26px',
                maxWidth: 460,
                fontSize: 13.5,
                lineHeight: 1.7,
                color: 'var(--eb-muted)',
              }}
            >
              A plan is the document your trades are graded against — scope, timeframes, location,
              risk limits, and the checklist you run before every entry. Once it exists, Edgebook
              can score adherence and let the tilt engine enforce the hard rules.
            </p>

            <Link
              href="/plans/new"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 16px',
                borderRadius: 9,
                border: 0,
                background: 'var(--green)',
                color: '#00251a',
                fontSize: 13,
                fontWeight: 600,
                textDecoration: 'none',
                marginBottom: 22,
              }}
            >
              <Plus size={15} />
              Create trading plan
            </Link>

            <div
              style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  border: '1px solid rgba(0,214,143,.30)',
                  background: 'rgba(0,214,143,.08)',
                  color: 'var(--green)',
                  fontFamily: MONO,
                }}
              >
                0 plans
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted-2)',
                }}
              >
                Version-stamped
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted-2)',
                }}
              >
                Hard rules enforced by the tilt engine
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── what a plan covers ── */}
      <h3
        style={{
          margin: '0 0 12px',
          fontSize: 10.5,
          fontWeight: 600,
          letterSpacing: '.12em',
          textTransform: 'uppercase',
          color: 'var(--eb-muted)',
        }}
      >
        What a plan covers
      </h3>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))',
          gap: 12,
        }}
      >
        {COVERAGE.map(({ Icon, accent, title, body }) => (
          <div
            key={title}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderLeft: `3px solid ${accent}`,
              borderRadius: '0 12px 12px 0',
              padding: '15px 17px',
              display: 'flex',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: 9,
                background: `${accent}1f`,
                border: `1px solid ${accent}3d`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: accent,
                flexShrink: 0,
              }}
            >
              <Icon size={15} strokeWidth={1.8} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--eb-text)',
                  marginBottom: 4,
                }}
              >
                {title}
              </div>
              <div style={{ fontSize: 12.5, lineHeight: 1.6, color: 'var(--eb-muted)' }}>
                {body}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
