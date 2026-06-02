'use client';

import { DeleteConfirmDialog } from '@/features/playbooks/components/DeleteConfirmDialog';
import { PlaybookFormDialog } from '@/features/playbooks/components/PlaybookFormDialog';
import { useDeletePlaybook } from '@/features/playbooks/hooks/useDeletePlaybook';
import { usePlaybook } from '@/features/playbooks/hooks/usePlaybook';
import { useUpdatePlaybookImages } from '@/features/playbooks/hooks/useUpdatePlaybookImages';
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Clock,
  Paperclip,
  Pencil,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

// ── style tokens ──────────────────────────────────────────────────────────────

const HSEC: React.CSSProperties = {
  margin: '0 0 10px',
  fontSize: 11.5,
  fontWeight: 600,
  color: 'var(--eb-muted-2)',
  textTransform: 'uppercase',
  letterSpacing: '.06em',
};

const SEP: React.CSSProperties = {
  border: 0,
  borderTop: '1px solid var(--eb-border)',
  margin: '18px 0',
};

const CRITERIA_BLOCK: React.CSSProperties = {
  background: 'var(--eb-input, #0c1119)',
  border: '1px solid var(--eb-border)',
  borderRadius: 8,
  padding: '10px 12px',
  fontSize: 12.5,
  color: 'var(--eb-text)',
  lineHeight: 1.65,
  whiteSpace: 'pre-wrap' as React.CSSProperties['whiteSpace'],
  minHeight: 52,
};

const EMPTY_CRITERIA: React.CSSProperties = {
  ...CRITERIA_BLOCK,
  color: 'var(--eb-muted)',
  fontStyle: 'italic',
};

const CHIP: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 11.5,
  padding: '3px 9px',
  borderRadius: 99,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-muted-2)',
};

const CHIP_GREEN: React.CSSProperties = {
  ...CHIP,
  color: 'var(--green)',
  borderColor: 'rgba(0,214,143,.30)',
  background: 'rgba(0,214,143,.08)',
};

const STAT: React.CSSProperties = {
  background: 'var(--eb-input, #0c1119)',
  border: '1px dashed var(--eb-border)',
  borderRadius: 9,
  padding: '10px 14px',
  display: 'flex',
  flexDirection: 'column',
  gap: 2,
};

// ── skeleton ──────────────────────────────────────────────────────────────────

function Skeleton() {
  return (
    <div style={{ padding: '24px 26px', maxWidth: 1100, width: '100%', alignSelf: 'center' }}>
      {[180, 120, 240].map((h, i) => (
        <div
          key={i}
          style={{ height: h, borderRadius: 10, background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', marginBottom: 14, animation: 'pulse 1.5s ease-in-out infinite' }}
        />
      ))}
    </div>
  );
}

// ── main ──────────────────────────────────────────────────────────────────────

export function PlaybookDetailClient({ id }: { id: string }) {
  const { data: playbook, isLoading, isError } = usePlaybook(id);
  const deletePlaybook = useDeletePlaybook();
  const updateImages = useUpdatePlaybookImages(id);
  const router = useRouter();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  if (isLoading) return <Skeleton />;

  if (isError || !playbook) {
    return (
      <div style={{ padding: '60px 26px', textAlign: 'center', color: 'var(--eb-muted)' }}>
        Playbook not found.{' '}
        <Link href="/playbooks" style={{ color: 'var(--green)', textDecoration: 'underline' }}>
          Back to playbooks
        </Link>
      </div>
    );
  }

  const STATUS_STYLE: Record<string, React.CSSProperties> = {
    active:       { color: 'var(--green)', borderColor: 'rgba(0,214,143,.30)', background: 'rgba(0,214,143,.08)' },
    experimental: { color: '#f5a524',      borderColor: 'rgba(245,165,36,.30)', background: 'rgba(245,165,36,.08)' },
    paused:       { color: '#ff5b6c',      borderColor: 'rgba(255,91,108,.30)', background: 'rgba(255,91,108,.08)' },
  };
  const statusStyle = STATUS_STYLE[playbook.status] ?? STATUS_STYLE.active;

  const criteria = playbook.criteriaJson as Record<string, string | string[]>;
  const checklist = playbook.checklists[0]?.itemsJson ?? [];
  const sessions = (criteria.sessions as string[] | undefined)?.join(' · ') ?? '—';
  const timeframes = (criteria.timeframes as string[] | undefined)?.join(' · ') ?? '—';
  const symbols = (criteria.symbols as string[] | undefined) ?? [];
  const tags = (criteria.tags as string[] | undefined) ?? [];
  const riskPct = criteria.riskPct as string | undefined;
  const minRR = criteria.minRR as string | undefined;

  const TAG_ACCENTS = ['#00d68f', '#06b6d4', '#818cf8', '#f5a524', '#fb923c', '#e879f9', '#ff5b6c', '#34d399'];

  const playbookImages = (playbook.images ?? []) as string[];

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const remaining = 10 - playbookImages.length;
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
    ).then((results) => {
      updateImages.mutate([...playbookImages, ...results]);
    });
    e.target.value = '';
  };

  const handleRemoveImage = (url: string) => {
    updateImages.mutate(playbookImages.filter((img) => img !== url));
  };

  return (
    <>
      <div style={{ padding: '18px 26px 60px', maxWidth: 1100, width: '100%', alignSelf: 'center' }}>

        {/* ── Topbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
          <Link
            href="/playbooks"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--eb-muted)', fontSize: 12.5, textDecoration: 'none' }}
          >
            <ArrowLeft size={14} /> Playbooks
          </Link>
          <span style={{ color: 'var(--eb-border)' }}>/</span>
          <span style={{ fontSize: 12.5, color: 'var(--eb-text)', fontWeight: 500 }}>{playbook.name}</span>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--eb-border)', background: 'var(--eb-panel-2)', color: 'var(--eb-text)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Pencil size={12} /> Edit
            </button>
            <button
              type="button"
              onClick={() => setDeleteOpen(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 8, border: '1px solid rgba(255,91,108,.3)', background: 'rgba(255,91,108,.08)', color: 'var(--red, #ff5b6c)', fontSize: 12.5, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Trash2 size={12} /> Delete
            </button>
          </div>
        </div>

        {/* ── Page header ── */}
        <div
          style={{
            background: 'linear-gradient(180deg,#141a24,#10151d)',
            border: '1px solid var(--eb-border)',
            borderRadius: 14,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 14,
            marginBottom: 18,
          }}
        >
          <span style={{ width: 40, height: 40, borderRadius: 10, background: 'linear-gradient(135deg,#00d68f,#06b6d4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#06140f', flexShrink: 0 }}>
            <Target size={20} strokeWidth={2.2} />
          </span>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--eb-text)' }}>{playbook.name}</h1>
              <span style={{ ...CHIP, ...statusStyle, textTransform: 'capitalize' }}>{playbook.status}</span>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)', lineHeight: 1.6 }}>{playbook.thesis}</p>
          </div>
          <div style={{ display: 'flex', gap: 14, flexShrink: 0 }}>
            {[
              { Icon: BookOpen, label: `${playbook._count.positions} trades` },
              { Icon: CheckSquare, label: `${checklist.length} checklist items` },
            ].map(({ Icon, label }) => (
              <div key={label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                <Icon size={18} style={{ color: 'var(--green)' }} />
                <span style={{ fontSize: 11, color: 'var(--eb-muted)', whiteSpace: 'nowrap' }}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Two-column body ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 1fr', gap: 18 }}>

          {/* LEFT — definition */}
          <div>
            <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: '16px 18px' }}>
              {/* Entry / Exit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
                <div>
                  <p style={HSEC}>Entry criteria</p>
                  {criteria.entry
                    ? <div style={CRITERIA_BLOCK}>{criteria.entry as string}</div>
                    : <div style={EMPTY_CRITERIA}>Not defined</div>}
                </div>
                <div>
                  <p style={HSEC}>Exit criteria</p>
                  {criteria.exit
                    ? <div style={CRITERIA_BLOCK}>{criteria.exit as string}</div>
                    : <div style={EMPTY_CRITERIA}>Not defined</div>}
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <p style={HSEC}>Invalidation</p>
                {criteria.invalidation
                  ? <div style={CRITERIA_BLOCK}>{criteria.invalidation as string}</div>
                  : <div style={EMPTY_CRITERIA}>Not defined</div>}
              </div>

              <hr style={SEP} />

              {/* Checklist */}
              <p style={HSEC}>
                Pre-trade checklist
                <span style={{ color: 'var(--eb-muted)', textTransform: 'none', letterSpacing: 0, fontWeight: 400 }}>
                  {' '}— gates trade entry
                </span>
              </p>
              {checklist.length === 0 ? (
                <div style={{ color: 'var(--eb-muted)', fontSize: 12.5, fontStyle: 'italic', padding: '8px 0' }}>No checklist defined.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {checklist.map((item, i) => {
                    const color = TAG_ACCENTS[i % TAG_ACCENTS.length];
                    return (
                      <div
                        key={item.id}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: `${color}0d`, border: `1px solid ${color}30`, borderLeft: `3px solid ${color}`, borderRadius: 8 }}
                      >
                        <span style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${color}60`, flexShrink: 0, background: 'transparent' }} />
                        <span style={{ flex: 1, fontSize: 12.5, color: 'var(--eb-text)' }}>{item.label}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              <hr style={SEP} />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <p style={{ ...HSEC, margin: 0 }}>Reference images</p>
                <label
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 7,
                    border: '1px solid var(--eb-border)',
                    background: 'var(--eb-input, #0c1119)',
                    color: 'var(--eb-muted)', fontSize: 11.5,
                    cursor: playbookImages.length >= 10 ? 'not-allowed' : 'pointer',
                    opacity: playbookImages.length >= 10 ? 0.5 : 1,
                  }}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    disabled={playbookImages.length >= 10 || updateImages.isPending}
                    onChange={handleAddImages}
                  />
                  <Paperclip size={11} />
                  {updateImages.isPending ? 'Saving…' : 'Add image'}
                </label>
              </div>

              {playbookImages.length === 0 ? (
                <div style={{ color: 'var(--eb-muted)', fontSize: 12, fontStyle: 'italic', padding: '8px 0' }}>
                  No reference images yet. Click "Add image" to attach screenshots.
                </div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {playbookImages.map((url, i) => (
                    <div key={i} style={{ position: 'relative', flexShrink: 0 }}>
                      <img
                        src={url}
                        alt=""
                        onClick={() => setLightbox(url)}
                        style={{
                          width: 110, height: 82, objectFit: 'cover',
                          borderRadius: 8, border: '1px solid var(--eb-border)',
                          cursor: 'pointer', display: 'block',
                          transition: 'opacity .1s',
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '0.85'; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = '1'; }}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(url)}
                        disabled={updateImages.isPending}
                        style={{
                          position: 'absolute', top: -5, right: -5,
                          width: 18, height: 18, borderRadius: 99,
                          background: '#ff5b6c', border: '1px solid rgba(0,0,0,.3)',
                          color: '#fff', cursor: 'pointer', fontSize: 12,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0, lineHeight: 1, opacity: updateImages.isPending ? 0.5 : 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT — config + stats */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Config card */}
            <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: '16px 18px' }}>
              <p style={HSEC}>Configuration</p>

              {[
                ['Sessions', sessions],
                ['Timeframes', timeframes],
                ['Risk / trade', riskPct ? `${riskPct}%` : '—'],
                ['Min R:R', minRR ?? '—'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--eb-border)', fontSize: 12.5 }}>
                  <span style={{ color: 'var(--eb-muted)' }}>{k}</span>
                  <b style={{ fontFamily: '"JetBrains Mono",monospace', color: 'var(--eb-text)' }}>{v}</b>
                </div>
              ))}

              <div style={{ marginTop: 12 }}>
                <p style={{ ...HSEC, marginBottom: 8 }}>Symbols</p>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {symbols.length > 0 ? symbols.map((sym, i) => {
                    const color = TAG_ACCENTS[i % TAG_ACCENTS.length];
                    return (
                      <span key={sym} style={{ ...CHIP, color, borderColor: `${color}40`, background: `${color}18`, fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 600 }}>
                        {sym}
                      </span>
                    );
                  }) : <span style={{ ...CHIP, fontStyle: 'italic' }}>All symbols</span>}
                </div>
              </div>

              {tags.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p style={{ ...HSEC, marginBottom: 8 }}>Tags</p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {tags.map((tag, i) => {
                      const color = TAG_ACCENTS[i % TAG_ACCENTS.length];
                      return (
                        <span key={tag} style={{ ...CHIP, color, borderColor: `${color}40`, background: `${color}18`, fontFamily: '"JetBrains Mono",monospace', fontSize: 11, fontWeight: 600 }}>
                          {tag}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Performance stub */}
            <div style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)', borderRadius: 12, padding: '16px 18px' }}>
              <p style={HSEC}>Performance</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Total trades',  value: String(playbook._count.positions), color: 'var(--eb-text)' },
                  { label: 'Win rate',       value: playbook._count.positions > 0 ? '—' : '—', color: 'var(--eb-muted)' },
                  { label: 'Avg R',          value: '—', color: 'var(--eb-muted)' },
                  { label: 'Profit factor',  value: '—', color: 'var(--eb-muted)' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={STAT}>
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontSize: 18, fontWeight: 600, fontFamily: '"JetBrains Mono",monospace', color }}>{value}</span>
                  </div>
                ))}
              </div>
              {playbook._count.positions === 0 && (
                <p style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 10, marginBottom: 0, lineHeight: 1.5 }}>
                  Tag trades with this playbook in the trade log to see performance stats.
                </p>
              )}
            </div>

            {/* Tip */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.55, padding: '0 4px' }}>
              <Sparkles size={13} style={{ color: '#818cf8', flexShrink: 0, marginTop: 1 }} />
              <span><b style={{ color: 'var(--eb-text)' }}>Tip:</b> trades tagged with this strategy will auto-fail the checklist gate if any required item is unticked.</span>
            </div>
          </div>
        </div>
      </div>

      <PlaybookFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        playbook={playbook}
      />

      {deleteOpen && (
        <DeleteConfirmDialog
          playbook={{ id, name: playbook.name }}
          accent="#00d68f"
          tradeCount={playbook._count.positions}
          isPending={deletePlaybook.isPending}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={async () => {
            try {
              await deletePlaybook.mutateAsync(id);
              toast.success('Playbook deleted.');
              router.push('/playbooks');
            } catch {
              toast.error('Failed to delete.');
              setDeleteOpen(false);
            }
          }}
        />
      )}

      {lightbox && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 400,
            background: 'rgba(0,0,0,.85)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24, cursor: 'zoom-out',
          }}
          onClick={() => setLightbox(null)}
        >
          <img
            src={lightbox}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, boxShadow: '0 24px 60px rgba(0,0,0,.6)', cursor: 'default' }}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            onClick={() => setLightbox(null)}
            style={{
              position: 'fixed', top: 20, right: 20,
              background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.2)',
              color: '#fff', width: 36, height: 36, borderRadius: 99,
              fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            ×
          </button>
        </div>
      )}
    </>
  );
}
