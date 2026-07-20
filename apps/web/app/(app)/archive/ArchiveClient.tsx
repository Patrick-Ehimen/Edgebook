'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useArchiveList, usePurgeArchiveItem, useRestoreArchiveItem } from '@/features/archive';
import { ApiError } from '@/lib/api-client';
import { useArchiveSettings } from '@/providers/archive-provider';
import type { ArchiveItemType, ArchivedItem } from '@edgebook/shared';
import {
  Archive as ArchiveIcon,
  ArchiveRestore,
  ArrowDownUp,
  Check,
  Clock,
  Eye,
  History,
  PieChart,
  Search,
  Settings2,
  Sparkles,
  Trash2,
  TriangleAlert,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  TYPE_META,
  daysAgoLabel,
  daysRemaining,
  fmtCountdown,
  relativeTime,
  urgencyOf,
} from './type-meta';
import type { Urgency } from './type-meta';

function errorMessage(err: unknown, fallback: string): string {
  return err instanceof ApiError ? err.message : fallback;
}

// ─── shared style tokens ────────────────────────────────────────────────────

const panel: React.CSSProperties = {
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  borderRadius: 11,
  padding: 14,
};

const panelTitle: React.CSSProperties = {
  margin: '0 0 12px',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  letterSpacing: '.05em',
  textTransform: 'uppercase',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 8,
};

const dialogContentStyle: React.CSSProperties = {
  maxWidth: 440,
  background: 'var(--eb-panel)',
  border: '1px solid var(--eb-border)',
  color: 'var(--eb-text)',
};

const dialogDescriptionStyle: React.CSSProperties = {
  color: 'var(--eb-muted-2)',
};

const URGENCY_STYLE: Record<Urgency, { bg: string; color: string; border: string }> = {
  urgent: { bg: 'rgba(255,91,108,.12)', color: 'var(--eb-red)', border: 'rgba(255,91,108,.30)' },
  warn: { bg: 'rgba(245,165,36,.10)', color: 'var(--eb-yellow)', border: 'rgba(245,165,36,.25)' },
  safe: { bg: 'rgba(0,214,143,.10)', color: 'var(--green)', border: 'rgba(0,214,143,.25)' },
};

function actionBtn(color?: string): React.CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    background: color ? `${color}14` : 'transparent',
    border: `1px solid ${color ? `${color}4d` : 'var(--eb-border)'}`,
    color: color ?? 'var(--eb-muted)',
    cursor: 'pointer',
    padding: '5px 9px',
    borderRadius: 6,
    fontSize: 11.5,
    fontFamily: 'inherit',
  };
}

// ─── item row ───────────────────────────────────────────────────────────────

function ItemRow({
  item,
  retentionDays,
  selected,
  onToggleSelect,
  onView,
  onRestore,
  onPurge,
}: {
  item: ArchivedItem;
  retentionDays: number;
  selected: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onRestore: () => void;
  onPurge: () => void;
}) {
  const meta = TYPE_META[item.type];
  const left = daysRemaining(item.removedAt, retentionDays);
  const urgency = urgencyOf(left);
  const uStyle = URGENCY_STYLE[urgency];

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 36px 1fr auto auto auto',
        gap: 12,
        padding: '12px 14px',
        alignItems: 'center',
        borderBottom: '1px solid var(--eb-border)',
      }}
    >
      <button
        type="button"
        onClick={onToggleSelect}
        aria-label={selected ? 'Deselect item' : 'Select item'}
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: selected ? 0 : '1.5px solid var(--eb-muted)',
          background: selected ? 'var(--green)' : 'transparent',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 0,
        }}
      >
        {selected && <Check size={11} color="#06140f" strokeWidth={3} />}
      </button>

      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: meta.bg,
          color: meta.color,
          border: `1px solid ${meta.border}`,
          flexShrink: 0,
        }}
      >
        <meta.Icon size={16} strokeWidth={1.8} />
      </div>

      <div style={{ minWidth: 0 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            color: 'var(--eb-text)',
          }}
        >
          {item.title}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--eb-muted)',
            marginTop: 2,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {item.context}
        </div>
      </div>

      <div
        style={{
          fontSize: 10.5,
          color: 'var(--eb-muted)',
          fontFamily: '"JetBrains Mono", monospace',
          whiteSpace: 'nowrap',
        }}
      >
        From <b style={{ color: 'var(--eb-text)', fontWeight: 600 }}>{item.originLabel}</b>
        <br />
        Removed {daysAgoLabel(item.removedAt)}
      </div>

      <div
        style={{
          fontSize: 11,
          fontFamily: '"JetBrains Mono", monospace',
          fontWeight: 600,
          padding: '4px 9px',
          borderRadius: 6,
          textAlign: 'center',
          minWidth: 96,
          background: uStyle.bg,
          color: uStyle.color,
          border: `1px solid ${uStyle.border}`,
        }}
      >
        {fmtCountdown(left)}
        <div
          style={{
            fontSize: 9,
            color: 'var(--eb-muted)',
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            marginTop: 1,
            fontWeight: 600,
          }}
        >
          until purge
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button type="button" title="View" onClick={onView} style={actionBtn()}>
          <Eye size={12} />
        </button>
        <button type="button" title="Restore" onClick={onRestore} style={actionBtn('var(--green)')}>
          <ArchiveRestore size={12} /> Restore
        </button>
        <button
          type="button"
          title="Delete now"
          onClick={onPurge}
          style={actionBtn('var(--eb-red)')}
        >
          <X size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── section (urgency bucket) ───────────────────────────────────────────────

function Section({
  title,
  tone,
  toneLabel,
  sub,
  items,
  retentionDays,
  selected,
  onToggleSelect,
  onView,
  onRestore,
  onPurge,
  onRestoreAll,
  onPurgeAll,
}: {
  title: string;
  tone: Urgency;
  toneLabel: string;
  sub: string;
  items: ArchivedItem[];
  retentionDays: number;
  selected: Set<string>;
  onToggleSelect: (id: string) => void;
  onView: (item: ArchivedItem) => void;
  onRestore: (item: ArchivedItem) => void;
  onPurge: (item: ArchivedItem) => void;
  onRestoreAll?: () => void;
  onPurgeAll?: () => void;
}) {
  if (items.length === 0) return null;
  const uStyle = URGENCY_STYLE[tone];

  return (
    <div style={{ marginBottom: 4 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          margin: '16px 0 10px',
          flexWrap: 'wrap',
        }}
      >
        <h3
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: 'var(--eb-text)',
          }}
        >
          <span
            style={{
              fontSize: 9.5,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 99,
              textTransform: 'uppercase',
              letterSpacing: '.04em',
              background: uStyle.bg,
              color: uStyle.color,
              border: `1px solid ${uStyle.border}`,
            }}
          >
            {toneLabel}
          </span>
          {title}
        </h3>
        <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>{sub}</span>
        {(onRestoreAll || onPurgeAll) && (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
            {onRestoreAll && (
              <button type="button" onClick={onRestoreAll} style={actionBtn('var(--green)')}>
                <ArchiveRestore size={12} /> Restore all {items.length}
              </button>
            )}
            {onPurgeAll && (
              <button type="button" onClick={onPurgeAll} style={actionBtn('var(--eb-red)')}>
                <Trash2 size={12} /> Purge now
              </button>
            )}
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--eb-panel)',
          border: `1px solid ${tone === 'urgent' ? 'rgba(255,91,108,.30)' : 'var(--eb-border)'}`,
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {items.map((item) => (
          <ItemRow
            key={item.id}
            item={item}
            retentionDays={retentionDays}
            selected={selected.has(item.id)}
            onToggleSelect={() => onToggleSelect(item.id)}
            onView={() => onView(item)}
            onRestore={() => onRestore(item)}
            onPurge={() => onPurge(item)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── toggle switch ──────────────────────────────────────────────────────────

function ToggleRow({
  label,
  desc,
  checked,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 0',
        borderBottom: '1px dashed var(--eb-border)',
        fontSize: 12,
      }}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          position: 'relative',
          width: 32,
          height: 18,
          borderRadius: 99,
          border: `1px solid ${checked ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
          background: checked ? 'rgba(0,214,143,.25)' : 'var(--eb-panel-2)',
          cursor: 'pointer',
          flexShrink: 0,
          padding: 0,
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 1,
            left: checked ? 16 : 2,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: checked ? 'var(--green)' : 'var(--eb-muted)',
            transition: 'left .15s',
          }}
        />
      </button>
      <div style={{ flex: 1 }}>
        <b style={{ display: 'block', fontSize: 12, fontWeight: 500, color: 'var(--eb-text)' }}>
          {label}
        </b>
        <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 1 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── skeleton ───────────────────────────────────────────────────────────────

function SkeletonBox({
  w = '100%',
  h = 12,
  r = 6,
  style,
}: {
  w?: string | number;
  h?: number;
  r?: number;
  style?: React.CSSProperties;
}) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          'linear-gradient(90deg, var(--eb-panel-2) 25%, var(--eb-border) 50%, var(--eb-panel-2) 75%)',
        backgroundSize: '400% 100%',
        animation: 'eb-shimmer 1.4s ease infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function SkeletonItemRow() {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '20px 36px 1fr auto auto auto',
        gap: 12,
        padding: '12px 14px',
        alignItems: 'center',
        borderBottom: '1px solid var(--eb-border)',
      }}
    >
      <SkeletonBox w={16} h={16} r={4} />
      <SkeletonBox w={36} h={36} r={10} />
      <div style={{ minWidth: 0 }}>
        <SkeletonBox w="55%" h={13} r={4} style={{ marginBottom: 6 }} />
        <SkeletonBox w="80%" h={10} r={4} />
      </div>
      <SkeletonBox w={90} h={26} r={4} />
      <SkeletonBox w={96} h={30} r={6} />
      <div style={{ display: 'flex', gap: 4 }}>
        <SkeletonBox w={26} h={22} r={6} />
        <SkeletonBox w={58} h={22} r={6} />
        <SkeletonBox w={26} h={22} r={6} />
      </div>
    </div>
  );
}

function SkeletonSection({ titleWidth, rows }: { titleWidth: number; rows: number }) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ margin: '16px 0 10px' }}>
        <SkeletonBox w={titleWidth} h={13} r={4} />
      </div>
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        {Array.from({ length: rows }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton row order
          <SkeletonItemRow key={i} />
        ))}
      </div>
    </div>
  );
}

function SkeletonPanel({ titleWidth, lines }: { titleWidth: number; lines: number }) {
  return (
    <div style={panel}>
      <div style={{ marginBottom: 12 }}>
        <SkeletonBox w={titleWidth} h={11} r={4} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {Array.from({ length: lines }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton row order
          <SkeletonBox key={i} w={i % 2 === 0 ? '100%' : '70%'} h={11} r={4} />
        ))}
      </div>
    </div>
  );
}

function ArchiveSkeleton() {
  return (
    <>
      <style>
        {'@keyframes eb-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}'}
      </style>
      <div style={{ padding: '18px 26px 80px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {/* hero */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(122,131,149,.06), rgba(122,131,149,.02))',
            border: '1px solid var(--eb-border)',
            borderRadius: 14,
            padding: '18px 22px',
            marginBottom: 14,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <SkeletonBox w={52} h={52} r={13} />
          <div style={{ flex: 1, minWidth: 220 }}>
            <SkeletonBox w={140} h={20} r={5} style={{ marginBottom: 8 }} />
            <SkeletonBox w="70%" h={12} r={4} />
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[1, 2, 3].map((k) => (
              <SkeletonBox key={k} w={110} h={48} r={9} />
            ))}
          </div>
        </div>

        {/* filter strip */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 14,
            padding: '8px 10px',
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 11,
          }}
        >
          {[64, 92, 88, 76].map((w, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: stable skeleton chip order
            <SkeletonBox key={i} w={w} h={24} r={99} />
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
          {/* left — sections */}
          <div>
            <SkeletonSection titleWidth={200} rows={2} />
            <SkeletonSection titleWidth={160} rows={3} />
          </div>

          {/* right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <SkeletonPanel titleWidth={120} lines={3} />
            <SkeletonPanel titleWidth={140} lines={4} />
            <SkeletonPanel titleWidth={120} lines={5} />
            <SkeletonPanel titleWidth={150} lines={3} />
          </div>
        </div>
      </div>
    </>
  );
}

// ─── empty states ───────────────────────────────────────────────────────────

const TYPE_PREVIEWS: { type: ArchiveItemType; desc: string; peek: string }[] = [
  {
    type: 'watchlist',
    desc: 'Tokens removed from any of your three horizons — manually or by auto-clear.',
    peek: '"PEPEUSDT · month watchlist" · watch bias · conviction 4/5',
  },
  {
    type: 'notes',
    desc: 'Deleted library notes. Restoring puts them right back in their folder.',
    peek: '"Funding squeeze v1" · 1,240 words · setups, deprecated',
  },
  {
    type: 'playbook',
    desc: 'Playbooks you archived — often replaced by newer versions. Historical trades stay intact.',
    peek: '"Playbook · Trend continuation v1" · active · 26 trades',
  },
  {
    type: 'journal',
    desc: 'Deleted daily journal entries. Writing a new entry for that date restores it automatically.',
    peek: '"Journal · 2026-07-14" · finalized · lesson noted',
  },
];

function EmptyState({
  variant,
  retentionDays,
  settings,
  activity,
  onUpdateSetting,
}: {
  variant: 'fresh' | 'cleaned';
  retentionDays: number;
  settings: ReturnType<typeof useArchiveSettings>['settings'];
  activity: ReturnType<typeof useArchiveSettings>['activity'];
  onUpdateSetting: ReturnType<typeof useArchiveSettings>['updateSetting'];
}) {
  return (
    <div style={{ padding: '20px 26px 80px', maxWidth: 1080, margin: '0 auto' }}>
      {variant === 'cleaned' && (
        <div
          style={{
            background: 'linear-gradient(180deg,rgba(0,214,143,.06),transparent)',
            border: '1px solid rgba(0,214,143,.25)',
            borderRadius: 11,
            padding: '10px 14px',
            marginBottom: 14,
            display: 'flex',
            gap: 11,
            alignItems: 'center',
            fontSize: 12.5,
            color: 'var(--eb-muted-2)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 7,
              background: 'rgba(0,214,143,.16)',
              color: 'var(--green)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <Check size={13} />
          </div>
          <div>
            Your archive is now clean — everything was either restored or permanently purged.
          </div>
        </div>
      )}

      {/* hero */}
      <div style={{ textAlign: 'center', padding: '16px 16px 28px' }}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: '0 auto 18px',
            borderRadius: 18,
            background:
              variant === 'fresh'
                ? 'linear-gradient(135deg,rgba(0,214,143,.18),rgba(6,182,212,.10))'
                : 'linear-gradient(135deg,rgba(139,92,246,.18),rgba(6,182,212,.10))',
            border: '1px solid var(--eb-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: variant === 'fresh' ? 'var(--green)' : 'var(--eb-purple)',
          }}
        >
          {variant === 'fresh' ? (
            <ArchiveIcon size={30} strokeWidth={1.6} />
          ) : (
            <Sparkles size={30} strokeWidth={1.6} />
          )}
        </div>
        <h1
          style={{
            margin: '0 0 10px',
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: '-.02em',
            color: 'var(--eb-text)',
          }}
        >
          {variant === 'fresh' ? 'Nothing archived yet' : 'All clear · nothing to review'}
        </h1>
        <p
          style={{
            margin: '0 auto 18px',
            maxWidth: 520,
            color: 'var(--eb-muted-2)',
            fontSize: 13.5,
            lineHeight: 1.55,
          }}
        >
          {variant === 'fresh' ? (
            <>
              Your Archive is quietly empty — a good sign. When you delete anything from Edgebook,
              it lands here for <b style={{ color: 'var(--eb-text)' }}>{retentionDays} days</b>{' '}
              before being permanently removed. You can restore items at any time during that
              window.
            </>
          ) : (
            <>
              Everything that was sitting in your archive has been restored or permanently purged.
              Nothing else is waiting — your workspace is tidy.
            </>
          )}
        </p>
        <div style={{ display: 'inline-flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
          <span
            style={{
              fontSize: 11.5,
              padding: '2px 9px',
              borderRadius: 99,
              border: '1px solid rgba(0,214,143,.30)',
              background: 'rgba(0,214,143,.08)',
              color: 'var(--green)',
            }}
          >
            0 items archived
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
            {retentionDays}-day retention
          </span>
        </div>
      </div>

      {variant === 'fresh' && (
        <>
          {/* how it works */}
          <div style={{ ...panel, padding: '20px 22px', marginBottom: 14 }}>
            <h3
              style={{
                margin: '0 0 14px',
                fontSize: 11,
                fontWeight: 600,
                color: 'var(--eb-muted-2)',
                letterSpacing: '.06em',
                textTransform: 'uppercase',
                textAlign: 'center',
              }}
            >
              How the archive works
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                {
                  n: '01',
                  Icon: Trash2,
                  color: 'var(--eb-red)',
                  title: 'You delete',
                  desc: 'From any surface — watchlist tokens, notes, playbooks, rules, goals. Deletion is always reversible.',
                },
                {
                  n: '02',
                  Icon: Clock,
                  color: 'var(--eb-yellow)',
                  title: `Sits here for ${retentionDays} days`,
                  desc: "Fully searchable, restorable, and previewable. You'll get a Sunday digest if anything is about to expire.",
                },
                {
                  n: '03',
                  Icon: X,
                  color: 'var(--eb-muted-2)',
                  title: 'Auto-purge',
                  desc: 'After the window, the item is permanently deleted and cannot be recovered.',
                },
              ].map((s) => (
                <div
                  key={s.n}
                  style={{
                    padding: '16px 14px',
                    borderRadius: 12,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 26,
                      height: 26,
                      margin: '0 auto 8px',
                      borderRadius: 8,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 11,
                      fontWeight: 700,
                      background: `${s.color}24`,
                      color: s.color,
                      border: `1px solid ${s.color}40`,
                    }}
                  >
                    {s.n}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    <s.Icon size={20} style={{ color: s.color }} />
                  </div>
                  <h4
                    style={{
                      margin: '0 0 4px',
                      fontSize: 13,
                      fontWeight: 600,
                      color: 'var(--eb-text)',
                    }}
                  >
                    {s.title}
                  </h4>
                  <p
                    style={{ margin: 0, fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5 }}
                  >
                    {s.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* type preview grid */}
          <div
            style={{
              margin: '20px 0 12px',
              fontSize: 11,
              fontWeight: 600,
              color: 'var(--eb-muted-2)',
              letterSpacing: '.06em',
              textTransform: 'uppercase',
            }}
          >
            What will show up here
          </div>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 10,
              marginBottom: 14,
            }}
          >
            {TYPE_PREVIEWS.map((tp) => {
              const meta = TYPE_META[tp.type];
              return (
                <div key={tp.type} style={{ ...panel, padding: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 9,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: meta.bg,
                        color: meta.color,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      <meta.Icon size={15} strokeWidth={1.8} />
                    </div>
                    <b style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>
                      {meta.label}
                    </b>
                  </div>
                  <p
                    style={{
                      margin: '0 0 8px',
                      fontSize: 11.5,
                      color: 'var(--eb-muted)',
                      lineHeight: 1.5,
                    }}
                  >
                    {tp.desc}
                  </p>
                  <div
                    style={{
                      padding: '7px 9px',
                      borderRadius: 8,
                      background: 'var(--eb-panel-2)',
                      border: '1px dashed var(--eb-border)',
                      fontSize: 10.5,
                      color: 'var(--eb-muted)',
                      fontStyle: 'italic',
                    }}
                  >
                    {tp.peek}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* settings + activity */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={panel}>
          <h3 style={panelTitle}>
            <span>Archive settings</span>
          </h3>
          <ToggleRow
            label="Sunday reminder · 18:00 UTC"
            desc="Weekly digest of items about to expire"
            checked={settings.sundayReminder}
            onChange={(v) => onUpdateSetting('sundayReminder', v)}
          />
          <ToggleRow
            label="Show archive count in sidebar"
            desc="Yellow badge with count"
            checked={settings.showSidebarCount}
            onChange={(v) => onUpdateSetting('showSidebarCount', v)}
          />
          <ToggleRow
            label="Auto-restore on same-day re-add"
            desc="If you re-add something you archived today, restore instead"
            checked={settings.autoRestoreSameDay}
            onChange={(v) => onUpdateSetting('autoRestoreSameDay', v)}
          />
          <ToggleRow
            label="Extend retention to 60 days"
            desc="More time to recover"
            checked={settings.extendedRetention}
            onChange={(v) => onUpdateSetting('extendedRetention', v)}
          />
        </div>

        <div style={panel}>
          <h3 style={panelTitle}>
            <span>{variant === 'fresh' ? 'Archive activity' : 'Recent archive activity'}</span>
          </h3>
          {activity.length === 0 ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px 8px',
                textAlign: 'center',
                color: 'var(--eb-muted)',
                fontSize: 12,
                lineHeight: 1.55,
              }}
            >
              <History size={26} style={{ marginBottom: 8, opacity: 0.5 }} />
              <b style={{ color: 'var(--eb-text)' }}>No archive activity yet</b>
              You haven't archived or restored anything. When you do, the last 30 events show up
              here.
            </div>
          ) : (
            activity.slice(0, 8).map((a) => (
              <div
                key={a.id}
                style={{
                  display: 'flex',
                  gap: 9,
                  padding: '8px 0',
                  borderBottom: '1px dashed var(--eb-border)',
                  fontSize: 11.5,
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    fontFamily: '"JetBrains Mono", monospace',
                    fontSize: 10,
                    color: 'var(--eb-muted)',
                    flex: '0 0 55px',
                    paddingTop: 2,
                  }}
                >
                  {relativeTime(a.when)}
                </div>
                <div style={{ flex: 1, lineHeight: 1.5, color: 'var(--eb-muted-2)' }}>{a.text}</div>
              </div>
            ))
          )}
        </div>
      </div>

      <div
        style={{
          marginTop: 32,
          padding: '18px 22px',
          textAlign: 'center',
          borderTop: '1px dashed var(--eb-border)',
          color: 'var(--eb-muted)',
          fontSize: 11,
          maxWidth: 620,
          marginLeft: 'auto',
          marginRight: 'auto',
          lineHeight: 1.6,
        }}
      >
        Nothing in Edgebook is destroyed on deletion. Everything sits here first — safely, quietly,
        waiting to be restored if you change your mind.
      </div>
    </div>
  );
}

// ─── main client ────────────────────────────────────────────────────────────

type SortKey = 'expiring' | 'recent' | 'type' | 'origin';

export function ArchiveClient() {
  const { data: items = [], isLoading } = useArchiveList();
  const {
    activity,
    settings,
    retentionDays,
    everHadActivity,
    recordActivity,
    recordPurge,
    updateSetting,
  } = useArchiveSettings();
  const restoreMutation = useRestoreArchiveItem();
  const purgeMutation = usePurgeArchiveItem();
  const [typeFilter, setTypeFilter] = useState<ArchiveItemType | 'all'>('all');
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('expiring');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewing, setViewing] = useState<ArchivedItem | null>(null);
  const [purgeRequest, setPurgeRequest] = useState<ArchivedItem[] | null>(null);
  const [isPurging, setIsPurging] = useState(false);

  const typeCounts = useMemo(() => {
    const counts: Partial<Record<ArchiveItemType, number>> = {};
    for (const item of items) counts[item.type] = (counts[item.type] ?? 0) + 1;
    return counts;
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (i) => i.title.toLowerCase().includes(q) || i.context.toLowerCase().includes(q),
      );
    }
    const sorted = [...list];
    switch (sortBy) {
      case 'expiring':
        sorted.sort(
          (a, b) =>
            daysRemaining(a.removedAt, retentionDays) - daysRemaining(b.removedAt, retentionDays),
        );
        break;
      case 'recent':
        sorted.sort((a, b) => new Date(b.removedAt).getTime() - new Date(a.removedAt).getTime());
        break;
      case 'type':
        sorted.sort((a, b) => TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label));
        break;
      case 'origin':
        sorted.sort((a, b) => a.originLabel.localeCompare(b.originLabel));
        break;
    }
    return sorted;
  }, [items, typeFilter, query, sortBy, retentionDays]);

  const urgentItems = filtered.filter(
    (i) => urgencyOf(daysRemaining(i.removedAt, retentionDays)) === 'urgent',
  );
  const warnItems = filtered.filter(
    (i) => urgencyOf(daysRemaining(i.removedAt, retentionDays)) === 'warn',
  );
  const safeItems = filtered.filter(
    (i) => urgencyOf(daysRemaining(i.removedAt, retentionDays)) === 'safe',
  );

  const allUrgentCount = items.filter(
    (i) => urgencyOf(daysRemaining(i.removedAt, retentionDays)) === 'urgent',
  ).length;
  const oldestDays = items.length
    ? Math.max(
        ...items.map((i) =>
          Math.floor((Date.now() - new Date(i.removedAt).getTime()) / 86_400_000),
        ),
      )
    : 0;

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function doRestore(item: ArchivedItem) {
    try {
      await restoreMutation.mutateAsync({ type: item.type, id: item.id });
      recordActivity({ text: `You restored "${item.title}"`, type: item.type });
      toast.success('Item restored');
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to restore item'));
    }
  }

  async function doBulkRestore(list: ArchivedItem[]) {
    if (list.length === 0) return;
    try {
      await Promise.all(list.map((i) => restoreMutation.mutateAsync({ type: i.type, id: i.id })));
      recordActivity({
        text: `You restored ${list.length} item${list.length === 1 ? '' : 's'} from archive`,
      });
      toast.success(`Restored ${list.length} item${list.length === 1 ? '' : 's'}`);
    } catch (err) {
      toast.error(errorMessage(err, 'Some items failed to restore'));
    }
  }

  function requestPurge(list: ArchivedItem[]) {
    if (list.length === 0) return;
    setPurgeRequest(list);
  }

  async function confirmPurge() {
    const list = purgeRequest;
    if (!list || list.length === 0) return;
    setIsPurging(true);
    try {
      await Promise.all(list.map((i) => purgeMutation.mutateAsync({ type: i.type, id: i.id })));
      const only = list.length === 1 ? list[0] : undefined;
      recordActivity(
        only
          ? { text: `You purged "${only.title}" permanently`, type: only.type }
          : { text: `You purged ${list.length} items permanently` },
      );
      recordPurge(list.length);
      toast.success(
        list.length === 1 ? 'Item permanently deleted' : `Purged ${list.length} items permanently`,
      );
      setSelected(new Set());
      setPurgeRequest(null);
    } catch (err) {
      toast.error(errorMessage(err, 'Failed to delete item(s)'));
    } finally {
      setIsPurging(false);
    }
  }

  function handleBulkRestore() {
    const list = items.filter((i) => selected.has(i.id));
    doBulkRestore(list);
    setSelected(new Set());
  }

  function handleBulkPurge() {
    requestPurge(items.filter((i) => selected.has(i.id)));
  }

  if (isLoading) {
    return <ArchiveSkeleton />;
  }

  if (items.length === 0) {
    return (
      <EmptyState
        variant={everHadActivity ? 'cleaned' : 'fresh'}
        retentionDays={retentionDays}
        settings={settings}
        activity={activity}
        onUpdateSetting={updateSetting}
      />
    );
  }

  const breakdown = Object.entries(typeCounts)
    .map(([type, count]) => ({ type: type as ArchiveItemType, count: count ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div style={{ padding: '18px 26px 80px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
      {/* hero */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(122,131,149,.06), rgba(122,131,149,.02))',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: '18px 22px',
          marginBottom: 14,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: 13,
            background: 'rgba(122,131,149,.14)',
            border: '1px solid var(--eb-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--eb-muted-2)',
            flex: '0 0 52px',
          }}
        >
          <ArchiveIcon size={24} strokeWidth={1.6} />
        </div>
        <div style={{ flex: 1, minWidth: 220 }}>
          <h1
            style={{
              margin: '0 0 4px',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '-.015em',
              color: 'var(--eb-text)',
            }}
          >
            Archive
          </h1>
          <div style={{ fontSize: 12.5, color: 'var(--eb-muted-2)' }}>
            Deleted items go here first · restore any time within{' '}
            <b style={{ color: 'var(--eb-text)' }}>{retentionDays} days</b> · permanent purge after
            that.
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {[
            { l: 'Items in archive', v: String(items.length) },
            {
              l: 'Expiring < 5d',
              v: String(allUrgentCount),
              color: allUrgentCount > 0 ? 'var(--eb-red)' : undefined,
            },
            { l: 'Oldest item', v: `${oldestDays}d ago` },
          ].map((s) => (
            <div
              key={s.l}
              style={{
                padding: '8px 14px',
                borderRadius: 9,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                }}
              >
                {s.l}
              </div>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 600,
                  fontFamily: '"JetBrains Mono", monospace',
                  marginTop: 2,
                  letterSpacing: '-.01em',
                  color: s.color ?? 'var(--eb-text)',
                }}
              >
                {s.v}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* urgent banner */}
      {allUrgentCount > 0 && (
        <div
          style={{
            background: 'linear-gradient(180deg,rgba(255,91,108,.10),rgba(255,91,108,.03))',
            border: '1px solid rgba(255,91,108,.35)',
            borderRadius: 12,
            padding: '14px 16px',
            marginBottom: 14,
            display: 'flex',
            gap: 12,
            alignItems: 'center',
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 9,
              background: 'rgba(255,91,108,.20)',
              color: 'var(--eb-red)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: '0 0 32px',
            }}
          >
            <TriangleAlert size={15} />
          </div>
          <div style={{ flex: 1 }}>
            <b style={{ color: 'var(--eb-text)', fontWeight: 600 }}>
              {allUrgentCount} item{allUrgentCount === 1 ? '' : 's'} will be permanently deleted in
              the next 5 days.
            </b>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted-2)', marginTop: 3 }}>
              Once purged they cannot be recovered
              {settings.sundayReminder &&
                ' · your weekly reminder is Sunday 18:00 UTC for anything expiring the week ahead.'}
            </div>
          </div>
        </div>
      )}

      {/* filter strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 14,
          flexWrap: 'wrap',
          padding: '8px 10px',
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
        }}
      >
        <span
          style={{
            fontSize: 10.5,
            color: 'var(--eb-muted)',
            marginRight: 3,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            fontWeight: 600,
          }}
        >
          Filter
        </span>
        <button
          type="button"
          onClick={() => setTypeFilter('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11.5,
            padding: '5px 10px',
            borderRadius: 99,
            border: `1px solid ${typeFilter === 'all' ? 'rgba(0,214,143,.30)' : 'var(--eb-border)'}`,
            background: typeFilter === 'all' ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
            color: typeFilter === 'all' ? 'var(--eb-text)' : 'var(--eb-muted-2)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <ArchiveIcon size={11} /> All
          <span
            style={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
              color: typeFilter === 'all' ? 'var(--green)' : 'var(--eb-muted)',
              padding: '1px 6px',
              borderRadius: 99,
              background: 'var(--eb-panel)',
            }}
          >
            {items.length}
          </span>
        </button>
        {breakdown.map(({ type, count }) => {
          const meta = TYPE_META[type];
          const on = typeFilter === type;
          return (
            <button
              key={type}
              type="button"
              onClick={() => setTypeFilter(on ? 'all' : type)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                fontSize: 11.5,
                padding: '5px 10px',
                borderRadius: 99,
                border: `1px solid ${on ? 'rgba(0,214,143,.30)' : 'var(--eb-border)'}`,
                background: on ? 'rgba(0,214,143,.10)' : 'var(--eb-panel-2)',
                color: on ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <meta.Icon size={11} /> {meta.label}
              <span
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 10,
                  color: on ? 'var(--green)' : 'var(--eb-muted)',
                  padding: '1px 6px',
                  borderRadius: 99,
                  background: 'var(--eb-panel)',
                }}
              >
                {count}
              </span>
            </button>
          );
        })}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 7,
              padding: '4px 8px',
            }}
          >
            <Search size={12} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search deleted items…"
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: 'var(--eb-text)',
                fontSize: 11.5,
                width: 150,
                fontFamily: 'inherit',
              }}
            />
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 7,
              padding: '4px 8px',
            }}
          >
            <ArrowDownUp size={11} style={{ color: 'var(--eb-muted)' }} />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortKey)}
              style={{
                border: 0,
                outline: 0,
                background: 'transparent',
                color: 'var(--eb-text)',
                fontSize: 11,
                fontFamily: 'inherit',
              }}
            >
              <option value="expiring">Sort · expiring soonest</option>
              <option value="recent">Deleted most recent</option>
              <option value="type">By type</option>
              <option value="origin">By original location</option>
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 14 }}>
        {/* left — item list */}
        <div>
          {selected.size > 0 && (
            <div
              style={{
                background: 'linear-gradient(180deg,rgba(0,214,143,.06),transparent)',
                border: '1px solid rgba(0,214,143,.30)',
                borderRadius: 11,
                padding: '9px 14px',
                marginBottom: 10,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  fontSize: 11.5,
                  padding: '2px 9px',
                  borderRadius: 99,
                  border: '1px solid rgba(0,214,143,.30)',
                  background: 'rgba(0,214,143,.08)',
                  color: 'var(--green)',
                }}
              >
                {selected.size} selected
              </span>
              <span style={{ fontSize: 12, color: 'var(--eb-muted-2)' }}>
                Choose an action for selected items
              </span>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 5 }}>
                <button type="button" onClick={handleBulkRestore} style={actionBtn('var(--green)')}>
                  <ArchiveRestore size={12} /> Restore selected
                </button>
                <button type="button" onClick={handleBulkPurge} style={actionBtn('var(--eb-red)')}>
                  <Trash2 size={12} /> Delete permanently
                </button>
                <button type="button" onClick={() => setSelected(new Set())} style={actionBtn()}>
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div
              style={{
                ...panel,
                textAlign: 'center',
                padding: '40px 20px',
                color: 'var(--eb-muted)',
                fontSize: 12.5,
              }}
            >
              No archived items match your filters.
            </div>
          ) : (
            <>
              <Section
                title="Expiring in the next 5 days"
                tone="urgent"
                toneLabel="urgent"
                sub={`${urgentItems.length} item${urgentItems.length === 1 ? '' : 's'} · unrecoverable after purge`}
                items={urgentItems}
                retentionDays={retentionDays}
                selected={selected}
                onToggleSelect={toggleSelect}
                onView={setViewing}
                onRestore={doRestore}
                onPurge={(item) => requestPurge([item])}
                onRestoreAll={() => doBulkRestore(urgentItems)}
                onPurgeAll={() => requestPurge(urgentItems)}
              />
              <Section
                title="Expiring in 5–15 days"
                tone="warn"
                toneLabel="soon"
                sub={`${warnItems.length} item${warnItems.length === 1 ? '' : 's'} · plenty of time to restore`}
                items={warnItems}
                retentionDays={retentionDays}
                selected={selected}
                onToggleSelect={toggleSelect}
                onView={setViewing}
                onRestore={doRestore}
                onPurge={(item) => requestPurge([item])}
              />
              <Section
                title={`Expiring in 15–${retentionDays} days`}
                tone="safe"
                toneLabel="safe"
                sub={`${safeItems.length} item${safeItems.length === 1 ? '' : 's'} · recent deletions`}
                items={safeItems}
                retentionDays={retentionDays}
                selected={selected}
                onToggleSelect={toggleSelect}
                onView={setViewing}
                onRestore={doRestore}
                onPurge={(item) => requestPurge([item])}
              />
            </>
          )}
        </div>

        {/* right sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* retention */}
          <div style={panel}>
            <h3 style={panelTitle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Clock size={12} /> Retention window
              </span>
              <button
                type="button"
                onClick={() => {
                  updateSetting('extendedRetention', !settings.extendedRetention);
                  toast.success(`Retention set to ${settings.extendedRetention ? 30 : 60} days`);
                }}
                style={{
                  fontSize: 11,
                  padding: '3px 9px',
                  borderRadius: 7,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-text)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Edit
              </button>
            </h3>
            <div
              style={{
                padding: 12,
                borderRadius: 9,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  fontSize: 9.5,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                  fontWeight: 600,
                }}
              >
                Auto-purge after
              </div>
              <div
                style={{
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 22,
                  fontWeight: 600,
                  marginTop: 4,
                  letterSpacing: '-.02em',
                  color: 'var(--eb-text)',
                }}
              >
                {retentionDays} days
              </div>
              <div style={{ fontSize: 10.5, color: 'var(--eb-muted)', marginTop: 2 }}>
                from date of deletion
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted-2)', lineHeight: 1.55 }}>
              Items sit in Archive for{' '}
              <b style={{ color: 'var(--eb-text)' }}>{retentionDays} days</b> then are permanently
              deleted. Once purged they're unrecoverable —{' '}
              <b style={{ color: 'var(--eb-text)' }}>not even Edgebook support can restore them</b>.
            </div>
          </div>

          {/* breakdown */}
          <div style={panel}>
            <h3 style={panelTitle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <PieChart size={12} /> What's in your archive
              </span>
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12 }}>
              {breakdown.map(({ type, count }) => {
                const meta = TYPE_META[type];
                const pct = Math.round((count / items.length) * 100);
                return (
                  <div key={type}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          color: 'var(--eb-text)',
                        }}
                      >
                        <meta.Icon size={12} style={{ color: meta.color }} /> {meta.label}
                      </span>
                      <span>
                        <b style={{ fontFamily: '"JetBrains Mono", monospace' }}>{count}</b>{' '}
                        <span style={{ color: 'var(--eb-muted)' }}>· {pct}%</span>
                      </span>
                    </div>
                    <div
                      style={{
                        height: 6,
                        borderRadius: 99,
                        background: 'var(--eb-panel-2)',
                        overflow: 'hidden',
                        margin: '4px 0 6px',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: meta.color,
                          borderRadius: 99,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* settings */}
          <div style={panel}>
            <h3 style={panelTitle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Settings2 size={12} /> Archive settings
              </span>
            </h3>
            <ToggleRow
              label="Sunday reminder · 18:00 UTC"
              desc="Weekly digest of items about to expire"
              checked={settings.sundayReminder}
              onChange={(v) => updateSetting('sundayReminder', v)}
            />
            <ToggleRow
              label="Show archive count in sidebar"
              desc="Yellow badge with count"
              checked={settings.showSidebarCount}
              onChange={(v) => updateSetting('showSidebarCount', v)}
            />
            <ToggleRow
              label="Auto-restore on same-day re-add"
              desc="If you re-add a token you archived today, restore instead"
              checked={settings.autoRestoreSameDay}
              onChange={(v) => updateSetting('autoRestoreSameDay', v)}
            />
            <ToggleRow
              label="Extend retention to 60 days"
              desc="More time to recover"
              checked={settings.extendedRetention}
              onChange={(v) => updateSetting('extendedRetention', v)}
            />
          </div>

          {/* recent activity */}
          <div style={panel}>
            <h3 style={panelTitle}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <History size={12} /> Recent archive activity
              </span>
            </h3>
            {activity.length === 0 ? (
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--eb-muted)',
                  textAlign: 'center',
                  padding: '10px 0',
                }}
              >
                No activity yet.
              </div>
            ) : (
              activity.slice(0, 7).map((a) => (
                <div
                  key={a.id}
                  style={{
                    display: 'flex',
                    gap: 9,
                    padding: '6px 0',
                    borderBottom: '1px dashed var(--eb-border)',
                    fontSize: 11.5,
                    alignItems: 'flex-start',
                  }}
                >
                  <div
                    style={{
                      fontFamily: '"JetBrains Mono", monospace',
                      fontSize: 10,
                      color: 'var(--eb-muted)',
                      flex: '0 0 50px',
                      paddingTop: 2,
                    }}
                  >
                    {relativeTime(a.when)}
                  </div>
                  <div style={{ flex: 1, lineHeight: 1.5, color: 'var(--eb-muted-2)' }}>
                    {a.text}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* view item dialog */}
      <Dialog open={!!viewing} onOpenChange={(open) => !open && setViewing(null)}>
        <DialogContent style={dialogContentStyle}>
          {viewing && (
            <>
              <DialogHeader>
                <DialogTitle>{viewing.title}</DialogTitle>
                <DialogDescription style={dialogDescriptionStyle}>
                  {viewing.context}
                </DialogDescription>
              </DialogHeader>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--eb-muted-2)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 6,
                  marginTop: 4,
                }}
              >
                <div>
                  Type: <b style={{ color: 'var(--eb-text)' }}>{TYPE_META[viewing.type].label}</b>
                </div>
                <div>
                  From: <b style={{ color: 'var(--eb-text)' }}>{viewing.originLabel}</b>
                </div>
                <div>
                  Removed:{' '}
                  <b style={{ color: 'var(--eb-text)' }}>{daysAgoLabel(viewing.removedAt)}</b>
                </div>
                <div>
                  Days remaining:{' '}
                  <b style={{ color: 'var(--eb-text)' }}>
                    {fmtCountdown(daysRemaining(viewing.removedAt, retentionDays))}
                  </b>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => {
                    doRestore(viewing);
                    setViewing(null);
                  }}
                  style={{
                    flex: 1,
                    ...actionBtn('var(--green)'),
                    justifyContent: 'center',
                    padding: '8px 0',
                  }}
                >
                  <ArchiveRestore size={13} /> Restore
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setViewing(null);
                    requestPurge([viewing]);
                  }}
                  style={{
                    flex: 1,
                    ...actionBtn('var(--eb-red)'),
                    justifyContent: 'center',
                    padding: '8px 0',
                  }}
                >
                  <Trash2 size={13} /> Delete now
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* purge confirmation */}
      <Dialog
        open={!!purgeRequest}
        onOpenChange={(open) => !open && !isPurging && setPurgeRequest(null)}
      >
        <DialogContent style={dialogContentStyle}>
          {purgeRequest && (
            <>
              <DialogHeader>
                <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    style={{
                      width: 30,
                      height: 30,
                      borderRadius: 8,
                      background: 'rgba(255,91,108,.14)',
                      color: 'var(--eb-red)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Trash2 size={14} />
                  </span>
                  Delete permanently?
                </DialogTitle>
                <DialogDescription style={dialogDescriptionStyle}>
                  {purgeRequest.length === 1
                    ? `"${purgeRequest[0]?.title}" will be permanently deleted. This cannot be undone.`
                    : `${purgeRequest.length} items will be permanently deleted. This cannot be undone.`}
                </DialogDescription>
              </DialogHeader>

              {purgeRequest.length > 1 && (
                <div
                  style={{
                    maxHeight: 140,
                    overflowY: 'auto',
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 8,
                    padding: '8px 10px',
                    marginTop: 4,
                  }}
                >
                  {purgeRequest.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        fontSize: 11.5,
                        color: 'var(--eb-muted-2)',
                        padding: '3px 0',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.title}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button
                  type="button"
                  onClick={() => setPurgeRequest(null)}
                  disabled={isPurging}
                  style={{
                    flex: 1,
                    ...actionBtn(),
                    justifyContent: 'center',
                    padding: '8px 0',
                    opacity: isPurging ? 0.6 : 1,
                    cursor: isPurging ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmPurge}
                  disabled={isPurging}
                  style={{
                    flex: 1,
                    ...actionBtn('var(--eb-red)'),
                    justifyContent: 'center',
                    padding: '8px 0',
                    opacity: isPurging ? 0.7 : 1,
                    cursor: isPurging ? 'not-allowed' : 'pointer',
                  }}
                >
                  <Trash2 size={13} /> {isPurging ? 'Deleting…' : 'Delete permanently'}
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
