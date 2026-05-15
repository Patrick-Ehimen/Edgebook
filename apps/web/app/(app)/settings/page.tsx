'use client';

import { AddAccountDialog, useAccounts, useDeleteAccount, useTriggerSync } from '@/features/accounts';
import { useAuth } from '@/providers/auth-provider';
import type { LucideIcon } from 'lucide-react';
import {
  AlertTriangle,
  Bell,
  Bot,
  Code,
  CreditCard,
  Database,
  Download,
  KeyRound,
  Monitor,
  Palette,
  Plug,
  RefreshCw,
  Scale,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  User,
  Webhook,
} from 'lucide-react';
import type { Metadata } from 'next';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useState } from 'react';

type TabId =
  | 'profile'
  | 'appearance'
  | 'security'
  | 'notifications'
  | 'connections'
  | 'rules'
  | 'ai'
  | 'data'
  | 'billing'
  | 'developer'
  | 'danger';

const NAV: { group: string; items: { id: TabId; label: string; Icon: LucideIcon }[] }[] = [
  {
    group: 'Personal',
    items: [
      { id: 'profile', label: 'Profile', Icon: User },
      { id: 'appearance', label: 'Appearance', Icon: Palette },
      { id: 'security', label: 'Security', Icon: Shield },
      { id: 'notifications', label: 'Notifications', Icon: Bell },
    ],
  },
  {
    group: 'Workspace',
    items: [
      { id: 'connections', label: 'Connections', Icon: Plug },
      { id: 'rules', label: 'Trading rules', Icon: Scale },
      { id: 'ai', label: 'AI & insights', Icon: Bot },
      { id: 'data', label: 'Data & export', Icon: Database },
    ],
  },
  {
    group: 'Account',
    items: [
      { id: 'billing', label: 'Plan & billing', Icon: CreditCard },
      { id: 'developer', label: 'Developer', Icon: Code },
      { id: 'danger', label: 'Danger zone', Icon: AlertTriangle },
    ],
  },
];

/* ── Shared primitives ───────────────────────────────────────────── */

function Toggle({ on = false }: { on?: boolean }) {
  const [checked, setChecked] = useState(on);
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => setChecked((v) => !v)}
      style={{
        position: 'relative',
        width: 38,
        height: 22,
        borderRadius: 99,
        border: `1px solid ${checked ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
        background: checked ? 'rgba(0,214,143,.2)' : 'var(--eb-panel-2)',
        cursor: 'pointer',
        transition: 'all .18s',
        flexShrink: 0,
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 18 : 2,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: checked ? 'var(--green)' : 'var(--eb-muted)',
          transition: 'left .18s, background .18s',
          display: 'block',
        }}
      />
    </button>
  );
}

function Card({
  children,
  danger,
}: {
  children: React.ReactNode;
  danger?: boolean;
}) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: `1px solid ${danger ? 'rgba(255,91,108,.35)' : 'var(--eb-border)'}`,
        borderRadius: 12,
        padding: 18,
        marginBottom: 14,
      }}
    >
      {children}
    </div>
  );
}

function CardTitle({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}>
      {children}
    </div>
  );
}

function CardDesc({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', marginBottom: 14 }}>{children}</div>
  );
}

function Sep() {
  return <div style={{ borderTop: '1px solid var(--eb-border)', margin: '14px 0' }} />;
}

function Between({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}
    >
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        color: 'var(--eb-muted)',
        textTransform: 'uppercase',
        letterSpacing: '.07em',
        fontWeight: 600,
        marginBottom: 5,
      }}
    >
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  background: 'var(--eb-panel-2)',
  border: '1px solid var(--eb-border)',
  borderRadius: 9,
  padding: '9px 12px',
  color: 'var(--eb-text)',
  outline: 0,
  fontSize: 13.5,
  width: '100%',
  fontFamily: 'inherit',
};

const btnStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '7px 12px',
  borderRadius: 8,
  border: '1px solid var(--eb-border)',
  background: 'var(--eb-panel-2)',
  color: 'var(--eb-text)',
  fontSize: 12.5,
  cursor: 'pointer',
  fontFamily: 'inherit',
};

const btnPrimaryStyle: React.CSSProperties = {
  ...btnStyle,
  border: '1px solid #00b67a',
  background: 'linear-gradient(180deg,#00d68f,#00b67a)',
  color: '#06140f',
  fontWeight: 600,
};

const btnDangerStyle: React.CSSProperties = {
  ...btnStyle,
  background: 'rgba(255,91,108,.08)',
  color: 'var(--eb-red)',
  border: '1px solid rgba(255,91,108,.3)',
};

function chip(text: string, color: string, bg: string, borderColor: string): React.ReactElement {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 11,
        padding: '2px 8px',
        borderRadius: 99,
        color,
        background: bg,
        border: `1px solid ${borderColor}`,
        marginLeft: 6,
      }}
    >
      {text}
    </span>
  );
}

/* ── Sections ────────────────────────────────────────────────────── */

function ProfileSection() {
  const { session } = useAuth();
  const initial = session?.handle?.[0]?.toUpperCase() ?? session?.email?.[0]?.toUpperCase() ?? 'U';
  const displayName = session?.handle ?? session?.email?.split('@')[0] ?? 'Trader';

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Profile
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        How you appear in shared reports and mentor mode.
      </p>
      <Card>
        <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start' }}>
          {/* Avatar */}
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 700,
              fontSize: 24,
              flexShrink: 0,
              boxShadow: '0 0 0 3px var(--eb-panel), 0 0 0 5px rgba(139,92,246,.3)',
            }}
          >
            {initial}
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}
            >
              <div>
                <FieldLabel>Trader handle</FieldLabel>
                <input style={inputStyle} defaultValue={displayName} />
              </div>
              <div>
                <FieldLabel>Display name</FieldLabel>
                <input style={inputStyle} defaultValue={displayName} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <input style={inputStyle} defaultValue={session?.email ?? ''} type="email" />
              </div>
              <div>
                <FieldLabel>Time zone</FieldLabel>
                <select style={{ ...inputStyle }}>
                  <option>UTC</option>
                  <option>UTC+1 — Lagos</option>
                  <option>UTC-5 — New York</option>
                  <option>UTC+8 — Singapore</option>
                </select>
              </div>
            </div>
            <div>
              <FieldLabel>Bio</FieldLabel>
              <textarea
                style={{ ...inputStyle, resize: 'vertical' }}
                rows={3}
                defaultValue="Crypto perp scalper. EU + US sessions."
              />
            </div>
          </div>
        </div>
        <Sep />
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button type="button" style={btnPrimaryStyle}>
            Save changes
          </button>
          <button type="button" style={btnStyle}>
            Cancel
          </button>
          <span
            style={{
              marginLeft: 'auto',
              fontSize: 11.5,
              color: 'var(--green)',
              background: 'rgba(0,214,143,.08)',
              border: '1px solid rgba(0,214,143,.3)',
              borderRadius: 99,
              padding: '2px 10px',
            }}
          >
            Auto-saved 12s ago
          </span>
        </div>
      </Card>
    </div>
  );
}

function AppearanceSection() {
  const { resolvedTheme, setTheme } = useTheme();
  const [density, setDensity] = useState<'comfortable' | 'default' | 'compact'>('default');
  const [currency, setCurrency] = useState('USD');
  const [numFmt, setNumFmt] = useState('1,234.56');

  const themes = [
    {
      id: 'dark',
      label: 'Dark',
      desc: 'Easy on eyes · default',
      previewBg: '#0a0e14',
      previewText: '#e6e9ef',
    },
    {
      id: 'light',
      label: 'Light',
      desc: 'High contrast · daytime',
      previewBg: '#ffffff',
      previewText: '#0f172a',
    },
    {
      id: 'system',
      label: 'System',
      desc: 'Match OS setting',
      previewBg: 'linear-gradient(90deg,#0a0e14 50%,#ffffff 50%)',
      previewText: '#e6e9ef',
    },
  ] as const;

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Appearance
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Make Edgebook match your environment.
      </p>
      <Card>
        <CardTitle>Theme</CardTitle>
        <CardDesc>Choose dark, light, or follow your system.</CardDesc>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
          {themes.map(({ id, label, desc, previewBg, previewText }) => {
            const active = resolvedTheme === id || id === 'system';
            const isActive = id === 'system' ? false : resolvedTheme === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                style={{
                  border: `1.5px solid ${isActive ? 'var(--green)' : 'var(--eb-border)'}`,
                  borderRadius: 10,
                  padding: 10,
                  background: isActive ? 'rgba(0,214,143,.04)' : 'var(--eb-panel)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  boxShadow: isActive ? '0 0 0 3px rgba(0,214,143,.12)' : 'none',
                  fontFamily: 'inherit',
                }}
              >
                <div
                  style={{
                    height: 70,
                    borderRadius: 7,
                    background: previewBg,
                    color: previewText,
                    border: '1px solid rgba(0,0,0,.1)',
                    padding: 8,
                    fontSize: 10,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    overflow: 'hidden',
                  }}
                >
                  <span>● Dashboard preview</span>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 99,
                      background: 'linear-gradient(90deg,#00d68f,#06b6d4)',
                      width: '60%',
                    }}
                  />
                </div>
                <div
                  style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--eb-text)', marginTop: 8 }}
                >
                  {label}
                </div>
                <div style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{desc}</div>
              </button>
            );
          })}
        </div>

        <Sep />
        <CardTitle>Density</CardTitle>
        <CardDesc>How tightly to pack tables and lists.</CardDesc>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['comfortable', 'default', 'compact'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDensity(d)}
              style={{
                ...btnStyle,
                border:
                  density === d ? '1px solid rgba(0,214,143,.4)' : '1px solid var(--eb-border)',
                color: density === d ? 'var(--green)' : 'var(--eb-muted-2)',
                background: density === d ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
                textTransform: 'capitalize',
              }}
            >
              {d}
            </button>
          ))}
        </div>

        <Sep />
        <CardTitle>Display currency</CardTitle>
        <CardDesc>All stats, calendars, and reports.</CardDesc>
        <div style={{ display: 'flex', gap: 8 }}>
          {['USD', 'USDT', 'BTC', 'ETH'].map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCurrency(c)}
              style={{
                ...btnStyle,
                border:
                  currency === c ? '1px solid rgba(0,214,143,.4)' : '1px solid var(--eb-border)',
                color: currency === c ? 'var(--green)' : 'var(--eb-muted-2)',
                background: currency === c ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
              }}
            >
              {c}
            </button>
          ))}
        </div>

        <Sep />
        <CardTitle>Number format</CardTitle>
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          {['1,234.56', '1.234,56', '1 234.56'].map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setNumFmt(f)}
              style={{
                ...btnStyle,
                fontFamily: 'var(--font-mono, monospace)',
                border:
                  numFmt === f ? '1px solid rgba(0,214,143,.4)' : '1px solid var(--eb-border)',
                color: numFmt === f ? 'var(--green)' : 'var(--eb-muted-2)',
                background: numFmt === f ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}

function SecuritySection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Security
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        2FA is mandatory. WebAuthn passkeys coming in v1.
      </p>

      <Card>
        <Between>
          <div>
            <CardTitle>Password</CardTitle>
            <div style={{ fontSize: 12.5, color: 'var(--eb-muted)' }}>
              Last changed 26 days ago. Rotate every 90 days.
            </div>
          </div>
          <button type="button" style={btnStyle}>
            <KeyRound size={13} /> Change password
          </button>
        </Between>
      </Card>

      <Card>
        <Between>
          <div>
            <CardTitle>
              Two-factor authentication
              {chip('Enabled', 'var(--green)', 'rgba(0,214,143,.08)', 'rgba(0,214,143,.3)')}
            </CardTitle>
            <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', marginTop: 3 }}>
              Authenticator app · 8 unused recovery codes · added Apr 02
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" style={btnStyle}>
              View codes
            </button>
            <button type="button" style={btnDangerStyle}>
              Disable
            </button>
          </div>
        </Between>
      </Card>

      <Card>
        <CardTitle>Active sessions</CardTitle>
        <CardDesc>Sign out anywhere you don&apos;t recognize.</CardDesc>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Device', 'IP', 'Last active', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: 'var(--eb-muted)',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              {
                device: 'macOS · Chrome 137',
                ip: '102.89.xx.41',
                when: 'now',
                Icon: Monitor,
                current: true,
              },
              {
                device: 'iOS · Safari',
                ip: '102.89.xx.41',
                when: '1h ago',
                Icon: Smartphone,
                current: false,
              },
              {
                device: 'Windows · Firefox',
                ip: '154.13.xx.20',
                when: '3d ago',
                Icon: Monitor,
                current: false,
              },
            ].map(({ device, ip, when, Icon, current }) => (
              <tr key={device}>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                  }}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                    <Icon size={13} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
                    {device}
                    {current &&
                      chip(
                        'this device',
                        'var(--green)',
                        'rgba(0,214,143,.08)',
                        'rgba(0,214,143,.3)',
                      )}
                  </span>
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono,monospace)',
                    color: 'var(--eb-muted)',
                  }}
                >
                  {ip}
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                    color: 'var(--eb-muted)',
                  }}
                >
                  {when}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--eb-border)' }}>
                  {!current && (
                    <button
                      type="button"
                      style={{ ...btnStyle, fontSize: 11.5, padding: '4px 10px' }}
                    >
                      Sign out
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 10 }}>
          <button type="button" style={btnDangerStyle}>
            Sign out all other sessions
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Audit log</CardTitle>
        <CardDesc>Immutable record of sensitive actions on your account.</CardDesc>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            {[
              { date: '2026-05-07 14:48', action: 'API key added', detail: 'Binance — Main' },
              {
                date: '2026-05-06 09:12',
                action: 'Tilt rule modified',
                detail: 'Cooldown 30→45 min',
              },
              { date: '2026-05-04 22:01', action: 'Recovery codes downloaded', detail: '—' },
              { date: '2026-04-21 10:33', action: 'Password changed', detail: '—' },
            ].map(({ date, action, detail }) => (
              <tr key={date + action}>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono,monospace)',
                    color: 'var(--eb-muted)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {date}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                  }}
                >
                  {action}
                </td>
                <td
                  style={{
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                    color: 'var(--eb-muted)',
                  }}
                >
                  {detail}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function NotificationsSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Notifications
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Choose what reaches you, where, and how loud.
      </p>

      <Card>
        <CardTitle>Channels</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'In-app', sub: 'Banner + inbox', on: true },
            { label: 'Email', sub: 'trader@protonmail.com', on: true },
            { label: 'Browser push', sub: 'macOS Chrome', on: true },
            {
              label: 'Telegram bot',
              sub: '@edgebook_bot · not connected',
              on: false,
              cta: 'Connect',
            },
          ].map(({ label, sub, on, cta }) => (
            <Between key={label}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)' }}>{sub}</div>
              </div>
              {cta ? (
                <button type="button" style={btnStyle}>
                  {cta}
                </button>
              ) : (
                <Toggle on={on} />
              )}
            </Between>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Categories</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {[
            { label: 'Tilt detector triggered', sub: 'Real-time · always recommended', on: true },
            { label: 'AI weekly review ready', sub: 'Every Sunday 18:00 UTC', on: true },
            { label: 'Edge decay alerts', sub: 'When a playbook drifts >10%', on: true },
            { label: 'Sync errors', sub: 'API key expiry, rate limits, etc.', on: true },
            { label: 'Goal achievements', sub: 'When you hit your daily/weekly goals', on: false },
            { label: 'Product updates', sub: 'Monthly · new features only', on: true },
          ].map(({ label, sub, on }) => (
            <Between key={label}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)' }}>{sub}</div>
              </div>
              <Toggle on={on} />
            </Between>
          ))}
        </div>
      </Card>

      <Card>
        <CardTitle>Quiet hours</CardTitle>
        <CardDesc>
          Silence non-critical notifications during these times. Tilt alerts always come through.
        </CardDesc>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>From</FieldLabel>
            <input
              style={{ ...inputStyle, fontFamily: 'var(--font-mono,monospace)' }}
              defaultValue="22:00"
            />
          </div>
          <div>
            <FieldLabel>To</FieldLabel>
            <input
              style={{ ...inputStyle, fontFamily: 'var(--font-mono,monospace)' }}
              defaultValue="07:00"
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function ConnectionsSection() {
  const { data: accounts, isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const triggerSync = useTriggerSync();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const VENUE_META: Record<string, { logo: string; bg: string }> = {
    binance: { logo: '/assets/binance-logo.svg', bg: '#f0b90b' },
    bybit: { logo: '/assets/bybit-logo.svg', bg: '#f7a600' },
  };

  async function handleSync(accountId: string) {
    setSyncingId(accountId);
    try {
      await triggerSync.mutateAsync(accountId);
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Connections
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Read-only API connections to exchanges. We test for withdrawal scope on every save.
      </p>

      <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />

      <Card>
        <Between>
          <CardTitle>Exchange accounts</CardTitle>
          <button type="button" style={btnPrimaryStyle} onClick={() => setDialogOpen(true)}>
            + Add account
          </button>
        </Between>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
          {isLoading && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 13 }}>
              Loading…
            </div>
          )}

          {!isLoading && accounts?.length === 0 && (
            <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--eb-muted)', fontSize: 13 }}>
              No accounts connected yet. Add your first exchange above.
            </div>
          )}

          {accounts?.map((account) => {
            const meta = VENUE_META[account.venue];
            const syncing = syncingId === account.id;
            return (
              <div
                key={account.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 10,
                  background: 'var(--eb-panel-2)',
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    background: meta?.bg ?? '#444',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    overflow: 'hidden',
                  }}
                >
                  {meta?.logo && (
                    <Image
                      src={meta.logo}
                      alt={account.venue}
                      width={28}
                      height={14}
                      style={{ objectFit: 'contain' }}
                    />
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)', display: 'flex', alignItems: 'center' }}>
                    {account.label}
                    {account.keyCount > 0
                      ? chip('read-only', 'var(--green)', 'rgba(0,214,143,.08)', 'rgba(0,214,143,.3)')
                      : chip('no key', 'var(--eb-yellow)', 'rgba(245,165,36,.08)', 'rgba(245,165,36,.3)')}
                  </div>
                  <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
                    {account.venue} · {account.accountType} · {account.keyCount} key{account.keyCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  {account.keyCount > 0 && (
                    <button
                      type="button"
                      disabled={syncing}
                      onClick={() => handleSync(account.id)}
                      style={{ ...btnStyle, fontSize: 11.5, padding: '5px 10px' }}
                    >
                      <RefreshCw size={11} style={{ animation: syncing ? 'spin 1s linear infinite' : 'none' }} />
                      {syncing ? 'Syncing…' : 'Resync'}
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={deleteAccount.isPending}
                    onClick={() => {
                      if (confirm(`Disconnect "${account.label}"? This cannot be undone.`)) {
                        deleteAccount.mutate(account.id);
                      }
                    }}
                    style={{ ...btnDangerStyle, fontSize: 11.5, padding: '5px 10px' }}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card>
        <CardTitle>Other sources</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 10 }}>
          {[
            { label: 'CSV import', sub: 'Universal column-mapper · save templates' },
            { label: 'Manual entry', sub: 'Keyboard-first form' },
          ].map(({ label, sub }) => (
            <div
              key={label}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                border: '1px solid var(--eb-border)',
                borderRadius: 10,
              }}
            >
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>{sub}</div>
              </div>
              <button type="button" style={{ ...btnStyle, fontSize: 11.5, padding: '5px 10px' }}>
                Open
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

function TradingRulesSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Trading rules &amp; goals
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Tilt detector, risk caps, daily goals — editable any time.
      </p>

      <Card>
        <CardTitle>Tilt rules</CardTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
          {[
            { label: 'Cooldown after 3 consecutive losses', sub: 'Hard pause · 30 min', on: true },
            { label: 'Block re-entry within 60s of stop-out', sub: 'Hard pause', on: true },
            { label: 'Confirm dialog on size > 2× avg', sub: 'Soft', on: true },
            { label: 'News window block', sub: '±15 min · ForexFactory feed', on: false },
          ].map(({ label, sub, on }) => (
            <Between key={label}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--eb-text)' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, color: 'var(--eb-muted)' }}>{sub}</div>
              </div>
              <Toggle on={on} />
            </Between>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" style={btnStyle}>
            + Add custom rule
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Goals</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          {[
            { label: 'Daily P&L target', value: '$400' },
            { label: 'Daily max loss', value: '-$600' },
            { label: 'Max trades / day', value: '8' },
            { label: 'Max risk / trade', value: '0.5%' },
          ].map(({ label, value }) => (
            <div key={label}>
              <FieldLabel>{label}</FieldLabel>
              <input
                style={{ ...inputStyle, fontFamily: 'var(--font-mono,monospace)' }}
                defaultValue={value}
              />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <button type="button" style={btnPrimaryStyle}>
            Save goals
          </button>
        </div>
      </Card>
    </div>
  );
}

function AiSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        AI &amp; insights
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        How aggressively Edgebook critiques and reviews your trading.
      </p>

      <Card>
        <Between>
          <div>
            <CardTitle>Weekly review</CardTitle>
            <div style={{ fontSize: 12.5, color: 'var(--eb-muted)' }}>
              Every Sunday 18:00 UTC — summarise wins/misses + recommend one change.
            </div>
          </div>
          <Toggle on={true} />
        </Between>
      </Card>

      <Card>
        <CardTitle>Coach tone</CardTitle>
        <CoachTonePicker />
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 8 }}>
          Brutal mode does not soften feedback. Recommended for traders who specifically asked for
          it.
        </div>
      </Card>

      <Card>
        <CardTitle>Model</CardTitle>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 10 }}>
          <div>
            <FieldLabel>Provider</FieldLabel>
            <select style={{ ...inputStyle }}>
              <option>Claude (recommended)</option>
              <option>OpenAI GPT</option>
              <option>Self-hosted (Ollama)</option>
            </select>
          </div>
          <div>
            <FieldLabel>Monthly token budget</FieldLabel>
            <input
              style={{ ...inputStyle, fontFamily: 'var(--font-mono,monospace)' }}
              defaultValue="500,000"
            />
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 10 }}>
          Pro plan includes 500k tokens/mo. Cached reviews don&apos;t count toward budget.
        </div>
      </Card>
    </div>
  );
}

function CoachTonePicker() {
  const [tone, setTone] = useState<'gentle' | 'balanced' | 'brutal'>('balanced');
  return (
    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
      {(['gentle', 'balanced', 'brutal'] as const).map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => setTone(t)}
          style={{
            ...btnStyle,
            border: tone === t ? '1px solid rgba(0,214,143,.4)' : '1px solid var(--eb-border)',
            color: tone === t ? 'var(--green)' : 'var(--eb-muted-2)',
            background: tone === t ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
            textTransform: 'capitalize',
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}

function DataSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Data &amp; export
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Your fills are immutable and yours. Export anytime, no lock-in.
      </p>

      <Card>
        <CardTitle>Export</CardTitle>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {[
            'Trades CSV',
            'Tax-ready CSV (FIFO)',
            'Full SQLite dump',
            'Notes & screenshots (zip)',
          ].map((label) => (
            <button key={label} type="button" style={btnStyle}>
              <Download size={13} /> {label}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <Between>
          <div>
            <CardTitle>Backups</CardTitle>
            <div style={{ fontSize: 12.5, color: 'var(--eb-muted)' }}>
              Automatic encrypted backup every 24h to S3.
            </div>
          </div>
          <span
            style={{
              fontSize: 11.5,
              color: 'var(--green)',
              background: 'rgba(0,214,143,.08)',
              border: '1px solid rgba(0,214,143,.3)',
              borderRadius: 99,
              padding: '3px 10px',
            }}
          >
            Last: 4h ago
          </span>
        </Between>
      </Card>

      <Card>
        <CardTitle>Position recompute</CardTitle>
        <CardDesc>
          Re-run the FIFO inventory algorithm against all fills. Useful after fixing a manual entry.
        </CardDesc>
        <button type="button" style={btnStyle}>
          <RefreshCw size={13} /> Recompute all positions
        </button>
      </Card>
    </div>
  );
}

function BillingSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Plan &amp; billing
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        You&apos;re on <strong>Pro</strong>. Renews May 28, 2026.
      </p>

      <Card>
        <Between>
          <div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--eb-text)',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              Pro · $29 / month
              {chip('current', 'var(--eb-purple)', 'rgba(139,92,246,.1)', 'rgba(139,92,246,.3)')}
            </div>
            <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', marginTop: 3 }}>
              Unlimited accounts · full history · AI weekly review · 500k tokens/mo
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <button type="button" style={btnStyle}>
              Switch to annual ($290 · save 16%)
            </button>
            <button type="button" style={btnDangerStyle}>
              Cancel plan
            </button>
          </div>
        </Between>
        <Sep />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <FieldLabel>Card</FieldLabel>
            <input
              style={{ ...inputStyle, fontFamily: 'var(--font-mono,monospace)' }}
              defaultValue="•••• •••• •••• 4242  ·  exp 09/28"
              readOnly
            />
          </div>
          <div>
            <FieldLabel>Billing email</FieldLabel>
            <input style={inputStyle} defaultValue="trader@protonmail.com" type="email" />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <button type="button" style={btnStyle}>
            Update payment method
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Invoices</CardTitle>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 10 }}>
          <thead>
            <tr>
              {['Date', 'Plan', 'Amount', 'Status', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: 'var(--eb-muted)',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { date: '2026-04-28', plan: 'Pro · monthly', amount: '$29.00' },
              { date: '2026-03-28', plan: 'Pro · monthly', amount: '$29.00' },
              { date: '2026-02-28', plan: 'Pro · monthly', amount: '$29.00' },
            ].map(({ date, plan, amount }) => (
              <tr key={date}>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono,monospace)',
                    color: 'var(--eb-muted)',
                  }}
                >
                  {date}
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                  }}
                >
                  {plan}
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                    fontFamily: 'var(--font-mono,monospace)',
                  }}
                >
                  {amount}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--eb-border)' }}>
                  {chip('paid', 'var(--green)', 'rgba(0,214,143,.08)', 'rgba(0,214,143,.3)')}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--eb-border)' }}>
                  <button type="button" style={{ ...btnStyle, fontSize: 11, padding: '3px 9px' }}>
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function DeveloperSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
        Developer
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Personal access tokens, webhooks, and Edgebook&apos;s read API.
      </p>

      <Card>
        <CardTitle>Personal access tokens</CardTitle>
        <CardDesc>Use these to read your own data programmatically. Scopes are read-only.</CardDesc>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Label', 'Scope', 'Last used', ''].map((h) => (
                <th
                  key={h}
                  style={{
                    textAlign: 'left',
                    padding: '8px 10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 10.5,
                    textTransform: 'uppercase',
                    letterSpacing: '.07em',
                    color: 'var(--eb-muted)',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { label: 'quant-notebook', scope: 'read:trades, read:journal', used: '2h ago' },
              { label: 'excel-export', scope: 'read:trades', used: '5d ago' },
            ].map(({ label, scope, used }) => (
              <tr key={label}>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                    fontFamily: 'var(--font-mono,monospace)',
                  }}
                >
                  {label}
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12,
                    fontFamily: 'var(--font-mono,monospace)',
                    color: 'var(--eb-muted)',
                  }}
                >
                  {scope}
                </td>
                <td
                  style={{
                    padding: '10px',
                    borderBottom: '1px solid var(--eb-border)',
                    fontSize: 12.5,
                    color: 'var(--eb-muted)',
                  }}
                >
                  {used}
                </td>
                <td style={{ padding: '10px', borderBottom: '1px solid var(--eb-border)' }}>
                  <button
                    type="button"
                    style={{ ...btnDangerStyle, fontSize: 11, padding: '3px 9px' }}
                  >
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{ marginTop: 12 }}>
          <button type="button" style={btnPrimaryStyle}>
            + Create token
          </button>
        </div>
      </Card>

      <Card>
        <CardTitle>Webhooks</CardTitle>
        <CardDesc>Get notified on tilt triggers, sync events, and AI reports.</CardDesc>
        <button type="button" style={btnStyle}>
          <Webhook size={13} /> Add webhook
        </button>
      </Card>
    </div>
  );
}

function DangerSection() {
  return (
    <div>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-red)' }}>
        Danger zone
      </h1>
      <p style={{ color: 'var(--eb-muted-2)', fontSize: 13.5, margin: '0 0 18px' }}>
        Permanent actions. We email you a confirmation link before anything irreversible happens.
      </p>

      <Card danger>
        {[
          {
            title: 'Reset all positions',
            desc: 'Delete derived positions and recompute from raw fills. Fills and notes are kept.',
            btn: 'Reset positions',
          },
          {
            title: 'Delete all journal entries',
            desc: 'Removes daily intents, EOD reviews, and AI reports. Cannot be undone.',
            btn: 'Delete journal',
          },
          {
            title: 'Delete account',
            desc: 'Permanently delete your account and all associated data. Exports remain valid.',
            btn: 'Delete account',
          },
        ].map(({ title, desc, btn }, i) => (
          <div key={title}>
            {i > 0 && <Sep />}
            <Between>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
                  {title}
                </div>
                <div style={{ fontSize: 12.5, color: 'var(--eb-muted)', marginTop: 3 }}>{desc}</div>
              </div>
              <button type="button" style={{ ...btnDangerStyle, flexShrink: 0 }}>
                <Trash2 size={13} /> {btn}
              </button>
            </Between>
          </div>
        ))}
      </Card>
    </div>
  );
}

const SECTION_MAP: Record<TabId, () => React.ReactElement> = {
  profile: ProfileSection,
  appearance: AppearanceSection,
  security: SecuritySection,
  notifications: NotificationsSection,
  connections: ConnectionsSection,
  rules: TradingRulesSection,
  ai: AiSection,
  data: DataSection,
  billing: BillingSection,
  developer: DeveloperSection,
  danger: DangerSection,
};

/* ── Page ────────────────────────────────────────────────────────── */

export default function SettingsPage() {
  const [tab, setTab] = useState<TabId>('profile');
  const Section = SECTION_MAP[tab];

  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1200, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 16 }}>
        Workspace / Settings
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '220px 1fr', gap: 28, alignItems: 'start' }}
      >
        {/* Settings nav */}
        <nav style={{ position: 'sticky', top: 80 }}>
          {NAV.map(({ group, items }) => (
            <div key={group} style={{ marginBottom: 18 }}>
              <div
                style={{
                  fontSize: 10.5,
                  textTransform: 'uppercase',
                  letterSpacing: '.1em',
                  color: 'var(--eb-muted)',
                  fontWeight: 600,
                  padding: '0 8px 6px',
                }}
              >
                {group}
              </div>
              {items.map(({ id, label, Icon }) => {
                const active = tab === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTab(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 9,
                      width: '100%',
                      padding: '7px 10px',
                      borderRadius: 8,
                      border: 0,
                      background: active ? 'var(--eb-panel-2)' : 'transparent',
                      color: active ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      fontWeight: active ? 500 : 400,
                      boxShadow: active ? 'inset 2px 0 0 var(--green)' : 'none',
                    }}
                  >
                    <Icon size={14} style={{ flexShrink: 0 }} />
                    {label}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Content */}
        <div style={{ minWidth: 0 }}>
          <Section />
        </div>
      </div>
    </div>
  );
}
