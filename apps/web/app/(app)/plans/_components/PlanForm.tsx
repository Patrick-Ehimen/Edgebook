'use client';

import { useCreatePlan, useUpdatePlan } from '@/features/plans';
import {
  PLAN_RULE_FIELDS,
  PLAN_TEMPLATE,
  PLAYBOOK_PREFILL,
  type Plan,
  type PlanCheckItem,
  type PlanFieldValue,
} from '@/features/plans/schemas';
import { usePlaybooks } from '@/features/playbooks';
import type { Playbook } from '@/features/playbooks/schemas';
import { ArrowLeft, Check, Loader2, Save } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { PlanFieldInput } from './PlanFieldInput';

const MONO = '"JetBrains Mono",monospace';

const STATUSES = ['draft', 'active', 'archived'] as const;

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 14,
  padding: '20px 22px',
  marginBottom: 14,
};

const metaInput: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-input)',
  color: 'var(--eb-text)',
  fontSize: 13,
  fontFamily: 'inherit',
  outline: 'none',
};

const metaLabel: React.CSSProperties = {
  display: 'block',
  fontSize: 12.5,
  fontWeight: 600,
  color: 'var(--eb-text)',
  marginBottom: 6,
};

/** Seed the form from the template — table rows and checklist lines start filled in. */
function seedValues(): Record<string, PlanFieldValue> {
  const out: Record<string, PlanFieldValue> = {};
  for (const section of PLAN_TEMPLATE) {
    for (const sub of section.subsections) {
      for (const field of sub.fields) {
        if (field.type === 'table' && field.seedRows) {
          out[field.id] = field.seedRows.map((r) => [...r]);
        } else if (field.type === 'checklist' && field.seedItems) {
          out[field.id] = field.seedItems.map(
            (it, i): PlanCheckItem => ({
              id: `${field.id}-${i}`,
              label: it.label,
              hard: it.hard ?? false,
            }),
          );
        }
      }
    }
  }
  return out;
}

/** A field counts as answered once it holds any non-blank content. */
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

/**
 * Editing an existing plan starts from the template seeds and overlays the saved
 * answers, so sections added to the template *after* the plan was written still
 * appear with their starter rows rather than blank.
 */
function initialValues(plan: Plan | undefined): Record<string, PlanFieldValue> {
  const seeded = seedValues();
  if (!plan) return seeded;
  return { ...seeded, ...(plan.valuesJson as Record<string, PlanFieldValue>) };
}

export function PlanForm({ plan }: { plan?: Plan }) {
  const router = useRouter();
  const isEdit = plan !== undefined;

  const { data: playbooks } = usePlaybooks();
  const createPlan = useCreatePlan();
  const updatePlan = useUpdatePlan(plan?.id ?? '');
  const isSaving = createPlan.isPending || updatePlan.isPending;

  const [name, setName] = useState(plan?.name ?? '');
  const [owner, setOwner] = useState(plan?.owner ?? '');
  const [method, setMethod] = useState(plan?.method ?? '');
  const [version, setVersion] = useState(plan?.version ?? '1.0');
  const [status, setStatus] = useState<(typeof STATUSES)[number]>(plan?.status ?? 'draft');
  const [values, setValues] = useState<Record<string, PlanFieldValue>>(() => initialValues(plan));
  const [activeKey, setActiveKey] = useState(PLAN_TEMPLATE[0]?.key ?? '');
  const [error, setError] = useState<string | null>(null);

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // Highlight the rail entry for whichever section is nearest the top of the viewport.
  useEffect(() => {
    const onScroll = () => {
      let best = '';
      let bestTop = Number.NEGATIVE_INFINITY;
      for (const [key, el] of Object.entries(sectionRefs.current)) {
        if (!el) continue;
        const top = el.getBoundingClientRect().top - 120;
        if (top <= 0 && top > bestTop) {
          bestTop = top;
          best = key;
        }
      }
      if (best) setActiveKey(best);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const setField = (id: string, v: PlanFieldValue) => setValues((prev) => ({ ...prev, [id]: v }));

  /**
   * Copy a linked playbook's content into the §9 slot it belongs to. Only blank
   * fields are written — anything already typed here is the author's own wording
   * and is left alone.
   */
  const prefillFromPlaybook = (refFieldId: string, playbook: Playbook) => {
    const slot = refFieldId.split('.')[1];
    if (!slot) return;
    const criteria = playbook.criteriaJson as Record<string, unknown>;

    setValues((prev) => {
      const next = { ...prev };
      for (const { source, fieldSuffix } of PLAYBOOK_PREFILL) {
        const raw =
          source === 'name'
            ? playbook.name
            : source === 'thesis'
              ? playbook.thesis
              : criteria[source];
        if (typeof raw !== 'string' || raw.trim() === '') continue;

        const targetId = `pb.${slot}.${fieldSuffix}`;
        if (isFilled(next[targetId])) continue;
        next[targetId] = raw;
      }
      return next;
    });
  };

  const progress = useMemo(() => {
    const perSection = PLAN_TEMPLATE.map((section) => {
      const fields = section.subsections.flatMap((s) => s.fields);
      const done = fields.filter((f) => isFilled(values[f.id])).length;
      return { key: section.key, done, total: fields.length };
    });
    const done = perSection.reduce((n, s) => n + s.done, 0);
    const total = perSection.reduce((n, s) => n + s.total, 0);
    return { perSection, done, total };
  }, [values]);

  const jump = (key: string) => {
    sectionRefs.current[key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActiveKey(key);
  };

  const save = async () => {
    setError(null);
    if (!name.trim()) {
      setError('Give the plan a name before saving.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Drop blank answers so a mostly-empty plan doesn't store noise.
    const valuesJson: Record<string, PlanFieldValue> = {};
    for (const [id, v] of Object.entries(values)) {
      if (isFilled(v)) valuesJson[id] = v;
    }

    // Mirror the enforceable numbers into the typed rules object. Anything that
    // isn't a clean positive decimal is left out rather than failing the save.
    const rulesJson: Record<string, string> = {};
    for (const field of PLAN_RULE_FIELDS) {
      const raw = values[field.id];
      if (typeof raw === 'string' && /^\d+(\.\d+)?$/.test(raw.trim())) {
        rulesJson[field.rulesKey] = raw.trim();
      }
    }

    const body = {
      name: name.trim(),
      owner: owner.trim(),
      method: method.trim(),
      version: version.trim() || '1.0',
      status,
      valuesJson,
      rulesJson,
    };

    try {
      if (isEdit) {
        await updatePlan.mutateAsync(body);
        router.push(`/plans/${plan.id}`);
      } else {
        const created = await createPlan.mutateAsync(body);
        router.push(`/plans/${created.id}`);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not save the plan.');
    }
  };

  const cancelHref = isEdit ? `/plans/${plan.id}` : '/plans';

  const saveButton = (big = false) => (
    <button
      type="button"
      onClick={save}
      disabled={isSaving}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 7,
        padding: big ? '9px 16px' : '8px 15px',
        borderRadius: 8,
        border: 0,
        background: 'var(--green)',
        color: '#00251a',
        fontSize: 12.5,
        fontWeight: 600,
        fontFamily: 'inherit',
        cursor: isSaving ? 'wait' : 'pointer',
        opacity: isSaving ? 0.7 : 1,
      }}
    >
      {isSaving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {isEdit ? 'Save changes' : 'Save plan'}
    </button>
  );

  return (
    <div style={{ padding: '22px 26px 80px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      {/* ── top bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: 18,
          position: 'sticky',
          top: 0,
          zIndex: 5,
          padding: '10px 0',
          background: 'var(--eb-bg)',
        }}
      >
        <Link
          href={cancelHref}
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
          {isEdit ? plan.name : 'Plans'}
        </Link>

        <span style={{ color: 'var(--eb-border)' }}>/</span>
        <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>
          {isEdit ? 'Edit' : 'New plan'}
        </span>

        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 11.5, color: 'var(--eb-muted)', fontFamily: MONO }}>
          {progress.done}/{progress.total} fields
        </span>

        {saveButton()}
      </div>

      {error && (
        <div
          style={{
            ...panel,
            padding: '11px 15px',
            borderColor: 'rgba(255,91,108,.4)',
            background: 'rgba(255,91,108,.08)',
            color: 'var(--eb-red)',
            fontSize: 12.5,
          }}
        >
          {error}
        </div>
      )}

      {/* ── plan meta ── */}
      <div style={panel}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 110px 100px',
            gap: 12,
            marginBottom: 12,
          }}
        >
          <div>
            <label htmlFor="plan-name" style={metaLabel}>
              Plan name
            </label>
            <input
              id="plan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Crypto Confluence Trading Plan"
              style={metaInput}
            />
          </div>
          <div>
            <label htmlFor="plan-owner" style={metaLabel}>
              Owner
            </label>
            <input
              id="plan-owner"
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              placeholder="Your handle"
              style={metaInput}
            />
          </div>
          <div>
            <label htmlFor="plan-status" style={metaLabel}>
              Status
            </label>
            <select
              id="plan-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as (typeof STATUSES)[number])}
              style={{ ...metaInput, textTransform: 'capitalize', cursor: 'pointer' }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="plan-version" style={metaLabel}>
              Version
            </label>
            <input
              id="plan-version"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              style={{ ...metaInput, fontFamily: MONO }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="plan-method" style={metaLabel}>
            Method
          </label>
          <input
            id="plan-method"
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            placeholder="One line — what this method is built on."
            style={metaInput}
          />
        </div>
      </div>

      {/* ── rail + sections ── */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 22, alignItems: 'start' }}
      >
        <aside
          style={{
            position: 'sticky',
            top: 64,
            paddingRight: 10,
            borderRight: '1px solid var(--eb-border)',
            maxHeight: 'calc(100vh - 90px)',
            overflowY: 'auto',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '.12em',
              textTransform: 'uppercase',
              color: 'var(--eb-muted)',
              margin: '0 0 9px 8px',
            }}
          >
            Sections
          </div>

          {PLAN_TEMPLATE.map((section) => {
            const p = progress.perSection.find((s) => s.key === section.key);
            const complete = p && p.total > 0 && p.done === p.total;
            const active = activeKey === section.key;
            return (
              <button
                key={section.key}
                type="button"
                onClick={() => jump(section.key)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  width: '100%',
                  textAlign: 'left',
                  padding: '6px 9px',
                  marginBottom: 1,
                  borderRadius: 6,
                  border: 0,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: 12,
                  background: active ? 'var(--eb-nav-active)' : 'transparent',
                  color: active ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                }}
              >
                <span
                  style={{ fontFamily: MONO, fontSize: 10.5, color: 'var(--eb-muted)', width: 14 }}
                >
                  {section.number}
                </span>
                <span
                  style={{
                    flex: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {section.title}
                </span>
                {complete ? (
                  <Check size={11} style={{ color: 'var(--green)', flexShrink: 0 }} />
                ) : (
                  <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--eb-muted)' }}>
                    {p?.done ?? 0}/{p?.total ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        <div>
          {PLAN_TEMPLATE.map((section) => (
            <section
              key={section.key}
              ref={(el) => {
                sectionRefs.current[section.key] = el;
              }}
              style={{ ...panel, scrollMarginTop: 70 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
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
                <h2
                  style={{
                    margin: 0,
                    fontSize: 15,
                    fontWeight: 700,
                    letterSpacing: '-.01em',
                    color: 'var(--eb-text)',
                  }}
                >
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

              {section.intro && (
                <p
                  style={{
                    margin: '0 0 16px',
                    fontSize: 12.5,
                    color: 'var(--eb-muted)',
                    lineHeight: 1.6,
                    maxWidth: 720,
                  }}
                >
                  {section.intro}
                </p>
              )}

              {section.subsections.map((sub, i) => (
                <div
                  key={sub.key}
                  style={{
                    paddingTop: i === 0 ? 8 : 16,
                    marginTop: i === 0 ? 0 : 4,
                    borderTop: i === 0 ? 'none' : '1px solid var(--eb-border)',
                  }}
                >
                  <h3
                    style={{
                      margin: '0 0 3px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--eb-text)',
                    }}
                  >
                    {sub.title}
                  </h3>
                  {sub.intro && (
                    <p
                      style={{
                        margin: '0 0 12px',
                        fontSize: 12,
                        color: 'var(--eb-muted)',
                        lineHeight: 1.55,
                        maxWidth: 720,
                      }}
                    >
                      {sub.intro}
                    </p>
                  )}
                  <div style={{ marginTop: sub.intro ? 0 : 10 }}>
                    {sub.fields.map((field) => (
                      <PlanFieldInput
                        key={field.id}
                        field={field}
                        value={values[field.id]}
                        onChange={(v) => setField(field.id, v)}
                        playbooks={playbooks ?? []}
                        onPrefillFromPlaybook={(pb) => prefillFromPlaybook(field.id, pb)}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </section>
          ))}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <Link
              href={cancelHref}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '9px 15px',
                borderRadius: 8,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel)',
                color: 'var(--eb-muted-2)',
                fontSize: 12.5,
                textDecoration: 'none',
              }}
            >
              Cancel
            </Link>
            {saveButton(true)}
          </div>
        </div>
      </div>
    </div>
  );
}
