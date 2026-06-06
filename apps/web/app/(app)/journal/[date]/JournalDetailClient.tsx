'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/features/journal';
import type { JournalEntry } from '@/features/journal';
import Link from 'next/link';
import { ArrowLeft, Sunrise, Zap, Moon, Star, Lock } from 'lucide-react';
import { toast } from 'sonner';

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtHeading(dateStr: string) {
  const d = new Date(`${dateStr}T00:00:00`);
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function isToday(dateStr: string) {
  return new Date().toISOString().slice(0, 10) === dateStr;
}

// ─── atoms ────────────────────────────────────────────────────────────────────

function SectionHeader({ icon, title, chip }: { icon: React.ReactNode; title: string; chip?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ color: 'var(--green)' }}>{icon}</span>
      <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--eb-text)' }}>{title}</span>
      {chip && <span style={{ marginLeft: 'auto' }}>{chip}</span>}
    </div>
  );
}

function Chip({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, padding: '2px 9px', borderRadius: 99, border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)', ...style }}>
      {children}
    </span>
  );
}

function Panel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: '18px 20px', ...style }}>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase' as const, letterSpacing: '.06em', fontWeight: 600, marginBottom: 5 }}>
      {children}
    </div>
  );
}

function ReadonlyTextarea({ value, placeholder }: { value: string | null | undefined; placeholder: string }) {
  if (!value) return <span style={{ color: 'var(--eb-muted)', fontSize: 12.5, fontStyle: 'italic' }}>{placeholder}</span>;
  return (
    <div style={{ fontSize: 13, color: 'var(--eb-text)', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>{value}</div>
  );
}

function ScoreBadge({ value, max = 10, label }: { value: number | null | undefined; max?: number; label: string }) {
  const pct = value != null ? (value / max) * 100 : 0;
  const color = pct >= 80 ? 'var(--green)' : pct >= 50 ? 'var(--eb-yellow)' : pct > 0 ? 'var(--eb-red)' : 'var(--eb-muted)';
  return (
    <div style={{ display: 'flex', flexDirection: 'column' as const, gap: 4 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
        <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color }}>
          {value != null ? value : '—'}
        </span>
        {value != null && <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>/ {max}</span>}
      </div>
      <div style={{ height: 4, borderRadius: 99, background: 'var(--eb-border)', overflow: 'hidden' }}>
        <div style={{ height: '100%', borderRadius: 99, background: color, width: `${pct}%`, transition: 'width .3s' }} />
      </div>
    </div>
  );
}

// ─── Editable EOD section ─────────────────────────────────────────────────────

const MOOD_TAGS = ['Calm', 'Patient', 'Focused', 'Confident', 'Excited', 'Tired', 'Anxious', 'Frustrated'];

function EodEditor({ entry, dateStr }: { entry: JournalEntry; dateStr: string }) {
  const qc = useQueryClient();
  const [wentRight, setWentRight] = useState(entry.wentRightMd ?? '');
  const [wentWrong, setWentWrongMd] = useState(entry.wentWrongMd ?? '');
  const [lesson, setLesson] = useState(entry.lesson ?? '');
  const [planAdherence, setPlanAdherence] = useState(entry.planAdherence ?? 5);
  const [processScore, setProcessScore] = useState(entry.processScore ?? 5);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      journalApi.upsertEntry(dateStr, {
        wentRightMd: wentRight,
        wentWrongMd: wentWrong,
        lesson,
        planAdherence,
        processScore,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', dateStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      toast.success('EOD review saved');
    },
    onError: () => toast.error('Failed to save'),
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <ScoreBadge value={planAdherence} max={10} label="Plan adherence" />
        <ScoreBadge value={processScore} max={10} label="Process score" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { label: 'Plan adherence', value: planAdherence, set: setPlanAdherence },
          { label: 'Process score', value: processScore, set: setProcessScore },
        ].map(({ label, value, set }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ flex: '0 0 120px', fontSize: 12, color: 'var(--eb-muted)' }}>{label}</span>
            <input
              type="range"
              min={1}
              max={10}
              value={value}
              onChange={(e) => set(Number(e.target.value))}
              style={{ flex: 1, accentColor: 'var(--green)', height: 4 }}
            />
            <span style={{ flex: '0 0 28px', textAlign: 'right', fontSize: 12.5, fontFamily: 'monospace', fontWeight: 500 }}>{value}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        {[
          { label: 'What went right', value: wentRight, set: setWentRight, placeholder: 'What worked today?' },
          { label: 'What went wrong', value: wentWrong, set: setWentWrongMd, placeholder: 'What would you change?' },
        ].map(({ label, value, set, placeholder }) => (
          <div key={label}>
            <FieldLabel>{label}</FieldLabel>
            <textarea
              value={value}
              onChange={(e) => set(e.target.value)}
              placeholder={placeholder}
              style={{ width: '100%', minHeight: 72, background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 11px', color: 'var(--eb-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--eb-border)'; }}
            />
          </div>
        ))}
      </div>

      <div>
        <FieldLabel>Lesson captured</FieldLabel>
        <textarea
          value={lesson}
          onChange={(e) => setLesson(e.target.value)}
          placeholder="The one thing you'll carry into tomorrow..."
          style={{ width: '100%', minHeight: 60, background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: '8px 11px', color: 'var(--eb-text)', fontSize: 13, fontFamily: 'inherit', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
          onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
          onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--eb-border)'; }}
        />
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => mutate()}
          disabled={isPending}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 16px', borderRadius: 7, border: '1px solid #00b67a', background: 'linear-gradient(180deg,#00d68f,#00b67a)', color: '#06140f', fontSize: 12.5, fontWeight: 600, cursor: isPending ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: isPending ? 0.6 : 1 }}
        >
          {isPending ? 'Saving…' : '💾 Save EOD review'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export function JournalDetailClient({ date: dateStr }: { date: string }) {
  const today = isToday(dateStr);

  const { data: entry, isPending } = useQuery({
    queryKey: ['journal-entry', dateStr],
    queryFn: () => journalApi.getEntry(dateStr),
  });

  if (isPending) {
    return (
      <div style={{ padding: '22px 26px', color: 'var(--eb-muted)', fontSize: 13 }}>
        Loading…
      </div>
    );
  }

  if (!entry) {
    return (
      <div style={{ padding: '22px 26px' }}>
        <Link href="/journal" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--eb-muted)', marginBottom: 20 }}>
          <ArrowLeft size={14} /> Back to journal
        </Link>
        <div style={{ color: 'var(--eb-muted-2)', fontSize: 14 }}>No entry found for {dateStr}.</div>
      </div>
    );
  }

  const moods: string[] = Array.isArray((entry as JournalEntry).moodTagsJson)
    ? ((entry as JournalEntry).moodTagsJson as string[])
    : [];

  const full = entry as JournalEntry;

  return (
    <div style={{ padding: '22px 26px 80px', maxWidth: 960, width: '100%', alignSelf: 'center' }}>

      {/* Breadcrumb */}
      <Link
        href="/journal"
        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12.5, color: 'var(--eb-muted)', marginBottom: 20, textDecoration: 'none' }}
      >
        <ArrowLeft size={14} /> Back to journal
      </Link>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginBottom: 4 }}>Coaching / Daily journal / {dateStr}</div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: '0 0 6px', color: 'var(--eb-text)', letterSpacing: '-.01em' }}>
            {fmtHeading(dateStr)}
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            {full.bias && (
              <Chip style={
                full.bias === 'LONG'
                  ? { color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', background: 'rgba(0,214,143,.08)' }
                  : full.bias === 'SHORT'
                    ? { color: 'var(--eb-red)', borderColor: 'rgba(255,91,108,.30)', background: 'rgba(255,91,108,.08)' }
                    : {}
              }>
                {full.bias}
              </Chip>
            )}
            {today && (
              <Chip style={{ color: 'var(--eb-cyan)', borderColor: 'rgba(6,182,212,.3)', background: 'rgba(6,182,212,.08)' }}>
                ● Today · in progress
              </Chip>
            )}
            {full.lockedAt && (
              <Chip style={{ color: 'var(--eb-yellow)', borderColor: 'rgba(245,165,36,.3)', background: 'rgba(245,165,36,.08)' }}>
                <Lock size={10} /> Intent locked
              </Chip>
            )}
            {full.finalizedAt && (
              <Chip style={{ color: 'var(--green)', borderColor: 'rgba(0,214,143,.3)', background: 'rgba(0,214,143,.08)' }}>
                ✓ Finalized
              </Chip>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Pre-market intent ── */}
        <Panel>
          <SectionHeader
            icon={<Sunrise size={16} />}
            title="Pre-market intent"
            chip={full.lockedAt && <Chip style={{ fontSize: 10.5 }}><Lock size={9} /> Locked</Chip>}
          />

          {/* Conviction */}
          {full.conviction != null && (
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>Conviction</FieldLabel>
              <div style={{ display: 'flex', gap: 3 }}>
                {([1, 2, 3, 4, 5] as const).map((n) => (
                  <Star
                    key={n}
                    size={16}
                    fill={n <= (full.conviction ?? 0) ? '#fbbf24' : 'none'}
                    color={n <= (full.conviction ?? 0) ? '#fbbf24' : 'var(--eb-border)'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Intent */}
          <div style={{ marginBottom: 14 }}>
            <FieldLabel>Intent &amp; thesis</FieldLabel>
            <ReadonlyTextarea value={full.intentMd} placeholder="No intent recorded." />
          </div>

          {/* State of mind */}
          {(full.sleepHours != null || full.energy != null || full.focus != null) && (
            <div style={{ marginBottom: 14 }}>
              <FieldLabel>State of mind</FieldLabel>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {full.sleepHours != null && (
                  <Chip>😴 Sleep {Number(full.sleepHours).toFixed(1)}h</Chip>
                )}
                {full.energy != null && (
                  <Chip>⚡ Energy {full.energy}/10</Chip>
                )}
                {full.focus != null && (
                  <Chip>🎯 Focus {full.focus}/10</Chip>
                )}
              </div>
            </div>
          )}

          {/* Mood tags */}
          {moods.length > 0 && (
            <div>
              <FieldLabel>Mood</FieldLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {moods.map((m) => (
                  <Chip key={m} style={{ background: 'rgba(139,92,246,.08)', borderColor: 'rgba(139,92,246,.25)', color: '#c4b5fd' }}>
                    {m}
                  </Chip>
                ))}
              </div>
            </div>
          )}
        </Panel>

        {/* ── Live session ── */}
        <Panel>
          <SectionHeader icon={<Zap size={16} />} title="Live session" />
          <div>
            <FieldLabel>Session notes</FieldLabel>
            <ReadonlyTextarea value={full.sessionNotesMd} placeholder="No session notes yet." />
          </div>
        </Panel>

        {/* ── EOD review ── */}
        <Panel>
          <SectionHeader
            icon={<Moon size={16} />}
            title="End-of-day review"
            chip={
              full.finalizedAt
                ? <Chip style={{ color: 'var(--green)', borderColor: 'rgba(0,214,143,.3)', background: 'rgba(0,214,143,.08)', fontSize: 10.5 }}>✓ Finalized</Chip>
                : <Chip style={{ fontSize: 10.5 }}>Draft</Chip>
            }
          />

          {full.eodMd && (
            <div style={{ marginBottom: 16 }}>
              <FieldLabel>Closing note</FieldLabel>
              <ReadonlyTextarea value={full.eodMd} placeholder="" />
            </div>
          )}

          <EodEditor entry={full} dateStr={dateStr} />
        </Panel>

      </div>
    </div>
  );
}
