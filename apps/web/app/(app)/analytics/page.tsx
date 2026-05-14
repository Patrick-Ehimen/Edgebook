import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Analytics — Edgebook' };

export default function AnalyticsPage() {
  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Analytics
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
        <div style={{ fontSize: 54, marginBottom: 8 }}>📈</div>
        <h2 style={{ margin: '6px 0', fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          Analytics — coming soon
        </h2>
        <p style={{ color: 'var(--eb-muted-2)', maxWidth: 440, margin: '0 auto', lineHeight: 1.65, fontSize: 13.5 }}>
          Edge-decay charts, R-multiple distributions, playbook comparison, and day/session
          heat-maps. Available once you have trade data.
        </p>
      </div>
    </div>
  );
}
