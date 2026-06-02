'use client';

import { AlertTriangle, Trash2 } from 'lucide-react';

interface Props {
  playbook: { id: string; name: string };
  accent: string;
  tradeCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isPending: boolean;
}

export function DeleteConfirmDialog({ playbook, accent, tradeCount, onConfirm, onCancel, isPending }: Props) {
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '16px',
      }}
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div style={{
        width: '100%', maxWidth: 420,
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderTop: '3px solid #ff5b6c',
        borderRadius: 14,
        boxShadow: '0 24px 60px rgba(0,0,0,.5)',
        overflow: 'hidden',
      }}>
        {/* header */}
        <div style={{ padding: '22px 24px 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'rgba(255,91,108,.14)',
            border: '1px solid rgba(255,91,108,.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} style={{ color: '#ff5b6c' }} />
          </div>
          <div>
            <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 600, color: 'var(--eb-text)' }}>
              Delete playbook?
            </h3>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--eb-muted)', lineHeight: 1.55 }}>
              This will permanently remove{' '}
              <span style={{ color: 'var(--eb-text)', fontWeight: 600 }}>{playbook.name}</span>
              {' '}and all its checklist gates.
              {tradeCount > 0 && (
                <> <span style={{ color: '#f5a524' }}>{tradeCount} trade{tradeCount !== 1 ? 's' : ''}</span> tagged to it will lose their playbook link.</>
              )}
            </p>
          </div>
        </div>

        {/* playbook preview pill */}
        <div style={{ padding: '16px 24px' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px',
            background: 'var(--eb-panel-2, #0c1119)',
            border: `1px solid ${accent}30`,
            borderLeft: `3px solid ${accent}`,
            borderRadius: '0 8px 8px 0',
          }}>
            <span style={{
              fontSize: 11, color: accent,
              fontFamily: '"JetBrains Mono",monospace',
              background: `${accent}18`, border: `1px solid ${accent}35`,
              borderRadius: 4, padding: '2px 7px', flexShrink: 0,
            }}>
              ⊘
            </span>
            <span style={{
              fontSize: 13, color: 'var(--eb-text)', fontWeight: 500,
              minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {playbook.name}
            </span>
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', padding: '0 24px 20px' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={isPending}
            style={{
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'transparent',
              color: 'var(--eb-muted)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'inherit',
              opacity: isPending ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isPending}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8,
              border: '1px solid rgba(255,91,108,.5)',
              background: isPending ? 'rgba(255,91,108,.12)' : 'rgba(255,91,108,.18)',
              color: '#ff5b6c', fontSize: 13, fontWeight: 600,
              cursor: isPending ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
              transition: 'background .1s',
            }}
            onMouseEnter={(e) => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,91,108,.28)'; }}
            onMouseLeave={(e) => { if (!isPending) (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,91,108,.18)'; }}
          >
            <Trash2 size={13} />
            {isPending ? 'Deleting…' : 'Delete playbook'}
          </button>
        </div>
      </div>
    </div>
  );
}
