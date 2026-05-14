import type { Metadata } from 'next';
import { Button } from '@/components/ui/button';
import { Archive, BookOpen, FileText, Plug, TrendingUp, Upload } from 'lucide-react';

export const metadata: Metadata = { title: 'Trade Log — Edgebook' };

const HOW_IT_WORKS = [
  {
    Icon: Archive,
    title: 'Every fill, immutable',
    desc: 'Each execution is stored once, append-only. Positions are derived from fills, never manually set.',
  },
  {
    Icon: TrendingUp,
    title: 'Full charting & replay',
    desc: 'Entry / exit lines on the chart, MFE/MAE markers, and R-multiple calculated automatically.',
  },
  {
    Icon: FileText,
    title: 'Notes, tags & checklist',
    desc: "Attach a note, screenshot, and playbook checklist to every trade while it's fresh.",
  },
];

export default function TradesPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Trade log
      </div>

      {/* Page header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 18,
        }}
      >
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0, color: 'var(--eb-text)' }}>
          Trade log
        </h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 11px',
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Upload size={13} /> Import CSV
          </Button>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 13px',
              borderRadius: 7,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Log first trade
          </Button>
        </div>
      </div>

      {/* Empty state card */}
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 11,
          padding: '56px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ marginBottom: 10, color: 'var(--eb-muted)' }}>
          <BookOpen size={44} />
        </div>
        <h2 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          No trades imported yet
        </h2>
        <p
          style={{
            color: 'var(--eb-muted-2)',
            margin: '0 0 20px',
            maxWidth: 460,
            marginInline: 'auto',
            lineHeight: 1.6,
            fontSize: 13.5,
          }}
        >
          Once you sync an exchange or import a CSV, every fill lands here with full charting,
          notes, and replay. Your fills are immutable and always yours.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 16px',
              borderRadius: 9,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00e29a,#00b67a)',
              color: '#06140f',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            + Log first trade
          </Button>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Upload size={14} /> Import CSV
          </Button>
          <Button
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '9px 14px',
              borderRadius: 9,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-text)',
              fontSize: 13,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plug size={14} /> Connect exchange
          </Button>
        </div>
      </div>

      {/* How it works teaser */}
      <div
        style={{
          marginTop: 14,
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
        }}
      >
        {HOW_IT_WORKS.map(({ Icon, title, desc }) => (
          <div
            key={title}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: '14px 16px',
            }}
          >
            <div style={{ marginBottom: 6, color: 'var(--eb-muted)' }}>
              <Icon size={22} />
            </div>
            <div
              style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)', marginBottom: 4 }}
            >
              {title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
