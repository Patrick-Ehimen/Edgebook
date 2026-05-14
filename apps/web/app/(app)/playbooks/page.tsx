import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Playbooks — Edgebook' };

export default function PlaybooksPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Playbook
      </div>
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 13,
          padding: '72px 28px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 54, marginBottom: 8 }}>🎯</div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          No playbooks yet
        </h2>
        <p style={{ color: 'var(--eb-muted-2)', maxWidth: 460, margin: '0 auto 20px', lineHeight: 1.65, fontSize: 13.5 }}>
          A playbook is a named strategy with thesis, entry/exit criteria, and an invalidation
          condition. Assigning trades to playbooks makes your edge measurable — PF, expectancy,
          and edge-decay per setup.
        </p>
        <button
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '9px 16px', borderRadius: 9, border: '1px solid #00b67a',
            background: 'linear-gradient(180deg,#00e29a,#00b67a)', color: '#06140f',
            fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          + Create first playbook
        </button>
      </div>
    </div>
  );
}
