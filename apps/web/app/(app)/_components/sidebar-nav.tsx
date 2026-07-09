'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAccounts } from '@/features/accounts';
import { useSignOut } from '@/features/auth';
import { journalApi } from '@/features/journal';
import { useNotes } from '@/features/notes';
import { usePlaybooks } from '@/features/playbooks';
import { useAllPositions } from '@/features/positions';
import { useWatchlist } from '@/features/watchlist/hooks/useWatchlist';
import { useAuth } from '@/providers/auth-provider';
import { useQuery } from '@tanstack/react-query';
import type { LucideIcon } from 'lucide-react';
import {
  BookMarked,
  BookOpen,
  Brain,
  CalendarDays,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Eye,
  Inbox,
  LayoutDashboard,
  Link2,
  LogOut,
  NotebookPen,
  Settings,
  ShieldCheck,
  Target,
  TrendingUp,
  Users,
  Wrench,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const AVATAR_PRESETS = [
  'linear-gradient(135deg,#8b5cf6,#06b6d4)',
  'linear-gradient(135deg,#f59e0b,#ef4444)',
  'linear-gradient(135deg,#10b981,#3b82f6)',
  'linear-gradient(135deg,#ec4899,#8b5cf6)',
  'linear-gradient(135deg,#f97316,#eab308)',
  'linear-gradient(135deg,#14b8a6,#22c55e)',
  'linear-gradient(135deg,#6366f1,#ec4899)',
  'linear-gradient(135deg,#ef4444,#f97316)',
  '#8b5cf6',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#6366f1',
  '#64748b',
];

const WORKSPACE: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: '/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/trades', Icon: BookOpen, label: 'Trade log' },
  { href: '/analytics', Icon: TrendingUp, label: 'Analytics' },
  { href: '/calendar', Icon: CalendarDays, label: 'Calendar' },
  { href: '/mind-lab', Icon: Brain, label: 'Mind Lab' },
  { href: '/playbooks', Icon: Target, label: 'Playbook' },
  { href: '/watchlist', Icon: Eye, label: 'Watchlist' },
];

const PROP: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: '/prop/accounts', Icon: Users, label: 'Prop accounts' },
  { href: '/prop/rules', Icon: ClipboardList, label: 'Rule library' },
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
  { href: '/notes', Icon: BookMarked, label: 'Library' },
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

const OTHERS: { href: string; Icon: LucideIcon; label: string }[] = [
  { href: '/tools', Icon: Wrench, label: 'Tools' },
];

export default function SidebarNav() {
  const pathname = usePathname();
  const [accountsOpen, setAccountsOpen] = useState(true);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const DEFAULT_AVATAR_COLOR = AVATAR_PRESETS[0] as string;
  const [avatarColor, setAvatarColor] = useState<string>(() =>
    typeof window !== 'undefined'
      ? (localStorage.getItem('eb-avatar-color') ?? DEFAULT_AVATAR_COLOR)
      : DEFAULT_AVATAR_COLOR,
  );
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const { session } = useAuth();

  useEffect(() => {
    if (!showColorPicker) return;
    const handler = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showColorPicker]);

  const pickColor = (color: string) => {
    setAvatarColor(color);
    localStorage.setItem('eb-avatar-color', color);
    setShowColorPicker(false);
  };
  const signOut = useSignOut();
  const { data: accounts } = useAccounts();
  const { data: positions } = useAllPositions(accounts);
  const { data: playbooks } = usePlaybooks();
  const { data: notes } = useNotes();
  const { data: journalStats } = useQuery({
    queryKey: ['journal-stats'],
    queryFn: () => journalApi.getStats(),
    enabled: pathname.startsWith('/journal'),
  });
  const { data: journalEntries } = useQuery({
    queryKey: ['journal-recent', undefined],
    queryFn: () => journalApi.listRecent(),
    staleTime: 60_000,
  });

  const { data: watchlistItems } = useWatchlist();

  const tradeCount = positions?.length ?? 0;
  const playbookCount = playbooks?.length ?? 0;
  const noteCount = notes?.length ?? 0;
  const journalCount = journalEntries?.length ?? 0;
  const watchlistCount = watchlistItems?.length ?? 0;

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

      {/* Scrollable nav area */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {/* Workspace nav */}
        <div style={sectionLabel}>Workspace</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {WORKSPACE.map(({ href, Icon, label }) => (
            <Link key={href} href={href} style={linkStyle(isActive(href))}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span>{label}</span>
              {href === '/trades' &&
                tradeCount > 0 &&
                pill(
                  tradeCount > 999 ? '999+' : String(tradeCount),
                  'var(--eb-panel-2)',
                  'var(--eb-muted-2)',
                )}
              {href === '/playbooks' &&
                playbookCount > 0 &&
                pill(String(playbookCount), 'var(--eb-panel-2)', 'var(--eb-muted-2)')}
              {href === '/watchlist' &&
                watchlistCount > 0 &&
                pill(String(watchlistCount), 'var(--eb-panel-2)', 'var(--eb-muted-2)')}
            </Link>
          ))}
        </nav>

        {/* Accounts nav — collapsible */}
        <button
          type="button"
          onClick={() => setAccountsOpen((v) => !v)}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '10px 6px 6px',
            background: 'transparent',
            border: 0,
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          <span style={{ ...sectionLabel, padding: 0, flex: 1, textAlign: 'left' }}>Accounts</span>
          {(accounts?.length ?? 0) > 0 && (
            <span
              style={{
                fontSize: 10,
                padding: '1px 5px',
                borderRadius: 8,
                background: 'var(--eb-panel-2)',
                color: 'var(--eb-muted)',
                marginRight: 4,
              }}
            >
              {accounts?.length}
            </span>
          )}
          <ChevronDown
            size={12}
            style={{
              color: 'var(--eb-muted)',
              transform: accountsOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform .2s',
            }}
          />
        </button>
        {accountsOpen && (
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {(accounts ?? []).map((account) => {
              const venueColor = account.venue === 'binance' ? '#F0B90B' : '#F7A600';
              return (
                <Link
                  key={account.id}
                  href="/accounts"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '5px 9px',
                    borderRadius: 7,
                    textDecoration: 'none',
                    background: 'transparent',
                    color: 'var(--eb-muted-2)',
                    fontSize: 12,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: '50%',
                      background: account.keyCount > 0 ? 'var(--green)' : 'var(--eb-yellow)',
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      flex: 1,
                    }}
                  >
                    {account.label}
                  </span>
                  <span style={{ fontSize: 10, fontWeight: 600, color: venueColor, flexShrink: 0 }}>
                    {account.venue === 'binance' ? 'BNB' : 'BYBIT'}
                  </span>
                </Link>
              );
            })}
            <Link
              href="/accounts"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                padding: '5px 9px',
                borderRadius: 7,
                textDecoration: 'none',
                background: 'transparent',
                color: 'var(--eb-muted)',
                fontSize: 12,
              }}
            >
              <Link2 size={12} style={{ flexShrink: 0 }} />
              <span>Connect account</span>
            </Link>
          </nav>
        )}

        {/* Prop trading nav */}
        <div style={sectionLabel}>Prop trading</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {PROP.map(({ href, Icon, label }) => (
            <Link key={href} href={href} style={linkStyle(isActive(href))}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Coaching nav */}
        <div style={sectionLabel}>Coaching</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {COACHING.map(({ href, Icon, label, badge, badgeColor, badgeText }) => (
            <Link key={href} href={href} style={linkStyle(isActive(href))}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span>{label}</span>
              {href === '/journal' && journalCount > 0
                ? pill(String(journalCount), 'var(--eb-panel-2)', 'var(--eb-muted-2)')
                : href === '/notes' && noteCount > 0
                  ? pill(String(noteCount), 'rgba(0,214,143,.12)', '#00d68f')
                  : badge && badgeColor && badgeText && pill(badge, badgeColor, badgeText)}
            </Link>
          ))}
        </nav>

        {/* Others nav */}
        <div style={sectionLabel}>Others</div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {OTHERS.map(({ href, Icon, label }) => (
            <Link key={href} href={href} style={linkStyle(isActive(href))}>
              <Icon size={14} style={{ flexShrink: 0 }} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        {/* Journal streak — only on /journal */}
        {pathname.startsWith('/journal') && journalStats && (
          <>
            <div style={sectionLabel}>Streak</div>
            <div style={{ padding: '2px 6px 6px', fontSize: 12 }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <span style={{ color: 'var(--eb-muted)' }}>Journal streak</span>
                <b style={{ color: 'var(--eb-text)', fontVariantNumeric: 'tabular-nums' }}>
                  {journalStats.streak} day{journalStats.streak !== 1 ? 's' : ''}
                </b>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginTop: 5,
                }}
              >
                <span style={{ color: 'var(--eb-muted)' }}>Discipline avg</span>
                <b
                  style={{
                    color:
                      journalStats.disciplineAvg != null
                        ? journalStats.disciplineAvg >= 70
                          ? 'var(--eb-text)'
                          : journalStats.disciplineAvg >= 40
                            ? 'var(--eb-yellow)'
                            : 'var(--eb-red)'
                        : 'var(--eb-muted-2)',
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {journalStats.disciplineAvg != null ? `${journalStats.disciplineAvg}/100` : '—'}
                </b>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Profile card at bottom */}
      <div style={{ paddingTop: 8 }}>
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
            }}
          >
            {/* Avatar — click to change color */}
            <div style={{ position: 'relative', flexShrink: 0 }} ref={colorPickerRef}>
              <button
                type="button"
                title="Change avatar color"
                onClick={() => setShowColorPicker((v) => !v)}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: avatarColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  border: 0,
                  cursor: 'pointer',
                  boxShadow: '0 0 0 2px var(--eb-panel-2), 0 0 0 3.5px rgba(139,92,246,.3)',
                  padding: 0,
                  fontFamily: 'inherit',
                }}
              >
                {initial}
              </button>

              {/* Color picker popover */}
              {showColorPicker && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: 0,
                    zIndex: 100,
                    background: 'var(--eb-panel)',
                    border: '1px solid var(--eb-border)',
                    borderRadius: 10,
                    padding: '10px',
                    boxShadow: '0 8px 24px rgba(0,0,0,.35)',
                    width: 160,
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      color: 'var(--eb-muted)',
                      marginBottom: 8,
                      letterSpacing: '.08em',
                      textTransform: 'uppercase',
                      fontWeight: 600,
                    }}
                  >
                    Avatar color
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
                    {AVATAR_PRESETS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        title={color}
                        onClick={() => pickColor(color)}
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          background: color,
                          border:
                            avatarColor === color
                              ? '2px solid var(--eb-text)'
                              : '2px solid transparent',
                          cursor: 'pointer',
                          padding: 0,
                          outline: avatarColor === color ? '2px solid var(--eb-panel)' : 'none',
                          outlineOffset: -4,
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Name + email → navigates to settings */}
            <Link
              href="/settings"
              style={{
                minWidth: 0,
                flex: 1,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 9,
              }}
            >
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
            </Link>
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
              onClick={() => setShowSignOutDialog(true)}
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

            <Dialog open={showSignOutDialog} onOpenChange={setShowSignOutDialog}>
              <DialogContent style={{ maxWidth: 360 }}>
                <DialogHeader>
                  <DialogTitle>Sign out?</DialogTitle>
                  <DialogDescription>
                    You'll need to sign back in to access your journal and trade data.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter style={{ gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowSignOutDialog(false)}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 500,
                      background: 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      color: 'var(--eb-text)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      signOut.mutate();
                      setShowSignOutDialog(false);
                    }}
                    disabled={signOut.isPending}
                    style={{
                      flex: 1,
                      padding: '8px 0',
                      borderRadius: 8,
                      fontSize: 13,
                      fontWeight: 600,
                      background: 'rgba(255,91,108,.12)',
                      border: '1px solid rgba(255,91,108,.3)',
                      color: '#ff5b6c',
                      cursor: signOut.isPending ? 'not-allowed' : 'pointer',
                      fontFamily: 'inherit',
                      opacity: signOut.isPending ? 0.6 : 1,
                    }}
                  >
                    <LogOut
                      size={13}
                      style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }}
                    />
                    {signOut.isPending ? 'Signing out…' : 'Sign out'}
                  </button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>
    </aside>
  );
}
