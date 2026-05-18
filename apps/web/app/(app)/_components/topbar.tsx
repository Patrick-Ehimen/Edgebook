'use client';

import { Button } from '@/components/ui/button';
import { useLogTrade } from '@/providers/log-trade-provider';
import {
  Bell,
  Calendar,
  Check,
  ChevronDown,
  Moon,
  Plug,
  Plus,
  RefreshCw,
  Search,
  Sun,
  Wallet,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';

const PRESETS = [
  { label: 'Last 7 days', value: '7d' },
  { label: 'Last 30 days', value: '30d' },
  { label: 'Last 90 days', value: '90d' },
  { label: 'Last 180 days', value: '180d' },
  { label: 'Custom range…', value: 'custom' },
] as const;

type Period = (typeof PRESETS)[number]['value'];

type Account = {
  id: string;
  label: string;
  exchange: string;
  color: string;
  logo: string;
  logoDark?: string;
};

const DEMO_ACCOUNTS: Account[] = [
  {
    id: 'bybit-main',
    label: 'Bybit main',
    exchange: 'Bybit',
    color: '#f7a600',
    logo: '/assets/bybit-logo.svg',
    logoDark: '/assets/bybit-logo-dark.svg',
  },
  {
    id: 'binance-perps',
    label: 'Binance perps',
    exchange: 'Binance',
    color: '#f0b90b',
    logo: '/assets/binance-logo.svg',
  },
];

function AccountSelector() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string>('all');
  const ref = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const activeAccount = DEMO_ACCOUNTS.find((a) => a.id === selected);
  const dotColor = selected === 'all' ? 'var(--green)' : (activeAccount?.color ?? 'var(--green)');
  const triggerLabel =
    selected === 'all' ? 'All accounts' : (activeAccount?.label ?? 'All accounts');

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
            boxShadow: `0 0 0 3px ${selected === 'all' ? 'rgba(0,214,143,.15)' : 'rgba(247,166,0,.15)'}`,
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
            minWidth: 220,
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            zIndex: 50,
            padding: 4,
          }}
        >
          {/* All accounts */}
          <button
            type="button"
            onClick={() => {
              setSelected('all');
              setOpen(false);
            }}
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

          {/* Divider + accounts */}
          {DEMO_ACCOUNTS.length > 0 && (
            <>
              <div style={{ height: 1, background: 'var(--eb-border)', margin: '4px 6px' }} />
              <div
                style={{
                  padding: '4px 10px 3px',
                  fontSize: 10.5,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.07em',
                  fontWeight: 600,
                }}
              >
                Connected
              </div>
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    setSelected(acc.id);
                    setOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 7,
                    border: 0,
                    background: selected === acc.id ? 'var(--eb-panel-2)' : 'transparent',
                    color: selected === acc.id ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                    fontSize: 12.5,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: '50%',
                      background: acc.color,
                      flexShrink: 0,
                      display: 'inline-block',
                    }}
                  />
                  <span style={{ flex: 1 }}>{acc.label}</span>
                  <Image
                    src={resolvedTheme === 'dark' && acc.logoDark ? acc.logoDark : acc.logo}
                    alt={acc.exchange}
                    width={44}
                    height={14}
                    style={{ objectFit: 'contain', opacity: 0.85, flexShrink: 0 }}
                  />
                  {selected === acc.id && (
                    <Check size={12} style={{ color: 'var(--green)', marginLeft: 4 }} />
                  )}
                </button>
              ))}
            </>
          )}

          {/* Connect account */}
          <div style={{ height: 1, background: 'var(--eb-border)', margin: '4px 6px' }} />
          <button
            type="button"
            onClick={() => setOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              width: '100%',
              padding: '7px 10px',
              borderRadius: 7,
              border: 0,
              background: 'transparent',
              color: 'var(--eb-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
            }}
          >
            <Plug size={12} style={{ flexShrink: 0 }} />
            Connect account…
          </button>
        </div>
      )}
    </div>
  );
}

function DateRangeFilter() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Period>('30d');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  const label = PRESETS.find((p) => p.value === selected)?.label ?? 'Last 30 days';
  const short = label.replace('Last ', '').replace(' days', 'D').replace('…', '');

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <Button
        onClick={() => setOpen((v) => !v)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px',
          borderRadius: 7,
          border: `1px solid ${open ? 'var(--eb-muted)' : 'var(--eb-border)'}`,
          background: 'var(--eb-panel-2)',
          color: 'var(--eb-text)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <Calendar size={12} style={{ flexShrink: 0, color: 'var(--eb-muted)' }} />
        {selected === 'custom' ? 'Custom' : `Last ${short}`} ▾
      </Button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: 170,
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,.18)',
            zIndex: 50,
            padding: 4,
            overflow: 'hidden',
          }}
        >
          {PRESETS.map(({ label: optLabel, value }) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSelected(value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '7px 10px',
                borderRadius: 7,
                border: 0,
                background: selected === value ? 'var(--eb-panel-2)' : 'transparent',
                color: selected === value ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                fontSize: 12.5,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              {optLabel}
              {selected === value && (
                <Check size={12} style={{ color: 'var(--green)', flexShrink: 0 }} />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();
  const logTrade = useLogTrade();

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
      <div
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
        }}
      >
        <Search size={13} style={{ flexShrink: 0 }} />
        <input
          placeholder="Search trades, notes, playbooks…"
          style={{
            flex: 1,
            background: 'transparent',
            border: 0,
            outline: 'none',
            color: 'var(--eb-text)',
            fontSize: 13,
            fontFamily: 'inherit',
          }}
        />
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
      </div>

      {/* Account selector */}
      <AccountSelector />

      {/* Date range filter */}
      <DateRangeFilter />

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
        {/* unread badge */}
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
        {resolvedTheme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
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
        onMouseEnter={(e) => {
          e.currentTarget.style.filter = 'brightness(1.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.filter = 'none';
        }}
      >
        <Plus size={13} />
        Log trade
      </Button>
    </header>
  );
}
