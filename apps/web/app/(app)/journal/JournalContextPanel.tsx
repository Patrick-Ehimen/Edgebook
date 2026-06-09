'use client';

import { X, Award, BookOpen, Lightbulb, Target, TrendingUp, TrendingDown, Zap, AlertTriangle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { JournalStats } from '@/features/journal';
import { usePlaybooks } from '@/features/playbooks/hooks/usePlaybooks';
import { playbooksApi } from '@/features/playbooks/api';
import type { PlaybookStatus } from '@/features/playbooks/schemas';

// ─── Props ────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean;
  onClose: () => void;
  stats: JournalStats | undefined;
}

// ─── SECTIONS ──────────────────────────────────────────────────────────────────

const PROMPTS = [
  'If today repeated 100×, would my process print money?',
  'Which trade did I take that I\'d regret reading next month?',
  'One thing I want to do differently tomorrow.',
];

const LESSONS = [
  {
    icon: '📰',
    title: 'Respect news windows',
    quote: '"A \'win\' from breaking my own rules is a future loss in disguise."',
    source: 'From your May 7 reflection · ETHUSDT trade',
  },
  {
    icon: '⏸',
    title: 'Stop at target',
    quote: '"Your win rate drops 28% when you trade past your goal."',
    source: 'AI weekly review · pinned 14d ago',
  },
];



type BreakdownItem = { label: string; score: number; delta: number };

function fmtDelta(delta: number) {
  if (delta === 0) return '0';
  return delta > 0 ? `+${delta}` : `${delta}`;
}

function deltaColor(delta: number) {
  if (delta > 0) return 'var(--green)';
  if (delta < 0) return 'var(--eb-red)';
  return 'var(--eb-muted)';
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Discipline ring ──────────────────────────────────────────────────────────

const CIRCUMFERENCE = 314;

function DisciplineRing({ score, vs30D, breakdown }: { score: number; vs30D: number; breakdown: BreakdownItem[] }) {
  const offset = CIRCUMFERENCE - (score / 100) * CIRCUMFERENCE;
  const color = score >= 70 ? '#00d68f' : score >= 50 ? '#f5a524' : '#ff5b6c';
  const gradId = `ring-grad-context`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative', width: 88, height: 88, flex: '0 0 88px' }}>
        <svg width="88" height="88" viewBox="0 0 120 120">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor={color} />
              <stop offset="1" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
          <circle cx="60" cy="60" r="50" fill="none" stroke="var(--eb-panel-2)" strokeWidth="10" strokeLinecap="round" />
          <circle
            cx="60" cy="60" r="50"
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset .6s ease' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
          <b style={{ fontSize: 18, fontFamily: 'var(--font-mono, monospace)', fontWeight: 700, color: 'var(--eb-text)' }}>{score}</b>
          <span style={{ fontSize: 8, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.05em' }}>of 100</span>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
        {breakdown.map(({ label, score, delta }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11 }}>
            <span style={{ color: 'var(--eb-muted)' }}>{label}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <b style={{ color: 'var(--eb-text)', fontFamily: 'var(--font-mono, monospace)', fontSize: 11.5 }}>{score}</b>
              <span style={{ color: deltaColor(delta), fontSize: 10, fontFamily: 'var(--font-mono, monospace)' }}>{fmtDelta(delta)}</span>
            </div>
          </div>
        ))}
        <hr style={{ border: 0, borderTop: '1px dashed var(--eb-border)', margin: '2px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--eb-muted)' }}>
          <span>vs 30D avg</span>
          <b style={{ color: vs30D >= 0 ? 'var(--green)' : 'var(--eb-red)', fontFamily: 'var(--font-mono, monospace)' }}>{vs30D >= 0 ? '+' : ''}{vs30D}</b>
        </div>
      </div>
    </div>
  );
}

// ─── Streak grid ─────────────────────────────────────────────────────────────

function StreakSection({ streak, longestStreak }: { streak: number; longestStreak: number }) {
  const tiles: number[] = [];
  const now = new Date();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = toDateStr(d.getFullYear(), d.getMonth(), d.getDate());
    const isFuture = ds > toDateStr(now.getFullYear(), now.getMonth(), now.getDate());
    if (isFuture) { tiles.push(0); continue; }
    const inStreak = i < streak;
    const v = inStreak ? Math.min(Math.floor((streak - i) / 3) + 1, 4) : 0;
    tiles.push(i === 0 ? 4 : v);
  }

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 26, fontWeight: 700, fontFamily: 'var(--font-mono, monospace)', color: 'var(--green)', letterSpacing: '-.02em' }}>
          {streak}
        </span>
        <span style={{ fontSize: 12, color: 'var(--eb-muted-2)' }}>day streak</span>
        <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--eb-muted)' }}>
          Best <b style={{ fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-text)' }}>{longestStreak}d</b>
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 2 }}>
        {tiles.map((v, i) => (
          <div
            key={i}
            title={i === 13 ? 'Today' : `${13 - i}d ago`}
            style={{
              aspectRatio: '1',
              borderRadius: 3,
              background: v === 0 ? 'var(--eb-panel-2)' : v === 1 ? 'rgba(0,214,143,.25)' : v === 2 ? 'rgba(0,214,143,.45)' : v === 3 ? 'rgba(0,214,143,.7)' : 'var(--green)',
              border: '1px solid var(--eb-border)',
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────

export function JournalContextPanel({ open, onClose, stats }: Props) {
  const qc = useQueryClient();
  const { data: playbooks, isLoading } = usePlaybooks();

  const toggleMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: PlaybookStatus }) =>
      playbooksApi.update(id, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['playbooks'] });
    },
  });

  const activeCount = playbooks?.filter(p => p.status === 'active').length ?? 0;

  return (
    <>
      {/* Backdrop */}
      <div
        role="button"
        tabIndex={-1}
        aria-label="Close context panel"
        onClick={onClose}
        onKeyDown={e => e.key === 'Escape' && onClose()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 89,
          background: 'rgba(0,0,0,.45)',
          opacity: open ? 1 : 0,
          pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity .25s ease',
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '50%',
          maxWidth: 520,
          minWidth: 360,
          zIndex: 90,
          transform: open ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform .25s cubic-bezier(.22,.68,0,1)',
          background: 'var(--eb-bg, #0a0e14)',
          borderLeft: '1px solid var(--eb-border)',
          overflowY: 'auto',
          padding: '18px 18px 60px',
          display: 'flex',
          flexDirection: 'column',
          gap: 18,
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingBottom: 4, borderBottom: '1px solid var(--eb-border)' }}>
          <Zap size={15} style={{ color: 'var(--eb-cyan)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)', letterSpacing: '.01em' }}>Day context</span>
          <span style={{ marginLeft: 'auto' }} />
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'var(--eb-panel-2)', border: '1px solid var(--eb-border)', color: 'var(--eb-muted)', width: 26, height: 26, borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <X size={13} />
          </button>
        </div>

        {/* 1. Discipline Score */}
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Award size={13} style={{ color: 'var(--eb-muted)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Discipline score</span>
            </div>
            {stats?.discipline != null && (
              <span style={{ fontSize: 10.5, padding: '1px 6px', borderRadius: 99, background: stats.discipline.score >= 70 ? 'rgba(0,214,143,.10)' : stats.discipline.score >= 50 ? 'rgba(245,165,36,.10)' : 'rgba(255,91,108,.10)', color: stats.discipline.score >= 70 ? 'var(--green)' : stats.discipline.score >= 50 ? 'var(--eb-yellow)' : '#ff5b6c', border: `1px solid ${stats.discipline.score >= 70 ? 'rgba(0,214,143,.25)' : stats.discipline.score >= 50 ? 'rgba(245,165,36,.25)' : 'rgba(255,91,108,.25)'}` }}>
                {stats.discipline.score >= 70 ? '✓ Good' : stats.discipline.score >= 50 ? '⚠ Needs work' : '✗ Critical'}
              </span>
            )}
          </div>
          <DisciplineRing
            score={stats?.discipline?.score ?? 50}
            vs30D={stats?.discipline?.delta ?? 0}
            breakdown={
              stats?.discipline != null
                ? [
                    { label: 'Plan adherence', score: stats.discipline.planAdherence.score, delta: stats.discipline.planAdherence.delta },
                    { label: 'Rule violations', score: stats.discipline.ruleViolations.score, delta: stats.discipline.ruleViolations.delta },
                    { label: 'Journal completion', score: stats.discipline.journalCompletion.score, delta: stats.discipline.journalCompletion.delta },
                    { label: 'Risk discipline', score: stats.discipline.riskDiscipline.score, delta: stats.discipline.riskDiscipline.delta },
                  ]
                : [
                    { label: 'Plan adherence', score: 50, delta: 0 },
                    { label: 'Rule violations', score: 50, delta: 0 },
                    { label: 'Journal completion', score: 50, delta: 0 },
                    { label: 'Risk discipline', score: 50, delta: 0 },
                  ]
            }
          />
        </div>

        {/* 2. Journal Streak */}
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
            <BookOpen size={13} style={{ color: 'var(--eb-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Journal streak</span>
            {stats?.entriesThisMonth != null && (
              <span style={{ marginLeft: 'auto', fontSize: 10.5, color: 'var(--eb-muted)' }}>{stats.entriesThisMonth} this month</span>
            )}
          </div>
          <StreakSection streak={stats?.streak ?? 0} longestStreak={stats?.longestStreak ?? stats?.streak ?? 0} />
        </div>

        {/* 3. Prompts to Think About */}
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Lightbulb size={13} style={{ color: 'var(--eb-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Prompts to think about</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 2 }}>
            {PROMPTS.map((p, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, fontSize: 12, lineHeight: 1.5, color: 'var(--eb-muted-2)' }}>
                <span style={{ color: 'var(--eb-border)', flex: '0 0 auto' }}>—</span>
                <span>{p}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Lessons in Focus */}
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Target size={13} style={{ color: 'var(--eb-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Lessons in focus</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {LESSONS.map(({ icon, title, quote, source }) => (
              <div
                key={title}
                style={{
                  padding: '10px 12px',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 9,
                  background: 'linear-gradient(180deg,rgba(245,165,36,.04),transparent)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: 'rgba(245,165,36,.16)',
                    color: 'var(--eb-yellow)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 13,
                    flex: '0 0 26px',
                  }}
                >
                  {icon}
                </div>
                <div style={{ flex: 1, fontSize: 11.5, lineHeight: 1.5 }}>
                  <b style={{ display: 'block', fontSize: 10.5, color: 'var(--eb-yellow)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600, marginBottom: 2 }}>
                    Lesson · {title}
                  </b>
                  <em style={{ color: 'var(--eb-text)', fontStyle: 'normal', fontWeight: 500 }}>{quote}</em>
                  <div style={{ fontSize: 10, color: 'var(--eb-muted)', marginTop: 3 }}>{source}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. Playbooks */}
        <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 11, padding: '14px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Target size={13} style={{ color: 'var(--eb-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--eb-muted-2)', textTransform: 'uppercase', letterSpacing: '.06em' }}>Playbooks</span>
            <span style={{ marginLeft: 'auto', fontSize: 10.5, padding: '1px 6px', borderRadius: 99, background: 'rgba(0,214,143,.10)', color: 'var(--green)', border: '1px solid rgba(0,214,143,.25)' }}>
              {activeCount} active
            </span>
          </div>
          {isLoading ? (
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 11, color: 'var(--eb-muted)' }}>Loading playbooks…</div>
          ) : !playbooks?.length ? (
            <div style={{ padding: '12px 0', textAlign: 'center', fontSize: 11, color: 'var(--eb-muted)' }}>
              No playbooks yet. Create one in the Playbooks tab.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {playbooks.map((pb) => {
                const isActive = pb.status === 'active';
                const badge = pb.status === 'paused' ? 'paused' : pb.status === 'experimental' ? 'experimental' : null;
                const badgeColor = pb.status === 'paused' ? '#ff5b6c' : '#f5a524';
                return (
                  <div
                    key={pb.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 0',
                      borderBottom: '1px dashed var(--eb-border)',
                    }}
                  >
                    <div
                      role="switch"
                      aria-checked={isActive}
                      tabIndex={0}
                      onClick={() => {
                        if (toggleMutation.isPending) return;
                        toggleMutation.mutate({ id: pb.id, status: isActive ? 'paused' : 'active' });
                      }}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleMutation.mutate({ id: pb.id, status: isActive ? 'paused' : 'active' }); } }}
                      style={{ position: 'relative', display: 'inline-block', width: 28, height: 16, flex: '0 0 28px', cursor: 'pointer' }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 99,
                          background: isActive ? 'rgba(0,214,143,.25)' : 'var(--eb-panel-2)',
                          border: `1px solid ${isActive ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
                          transition: '.18s',
                        }}
                      >
                        <div
                          style={{
                            position: 'absolute',
                            left: isActive ? 14 : 2,
                            top: 1,
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: isActive ? 'var(--green)' : 'var(--eb-muted)',
                            transition: '.18s',
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ flex: 1, fontSize: 12, fontWeight: 500, color: 'var(--eb-text)', minWidth: 0 }}>
                      {pb.name}
                      {badge && (
                        <span style={{ fontSize: 9.5, padding: '1px 5px', borderRadius: 99, background: `${badgeColor}18`, color: badgeColor, border: `1px solid ${badgeColor}30`, marginLeft: 4, whiteSpace: 'nowrap' }}>
                          {badge}
                        </span>
                      )}
                      <div style={{ fontSize: 10, color: 'var(--eb-muted)', fontWeight: 400, marginTop: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {pb.thesis}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 11, fontFamily: 'var(--font-mono, monospace)', color: 'var(--eb-muted)', whiteSpace: 'nowrap' }}>
                      <b style={{ color: 'var(--eb-text)' }}>{pb._count?.positions ?? 0}</b> trades
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </>
  );
}
