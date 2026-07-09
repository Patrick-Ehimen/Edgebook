'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-client';
import { useQueryClient } from '@tanstack/react-query';
import { AlertCircle } from 'lucide-react';
import Image from 'next/image';
import { useState } from 'react';
import { accountsApi } from '../api';
import type { AccountCategory, Venue } from '../schemas';

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
  boxSizing: 'border-box',
};

const VENUES: { id: Venue; label: string; logo: string }[] = [
  { id: 'binance', label: 'Binance', logo: '/assets/binance-logo.svg' },
  { id: 'bybit', label: 'Bybit', logo: '/assets/bybit-logo.svg' },
];

const CATEGORIES: {
  id: AccountCategory;
  label: string;
  desc: string;
  color: string;
  border: string;
  bg: string;
}[] = [
  {
    id: 'live',
    label: 'Live',
    desc: 'Real money account',
    color: 'var(--green)',
    border: 'rgba(0,214,143,.4)',
    bg: 'rgba(0,214,143,.07)',
  },
  {
    id: 'demo',
    label: 'Demo',
    desc: 'Paper / testnet account',
    color: 'var(--eb-cyan)',
    border: 'rgba(6,182,212,.4)',
    bg: 'rgba(6,182,212,.07)',
  },
  {
    id: 'prop',
    label: 'Prop',
    desc: 'Funded / prop firm account',
    color: 'var(--eb-purple)',
    border: 'rgba(139,92,246,.4)',
    bg: 'rgba(139,92,246,.07)',
  },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddAccountDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const [venue, setVenue] = useState<Venue>('binance');
  const [category, setCategory] = useState<AccountCategory>('live');
  const [label, setLabel] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function reset() {
    setVenue('binance');
    setCategory('live');
    setLabel('');
    setAccountSize('');
    setError('');
    setLoading(false);
  }

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
    if (!v) reset();
  }

  async function handleCreate() {
    setLoading(true);
    setError('');
    try {
      const venueLabel = venue.charAt(0).toUpperCase() + venue.slice(1);
      const size = accountSize.trim();
      if (size && !/^\d+(\.\d+)?$/.test(size)) {
        setError('Account size must be a positive number.');
        setLoading(false);
        return;
      }
      await accountsApi.create({
        venue,
        label:
          label.trim() || `${venueLabel} ${category.charAt(0).toUpperCase() + category.slice(1)}`,
        accountType: 'futures',
        category,
        baseCurrency: 'USDT',
        startingBalance: size || '0',
      });
      await qc.invalidateQueries({ queryKey: ['accounts'] });
      handleOpenChange(false);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError('Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--eb-text)', fontSize: 15 }}>
            Add subaccount
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Category picker */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Account type
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              {CATEGORIES.map(({ id, label: name, desc, color, border, bg }) => {
                const active = category === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setCategory(id)}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: 4,
                      padding: '10px 8px',
                      border: `1.5px solid ${active ? border : 'var(--eb-border)'}`,
                      borderRadius: 10,
                      background: active ? bg : 'var(--eb-panel-2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      transition: 'border-color .15s, background .15s',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: active ? color : 'var(--eb-text)',
                      }}
                    >
                      {name}
                    </span>
                    <span
                      style={{
                        fontSize: 10.5,
                        color: 'var(--eb-muted)',
                        textAlign: 'center',
                        lineHeight: 1.3,
                      }}
                    >
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Exchange picker */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              Exchange
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {VENUES.map(({ id, label: name, logo }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setVenue(id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '10px 14px',
                    border: `1.5px solid ${venue === id ? 'var(--green)' : 'var(--eb-border)'}`,
                    borderRadius: 10,
                    background: venue === id ? 'rgba(0,214,143,.06)' : 'var(--eb-panel-2)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Image
                    src={logo}
                    alt={name}
                    width={60}
                    height={16}
                    style={{ objectFit: 'contain' }}
                  />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>
                    {name}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Label */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Label
            </div>
            <input
              style={inputStyle}
              placeholder="e.g. Bybit Demo 10k, HydroTrader Prop 25k"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              autoFocus
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {/* Account size */}
          <div>
            <div
              style={{
                fontSize: 11,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.07em',
                fontWeight: 600,
                marginBottom: 6,
              }}
            >
              Account size
            </div>
            <input
              style={inputStyle}
              placeholder="e.g. 5000"
              inputMode="decimal"
              value={accountSize}
              onChange={(e) => setAccountSize(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            />
          </div>

          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(255,91,108,.06)',
                border: '1px solid rgba(255,91,108,.25)',
                fontSize: 12.5,
                color: 'var(--eb-red)',
              }}
            >
              <AlertCircle size={13} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
            <button
              type="button"
              onClick={() => handleOpenChange(false)}
              disabled={loading}
              style={{
                padding: '8px 14px',
                borderRadius: 9,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                color: 'var(--eb-muted-2)',
                fontSize: 13,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleCreate}
              disabled={loading}
              style={{
                padding: '8px 18px',
                borderRadius: 9,
                border: '1px solid #00b67a',
                background: loading
                  ? 'rgba(0,182,122,.5)'
                  : 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 13,
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {loading ? 'Creating…' : 'Create subaccount'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
