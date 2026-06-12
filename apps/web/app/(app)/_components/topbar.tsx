'use client';

import { Button } from '@/components/ui/button';
import { useAccounts } from '@/features/accounts';
import { useLogTrade } from '@/providers/log-trade-provider';
import { useSelectedAccount } from '@/providers/selected-account-provider';
import { SearchPalette } from './SearchPalette';
import {
  Bell,
  Check,
  ChevronDown,
  Moon,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

const VENUE_META: Record<string, { logo: string; color: string }> = {
  binance: { logo: '/assets/binance-logo.svg', color: '#F0B90B' },
  bybit:   { logo: '/assets/bybit-logo.svg',   color: '#F7A600' },
};

const CATEGORY_DOT: Record<string, string> = {
  live: 'var(--green)',
  demo: 'var(--eb-cyan)',
  prop: 'var(--eb-purple)',
};

function AccountSelector() {
  const [open, setOpen] = useState(false);
  const { selectedAccountId: selected, setSelectedAccountId: setSelected } = useSelectedAccount();
  const ref = useRef<HTMLDivElement>(null);
  const { data: accounts } = useAccounts();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const activeAccount = (accounts ?? []).find((a) => a.id === selected);
  const dotColor = selected === 'all'
    ? 'var(--green)'
    : (CATEGORY_DOT[activeAccount?.category ?? ''] ?? 'var(--green)');
  const triggerLabel = selected === 'all' ? 'All accounts' : (activeAccount?.label ?? 'All accounts');

  // Group accounts by venue
  const venues = [...new Set((accounts ?? []).map((a) => a.venue))];

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          padding: '5px 10px',
          border: `1px solid ${open ? 'var(--eb-muted)' : 'var(--eb-border)'}`,
          borderRadius: 8,
          background: 'var(--eb-panel)',
          color: 'var(--eb-text)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: dotColor,
            boxShadow: `0 0 0 3px ${dotColor}26`,
            flexShrink: 0,
            display: 'inline-block',
          }}
        />
        {triggerLabel}
        <ChevronDown size={11} style={{ color: 'var(--eb-muted)', marginLeft: 1 }} />
      </Button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: 236,
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            zIndex: 50,
            padding: 4,
          }}
        >
          {/* All accounts row */}
          <button
            type="button"
            onClick={() => { setSelected('all'); setOpen(false); }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '7px 10px',
              borderRadius: 7,
              border: 0,
              background: selected === 'all' ? 'var(--eb-panel-2)' : 'transparent',
              color: selected === 'all' ? 'var(--eb-text)' : 'var(--eb-muted-2)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <Wallet size={13} style={{ flexShrink: 0, color: 'var(--eb-muted)' }} />
            <span style={{ flex: 1 }}>All accounts</span>
            {selected === 'all' && <Check size={12} style={{ color: 'var(--green)' }} />}
          </button>

          {/* Exchange groups */}
          {venues.length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--eb-border)', margin: '4px 6px' }} />
              {venues.map((venue) => {
                const venueAccounts = (accounts ?? []).filter((a) => a.venue === venue);
                const meta = VENUE_META[venue] ?? { logo: '', color: 'var(--eb-muted)' };
                return (
                  <div key={venue}>
                    {/* Exchange header */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px 4px',
                    }}>
                      {meta.logo && (
                        <Image
                          src={meta.logo}
                          alt={venue}
                          width={52}
                          height={14}
                          style={{ objectFit: 'contain', flexShrink: 0 }}
                        />
                      )}
                    </div>

                    {/* Subaccounts under this exchange */}
                    {venueAccounts.map((acc) => {
                      const catDot = CATEGORY_DOT[acc.category] ?? 'var(--eb-muted)';
                      const isActive = selected === acc.id;
                      return (
                        <button
                          key={acc.id}
                          type="button"
                          onClick={() => { setSelected(acc.id); setOpen(false); }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 9,
                            width: '100%',
                            padding: '6px 10px 6px 22px',
                            borderRadius: 7,
                            border: 0,
                            background: isActive ? 'var(--eb-panel-2)' : 'transparent',
                            color: isActive ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                            fontSize: 12.5,
                            cursor: 'pointer',
                            fontFamily: 'inherit',
                            textAlign: 'left',
                          }}
                        >
                          <span style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: catDot,
                            flexShrink: 0,
                            display: 'inline-block',
                          }} />
                          <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {acc.label}
                          </span>
                          <span style={{
                            fontSize: 10,
                            padding: '1px 5px',
                            borderRadius: 99,
                            background: `${catDot}1a`,
                            color: catDot,
                            fontWeight: 600,
                            flexShrink: 0,
                          }}>
                            {acc.category.charAt(0).toUpperCase() + acc.category.slice(1)}
                          </span>
                          {isActive && <Check size={11} style={{ color: 'var(--green)', flexShrink: 0 }} />}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </>
          )}

          {/* Add subaccount link */}
          <div style={{ height: 1, background: 'var(--eb-border)', margin: '4px 6px' }} />
          <Link
            href="/accounts"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '7px 10px',
              borderRadius: 7,
              color: 'var(--eb-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textDecoration: 'none',
            }}
          >
            <Plus size={12} style={{ flexShrink: 0 }} />
            Add subaccount…
          </Link>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const logTrade = useLogTrade();

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 22px',
        borderBottom: '1px solid var(--eb-border)',
        backdropFilter: 'blur(8px)',
        position: 'sticky',
        top: 0,
        zIndex: 5,
      }}
      className="dark:bg-[rgba(10,14,20,.7)] bg-[rgba(246,248,251,.85)]"
    >
      {/* Search */}
      <button
        type="button"
        onClick={() => setPaletteOpen(true)}
        style={{
          flex: 1,
          maxWidth: 480,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          padding: '6px 10px',
          borderRadius: 8,
          color: 'var(--eb-muted)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          textAlign: 'left',
        }}
      >
        <Search size={13} style={{ flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: 13, color: 'var(--eb-muted)' }}>
          Search trades, notes, playbooks…
        </span>
        <kbd
          style={{
            fontSize: 11,
            padding: '1px 6px',
            border: '1px solid var(--eb-border)',
            borderRadius: 5,
            color: 'var(--eb-muted)',
            background: 'transparent',
            fontFamily: 'inherit',
          }}
        >
          ⌘ K
        </kbd>
      </button>
      <SearchPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      {/* Account selector */}
      <AccountSelector />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Sync */}
      <Button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px',
          borderRadius: 7,
          border: '1px solid var(--eb-border)',
          background: 'var(--eb-panel-2)',
          color: 'var(--eb-muted)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <RefreshCw size={12} />
        Sync
      </Button>

      {/* Notifications */}
      <Button
        title="Notifications"
        style={{
          position: 'relative',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 32,
          border: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'var(--eb-muted)',
        }}
      >
        <Bell size={14} />
        <span
          style={{
            position: 'absolute',
            top: 5,
            right: 5,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'var(--eb-red)',
            border: '1.5px solid var(--eb-panel)',
          }}
        />
      </Button>

      {/* Theme toggle */}
      <Button
        onClick={toggleTheme}
        title="Toggle theme"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 34,
          height: 32,
          border: '1px solid var(--eb-border)',
          background: 'var(--eb-panel)',
          borderRadius: 8,
          cursor: 'pointer',
          color: 'var(--eb-text)',
        }}
      >
        {mounted ? (resolvedTheme === 'dark' ? <Moon size={14} /> : <Sun size={14} />) : <Sun size={14} />}
      </Button>

      {/* Log trade */}
      <Button
        onClick={logTrade.open}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '7px 13px',
          borderRadius: 8,
          border: '1px solid #00b67a',
          background: 'linear-gradient(180deg,#00d68f,#00b67a)',
          color: '#06140f',
          fontSize: 12.5,
          fontWeight: 600,
          cursor: 'pointer',
          fontFamily: 'inherit',
          transition: 'filter .15s',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.filter = 'brightness(1.05)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.filter = 'none'; }}
      >
        <Plus size={13} />
        Log trade
      </Button>
    </header>
  );
}
