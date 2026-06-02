'use client';

import { DeleteConfirmDialog } from '@/features/playbooks/components/DeleteConfirmDialog';
import { PlaybookFormDialog } from '@/features/playbooks/components/PlaybookFormDialog';
import { useDeletePlaybook } from '@/features/playbooks/hooks/useDeletePlaybook';
import { usePlaybooks } from '@/features/playbooks/hooks/usePlaybooks';
import type { Playbook } from '@/features/playbooks/schemas';
import type { PlaybookStatus } from '@/features/playbooks/schemas';
import { ArrowUpDown, CheckSquare, Plus, Search, Trash2, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

// ── accent cycle ──────────────────────────────────────────────────────────────

const ACCENTS = ['#00d68f', '#06b6d4', '#818cf8', '#f472b6', '#fb923c', '#facc15'];

// ── playbook card ─────────────────────────────────────────────────────────────

function PlaybookCard({ playbook, index, onDelete }: { playbook: Playbook; index: number; onDelete: () => void }) {
  const accent = ACCENTS[index % ACCENTS.length];
  const statusCfg = STATUS_CONFIG[playbook.status];
  const criteria = playbook.criteriaJson as Record<string, unknown>;
  const sessions   = (criteria.sessions   as string[] | undefined) ?? [];
  const timeframes = (criteria.timeframes as string[] | undefined) ?? [];
  const minRR   = criteria.minRR   as string | undefined;
  const riskPct = criteria.riskPct as string | undefined;
  const checklistCount = playbook.checklists[0]?.itemsJson?.length ?? 0;
  const tradeCount     = playbook._count.positions;

  return (
    <Link href={`/playbooks/${playbook.id}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderLeft: `4px solid ${accent}`,
          borderRadius: '0 12px 12px 0',
          padding: '20px 22px',
          height: '100%',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          cursor: 'pointer',
          transition: 'box-shadow .15s, transform .1s',
          backgroundImage: `linear-gradient(90deg, ${accent}0d 0%, transparent 55%)`,
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = `0 0 0 1px ${accent}50, 0 6px 20px rgba(0,0,0,.28)`;
          el.style.transform = 'translateY(-2px)';
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget as HTMLDivElement;
          el.style.boxShadow = 'none';
          el.style.transform = 'none';
        }}
      >
        {/* header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--eb-text)', lineHeight: 1.35 }}>
              {playbook.name}
            </h3>
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              fontSize: 10.5, color: statusCfg.color,
              background: statusCfg.bg, border: `1px solid ${statusCfg.border}`,
              borderRadius: 99, padding: '2px 8px', width: 'fit-content',
              textTransform: 'capitalize',
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: statusCfg.color, flexShrink: 0 }} />
              {playbook.status}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginTop: 1 }}>
            <span style={{
              fontSize: 11, color: accent,
              fontFamily: '"JetBrains Mono",monospace',
              background: `${accent}18`,
              border: `1px solid ${accent}40`,
              borderRadius: 4, padding: '3px 8px',
            }}>
              #{String(index + 1).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDelete(); }}
              title="Delete playbook"
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 26, height: 26, borderRadius: 6,
                border: '1px solid transparent',
                background: 'transparent',
                color: 'var(--eb-muted)',
                cursor: 'pointer',
                transition: 'color .12s, background .12s, border-color .12s',
              }}
              onMouseEnter={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = '#ff5b6c';
                b.style.background = 'rgba(255,91,108,.12)';
                b.style.borderColor = 'rgba(255,91,108,.3)';
              }}
              onMouseLeave={(e) => {
                const b = e.currentTarget as HTMLButtonElement;
                b.style.color = 'var(--eb-muted)';
                b.style.background = 'transparent';
                b.style.borderColor = 'transparent';
              }}
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* thesis */}
        <p style={{
          margin: 0, fontSize: 13, color: 'var(--eb-muted)', lineHeight: 1.65, flex: 1,
          display: '-webkit-box', WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {playbook.thesis}
        </p>

        {/* session + timeframe chips */}
        {(sessions.length > 0 || timeframes.length > 0) && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {sessions.map((s) => (
              <span key={s} style={{
                fontSize: 11.5, padding: '3px 9px', borderRadius: 99,
                border: `1px solid ${accent}44`, background: `${accent}12`, color: accent,
              }}>
                {s}
              </span>
            ))}
            {timeframes.map((tf) => (
              <span key={tf} style={{
                fontSize: 11.5, padding: '3px 9px', borderRadius: 99,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)', color: 'var(--eb-muted-2)',
              }}>
                {tf}
              </span>
            ))}
          </div>
        )}

        {/* footer stats */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          borderTop: '1px solid var(--eb-border)', paddingTop: 10, fontSize: 12,
        }}>
          <div style={{ display: 'flex', gap: 10, color: 'var(--eb-muted)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <TrendingUp size={11} />
              {tradeCount} trade{tradeCount !== 1 ? 's' : ''}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
              <CheckSquare size={11} />
              {checklistCount} gate{checklistCount !== 1 ? 's' : ''}
            </span>
          </div>
          <div style={{
            display: 'flex', gap: 8,
            color: 'var(--eb-muted)', fontFamily: '"JetBrains Mono",monospace', fontSize: 11.5,
          }}>
            {minRR   && <span>R:R {minRR}</span>}
            {riskPct && <span style={{ color: accent }}>{riskPct}%</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ── skeleton primitives ───────────────────────────────────────────────────────

function SkelBar({
  w, h = 10, radius = 4, style,
}: {
  w: string | number;
  h?: number;
  radius?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div style={{ height: h, background: 'var(--eb-border)', borderRadius: radius, width: w, flexShrink: 0, ...style }} />
  );
}

function SkelCard({ accent, delay }: { accent: string; delay: number }) {
  return (
    <div style={{
      background: 'var(--eb-panel)',
      border: '1px solid var(--eb-border)',
      borderLeft: `4px solid ${accent}35`,
      borderRadius: '0 12px 12px 0',
      padding: '20px 22px',
      display: 'flex', flexDirection: 'column', gap: 14,
      backgroundImage: `linear-gradient(90deg, ${accent}07 0%, transparent 55%)`,
      animation: 'pulse 1.6s ease-in-out infinite',
      animationDelay: `${delay}s`,
    }}>
      {/* header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <SkelBar w="46%" h={14} />
        <SkelBar w={34} h={20} radius={4} />
      </div>
      {/* thesis lines */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <SkelBar w="92%" h={11} />
        <SkelBar w="84%" h={11} />
        <SkelBar w="77%" h={11} />
        <SkelBar w="58%" h={11} />
      </div>
      {/* chips */}
      <div style={{ display: 'flex', gap: 5 }}>
        <SkelBar w={44} h={22} radius={99} />
        <SkelBar w={38} h={22} radius={99} />
        <SkelBar w={34} h={22} radius={99} />
      </div>
      {/* footer */}
      <div style={{
        borderTop: '1px solid var(--eb-border)', paddingTop: 10,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <SkelBar w={68} h={11} />
          <SkelBar w={52} h={11} />
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <SkelBar w={46} h={11} />
          <SkelBar w={30} h={11} />
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div>
      {/* stats row */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: 18,
        animation: 'pulse 1.6s ease-in-out infinite',
      }}>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
          <SkelBar w={72} h={13} />
          <SkelBar w={1} h={14} style={{ background: 'var(--eb-border)' }} />
          <SkelBar w={96} h={13} />
          <SkelBar w={1} h={14} style={{ background: 'var(--eb-border)' }} />
          <SkelBar w={110} h={13} />
        </div>
        <SkelBar w={118} h={33} radius={8} />
      </div>

      {/* filter bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '10px 14px',
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 10, marginBottom: 18,
        animation: 'pulse 1.6s ease-in-out infinite',
        animationDelay: '0.1s',
      }}>
        <SkelBar w={190} h={28} radius={7} />
        <SkelBar w={1} h={20} />
        {[48, 38, 36, 56].map((w, i) => <SkelBar key={i} w={w} h={24} radius={99} />)}
        <SkelBar w={1} h={20} />
        <SkelBar w={108} h={28} radius={7} style={{ marginLeft: 'auto' }} />
      </div>

      {/* cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: 14,
      }}>
        {ACCENTS.slice(0, 4).map((accent, i) => (
          <SkelCard key={i} accent={accent} delay={i * 0.12} />
        ))}
      </div>
    </div>
  );
}

// ── empty state ───────────────────────────────────────────────────────────────

const GHOST_CARDS = [
  { accent: ACCENTS[0], w1: '52%', w2: '85%', w3: '70%', chips: [28, 22] },
  { accent: ACCENTS[1], w1: '62%', w2: '90%', w3: '60%', chips: [24, 20, 18] },
  { accent: ACCENTS[2], w1: '44%', w2: '78%', w3: '66%', chips: [30, 20] },
];

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{
      border: '1px solid var(--eb-border)',
      borderRadius: 14,
      overflow: 'hidden',
      background: 'var(--eb-panel)',
    }}>
      {/* 6-colour accent stripe */}
      <div style={{ display: 'flex', height: 3 }}>
        {ACCENTS.map((c) => (
          <div key={c} style={{ flex: 1, background: c }} />
        ))}
      </div>

      <div style={{
        padding: '100px 64px 92px',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      }}>

        {/* ghost card thumbnails */}
        <div style={{ display: 'flex', gap: 18, marginBottom: 56 }}>
          {GHOST_CARDS.map(({ accent, w1, w2, w3, chips }, i) => (
            <div
              key={i}
              style={{
                width: 200, height: 220,
                borderRadius: '0 12px 12px 0',
                border: '1px solid var(--eb-border)',
                borderLeft: `4px solid ${accent}`,
                background: `linear-gradient(90deg, ${accent}0d 0%, transparent 60%)`,
                padding: '20px 18px 16px',
                display: 'flex', flexDirection: 'column', gap: 8,
                opacity: 0.45,
                transform: `translateY(${i === 1 ? '-10px' : '0'})`,
              }}
            >
              <div style={{ height: 11, background: accent, borderRadius: 3, width: w1, opacity: 0.7 }} />
              <div style={{ height: 7, background: 'var(--eb-border)', borderRadius: 2, width: w2 }} />
              <div style={{ height: 7, background: 'var(--eb-border)', borderRadius: 2, width: w3 }} />
              <div style={{ height: 7, background: 'var(--eb-border)', borderRadius: 2, width: '50%' }} />
              <div style={{ display: 'flex', gap: 5, marginTop: 4 }}>
                {chips.map((w, j) => (
                  <div key={j} style={{ height: 20, width: w + 20, borderRadius: 99, background: `${accent}28`, border: `1px solid ${accent}40` }} />
                ))}
              </div>
              <div style={{ marginTop: 'auto', borderTop: '1px solid var(--eb-border)', paddingTop: 12, display: 'flex', justifyContent: 'space-between' }}>
                <div style={{ height: 6, background: 'var(--eb-border)', borderRadius: 2, width: '40%', opacity: 0.6 }} />
                <div style={{ height: 6, background: 'var(--eb-border)', borderRadius: 2, width: '28%', opacity: 0.6 }} />
              </div>
            </div>
          ))}
        </div>

        <h3 style={{ margin: '0 0 14px', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)', letterSpacing: '-.02em' }}>
          No playbooks defined yet
        </h3>
        <p style={{
          margin: '0 0 34px', fontSize: 14, color: 'var(--eb-muted)',
          lineHeight: 1.7, maxWidth: 400,
        }}>
          Each playbook is a named strategy with entry criteria, exit rules, and checklist gates.
          Tag trades to it and your edge becomes measurable.
        </p>

        <button
          type="button"
          onClick={onAdd}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 7,
            padding: '9px 20px', borderRadius: 8,
            border: '1px solid #00b67a',
            background: 'linear-gradient(180deg,#00d68f,#00b67a)',
            color: '#06140f', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <Plus size={13} /> Add your first playbook
        </button>
      </div>
    </div>
  );
}

// ── sort type ─────────────────────────────────────────────────────────────────

type SortKey = 'newest' | 'oldest' | 'name' | 'trades' | 'gates';

const SESSIONS = ['Asia', 'EU', 'US', 'Weekend'];

const STATUS_CONFIG: Record<PlaybookStatus, { label: string; color: string; bg: string; border: string }> = {
  experimental: { label: 'Experimental', color: '#f5a524', bg: 'rgba(245,165,36,.12)', border: 'rgba(245,165,36,.4)' },
  active:       { label: 'Active',        color: '#00d68f', bg: 'rgba(0,214,143,.12)', border: 'rgba(0,214,143,.4)' },
  paused:       { label: 'Paused',        color: '#ff5b6c', bg: 'rgba(255,91,108,.12)', border: 'rgba(255,91,108,.4)' },
};

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'newest', label: 'Newest first' },
  { key: 'oldest', label: 'Oldest first' },
  { key: 'name',   label: 'Name A → Z'  },
  { key: 'trades', label: 'Most trades'  },
  { key: 'gates',  label: 'Most gates'   },
];

// ── main ──────────────────────────────────────────────────────────────────────

export function PlaybooksClient() {
  const { data: playbooks, isLoading } = usePlaybooks();
  const deletePlaybook = useDeletePlaybook();
  const [dialogOpen, setDialogOpen]     = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string; accent: string; tradeCount: number } | null>(null);
  const [search, setSearch]             = useState('');
  const [sessionFilter, setSessionFilter] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<PlaybookStatus[]>([]);
  const [sort, setSort]                 = useState<SortKey>('newest');

  const count = playbooks?.length ?? 0;

  const totalTrades = useMemo(
    () => playbooks?.reduce((n, p) => n + p._count.positions, 0) ?? 0,
    [playbooks],
  );

  const coveredSessions = useMemo(() => {
    const set = new Set<string>();
    for (const p of playbooks ?? []) {
      const s = (p.criteriaJson as Record<string, unknown>).sessions as string[] | undefined;
      s?.forEach((x) => set.add(x));
    }
    return [...set];
  }, [playbooks]);

  const toggleSession = (s: string) =>
    setSessionFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const toggleStatus = (s: PlaybookStatus) =>
    setStatusFilter((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
    );

  const cycleSort = () => {
    const idx = SORT_OPTIONS.findIndex((o) => o.key === sort);
    setSort(SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length]!.key);
  };

  const sortLabel = SORT_OPTIONS.find((o) => o.key === sort)!.label;

  const filtered = useMemo(() => {
    if (!playbooks) return [];
    let list = [...playbooks];

    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.thesis.toLowerCase().includes(q),
      );
    }

    if (statusFilter.length > 0) {
      list = list.filter((p) => statusFilter.includes(p.status));
    }

    if (sessionFilter.length > 0) {
      list = list.filter((p) => {
        const s = (p.criteriaJson as Record<string, unknown>).sessions as string[] | undefined;
        return sessionFilter.some((f) => s?.includes(f));
      });
    }

    switch (sort) {
      case 'oldest':
        list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'trades':
        list.sort((a, b) => b._count.positions - a._count.positions);
        break;
      case 'gates':
        list.sort(
          (a, b) =>
            (b.checklists[0]?.itemsJson?.length ?? 0) -
            (a.checklists[0]?.itemsJson?.length ?? 0),
        );
        break;
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return list;
  }, [playbooks, search, statusFilter, sessionFilter, sort]);

  const hasFilters = search.trim() !== '' || statusFilter.length > 0 || sessionFilter.length > 0;

  return (
    <>
      <div style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>

        {/* ── Loading ── */}
        {isLoading && <Skeleton />}

        {/* ── Empty ── */}
        {!isLoading && count === 0 && (
          <EmptyState onAdd={() => setDialogOpen(true)} />
        )}

        {/* ── Has playbooks ── */}
        {!isLoading && count > 0 && (
          <>
            {/* Stats + action row */}
            <div style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'space-between', marginBottom: 18,
            }}>
              <div style={{ display: 'flex', gap: 20, fontSize: 12.5, color: 'var(--eb-muted)' }}>
                <span>
                  <b style={{ color: 'var(--eb-text)', fontFamily: '"JetBrains Mono",monospace' }}>{count}</b>
                  {' '}strateg{count !== 1 ? 'ies' : 'y'}
                </span>
                <span style={{ color: 'var(--eb-border)' }}>|</span>
                <span>
                  <b style={{ color: 'var(--eb-text)', fontFamily: '"JetBrains Mono",monospace' }}>{totalTrades}</b>
                  {' '}trade{totalTrades !== 1 ? 's' : ''} tagged
                </span>
                {coveredSessions.length > 0 && (
                  <>
                    <span style={{ color: 'var(--eb-border)' }}>|</span>
                    <span style={{ color: 'var(--eb-muted-2)' }}>{coveredSessions.join(' · ')}</span>
                  </>
                )}
              </div>
              <button
                type="button"
                onClick={() => setDialogOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '7px 14px', borderRadius: 8,
                  border: '1px solid #00b67a',
                  background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                  color: '#06140f', fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <Plus size={12} /> New playbook
              </button>
            </div>

            {/* Filter bar */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px',
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              marginBottom: 18,
            }}>
              {/* Search */}
              <div style={{ position: 'relative', flex: '0 0 220px' }}>
                <Search size={12} style={{
                  position: 'absolute', left: 9, top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--eb-muted)', pointerEvents: 'none',
                }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search playbooks…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'var(--eb-input, #0c1119)',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 7, padding: '5px 9px 5px 26px',
                    color: 'var(--eb-text)', fontFamily: 'inherit',
                    fontSize: 12.5, outline: 0,
                  }}
                />
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--eb-border)', flexShrink: 0 }} />

              {/* Status chips */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                {(Object.entries(STATUS_CONFIG) as [PlaybookStatus, typeof STATUS_CONFIG[PlaybookStatus]][]).map(([key, cfg]) => {
                  const active = statusFilter.includes(key);
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleStatus(key)}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        fontSize: 11.5, padding: '3px 10px', borderRadius: 99,
                        border: active ? `1px solid ${cfg.border}` : '1px solid var(--eb-border)',
                        background: active ? cfg.bg : 'transparent',
                        color: active ? cfg.color : 'var(--eb-muted-2)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'background .1s, color .1s, border-color .1s',
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: active ? cfg.color : 'var(--eb-border)', flexShrink: 0, transition: 'background .1s' }} />
                      {cfg.label}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--eb-border)', flexShrink: 0 }} />

              {/* Session chips */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginRight: 2, whiteSpace: 'nowrap' }}>Session</span>
                {SESSIONS.map((s) => {
                  const active = sessionFilter.includes(s);
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleSession(s)}
                      style={{
                        fontSize: 11.5, padding: '3px 10px', borderRadius: 99,
                        border: active ? '1px solid rgba(0,214,143,.45)' : '1px solid var(--eb-border)',
                        background: active ? 'rgba(0,214,143,.12)' : 'transparent',
                        color: active ? 'var(--green)' : 'var(--eb-muted-2)',
                        cursor: 'pointer', fontFamily: 'inherit',
                        transition: 'background .1s, color .1s, border-color .1s',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>

              {/* Divider */}
              <div style={{ width: 1, height: 20, background: 'var(--eb-border)', flexShrink: 0 }} />

              {/* Sort */}
              <button
                type="button"
                onClick={cycleSort}
                style={{
                  marginLeft: 'auto',
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 12, color: 'var(--eb-text)',
                  background: 'var(--eb-input, #0c1119)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 7, padding: '5px 10px',
                  cursor: 'pointer', fontFamily: 'inherit',
                  whiteSpace: 'nowrap',
                }}
              >
                <ArrowUpDown size={11} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
                {sortLabel}
              </button>

              {/* Clear filters */}
              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSessionFilter([]); setStatusFilter([]); }}
                  style={{
                    fontSize: 11.5, color: 'var(--eb-muted)',
                    background: 'none', border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit',
                    padding: '3px 6px', borderRadius: 5,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Clear ×
                </button>
              )}
            </div>

            {/* Grid or no-results */}
            {filtered.length === 0 ? (
              <div style={{
                textAlign: 'center', padding: '52px 24px',
                color: 'var(--eb-muted)', fontSize: 13,
                border: '1px dashed var(--eb-border)', borderRadius: 10,
              }}>
                No playbooks match your filters.{' '}
                <button
                  type="button"
                  onClick={() => { setSearch(''); setSessionFilter([]); setStatusFilter([]); }}
                  style={{ background: 'none', border: 'none', color: 'var(--green)', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit', padding: 0 }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
                gap: 14,
              }}>
                {filtered.map((pb, i) => (
                  <PlaybookCard
                    key={pb.id}
                    playbook={pb}
                    index={i}
                    onDelete={() => setDeleteTarget({ id: pb.id, name: pb.name, accent: ACCENTS[i % ACCENTS.length]!, tradeCount: pb._count.positions })}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <PlaybookFormDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      {deleteTarget && (
        <DeleteConfirmDialog
          playbook={deleteTarget}
          accent={deleteTarget.accent}
          tradeCount={deleteTarget.tradeCount}
          isPending={deletePlaybook.isPending}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            await deletePlaybook.mutateAsync(deleteTarget.id);
            setDeleteTarget(null);
          }}
        />
      )}
    </>
  );
}
