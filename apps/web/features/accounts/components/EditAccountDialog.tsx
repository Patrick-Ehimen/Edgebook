'use client';

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ApiError } from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useUpdateAccount } from '../hooks/useUpdateAccount';
import type { AccountItem } from '../schemas';

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

interface Props {
  account: AccountItem | null;
  onOpenChange: (open: boolean) => void;
}

export function EditAccountDialog({ account, onOpenChange }: Props) {
  const updateAccount = useUpdateAccount();
  const [label, setLabel] = useState('');
  const [accountSize, setAccountSize] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (account) {
      setLabel(account.label);
      setAccountSize(account.startingBalance);
      setError('');
    }
  }, [account]);

  function handleOpenChange(v: boolean) {
    onOpenChange(v);
  }

  async function handleSave() {
    if (!account) return;
    setError('');

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError('Label is required.');
      return;
    }
    const size = accountSize.trim();
    if (size && !/^\d+(\.\d+)?$/.test(size)) {
      setError('Account size must be a positive number.');
      return;
    }

    try {
      await updateAccount.mutateAsync({
        accountId: account.id,
        body: { label: trimmedLabel, startingBalance: size || '0' },
      });
      handleOpenChange(false);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
    }
  }

  return (
    <Dialog open={!!account} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        style={{ background: 'var(--eb-panel)', border: '1px solid var(--eb-border)' }}
      >
        <DialogHeader>
          <DialogTitle style={{ color: 'var(--eb-text)', fontSize: 15 }}>
            Edit subaccount
          </DialogTitle>
        </DialogHeader>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          </div>

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
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
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
              disabled={updateAccount.isPending}
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
              onClick={handleSave}
              disabled={updateAccount.isPending}
              style={{
                padding: '8px 18px',
                borderRadius: 9,
                border: '1px solid #00b67a',
                background: updateAccount.isPending
                  ? 'rgba(0,182,122,.5)'
                  : 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 13,
                fontWeight: 600,
                cursor: updateAccount.isPending ? 'not-allowed' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {updateAccount.isPending ? 'Saving…' : 'Save changes'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
