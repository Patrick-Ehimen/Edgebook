'use client';

import { useAccounts } from '@/features/accounts';
import { useAllPositions } from '@/features/positions';
import type { Position } from '@/features/positions/schemas';
import type { LucideIcon } from 'lucide-react';
import {
  BookOpen,
  Brain,
  CalendarDays,
  Inbox,
  Layers,
  LayoutDashboard,
  NotebookPen,
  ScrollText,
  Search,
  SearchX,
  Settings,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

// ─── Static data ──────────────────────────────────────────────────────────────

const PAGES: { name: string; path: string; Icon: LucideIcon }[] = [
  { name: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
  { name: 'Trade log', path: '/trades', Icon: BookOpen },
  { name: 'Analytics', path: '/analytics', Icon: TrendingUp },
  { name: 'Calendar', path: '/calendar', Icon: CalendarDays },
  { name: 'Mind Lab', path: '/mind-lab', Icon: Brain },
  { name: 'Plans', path: '/plans', Icon: ScrollText },
  { name: 'Playbook', path: '/playbooks', Icon: Target },
  { name: 'Daily journal', path: '/journal', Icon: NotebookPen },
  { name: 'AI weekly review', path: '/ai-review', Icon: Inbox },
  { name: 'Goals & rules', path: '/goals', Icon: ShieldCheck },
  { name: 'Settings', path: '/settings', Icon: Settings },
];

type Scope = 'all' | 'trades' | 'pages';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function highlight(text: string, query: string) {
  if (!query.trim()) return <>{text}</>;
  const safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${safe})`, 'i'));
  let pos = 0;
  return (
    <>
      {parts.map((p) => {
        const k = pos;
        pos += p.length;
        return p.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={k}
            style={{
              background: 'rgba(0,214,143,.25)',
              color: 'var(--green)',
              padding: '0 2px',
              borderRadius: 3,
              fontWeight: 600,
            }}
          >
            {p}
          </mark>
        ) : (
          <span key={k}>{p}</span>
        );
      })}
    </>
  );
}

function isQuestion(s: string) {
  const t = s.trim().toLowerCase();
  return (
    t.length >= 10 &&
    (/^(what|how|why|when|where|show|find|list|compare|did|do)/.test(t) || t.includes('?'))
  );
}

function fmtPnl(n: string | null) {
  if (!n) return null;
  const v = Number.parseFloat(n);
  if (Number.isNaN(v)) return null;
  return {
    text: `${v >= 0 ? '+' : ''}${v.toFixed(2)}`,
    color: v > 0 ? 'var(--green)' : v < 0 ? 'var(--eb-red)' : 'var(--eb-muted)',
  };
}

const KEYWORD_FILTERS: Record<string, (p: Position) => boolean> = {
  open: (p) => p.status === 'open',
  closed: (p) => p.status === 'closed',
  long: (p) => p.side === 'long',
  short: (p) => p.side === 'short',
  win: (p) => Number.parseFloat(p.netPnl) > 0,
  winner: (p) => Number.parseFloat(p.netPnl) > 0,
  green: (p) => Number.parseFloat(p.netPnl) > 0,
  loss: (p) => Number.parseFloat(p.netPnl) < 0,
  loser: (p) => Number.parseFloat(p.netPnl) < 0,
  red: (p) => Number.parseFloat(p.netPnl) < 0,
};

// ─── Item types ───────────────────────────────────────────────────────────────

type Item = {
  id: string;
  group: string;
  render: (active: boolean) => React.ReactNode;
  action: () => void;
};

// ─── SearchPalette ────────────────────────────────────────────────────────────

export function SearchPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState('');
  const [scope, setScope] = useState<Scope>('all');
  const [activeIndex, setActiveIndex] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { data: accounts } = useAccounts();
  const { data: positions } = useAllPositions(accounts);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setScope('all');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const navigate = useCallback(
    (path: string) => {
      router.push(path);
      onClose();
    },
    [router, onClose],
  );

  // ─── Filtered results ──────────────────────────────────────────────────────

  const q = query.trim().toLowerCase();

  const filteredTrades = useMemo(() => {
    if (!positions) return [];

    if (!q) {
      return [...positions]
        .filter((p) => p.status === 'closed')
        .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())
        .slice(0, 5);
    }

    const keywordFn = KEYWORD_FILTERS[q];
    const filtered = keywordFn
      ? positions.filter(keywordFn)
      : positions.filter(
          (p) =>
            p.symbol.toLowerCase().includes(q) ||
            p.side.includes(q) ||
            p.status.includes(q) ||
            p.wentRight?.toLowerCase().includes(q) ||
            p.wentWrong?.toLowerCase().includes(q) ||
            p.lesson?.toLowerCase().includes(q),
        );

    return filtered.slice(0, scope === 'all' ? 5 : 20);
  }, [positions, q, scope]);

  const filteredPages = useMemo(() => {
    if (!q) return PAGES;
    return PAGES.filter((p) => p.name.toLowerCase().includes(q) || p.path.includes(q)).slice(
      0,
      scope === 'all' ? 4 : 20,
    );
  }, [q, scope]);

  // ─── Build flat item list ──────────────────────────────────────────────────

  const items = useMemo<Item[]>(() => {
    const list: Item[] = [];
    const tradeGroup = q ? 'Trades' : 'Recent trades';
    const pageGroup = q ? 'Pages' : 'Navigate';

    if (scope === 'all' || scope === 'trades') {
      for (const pos of filteredTrades) {
        const pnl = fmtPnl(pos.netPnl);
        const r = pos.rRealized ? Number.parseFloat(pos.rRealized) : null;
        const SideIcon = pos.side === 'long' ? TrendingUp : TrendingDown;
        const sideColor = pos.side === 'long' ? 'var(--green)' : 'var(--eb-red)';
        list.push({
          id: `trade-${pos.id}`,
          group: tradeGroup,
          action: () => navigate(`/trades/${pos.id}`),
          render: (active) => (
            <div style={rowStyle(active)}>
              <div
                style={{
                  ...iconStyle,
                  borderColor: pos.side === 'long' ? 'rgba(0,214,143,.25)' : 'rgba(255,91,108,.25)',
                }}
              >
                <SideIcon size={14} style={{ color: sideColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    flexWrap: 'wrap',
                    fontWeight: 500,
                    fontSize: 13,
                  }}
                >
                  {highlight(pos.symbol, query)}
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 5px',
                      borderRadius: 4,
                      fontWeight: 600,
                      letterSpacing: '.04em',
                      background:
                        pos.side === 'long' ? 'rgba(0,214,143,.14)' : 'rgba(255,91,108,.14)',
                      color: sideColor,
                    }}
                  >
                    {pos.side.toUpperCase()}
                  </span>
                  {pos.status === 'open' && (
                    <span
                      style={{
                        fontSize: 9.5,
                        padding: '1px 5px',
                        borderRadius: 4,
                        background: 'rgba(139,92,246,.14)',
                        color: 'var(--eb-purple, #8b5cf6)',
                        fontWeight: 600,
                      }}
                    >
                      OPEN
                    </span>
                  )}
                </div>
                <div
                  style={{
                    color: 'var(--eb-muted)',
                    fontSize: 11.5,
                    marginTop: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {pos.closedAt
                    ? new Date(pos.closedAt).toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })
                    : `Opened ${new Date(pos.openedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}`}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {r !== null && (
                  <span
                    style={{
                      fontSize: 10.5,
                      padding: '1px 7px',
                      borderRadius: 99,
                      border: '1px solid',
                      fontFamily: 'var(--font-mono, monospace)',
                      borderColor: r >= 0 ? 'rgba(0,214,143,.30)' : 'rgba(255,91,108,.30)',
                      background: r >= 0 ? 'rgba(0,214,143,.08)' : 'rgba(255,91,108,.08)',
                      color: r >= 0 ? 'var(--green)' : 'var(--eb-red)',
                    }}
                  >
                    {r >= 0 ? '+' : ''}
                    {r.toFixed(2)}R
                  </span>
                )}
                {pnl && (
                  <span
                    style={{
                      fontSize: 12,
                      fontFamily: 'var(--font-mono, monospace)',
                      color: pnl.color,
                      fontWeight: 600,
                    }}
                  >
                    {pnl.text}
                  </span>
                )}
                <span
                  style={{
                    opacity: active ? 1 : 0,
                    color: 'var(--green)',
                    fontSize: 14,
                    fontWeight: 600,
                  }}
                >
                  ↵
                </span>
              </div>
            </div>
          ),
        });
      }
    }

    if (scope === 'all' || scope === 'pages') {
      for (const page of filteredPages) {
        const { Icon } = page;
        list.push({
          id: `page-${page.path}`,
          group: pageGroup,
          action: () => navigate(page.path),
          render: (active) => (
            <div style={rowStyle(active)}>
              <div style={iconStyle}>
                <Icon size={14} style={{ color: 'var(--eb-muted-2)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13 }}>{highlight(page.name, query)}</div>
                <div style={{ color: 'var(--eb-muted)', fontSize: 11.5, marginTop: 1 }}>
                  {page.path}
                </div>
              </div>
              <span
                style={{
                  opacity: active ? 1 : 0,
                  color: 'var(--green)',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                ↵
              </span>
            </div>
          ),
        });
      }
    }

    return list;
  }, [filteredTrades, filteredPages, query, q, scope, navigate]);

  // ─── Keyboard navigation ───────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key === 'ArrowDown') {
        setActiveIndex((i) => Math.min(items.length - 1, i + 1));
        e.preventDefault();
      } else if (e.key === 'ArrowUp') {
        setActiveIndex((i) => Math.max(0, i - 1));
        e.preventDefault();
      } else if (e.key === 'Enter') {
        if (items[activeIndex]) items[activeIndex].action();
        e.preventDefault();
      } else if (e.key === 'Tab') {
        const scopes: Scope[] = ['all', 'trades', 'pages'];
        const cur = scopes.indexOf(scope);
        setScope(scopes[(cur + (e.shiftKey ? -1 + scopes.length : 1)) % scopes.length] ?? 'all');
        setActiveIndex(0);
        e.preventDefault();
      }
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, items, activeIndex, scope, onClose]);

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIndex}"]`) as HTMLElement | null;
    el?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!mounted || !open) return null;

  const tradeCount = filteredTrades.length;
  const pageCount = filteredPages.length;

  const scopeChips: { key: Scope; label: string; Icon: LucideIcon; count?: number }[] = [
    { key: 'all', label: 'All', Icon: Search, count: tradeCount + pageCount },
    { key: 'trades', label: 'Trades', Icon: BookOpen, count: tradeCount },
    { key: 'pages', label: 'Pages', Icon: Layers, count: pageCount },
  ];

  const groups: Record<string, Item[]> = {};
  for (const item of items) {
    if (!groups[item.group]) groups[item.group] = [];
    // biome-ignore lint/style/noNonNullAssertion: initialized above
    groups[item.group]!.push(item);
  }
  let flatIndex = 0;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(4,7,12,.52)',
        backdropFilter: 'blur(8px)',
        zIndex: 999,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: 84,
        animation: 'eb-fade-in .12s ease-out',
      }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <style>{`
        @keyframes eb-fade-in{from{opacity:0}to{opacity:1}}
        @keyframes eb-pop{from{transform:translateY(-8px) scale(.985);opacity:0}to{transform:none;opacity:1}}
        .eb-pal-row:hover{background:var(--eb-panel-2)!important}
        @media(max-width:600px){.eb-palette{width:100%!important;max-height:100vh!important;border-radius:0!important}}
      `}</style>

      <div
        className="eb-palette"
        style={{
          width: 'min(680px, calc(100vw - 32px))',
          maxHeight: 'min(640px, calc(100vh - 120px))',
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          boxShadow: '0 32px 80px rgba(0,0,0,.55), 0 0 0 1px rgba(0,214,143,.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'eb-pop .18s cubic-bezier(.16,1,.3,1)',
        }}
        aria-label="Search palette"
      >
        {/* Input */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '14px 18px',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          <Search size={16} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search trades, notes — or type 'long', 'win', 'open'…"
            style={{
              flex: 1,
              background: 'transparent',
              border: 0,
              outline: 'none',
              color: 'var(--eb-text)',
              fontSize: 15,
              fontFamily: 'inherit',
            }}
          />
          <kbd style={kbdStyle}>esc</kbd>
        </div>

        {/* Scope chips */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '10px 14px 12px',
            borderBottom: '1px solid var(--eb-border)',
            overflowX: 'auto',
            scrollbarWidth: 'none',
          }}
        >
          {scopeChips.map(({ key, label, Icon: ChipIcon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setScope(key);
                setActiveIndex(0);
              }}
              style={{
                fontFamily: 'inherit',
                fontSize: 11.5,
                padding: '4px 10px',
                borderRadius: 99,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                border: `1px solid ${scope === key ? 'rgba(0,214,143,.40)' : 'var(--eb-border)'}`,
                background: scope === key ? 'rgba(0,214,143,.12)' : 'var(--eb-panel-2)',
                color: scope === key ? 'var(--green)' : 'var(--eb-muted-2)',
              }}
            >
              <ChipIcon size={11} />
              {label}
              {count !== undefined && <span style={{ fontSize: 10, opacity: 0.7 }}>· {count}</span>}
            </button>
          ))}

          {/* Smart keyword hints */}
          {!q && (
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4, alignItems: 'center' }}>
              {['long', 'short', 'win', 'loss', 'open'].map((kw) => (
                <button
                  key={kw}
                  type="button"
                  onClick={() => setQuery(kw)}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: 10.5,
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid var(--eb-border)',
                    background: 'transparent',
                    color: 'var(--eb-muted)',
                    cursor: 'pointer',
                  }}
                >
                  {kw}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Results */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '6px 0 4px' }}>
          {/* AI banner */}
          {isQuestion(query) && (
            <div
              style={{
                margin: '6px 14px',
                padding: '11px 14px',
                borderRadius: 10,
                background: 'linear-gradient(180deg,rgba(139,92,246,.10),rgba(6,182,212,.04))',
                border: '1px solid rgba(139,92,246,.30)',
                display: 'flex',
                gap: 10,
                alignItems: 'flex-start',
              }}
            >
              <div
                style={{
                  width: 26,
                  height: 26,
                  borderRadius: 8,
                  flexShrink: 0,
                  background:
                    'linear-gradient(135deg,var(--eb-purple, #8b5cf6),var(--cyan, #06b6d4))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Sparkles size={13} style={{ color: '#fff' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 2 }}>
                  Ask AI · "{query}"
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted-2)' }}>
                  Claude will scan your fills, journal, and rules to answer.
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <kbd style={kbdStyle}>⌘</kbd>
                <kbd style={kbdStyle}>↵</kbd>
              </div>
            </div>
          )}

          {/* Grouped results */}
          {Object.entries(groups).map(([group, groupItems]) => (
            <div key={group} style={{ marginBottom: 4 }}>
              <div style={sectionHeader}>
                {group}
                {q && <span style={{ fontWeight: 400, opacity: 0.6 }}> {groupItems.length}</span>}
              </div>
              {groupItems.map((item) => {
                const idx = flatIndex++;
                return (
                  <div
                    key={item.id}
                    data-idx={idx}
                    className="eb-pal-row"
                    onMouseEnter={() => setActiveIndex(idx)}
                    onClick={item.action}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') item.action();
                    }}
                    tabIndex={-1}
                    style={{ cursor: 'pointer' }}
                  >
                    {item.render(idx === activeIndex)}
                  </div>
                );
              })}
            </div>
          ))}

          {/* No results */}
          {q && items.length === 0 && !isQuestion(query) && (
            <div style={{ padding: '38px 18px', textAlign: 'center', color: 'var(--eb-muted)' }}>
              <SearchX size={32} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
              <div
                style={{ fontWeight: 600, fontSize: 14, color: 'var(--eb-text)', marginBottom: 4 }}
              >
                No matches for "{query}"
              </div>
              <div style={{ fontSize: 12.5 }}>
                Try "long", "win", "BTCUSDT", or ask AI with a full sentence.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            padding: '10px 18px',
            borderTop: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
            fontSize: 11,
            color: 'var(--eb-muted)',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbdStyle}>↑↓</kbd> navigate
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbdStyle}>↵</kbd> open
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbdStyle}>tab</kbd> scope
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5 }}>
            <kbd style={kbdStyle}>esc</kbd> close
          </span>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// ─── Shared styles ────────────────────────────────────────────────────────────

const rowStyle = (active: boolean): React.CSSProperties => ({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '9px 18px',
  fontSize: 13,
  background: active ? 'var(--eb-panel-2)' : 'transparent',
});

const iconStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  flexShrink: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: 'var(--eb-panel-2)',
  border: '1px solid var(--eb-border)',
};

const kbdStyle: React.CSSProperties = {
  fontSize: 10,
  padding: '1px 6px',
  border: '1px solid var(--eb-border)',
  borderRadius: 4,
  color: 'var(--eb-muted)',
  fontFamily: 'inherit',
  background: 'var(--eb-panel)',
};

const sectionHeader: React.CSSProperties = {
  margin: 0,
  padding: '8px 18px 4px',
  fontSize: 10.5,
  color: 'var(--eb-muted)',
  textTransform: 'uppercase',
  letterSpacing: '.08em',
  fontWeight: 600,
};
