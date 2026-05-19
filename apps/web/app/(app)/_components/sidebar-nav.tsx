'use client';

import { useAuth } from '@/providers/auth-provider';
import { useSignOut } from '@/features/auth';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Brain,
  CalendarDays,
  ChevronUp,
  Inbox,
  LayoutDashboard,
  LogOut,
  NotebookPen,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const WORKSPACE: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/trades', Icon: BookOpen, label: 'Trade log' },
  { href: '/analytics', Icon: TrendingUp, label: 'Analytics' },
  { href: '/calendar', Icon: CalendarDays, label: 'Calendar' },
  { href: '/mind-lab', Icon: Brain, label: 'Mind Lab' },
  { href: '/playbooks', Icon: Target, label: 'Playbook' },
];

const COACHING: {
  href: string;
  Icon: LucideIcon;
  label: string;
  badge?: string;
  badgeColor?: string;
  badgeText?: string;
}[] = [
  { href: '/journal', Icon: NotebookPen, label: 'Daily journal' },
  {
    href: '/ai-review',
    Icon: Inbox,
    label: 'AI weekly review',
    badge: '2',
    badgeColor: 'rgba(139,92,246,.2)',
    badgeText: '#c4b5fd',
  },
  { href: '/goals', Icon: ShieldCheck, label: 'Goals & rules' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const { session } = useAuth();
  const signOut = useSignOut();

  const isActive = (href: string) =>
    pathname === href || (href !== '/dashboard' && pathname.startsWith(`${href}/`));

  const linkStyle = (active: boolean): React.CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    padding: '7px 9px',
    borderRadius: '7px',
    color: active ? 'var(--eb-nav-active-text)' : 'var(--eb-muted-2)',
    fontSize: '13px',
    textDecoration: 'none',
    backgroundColor: active ? 'var(--eb-nav-active)' : 'transparent',
    transition: 'background 0.1s, color 0.1s',
    lineHeight: '1.3',
    fontWeight: active ? 500 : 400,
  });

  const sectionLabel: React.CSSProperties = {
    padding: '10px 6px 6px',
    fontSize: '10.5px',
    letterSpacing: '.12em',
    textTransform: 'uppercase',
    color: 'var(--eb-muted)',
    fontWeight: 600,
  };

  const pill = (text: string, bg: string, color: string) => (
    <span
      style={{
        marginLeft: 'auto',
        fontSize: '10px',
        padding: '1px 6px',
        borderRadius: '8px',
        background: bg,
        color,
      }}
    >
      {text}
    </span>
  );

  const initial = session?.handle?.[0]?.toUpperCase() ?? session?.email?.[0]?.toUpperCase() ?? 'U';
  const displayName = session?.handle ?? session?.email?.split('@')[0] ?? 'Trader';

  return (
    <aside
      style={{
        background: 'var(--eb-panel)',
        borderRight: '1px solid var(--eb-border)',
        padding: '14px 10px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 0,
      }}
    >
      {/* Brand */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '9px',
          padding: '6px 8px 18px',
          fontWeight: 600,
        }}
      >
        <Image
          src="/assets/logo-mark.svg"
          alt="Edgebook"
          width={22}
          height={22}
          style={{ borderRadius: 6, flexShrink: 0 }}
        />
        <span style={{ color: 'var(--eb-text)' }}>Edgebook</span>
        <span
          style={{
            marginLeft: 'auto',
            fontSize: '9.5px',
            padding: '2px 7px',
            borderRadius: 99,
            border: '1px solid rgba(139,92,246,.3)',
            background: 'rgba(139,92,246,.1)',
            color: 'var(--eb-purple)',
            fontWeight: 600,
          }}
        >
          PRO
        </span>
      </div>

      {/* Workspace nav */}
      <div style={sectionLabel}>Workspace</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {WORKSPACE.map(({ href, Icon, label }) => (
          <Link key={href} href={href} style={linkStyle(isActive(href))}>
            <Icon size={14} style={{ flexShrink: 0 }} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>

      {/* Accounts nav */}
      <div style={sectionLabel}>Accounts</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Link
          href="/settings/connections"
          style={{ ...linkStyle(false), color: 'var(--eb-muted)', fontSize: 12.5 }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--eb-muted)',
              flexShrink: 0,
              display: 'inline-block',
            }}
          />
          <span>+ Connect account</span>
        </Link>
      </nav>

      {/* Coaching nav */}
      <div style={sectionLabel}>Coaching</div>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {COACHING.map(({ href, Icon, label, badge, badgeColor, badgeText }) => (
          <Link key={href} href={href} style={linkStyle(isActive(href))}>
            <Icon size={14} style={{ flexShrink: 0 }} />
            <span>{label}</span>
            {badge && badgeColor && badgeText && pill(badge, badgeColor, badgeText)}
          </Link>
        ))}
      </nav>

      {/* Profile card at bottom */}
      <div style={{ marginTop: 'auto', paddingTop: 8 }}>
        <div
          style={{
            borderTop: '1px solid var(--eb-border)',
            padding: '10px 4px 2px',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              padding: '8px 8px',
              borderRadius: 9,
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              cursor: 'pointer',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: 'linear-gradient(135deg,#8b5cf6,#06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13,
                flexShrink: 0,
                boxShadow: '0 0 0 2px var(--eb-panel-2), 0 0 0 3.5px rgba(139,92,246,.3)',
              }}
            >
              {initial}
            </div>

            {/* Name + email */}
            <div style={{ minWidth: 0, flex: 1 }}>
              <div
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: 'var(--eb-text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {displayName}
              </div>
              <div
                style={{
                  fontSize: 10.5,
                  color: 'var(--eb-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {session?.email}
              </div>
            </div>

            <ChevronUp size={13} style={{ flexShrink: 0, color: 'var(--eb-muted)' }} />
          </div>

          {/* Quick actions */}
          <div style={{ display: 'flex', gap: 4, padding: '6px 2px 0' }}>
            <Link
              href="/settings"
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '5px 0',
                borderRadius: 7,
                fontSize: 11.5,
                color: 'var(--eb-muted)',
                textDecoration: 'none',
                border: '1px solid transparent',
              }}
            >
              <Settings size={12} /> Settings
            </Link>
            <button
              type="button"
              onClick={() => signOut.mutate()}
              disabled={signOut.isPending}
              style={{
                flex: 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '5px 0',
                borderRadius: 7,
                fontSize: 11.5,
                color: 'var(--eb-muted)',
                background: 'transparent',
                border: '1px solid transparent',
                cursor: signOut.isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
                opacity: signOut.isPending ? 0.5 : 1,
              }}
            >
              <LogOut size={12} /> {signOut.isPending ? 'Signing out…' : 'Sign out'}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
