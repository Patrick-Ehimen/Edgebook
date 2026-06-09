'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { journalApi } from '@/features/journal';
import type { JournalEntry } from '@/features/journal';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Compass, Save } from 'lucide-react';
import { toast } from 'sonner';
import { MOOD_TAGS } from './journal-constants';

interface Props {
  open: boolean;
  onClose: () => void;
  todayStr: string;
  existingEntry?: JournalEntry | null;
}

export function PremarketModal({ open, onClose, todayStr, existingEntry }: Props) {
  const qc = useQueryClient();
  const [bias, setBias] = useState<'LONG' | 'NEUTRAL' | 'SHORT'>(existingEntry?.bias as any ?? 'NEUTRAL');
  const [conviction, setConviction] = useState(existingEntry?.conviction ?? 3);
  const [intentMd, setIntentMd] = useState(existingEntry?.intentMd ?? '');
  const [sleepHours, setSleepHours] = useState(Number(existingEntry?.sleepHours) || 7);
  const [energy, setEnergy] = useState(existingEntry?.energy ?? 7);
  const [focus, setFocus] = useState(existingEntry?.focus ?? 7);
  const [moods, setMoods] = useState<string[]>(
    Array.isArray(existingEntry?.moodTagsJson) ? (existingEntry.moodTagsJson as string[]) : []
  );

  // Re-seed when the modal opens with fresh entry data
  useEffect(() => {
    if (open) {
      setBias((existingEntry?.bias as any) ?? 'NEUTRAL');
      setConviction(existingEntry?.conviction ?? 3);
      setIntentMd(existingEntry?.intentMd ?? '');
      setSleepHours(Number(existingEntry?.sleepHours) || 7);
      setEnergy(existingEntry?.energy ?? 7);
      setFocus(existingEntry?.focus ?? 7);
      setMoods(Array.isArray(existingEntry?.moodTagsJson) ? (existingEntry.moodTagsJson as string[]) : []);
    }
  }, [open, existingEntry]);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      journalApi.upsertEntry(todayStr, {
        bias,
        conviction,
        intentMd,
        sleepHours: sleepHours.toString(),
        energy,
        focus,
        moodTagsJson: moods,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['journal-entry', todayStr] });
      qc.invalidateQueries({ queryKey: ['journal-recent'] });
      qc.invalidateQueries({ queryKey: ['journal-stats'] });
      toast.success('Pre-market intent saved');
      onClose();
    },
    onError: () => toast.error('Failed to save entry'),
  });

  const toggleMood = (m: string) =>
    setMoods((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        style={{
          maxWidth: 620,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: 0,
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 22px 14px',
            borderBottom: '1px solid var(--eb-border)',
            background: 'linear-gradient(180deg,rgba(0,214,143,.06),transparent)',
          }}
        >
          <DialogHeader>
            <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--eb-text)' }}>
              <Compass size={17} style={{ color: 'var(--green)' }} />
              Pre-market intent · {new Date(todayStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
            </DialogTitle>
          </DialogHeader>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--eb-muted)' }}>
            Lock in your bias and plan before the first trade fires.
          </p>
        </div>

        <div style={{ padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 18, maxHeight: '75vh', overflowY: 'auto' }}>

          {/* Bias + Conviction */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <Label>Overall day bias</Label>
              <div style={{ display: 'inline-flex', background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', borderRadius: 8, padding: 3, gap: 2 }}>
                {(['LONG', 'NEUTRAL', 'SHORT'] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setBias(s)}
                    style={{
                      background: bias === s
                        ? s === 'LONG' ? 'rgba(0,214,143,.18)' : s === 'SHORT' ? 'rgba(255,91,108,.18)' : 'var(--eb-panel-2)'
                        : 'transparent',
                      border: bias === s && s === 'NEUTRAL' ? '1px solid var(--eb-border)' : 0,
                      color: bias === s
                        ? s === 'LONG' ? 'var(--green)' : s === 'SHORT' ? 'var(--eb-red)' : 'var(--eb-text)'
                        : 'var(--eb-muted)',
                      padding: '5px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: 11.5,
                      fontWeight: 500,
                      fontFamily: 'inherit',
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Conviction</Label>
              <div style={{ display: 'flex', gap: 3 }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setConviction(n)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 22,
                      padding: 0,
                      lineHeight: 1,
                      color: n <= conviction ? '#fbbf24' : 'var(--eb-border)',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Intent */}
          <div>
            <Label>Intent &amp; thesis</Label>
            <textarea
              value={intentMd}
              onChange={(e) => setIntentMd(e.target.value)}
              placeholder="What's your read on the market today? Bias, key levels, plan, constraints..."
              style={{
                width: '100%',
                minHeight: 90,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 8,
                padding: '8px 11px',
                color: 'var(--eb-text)',
                fontSize: 13,
                fontFamily: 'inherit',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--green)'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--eb-border)'; }}
            />
          </div>

          {/* State of mind */}
          <div>
            <Label>State of mind</Label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Sleep', value: sleepHours, set: setSleepHours, min: 0, max: 12, fmt: (v: number) => `${v}h` },
                { label: 'Energy', value: energy, set: setEnergy, min: 0, max: 10, fmt: (v: number) => `${v}/10` },
                { label: 'Focus', value: focus, set: setFocus, min: 0, max: 10, fmt: (v: number) => `${v}/10` },
              ].map(({ label, value, set, min, max, fmt }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ flex: '0 0 54px', fontSize: 12, color: 'var(--eb-muted)' }}>{label}</span>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    step={label === 'Sleep' ? 0.5 : 1}
                    value={value}
                    onChange={(e) => set(Number(e.target.value))}
                    style={{ flex: 1, accentColor: 'var(--green)', height: 4 }}
                  />
                  <span style={{ flex: '0 0 44px', textAlign: 'right', fontFamily: 'monospace', fontSize: 12.5, fontWeight: 500, color: 'var(--eb-text)' }}>
                    {fmt(value)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Mood */}
          <div>
            <Label>Mood tags</Label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {MOOD_TAGS.map(({ label, color, bg, border }) => {
                const active = moods.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleMood(label)}
                    style={{
                      fontSize: 11.5,
                      padding: '3px 10px',
                      borderRadius: 99,
                      border: `1px solid ${active ? border : 'var(--eb-border)'}`,
                      background: active ? bg : 'var(--eb-panel-2)',
                      color: active ? color : 'var(--eb-muted-2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'background .12s, color .12s, border-color .12s',
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid var(--eb-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'transparent', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontSize: 12.5, fontFamily: 'inherit' }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => mutate()}
            disabled={isPending || !intentMd.trim()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              border: '1px solid #00b67a',
              color: '#06140f',
              padding: '7px 18px',
              borderRadius: 7,
              cursor: isPending || !intentMd.trim() ? 'not-allowed' : 'pointer',
              fontSize: 12.5,
              fontWeight: 600,
              fontFamily: 'inherit',
              opacity: isPending || !intentMd.trim() ? 0.6 : 1,
            }}
          >
            {isPending ? 'Saving…' : <><Save size={12} /> Save intent</>}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 6 }}>
      {children}
    </div>
  );
}
