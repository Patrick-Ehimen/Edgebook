'use client';

import { GripVertical, Paperclip, Sparkles, Target, X } from 'lucide-react';
import { useId, useState } from 'react';
import { toast } from 'sonner';
import { useCreatePlaybook } from '../hooks/useCreatePlaybook';
import { useUpdatePlaybook } from '../hooks/useUpdatePlaybook';
import { useUpdateChecklist } from '../hooks/useUpdateChecklist';
import { useUpdatePlaybookImages } from '../hooks/useUpdatePlaybookImages';
import type { ChecklistItem, Playbook } from '../schemas';

// ── shared style tokens (matches HTML prototype) ──────────────────────────────

const INPUT: React.CSSProperties = {
  background: 'var(--eb-input, #0c1119)',
  border: '1px solid var(--eb-border)',
  borderRadius: 8,
  padding: '9px 11px',
  color: 'var(--eb-text)',
  fontFamily: 'inherit',
  fontSize: 13,
  outline: 0,
  width: '100%',
  boxSizing: 'border-box',
  transition: 'border-color .12s',
};

const TEXTAREA: React.CSSProperties = {
  ...INPUT,
  minHeight: 80,
  resize: 'vertical' as React.CSSProperties['resize'],
};

const LABEL: React.CSSProperties = {
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.07em',
  fontWeight: 600,
};

const HELP: React.CSSProperties = {
  fontSize: 11.5,
  color: 'var(--eb-muted)',
};

const HSEC: React.CSSProperties = {
  margin: '0 0 8px',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const SEP: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--eb-border)',
  margin: '14px 0',
};

const CHK_ROW: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '7px 10px',
  border: '1px solid var(--eb-border)',
  borderRadius: 8,
  background: 'var(--eb-input, #0c1119)',
  marginBottom: 6,
};

const CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 5,
  fontSize: 11.5,
  padding: '3px 9px',
  borderRadius: 99,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-muted-2)',
  cursor: 'pointer',
  userSelect: 'none' as React.CSSProperties['userSelect'],
};

const CHIP_ON: React.CSSProperties = {
  ...CHIP,
  background: 'rgba(0,214,143,.14)',
  color: 'var(--green)',
  borderColor: 'rgba(0,214,143,.35)',
};

const PREVIEW: React.CSSProperties = {
  background: 'var(--eb-input, #0c1119)',
  border: '1px dashed var(--eb-border)',
  borderRadius: 9,
  padding: 12,
};

// ── Field wrapper ──────────────────────────────────────────────────────────────

function Field({ label, help, children, style }: { label: string; help?: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 12, ...style }}>
      <label style={LABEL}>{label}</label>
      {children}
      {help && <span style={HELP}>{help}</span>}
    </div>
  );
}

// ── Status segmented ──────────────────────────────────────────────────────────

type Status = 'experimental' | 'active' | 'paused';

const STATUS_COLORS: Record<Status, { bg: string; color: string }> = {
  experimental: { bg: 'rgba(245,165,36,.16)', color: 'var(--yellow, #f5a524)' },
  active:       { bg: 'rgba(0,214,143,.16)',  color: 'var(--green)' },
  paused:       { bg: 'rgba(255,91,108,.16)', color: 'var(--red, #ff5b6c)' },
};

function StatusSeg({ value, onChange }: { value: Status; onChange: (v: Status) => void }) {
  return (
    <div style={{ display: 'inline-flex', background: 'var(--eb-input, #0c1119)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: 3, gap: 2 }}>
      {(['experimental', 'active', 'paused'] as Status[]).map((s) => {
        const active = value === s;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            style={{
              flex: 1,
              background: active ? STATUS_COLORS[s].bg : 'transparent',
              border: 0,
              color: active ? STATUS_COLORS[s].color : 'var(--eb-muted)',
              padding: '6px 12px',
              borderRadius: 6,
              cursor: 'pointer',
              fontSize: 12,
              fontFamily: 'inherit',
              fontWeight: active ? 600 : 400,
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}

// ── Toggle chips ──────────────────────────────────────────────────────────────

function ToggleChips({ options, selected, onChange }: {
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const toggle = (opt: string) => {
    onChange(selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]);
  };
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
      {options.map((opt) => (
        <span key={opt} style={selected.includes(opt) ? CHIP_ON : CHIP} onClick={() => toggle(opt)}>
          {opt}
        </span>
      ))}
    </div>
  );
}

// ── Tag input (shared) ────────────────────────────────────────────────────────

const TAG_ACCENTS = ['#00d68f', '#06b6d4', '#818cf8', '#f5a524', '#fb923c', '#e879f9', '#ff5b6c', '#34d399'];

function TagInput({
  tags,
  onChange,
  placeholder,
  transform = (v) => v,
}: {
  tags: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  transform?: (v: string) => string;
}) {
  const [input, setInput] = useState('');

  const addTag = (raw: string) => {
    const val = transform(raw.trim());
    if (!val || tags.includes(val)) { setInput(''); return; }
    onChange([...tags, val]);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(input);
    } else if (e.key === 'Backspace' && input === '') {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div
      style={{
        display: 'flex', flexWrap: 'wrap', gap: 5, alignItems: 'center',
        background: 'var(--eb-input, #0c1119)',
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        padding: '6px 8px',
        minHeight: 38,
        cursor: 'text',
      }}
      onClick={(e) => (e.currentTarget.querySelector('input') as HTMLInputElement)?.focus()}
    >
      {tags.map((tag, i) => {
        const color = TAG_ACCENTS[i % TAG_ACCENTS.length];
        return (
          <span key={tag} style={{
            display: 'inline-flex', alignItems: 'center', gap: 4,
            padding: '2px 8px', borderRadius: 5,
            fontSize: 11, fontFamily: '"JetBrains Mono",monospace', fontWeight: 600,
            background: `${color}18`, border: `1px solid ${color}40`, color,
          }}>
            {tag}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(tags.filter((_, j) => j !== i)); }}
              style={{ background: 'transparent', border: 0, color, cursor: 'pointer', padding: 0, lineHeight: 1, fontSize: 13, display: 'flex', alignItems: 'center' }}
            >
              ×
            </button>
          </span>
        );
      })}
      <input
        style={{ flex: 1, minWidth: 80, background: 'transparent', border: 0, outline: 0, color: 'var(--eb-text)', fontFamily: 'inherit', fontSize: 13, padding: '1px 2px' }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
        placeholder={tags.length === 0 ? placeholder : ''}
      />
    </div>
  );
}

// ── Checklist builder ─────────────────────────────────────────────────────────

function ChecklistBuilder({ items, onChange }: { items: ChecklistItem[]; onChange: (v: ChecklistItem[]) => void }) {
  const uid = useId();
  const [draft, setDraft] = useState('');
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);

  const commit = () => {
    const label = draft.trim();
    if (!label) return;
    onChange([...items, { id: `${uid}-${Date.now()}`, label, type: 'checkbox', required: false }]);
    setDraft('');
  };

  const onDragStart = (idx: number) => setDragIdx(idx);
  const onDragOver = (e: React.DragEvent, idx: number) => { e.preventDefault(); setOverIdx(idx); };
  const onDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1) as [ChecklistItem];
    next.splice(idx, 0, moved);
    onChange(next);
    setDragIdx(null);
    setOverIdx(null);
  };
  const onDragEnd = () => { setDragIdx(null); setOverIdx(null); };

  return (
    <div>
      {items.map((item, idx) => (
        <div
          key={item.id}
          draggable
          onDragStart={() => onDragStart(idx)}
          onDragOver={(e) => onDragOver(e, idx)}
          onDrop={(e) => onDrop(e, idx)}
          onDragEnd={onDragEnd}
          style={{
            ...CHK_ROW,
            opacity: dragIdx === idx ? 0.35 : 1,
            borderColor: overIdx === idx && dragIdx !== idx ? 'var(--green)' : 'var(--eb-border)',
            transition: 'border-color .1s, opacity .1s',
          }}
        >
          <GripVertical size={13} style={{ color: 'var(--eb-muted)', flexShrink: 0, cursor: 'grab' }} />
          <input
            style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--eb-text)', outline: 0, fontSize: 12.5, fontFamily: 'inherit' }}
            value={item.label}
            onChange={(e) => onChange(items.map((it, i) => i === idx ? { ...it, label: e.target.value } : it))}
          />
          <button
            type="button"
            onClick={() => onChange(items.filter((_, i) => i !== idx))}
            style={{ color: 'var(--eb-muted)', cursor: 'pointer', background: 'transparent', border: 0, fontSize: 14, padding: '2px 6px', lineHeight: 1 }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--red, #ff5b6c)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--eb-muted)'; }}
          >
            ×
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, border: '1px dashed var(--eb-border)', borderRadius: 8, padding: '4px 10px', background: 'var(--eb-input, #0c1119)' }}>
        <span style={{ color: 'var(--eb-muted)', fontSize: 13, flexShrink: 0 }}>+</span>
        <input
          style={{ flex: 1, background: 'transparent', border: 0, color: 'var(--eb-text)', outline: 0, fontSize: 12.5, fontFamily: 'inherit', padding: '3px 0' }}
          placeholder="Type item and press Enter…"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } }}
        />
      </div>
    </div>
  );
}

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  playbook?: Playbook | null;
  prefill?: { name: string; thesis: string; checklistItems: ChecklistItem[] } | null;
}

// ── Main component ────────────────────────────────────────────────────────────

export function PlaybookFormDialog({ open, onOpenChange, playbook, prefill }: Props) {
  const isEdit = !!playbook;
  const criteria = playbook?.criteriaJson as Record<string, unknown> | undefined;

  // Core fields
  const [name, setName]               = useState(prefill?.name ?? playbook?.name ?? '');
  const [status, setStatus]           = useState<Status>((playbook?.status as Status | undefined) ?? 'experimental');
  const [thesis, setThesis]           = useState(prefill?.thesis ?? playbook?.thesis ?? '');
  const [entry, setEntry]             = useState((criteria?.entry as string) ?? '');
  const [exit, setExit]               = useState((criteria?.exit as string) ?? '');
  const [invalidation, setInvalidation] = useState((criteria?.invalidation as string) ?? '');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>(
    prefill?.checklistItems ?? playbook?.checklists[0]?.itemsJson ?? [],
  );

  // Right-column config
  const [sessions, setSessions]     = useState<string[]>(['EU', 'US']);
  const [timeframes, setTimeframes] = useState<string[]>(['5m', '15m']);
  const [symbols, setSymbols]       = useState<string[]>(() => {
    const raw = criteria?.symbols;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
    return [];
  });
  const [riskPct, setRiskPct]       = useState('0.5');
  const [maxTrades, setMaxTrades]   = useState('3');
  const [minRR, setMinRR]           = useState('1 : 2');
  const [minConviction, setMinConviction] = useState('3');
  const [tags, setTags]             = useState<string[]>(() => {
    const raw = criteria?.tags;
    if (Array.isArray(raw)) return raw as string[];
    if (typeof raw === 'string' && raw.trim()) return raw.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
  });

  const [images, setImages] = useState<string[]>(() => (playbook?.images ?? []) as string[]);

  const create = useCreatePlaybook();
  const update = useUpdatePlaybook(playbook?.id ?? '');
  const updateChecklist = useUpdateChecklist(playbook?.id ?? '');
  const updateImages = useUpdatePlaybookImages(playbook?.id ?? '');

  const close = () => onOpenChange(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - images.length;
    const toProcess = files.slice(0, remaining);
    Promise.all(
      toProcess.map(
        (file) =>
          new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Read failed'));
            reader.readAsDataURL(file);
          }),
      ),
    ).then((results) => setImages((prev) => [...prev, ...results]));
    e.target.value = '';
  };

  const handleSubmit = async (asDraft = false) => {
    if (!name.trim() || !thesis.trim()) return;

    const criteriaJson: Record<string, unknown> = {};
    if (entry.trim())      criteriaJson.entry = entry.trim();
    if (exit.trim())       criteriaJson.exit = exit.trim();
    if (invalidation.trim()) criteriaJson.invalidation = invalidation.trim();
    if (sessions.length)   criteriaJson.sessions = sessions;
    if (timeframes.length) criteriaJson.timeframes = timeframes;
    if (symbols.length)    criteriaJson.symbols = symbols;
    if (tags.length)       criteriaJson.tags = tags;
    if (minRR.trim())      criteriaJson.minRR = minRR.trim().replace(/\s+/g, '');
    if (riskPct.trim())    criteriaJson.riskPct = riskPct.trim();

    try {
      if (isEdit) {
        await update.mutateAsync({ name: name.trim(), thesis: thesis.trim(), status, criteriaJson });
        await updateImages.mutateAsync(images);
        await updateChecklist.mutateAsync({
          checklistId: playbook.checklists[0]?.id ?? null,
          body: { items: checklistItems },
        });
        toast.success('Playbook updated.');
      } else {
        await create.mutateAsync({ name: name.trim(), thesis: thesis.trim(), status, criteriaJson, checklistItems, images });
        toast.success(asDraft ? 'Saved as draft.' : 'Playbook created.');
      }
      close();
    } catch {
      toast.error('Failed to save playbook.');
    }
  };

  const isPending = create.isPending || update.isPending || updateChecklist.isPending || updateImages.isPending;

  if (!open) return null;

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.55)', backdropFilter: 'blur(3px)', zIndex: 200, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '24px 16px', overflowY: 'auto' }}
      onClick={(e) => e.target === e.currentTarget && close()}
    >
      <div style={{ width: '100%', maxWidth: 980, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 14, boxShadow: '0 24px 60px rgba(0,0,0,.45)', overflow: 'hidden' }}>

        {/* ── Header ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--eb-border)', background: 'linear-gradient(180deg,#141a24,#10151d)' }}>
          <span style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#00d68f,#06b6d4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#06140f', flexShrink: 0 }}>
            <Target size={15} strokeWidth={2.2} />
          </span>
          <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: 'var(--eb-text)' }}>
            {isEdit ? 'Edit strategy' : 'New strategy'}
          </h2>
          <span style={CHIP}>Draft · auto-saved</span>
          <button type="button" onClick={close} style={{ marginLeft: 'auto', background: 'transparent', border: 0, color: 'var(--eb-muted)', cursor: 'pointer', fontSize: 16, padding: '6px 8px', borderRadius: 6 }}>
            ✕
          </button>
        </div>

        {/* ── Body ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 20, padding: '18px 20px', maxHeight: 'calc(100vh - 220px)', overflowY: 'auto' }}>

          {/* LEFT — definition */}
          <div>
            {/* Name + Status row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Strategy name" help="Visible on every trade tagged with this strategy.">
                <input
                  style={INPUT}
                  placeholder="e.g. Liquidity sweep · EU"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={100}
                />
              </Field>
              <Field label="Status" help="Experimental excludes from headline stats.">
                <StatusSeg value={status} onChange={setStatus} />
              </Field>
            </div>

            <Field label="Thesis">
              <textarea
                style={TEXTAREA}
                placeholder="Why does this work? In one or two sentences."
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                maxLength={5000}
              />
            </Field>

            {/* Entry + Exit row */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Entry criteria">
                <textarea
                  style={{ ...TEXTAREA, minHeight: 90 }}
                  placeholder={'• HTF aligned\n• Sweep + reclaim\n• Confluence at level'}
                  value={entry}
                  onChange={(e) => setEntry(e.target.value)}
                  maxLength={2000}
                />
              </Field>
              <Field label="Exit criteria">
                <textarea
                  style={{ ...TEXTAREA, minHeight: 90 }}
                  placeholder={'• 50% partial at TP1\n• Trail stop to BE'}
                  value={exit}
                  onChange={(e) => setExit(e.target.value)}
                  maxLength={2000}
                />
              </Field>
            </div>

            <Field label="Invalidation">
              <textarea
                style={{ ...TEXTAREA, minHeight: 60 }}
                placeholder="When to abandon the trade?"
                value={invalidation}
                onChange={(e) => setInvalidation(e.target.value)}
                maxLength={2000}
              />
            </Field>

            <hr style={SEP} />
            <p style={{ ...HSEC, marginBottom: 8 }}>
              Pre-trade checklist{' '}
              <span style={{ color: 'var(--eb-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                — gates trade entry
              </span>
            </p>
            <ChecklistBuilder items={checklistItems} onChange={setChecklistItems} />

            <hr style={SEP} />
            <p style={HSEC}>Reference images</p>
            {images.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                {images.map((src, i) => (
                  <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                    <img
                      src={src}
                      alt=""
                      style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--eb-border)', display: 'block' }}
                    />
                    <button
                      type="button"
                      onClick={() => setImages(images.filter((_, j) => j !== i))}
                      style={{
                        position: 'absolute', top: -5, right: -5,
                        width: 17, height: 17, borderRadius: 99,
                        background: '#ff5b6c', border: 0, color: '#fff',
                        cursor: 'pointer', fontSize: 11, display: 'flex',
                        alignItems: 'center', justifyContent: 'center', padding: 0, lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <label
              style={{
                display: 'block', border: '1.5px dashed var(--eb-border)',
                borderRadius: 8, padding: '10px 14px', textAlign: 'center',
                color: 'var(--eb-muted)', fontSize: 12,
                cursor: images.length >= 10 ? 'not-allowed' : 'pointer',
                background: 'var(--eb-input, #0c1119)',
                opacity: images.length >= 10 ? 0.5 : 1,
              }}
            >
              <input
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                disabled={images.length >= 10}
                onChange={handleFileSelect}
              />
              <Paperclip size={13} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5, color: 'var(--eb-muted-2)' }} />
              {images.length === 0 ? 'Add screenshots or chart images (up to 10)' : `Add more · ${images.length}/10`}
            </label>
          </div>

          {/* RIGHT — config + preview */}
          <div>
            <p style={HSEC}>Allowed sessions</p>
            <ToggleChips
              options={['Asia', 'EU', 'US', 'Weekend']}
              selected={sessions}
              onChange={setSessions}
            />

            <p style={HSEC}>Allowed timeframes</p>
            <ToggleChips
              options={['1m', '5m', '15m', '1h', '4h', '1d']}
              selected={timeframes}
              onChange={setTimeframes}
            />

            <Field label="Allowed symbols" help="Press Enter or comma to add. Backspace removes last. Leave empty to allow all.">
              <TagInput tags={symbols} onChange={setSymbols} placeholder="BTCUSDT, ETHUSDT… (Enter to add)" transform={(v) => v.toUpperCase()} />
            </Field>

            <hr style={SEP} />
            <p style={HSEC}>Risk caps</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Risk per trade">
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...INPUT, fontFamily: '"JetBrains Mono",monospace', paddingRight: 48 }}
                    value={riskPct}
                    onChange={(e) => setRiskPct(e.target.value)}
                    placeholder="0.5"
                  />
                  <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>% acct</span>
                </div>
              </Field>
              <Field label="Max trades / day">
                <input
                  style={{ ...INPUT, fontFamily: '"JetBrains Mono",monospace' }}
                  value={maxTrades}
                  onChange={(e) => setMaxTrades(e.target.value)}
                  placeholder="3"
                />
              </Field>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <Field label="Min R:R">
                <input
                  style={{ ...INPUT, fontFamily: '"JetBrains Mono",monospace' }}
                  value={minRR}
                  onChange={(e) => setMinRR(e.target.value)}
                  placeholder="1 : 2"
                />
              </Field>
              <Field label="Min conviction">
                <div style={{ position: 'relative' }}>
                  <input
                    style={{ ...INPUT, fontFamily: '"JetBrains Mono",monospace', paddingRight: 28 }}
                    value={minConviction}
                    onChange={(e) => setMinConviction(e.target.value)}
                    placeholder="3"
                  />
                  <span style={{ position: 'absolute', right: 11, top: '50%', transform: 'translateY(-50%)', color: 'var(--eb-muted)', fontSize: 11.5, pointerEvents: 'none' }}>/ 5</span>
                </div>
              </Field>
            </div>

            <hr style={SEP} />
            <Field label="Tags" help="Press Enter or comma to add. Backspace removes last.">
              <TagInput tags={tags} onChange={setTags} placeholder="ICT, smart-money, liquidity… (Enter to add)" />
            </Field>

            <hr style={SEP} />
            <p style={HSEC}>Preview</p>
            <div style={PREVIEW}>
              {[
                ['Strategy',       name || '—'],
                ['Sessions',       sessions.join(' · ') || '—'],
                ['Timeframes',     timeframes.join(' · ') || '—'],
                ['Symbols',        symbols.length ? symbols.join(' · ') : 'All'],
                ['Risk / trade',   riskPct ? `${riskPct}%` : '—'],
                ['Min R:R',        minRR || '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                  <span style={{ color: 'var(--eb-muted)' }}>{k}</span>
                  <b style={{ fontFamily: '"JetBrains Mono",monospace', fontWeight: 600 }}>{v}</b>
                </div>
              ))}
              <div style={{ borderTop: '1px dashed var(--eb-border)', marginTop: 5, paddingTop: 8, display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
                <span style={{ color: 'var(--eb-muted)' }}>Checklist gates</span>
                <b style={{ fontFamily: '"JetBrains Mono",monospace' }}>{checklistItems.length} items</b>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '3px 0' }}>
                <span style={{ color: 'var(--eb-muted)' }}>Status</span>
                <b style={{ color: STATUS_COLORS[status].color, fontFamily: '"JetBrains Mono",monospace', textTransform: 'capitalize' }}>{status}</b>
              </div>
            </div>

            <div style={{ marginTop: 14, display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, color: 'var(--eb-muted)' }}>
              <Sparkles size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
              <span><b style={{ color: 'var(--eb-text)' }}>Tip:</b> trades tagged with this strategy will auto-fail the checklist gate if any item is unticked.</span>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 20px', borderTop: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)' }}>
          <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>⌘ Enter to save · Esc to close</span>
          <span style={{ marginLeft: 'auto' }} />
          <button
            type="button"
            onClick={close}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid transparent', background: 'transparent', color: 'var(--eb-muted)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          {!isEdit && (
            <button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={isPending || !name.trim()}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', color: 'var(--eb-text)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}
            >
              Save as draft
            </button>
          )}
          <button
            type="button"
            onClick={() => handleSubmit(false)}
            disabled={isPending || !name.trim() || !thesis.trim()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00e29a,#00b67a)', color: '#06140f', fontSize: 12.5, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}
          >
            {isPending ? 'Saving…' : isEdit ? 'Save strategy' : 'Save strategy'}
          </button>
        </div>
      </div>
    </div>
  );
}
