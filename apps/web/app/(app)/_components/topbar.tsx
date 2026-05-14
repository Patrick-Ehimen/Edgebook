'use client';

import { Button } from '@/components/ui/button';
import { Moon, Plus, RefreshCw, Search, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function Topbar() {
  const { resolvedTheme, setTheme } = useTheme();

  const toggleTheme = () => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 22px',
        borderBottom: '1px solid var(--eb-border)',
        background: 'rgba(10,14,20,.7)',
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
      <Button
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '5px 10px',
          border: '1px solid var(--eb-border)',
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
            background: 'var(--green)',
            boxShadow: '0 0 0 3px rgba(0,214,143,.15)',
            display: 'inline-block',
          }}
        />
        All accounts
        <span style={{ color: 'var(--eb-muted)', marginLeft: 2 }}>▾</span>
      </Button>

      {/* Date range */}
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
        Last 30D ▾
      </Button>

      {/* Sync */}
      <Button
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '6px 11px',
          borderRadius: 7,
          border: '1px solid transparent',
          background: 'transparent',
          color: 'var(--eb-muted)',
          fontSize: 12,
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        <RefreshCw size={12} />
        Sync
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
