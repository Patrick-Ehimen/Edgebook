'use client';

import type { PlanCheckItem, PlanField, PlanFieldValue } from '@/features/plans/schemas';
import type { Playbook } from '@/features/playbooks/schemas';
import { Download, ExternalLink, Plus, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const MONO = '"JetBrains Mono",monospace';

const inputBase: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 8,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-input)',
  color: 'var(--eb-text)',
  fontSize: 13,
  fontFamily: 'inherit',
  lineHeight: 1.55,
  outline: 'none',
};

function focusRing(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--green)';
}
function blurRing(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = 'var(--eb-border)';
}

const ghostBtn: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  padding: '5px 9px',
  borderRadius: 7,
  border: '1px dashed var(--eb-border)',
  background: 'transparent',
  color: 'var(--eb-muted)',
  fontSize: 11.5,
  fontFamily: 'inherit',
  cursor: 'pointer',
};

const iconBtn: React.CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 6,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-muted)',
  cursor: 'pointer',
  flexShrink: 0,
};

// ── per-type value coercion ───────────────────────────────────────────────────

const asString = (v: PlanFieldValue | undefined) => (typeof v === 'string' ? v : '');

const asTags = (v: PlanFieldValue | undefined): string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string') ? (v as string[]) : [];

const asRows = (v: PlanFieldValue | undefined): string[][] =>
  Array.isArray(v) && v.every((r) => Array.isArray(r) && r.every((c) => typeof c === 'string'))
    ? (v as string[][])
    : [];

const asItems = (v: PlanFieldValue | undefined): PlanCheckItem[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'object' && x !== null && 'label' in x)
    ? (v as PlanCheckItem[])
    : [];

// ── sub-editors ───────────────────────────────────────────────────────────────

function TagsEditor({
  value,
  suggestions,
  onChange,
}: { value: string[]; suggestions: string[] | undefined; onChange: (v: string[]) => void }) {
  const [draft, setDraft] = useState('');

  const add = (tag: string) => {
    const t = tag.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setDraft('');
  };

  const unused = (suggestions ?? []).filter((s) => !value.includes(s));

  return (
    <div>
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: value.length ? 8 : 0 }}
      >
        {value.map((tag) => (
          <span
            key={tag}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '3px 6px 3px 10px',
              borderRadius: 99,
              border: '1px solid rgba(0,214,143,.3)',
              background: 'rgba(0,214,143,.08)',
              color: 'var(--green)',
              fontSize: 12,
            }}
          >
            {tag}
            <button
              type="button"
              aria-label={`Remove ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              style={{
                display: 'grid',
                placeItems: 'center',
                width: 16,
                height: 16,
                borderRadius: 99,
                border: 0,
                background: 'transparent',
                color: 'inherit',
                cursor: 'pointer',
                opacity: 0.7,
              }}
            >
              <X size={11} />
            </button>
          </span>
        ))}
      </div>

      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(draft);
          }
        }}
        onBlur={(e) => {
          blurRing(e);
          add(draft);
        }}
        onFocus={focusRing}
        placeholder="Type and press Enter…"
        style={inputBase}
      />

      {unused.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              style={{
                ...ghostBtn,
                padding: '2px 8px',
                borderRadius: 99,
                borderStyle: 'solid',
              }}
            >
              <Plus size={10} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function TableEditor({
  columns,
  rows,
  onChange,
}: { columns: string[]; rows: string[][]; onChange: (v: string[][]) => void }) {
  const setCell = (r: number, c: number, next: string) =>
    onChange(
      rows.map((row, ri) => (ri === r ? row.map((cell, ci) => (ci === c ? next : cell)) : row)),
    );

  return (
    <div>
      <div style={{ overflowX: 'auto' }}>
        <div style={{ minWidth: columns.length * 130 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `${columns.map(() => '1fr').join(' ')} 28px`,
              gap: 6,
              marginBottom: 6,
            }}
          >
            {columns.map((c) => (
              <div
                key={c}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '.1em',
                  textTransform: 'uppercase',
                  color: 'var(--eb-muted)',
                  paddingLeft: 2,
                }}
              >
                {c}
              </div>
            ))}
            <div />
          </div>

          {rows.map((row, ri) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: rows are positional; inputs are fully controlled by row[ci]
              key={ri}
              style={{
                display: 'grid',
                gridTemplateColumns: `${columns.map(() => '1fr').join(' ')} 28px`,
                gap: 6,
                marginBottom: 6,
                alignItems: 'center',
              }}
            >
              {columns.map((c, ci) => (
                <input
                  key={c}
                  value={row[ci] ?? ''}
                  onChange={(e) => setCell(ri, ci, e.target.value)}
                  onFocus={focusRing}
                  onBlur={blurRing}
                  style={{ ...inputBase, padding: '6px 9px', fontSize: 12.5 }}
                />
              ))}
              <button
                type="button"
                aria-label="Remove row"
                onClick={() => onChange(rows.filter((_, i) => i !== ri))}
                style={iconBtn}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onChange([...rows, columns.map(() => '')])}
        style={{ ...ghostBtn, marginTop: 2 }}
      >
        <Plus size={11} />
        Add row
      </button>
    </div>
  );
}

function ChecklistEditor({
  items,
  onChange,
}: { items: PlanCheckItem[]; onChange: (v: PlanCheckItem[]) => void }) {
  const update = (id: string, patch: Partial<PlanCheckItem>) =>
    onChange(items.map((it) => (it.id === id ? { ...it, ...patch } : it)));

  return (
    <div>
      {items.map((item) => (
        <div
          key={item.id}
          style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}
        >
          <input
            value={item.label}
            onChange={(e) => update(item.id, { label: e.target.value })}
            onFocus={focusRing}
            onBlur={blurRing}
            placeholder="Checklist line…"
            style={{ ...inputBase, padding: '6px 9px', fontSize: 12.5 }}
          />
          <button
            type="button"
            onClick={() => update(item.id, { hard: !item.hard })}
            title={
              item.hard
                ? 'Hard veto — click to soften'
                : 'Soft check — click to make it a hard veto'
            }
            style={{
              padding: '4px 9px',
              borderRadius: 6,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '.08em',
              fontFamily: MONO,
              cursor: 'pointer',
              flexShrink: 0,
              border: `1px solid ${item.hard ? 'rgba(255,91,108,.45)' : 'var(--eb-border)'}`,
              background: item.hard ? 'rgba(255,91,108,.1)' : 'var(--eb-panel-2)',
              color: item.hard ? 'var(--eb-red)' : 'var(--eb-muted)',
            }}
          >
            HARD
          </button>
          <button
            type="button"
            aria-label="Remove line"
            onClick={() => onChange(items.filter((i) => i.id !== item.id))}
            style={iconBtn}
          >
            <X size={12} />
          </button>
        </div>
      ))}

      <button
        type="button"
        onClick={() =>
          onChange([
            ...items,
            { id: `i${Date.now().toString(36)}${items.length}`, label: '', hard: false },
          ])
        }
        style={{ ...ghostBtn, marginTop: 2 }}
      >
        <Plus size={11} />
        Add line
      </button>
    </div>
  );
}

function PlaybookPicker({
  value,
  playbooks,
  onChange,
  onPrefill,
}: {
  value: string;
  playbooks: Playbook[];
  onChange: (v: string) => void;
  onPrefill: (playbook: Playbook) => void;
}) {
  const selected = playbooks.find((p) => p.id === value);

  if (playbooks.length === 0) {
    return (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 8,
          border: '1px dashed var(--eb-border)',
          background: 'var(--eb-panel-2)',
          color: 'var(--eb-muted)',
          fontSize: 12,
        }}
      >
        No playbooks yet.{' '}
        <Link href="/playbooks" style={{ color: 'var(--green)' }}>
          Create one
        </Link>{' '}
        and it will be selectable here.
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusRing}
          onBlur={blurRing}
          style={{ ...inputBase, flex: 1, minWidth: 220, cursor: 'pointer' }}
        >
          <option value="">— not linked —</option>
          {playbooks.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.status})
            </option>
          ))}
        </select>

        {selected && (
          <>
            <button
              type="button"
              onClick={() => onPrefill(selected)}
              title="Copy this playbook's name, thesis, entry, exit and invalidation into the fields below"
              style={{ ...ghostBtn, borderStyle: 'solid', padding: '7px 11px' }}
            >
              <Download size={12} />
              Fill from playbook
            </button>
            <Link
              href={`/playbooks/${selected.id}`}
              title="Open the playbook"
              style={{
                ...ghostBtn,
                borderStyle: 'solid',
                padding: '7px 11px',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={12} />
              Open
            </Link>
          </>
        )}
      </div>

      {selected && (
        <div
          style={{
            marginTop: 8,
            padding: '9px 12px',
            borderRadius: 8,
            border: '1px solid rgba(0,214,143,.28)',
            background: 'rgba(0,214,143,.06)',
            fontSize: 12,
            color: 'var(--eb-muted-2)',
            lineHeight: 1.55,
          }}
        >
          <b style={{ color: 'var(--eb-text)' }}>{selected.name}</b>
          {selected.thesis ? ` — ${selected.thesis}` : ''}
          <span style={{ color: 'var(--eb-muted)' }}>
            {' '}
            · {selected._count.positions} trade{selected._count.positions === 1 ? '' : 's'} tagged
          </span>
        </div>
      )}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function PlanFieldInput({
  field,
  value,
  onChange,
  playbooks,
  onPrefillFromPlaybook,
}: {
  field: PlanField;
  value: PlanFieldValue | undefined;
  onChange: (v: PlanFieldValue) => void;
  /** Supplied by the form for `playbook` fields; ignored by every other type. */
  playbooks?: Playbook[];
  onPrefillFromPlaybook?: (playbook: Playbook) => void;
}) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        htmlFor={field.id}
        style={{
          display: 'block',
          fontSize: 12.5,
          fontWeight: 600,
          color: 'var(--eb-text)',
          marginBottom: field.help ? 3 : 6,
        }}
      >
        {field.label}
        {field.rulesKey && (
          <span
            title="Enforced — the tilt engine reads this value"
            style={{
              marginLeft: 7,
              fontSize: 9.5,
              fontWeight: 700,
              letterSpacing: '.08em',
              padding: '1px 5px',
              borderRadius: 5,
              background: 'rgba(0,214,143,.1)',
              border: '1px solid rgba(0,214,143,.3)',
              color: 'var(--green)',
              fontFamily: MONO,
            }}
          >
            ENFORCED
          </span>
        )}
      </label>

      {field.help && (
        <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginBottom: 7, lineHeight: 1.5 }}>
          {field.help}
        </div>
      )}

      {field.type === 'textarea' && (
        <textarea
          id={field.id}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusRing}
          onBlur={blurRing}
          placeholder={field.placeholder}
          rows={4}
          style={{ ...inputBase, resize: 'vertical', minHeight: 84 }}
        />
      )}

      {field.type === 'text' && (
        <input
          id={field.id}
          value={asString(value)}
          onChange={(e) => onChange(e.target.value)}
          onFocus={focusRing}
          onBlur={blurRing}
          placeholder={field.placeholder}
          style={inputBase}
        />
      )}

      {field.type === 'number' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, maxWidth: 220 }}>
          <input
            id={field.id}
            value={asString(value)}
            onChange={(e) => onChange(e.target.value)}
            onFocus={focusRing}
            onBlur={blurRing}
            placeholder={field.placeholder}
            inputMode="decimal"
            style={{ ...inputBase, fontFamily: MONO }}
          />
          {field.unit && (
            <span style={{ fontSize: 12.5, color: 'var(--eb-muted)', flexShrink: 0 }}>
              {field.unit}
            </span>
          )}
        </div>
      )}

      {field.type === 'tags' && (
        <TagsEditor value={asTags(value)} suggestions={field.suggestions} onChange={onChange} />
      )}

      {field.type === 'table' && (
        <TableEditor columns={field.columns ?? []} rows={asRows(value)} onChange={onChange} />
      )}

      {field.type === 'checklist' && <ChecklistEditor items={asItems(value)} onChange={onChange} />}

      {field.type === 'playbook' && (
        <PlaybookPicker
          value={asString(value)}
          playbooks={playbooks ?? []}
          onChange={onChange}
          onPrefill={(p) => onPrefillFromPlaybook?.(p)}
        />
      )}
    </div>
  );
}
