'use client';

import { usePlan } from '@/features/plans';
import {
  PLAN_TEMPLATE,
  type PlanCheckItem,
  type PlanField,
  type PlanFieldValue,
} from '@/features/plans/schemas';
import { usePlaybooks } from '@/features/playbooks';
import type { Playbook } from '@/features/playbooks/schemas';
import { ArrowLeft, ExternalLink, Pencil, ScrollText, Target } from 'lucide-react';
import Link from 'next/link';

const MONO = '"JetBrains Mono",monospace';

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 14,
  padding: '20px 22px',
  marginBottom: 14,
};

/** Headline numbers pulled from the enforceable rules object. */
const HERO_RULES: { key: string; label: string; unit: string; tone?: string }[] = [
  { key: 'riskPctPerTrade', label: 'Risk / trade', unit: '%' },
  { key: 'dailyLossLimitPct', label: 'Daily loss limit', unit: '%', tone: 'var(--eb-red)' },
  { key: 'minRRIntraday', label: 'Min R:R (intraday)', unit: ': 1', tone: 'var(--green)' },
  { key: 'leverageCeiling', label: 'Leverage ceiling', unit: 'x' },
];

function isFilled(v: PlanFieldValue | undefined): boolean {
  if (v === undefined) return false;
  if (typeof v === 'string') return v.trim() !== '';
  if (!Array.isArray(v) || v.length === 0) return false;
  return v.some((entry) => {
    if (typeof entry === 'string') return entry.trim() !== '';
    if (Array.isArray(entry)) return entry.some((cell) => cell.trim() !== '');
    return entry.label.trim() !== '';
  });
}

function FieldValue({
  field,
  value,
  playbooks,
}: { field: PlanField; value: PlanFieldValue; playbooks: Playbook[] }) {
  // A `playbook` field stores an id — resolve it against the live record so the
  // plan always shows the playbook's current name and status, never a stale copy.
  if (field.type === 'playbook') {
    const id = typeof value === 'string' ? value : '';
    const pb = playbooks.find((p) => p.id === id);
    if (!pb) {
      return (
        <div style={{ fontSize: 12.5, color: 'var(--eb-muted)' }}>
          Linked playbook no longer exists.
        </div>
      );
    }
    return (
      <Link
        href={`/playbooks/${pb.id}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 9,
          padding: '8px 12px',
          borderRadius: 9,
          border: '1px solid rgba(0,214,143,.28)',
          background: 'rgba(0,214,143,.06)',
          textDecoration: 'none',
          maxWidth: '100%',
        }}
      >
        <Target size={14} style={{ color: 'var(--green)', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>{pb.name}</span>
        <span
          style={{
            fontSize: 10.5,
            padding: '1px 7px',
            borderRadius: 99,
            background: 'var(--eb-panel-2)',
            color: 'var(--eb-muted-2)',
            textTransform: 'capitalize',
          }}
        >
          {pb.status}
        </span>
        <span style={{ fontSize: 11, color: 'var(--eb-muted)', fontFamily: MONO }}>
          {pb._count.positions} trade{pb._count.positions === 1 ? '' : 's'}
        </span>
        <ExternalLink size={12} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
      </Link>
    );
  }

  if (field.type === 'tags' && Array.isArray(value)) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {(value as string[]).map((tag) => (
          <span
            key={tag}
            style={{
              padding: '2px 9px',
              borderRadius: 99,
              border: '1px solid rgba(0,214,143,.3)',
              background: 'rgba(0,214,143,.08)',
              color: 'var(--green)',
              fontSize: 12,
            }}
          >
            {tag}
          </span>
        ))}
      </div>
    );
  }

  if (field.type === 'table' && Array.isArray(value)) {
    const rows = value as string[][];
    const columns = field.columns ?? [];
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, minWidth: 360 }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  style={{
                    textAlign: 'left',
                    padding: '6px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 10,
                    fontWeight: 600,
                    letterSpacing: '.1em',
                    textTransform: 'uppercase',
                    color: 'var(--eb-muted)',
                  }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={`${ri}:${row.join('|')}`}>
                {columns.map((c, ci) => (
                  <td
                    key={c}
                    style={{
                      padding: '8px 10px',
                      borderBottom: '1px solid var(--eb-border)',
                      color: 'var(--eb-text)',
                    }}
                  >
                    {row[ci] ?? ''}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (field.type === 'checklist' && Array.isArray(value)) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {(value as PlanCheckItem[]).map((item) => (
          <div
            key={item.id}
            style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12.5 }}
          >
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 4,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                flexShrink: 0,
              }}
            />
            <span style={{ color: 'var(--eb-text)', flex: 1 }}>{item.label}</span>
            {item.hard && (
              <span
                style={{
                  fontSize: 9.5,
                  fontWeight: 700,
                  letterSpacing: '.08em',
                  fontFamily: MONO,
                  padding: '1px 6px',
                  borderRadius: 5,
                  border: '1px solid rgba(255,91,108,.45)',
                  background: 'rgba(255,91,108,.1)',
                  color: 'var(--eb-red)',
                  flexShrink: 0,
                }}
              >
                HARD
              </span>
            )}
          </div>
        ))}
      </div>
    );
  }

  const text = typeof value === 'string' ? value : '';
  return (
    <div
      style={{
        fontSize: 13,
        color: 'var(--eb-text)',
        lineHeight: 1.65,
        whiteSpace: 'pre-wrap',
        fontFamily: field.type === 'number' ? MONO : 'inherit',
      }}
    >
      {text}
      {field.type === 'number' && field.unit ? (
        <span style={{ color: 'var(--eb-muted)' }}> {field.unit}</span>
      ) : null}
    </div>
  );
}

export function PlanDetailClient({ planId }: { planId: string }) {
  const { data: plan, isLoading, isError } = usePlan(planId);
  const { data: playbooks } = usePlaybooks();

  if (isLoading) {
    return (
      <div
        style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}
      >
        <div style={{ ...panel, color: 'var(--eb-muted)', fontSize: 13 }}>Loading plan…</div>
      </div>
    );
  }

  if (isError || !plan) {
    return (
      <div
        style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}
      >
        <div style={{ ...panel, color: 'var(--eb-muted)', fontSize: 13 }}>
          That plan could not be found. <Link href="/plans">Back to plans</Link>
        </div>
      </div>
    );
  }

  const values = plan.valuesJson as Record<string, PlanFieldValue>;
  const rules = plan.rulesJson as Record<string, string | undefined>;

  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <Link
          href="/plans"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12.5,
            color: 'var(--eb-muted)',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={14} />
          Plans
        </Link>

        <div style={{ flex: 1 }} />

        <Link
          href={`/plans/${plan.id}/edit`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 7,
            padding: '7px 13px',
            borderRadius: 8,
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel)',
            color: 'var(--eb-text)',
            fontSize: 12.5,
            fontWeight: 500,
            textDecoration: 'none',
          }}
        >
          <Pencil size={13} />
          Edit plan
        </Link>
      </div>

      {/* ── hero ── */}
      <div style={{ ...panel, padding: '22px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 14,
              background: 'linear-gradient(135deg,rgba(0,214,143,.18),rgba(6,182,212,.10))',
              border: '1px solid var(--eb-border)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--green)',
              flexShrink: 0,
            }}
          >
            <ScrollText size={26} strokeWidth={1.6} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h1
              style={{
                margin: '0 0 6px',
                fontSize: 22,
                fontWeight: 700,
                letterSpacing: '-.02em',
                color: 'var(--eb-text)',
              }}
            >
              {plan.name}
            </h1>
            {plan.method && (
              <div style={{ fontSize: 13, color: 'var(--eb-muted-2)', maxWidth: 640 }}>
                {plan.method}
              </div>
            )}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
              {plan.owner && (
                <span
                  style={{
                    fontSize: 11.5,
                    padding: '2px 9px',
                    borderRadius: 99,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    color: 'var(--eb-muted-2)',
                  }}
                >
                  Owner · {plan.owner}
                </span>
              )}
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  color: 'var(--eb-muted-2)',
                  fontFamily: MONO,
                }}
              >
                v{plan.version}
              </span>
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  background: 'rgba(0,214,143,.08)',
                  border: '1px solid rgba(0,214,143,.3)',
                  color: 'var(--green)',
                  textTransform: 'capitalize',
                }}
              >
                {plan.status}
              </span>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))',
            gap: 12,
            marginTop: 20,
          }}
        >
          {HERO_RULES.map(({ key, label, unit, tone }) => (
            <div
              key={key}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 10,
                padding: '11px 14px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--eb-muted)',
                  marginBottom: 4,
                }}
              >
                {label}
              </div>
              <div
                style={{
                  fontSize: 19,
                  fontWeight: 700,
                  fontFamily: MONO,
                  color: rules[key] ? (tone ?? 'var(--eb-text)') : 'var(--eb-muted)',
                }}
              >
                {rules[key] ?? '—'}
                {rules[key] && (
                  <span style={{ fontSize: 12, color: 'var(--eb-muted)', marginLeft: 3 }}>
                    {unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── sections ── */}
      {PLAN_TEMPLATE.map((section) => {
        const answered = section.subsections
          .flatMap((s) => s.fields)
          .filter((f) => isFilled(values[f.id]));
        if (answered.length === 0) return null;

        return (
          <section key={section.key} style={panel}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted-2)',
                  fontSize: 11,
                  fontWeight: 700,
                  fontFamily: MONO,
                  flexShrink: 0,
                }}
              >
                {section.number}
              </span>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--eb-text)' }}>
                {section.title}
              </h2>
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--eb-muted)',
                }}
              >
                {section.governs}
              </span>
            </div>

            {section.subsections.map((sub) => {
              const subFields = sub.fields.filter((f) => isFilled(values[f.id]));
              if (subFields.length === 0) return null;
              return (
                <div key={sub.key} style={{ marginBottom: 18 }}>
                  <h3
                    style={{
                      margin: '0 0 10px',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--eb-muted-2)',
                    }}
                  >
                    {sub.title}
                  </h3>
                  {subFields.map((field) => (
                    <div key={field.id} style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: 'var(--eb-muted)',
                          marginBottom: 4,
                        }}
                      >
                        {field.label}
                      </div>
                      <FieldValue
                        field={field}
                        value={values[field.id] as PlanFieldValue}
                        playbooks={playbooks ?? []}
                      />
                    </div>
                  ))}
                </div>
              );
            })}
          </section>
        );
      })}
    </div>
  );
}
