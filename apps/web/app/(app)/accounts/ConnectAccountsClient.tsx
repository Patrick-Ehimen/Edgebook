'use client';

import {
  AddAccountDialog,
  EditAccountDialog,
  useAccounts,
  useDeleteAccount,
} from '@/features/accounts';
import type { AccountItem } from '@/features/accounts';
import {
  AlertTriangle,
  KeyRound,
  MoreHorizontal,
  Pencil,
  Plus,
  ShieldCheck,
  Trash2,
  Zap,
} from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// ─── venue + category config ───────────────────────────────────────────────────

const VENUE_META: Record<string, { logo: string; color: string; bg: string }> = {
  binance: { logo: '/assets/binance-logo.svg', color: '#F0B90B', bg: 'rgba(240,185,11,.1)' },
  bybit: { logo: '/assets/bybit-logo.svg', color: '#F7A600', bg: 'rgba(247,166,0,.1)' },
};

const CATEGORY_META: Record<
  string,
  { label: string; color: string; bg: string; border: string; dot: string }
> = {
  live: {
    label: 'Live',
    color: 'var(--green)',
    bg: 'rgba(0,214,143,.1)',
    border: 'rgba(0,214,143,.25)',
    dot: 'var(--green)',
  },
  demo: {
    label: 'Demo',
    color: 'var(--eb-cyan)',
    bg: 'rgba(6,182,212,.1)',
    border: 'rgba(6,182,212,.25)',
    dot: 'var(--eb-cyan)',
  },
  prop: {
    label: 'Prop',
    color: 'var(--eb-purple)',
    bg: 'rgba(139,92,246,.1)',
    border: 'rgba(139,92,246,.25)',
    dot: 'var(--eb-purple)',
  },
};

const CATEGORY_ORDER: string[] = ['live', 'demo', 'prop'];
const CATEGORY_LABELS: Record<string, string> = {
  live: 'Live accounts',
  demo: 'Demo / paper',
  prop: 'Prop / funded',
};

function venueMeta(venue: string) {
  return VENUE_META[venue] ?? { logo: '', color: 'var(--eb-muted)', bg: 'var(--eb-panel-2)' };
}

function categoryMeta(cat: string) {
  return CATEGORY_META[cat] ?? CATEGORY_META.live!;
}

// ─── skeleton ──────────────────────────────────────────────────────────────────

function SkeletonBox({
  w = '100%',
  h = 12,
  r = 6,
  style,
}: { w?: string | number; h?: number; r?: number; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        width: w,
        height: h,
        borderRadius: r,
        background:
          'linear-gradient(90deg, var(--eb-panel-2) 25%, var(--eb-border) 50%, var(--eb-panel-2) 75%)',
        backgroundSize: '400% 100%',
        animation: 'eb-shimmer 1.4s ease infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  );
}

function AccountsSkeleton() {
  return (
    <>
      <style>
        {'@keyframes eb-shimmer{0%{background-position:100% 0}100%{background-position:-100% 0}}'}
      </style>
      <div style={{ padding: '18px 26px 60px', maxWidth: 960, width: '100%', alignSelf: 'center' }}>
        <SkeletonBox w={100} h={11} style={{ marginBottom: 14 }} />
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 24,
          }}
        >
          <SkeletonBox w={160} h={22} r={8} />
          <SkeletonBox w={140} h={34} r={9} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
          {[1, 2].map((k) => (
            <div
              key={k}
              style={{
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <SkeletonBox w={40} h={40} r={10} />
                <div style={{ flex: 1 }}>
                  <SkeletonBox w="60%" h={14} r={6} style={{ marginBottom: 6 }} />
                  <SkeletonBox w="35%" h={10} r={6} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <SkeletonBox w="50%" h={30} r={8} />
                <SkeletonBox w="50%" h={30} r={8} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onConnect }: { onConnect: () => void }) {
  return (
    <div style={{ padding: '60px 24px', textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: 22,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 20,
          background: 'linear-gradient(135deg,rgba(0,214,143,.12),rgba(6,182,212,.08))',
          border: '1px solid rgba(0,214,143,.2)',
        }}
      >
        <Plus size={36} style={{ color: 'var(--green)' }} />
      </div>

      <h2
        style={{
          margin: '0 0 8px',
          fontSize: 22,
          fontWeight: 600,
          color: 'var(--eb-text)',
          letterSpacing: '-.01em',
        }}
      >
        No subaccounts yet
      </h2>
      <p style={{ margin: '0 0 28px', fontSize: 14, color: 'var(--eb-muted-2)', lineHeight: 1.6 }}>
        Create subaccounts to organise your trades by exchange, account type, or strategy. Filter
        your dashboard, journal, and analytics by account.
      </p>

      <button
        type="button"
        onClick={onConnect}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '10px 22px',
          borderRadius: 10,
          border: '1px solid #00b67a',
          background: 'linear-gradient(180deg,#00d68f,#00b67a)',
          color: '#06140f',
          fontSize: 13.5,
          fontWeight: 700,
          cursor: 'pointer',
          fontFamily: 'inherit',
          marginBottom: 40,
        }}
      >
        <Plus size={14} /> Add subaccount
      </button>

      {/* Supported exchanges */}
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: 'var(--eb-muted)',
          letterSpacing: '.08em',
          textTransform: 'uppercase',
          marginBottom: 14,
        }}
      >
        Supported exchanges
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 40 }}>
        {[
          { id: 'binance', logo: '/assets/binance-logo.svg', label: 'Binance' },
          { id: 'bybit', logo: '/assets/bybit-logo.svg', label: 'Bybit' },
        ].map(({ id, logo, label }) => {
          const { color, bg } = venueMeta(id);
          return (
            <div
              key={id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '10px 18px',
                borderRadius: 10,
                border: '1px solid var(--eb-border)',
                background: bg,
              }}
            >
              <Image
                src={logo}
                alt={label}
                width={72}
                height={18}
                style={{ objectFit: 'contain' }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color }}>{label}</span>
            </div>
          );
        })}
      </div>

      {/* Security callouts */}
      <div
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, textAlign: 'left' }}
      >
        {[
          {
            Icon: ShieldCheck,
            color: 'var(--green)',
            bg: 'rgba(0,214,143,.1)',
            title: 'Read-only',
            desc: 'API keys are tested for withdrawal access on save and rejected if they have it.',
          },
          {
            Icon: KeyRound,
            color: 'var(--eb-purple)',
            bg: 'rgba(139,92,246,.1)',
            title: 'Encrypted at rest',
            desc: 'Keys are envelope-encrypted with AWS KMS. Plaintext only lives in worker memory.',
          },
          {
            Icon: Zap,
            color: 'var(--eb-cyan)',
            bg: 'rgba(6,182,212,.1)',
            title: 'Auto-sync',
            desc: 'Trades are synced continuously in the background — no manual imports needed.',
          },
        ].map(({ Icon, color, bg, title, desc }) => (
          <div
            key={title}
            style={{
              padding: 12,
              borderRadius: 10,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel)',
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: bg,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 8,
              }}
            >
              <Icon size={14} style={{ color }} />
            </div>
            <div
              style={{ fontSize: 12, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}
            >
              {title}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5 }}>{desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── account card ──────────────────────────────────────────────────────────────

// ─── delete confirmation dialog ────────────────────────────────────────────────

function DeleteConfirmDialog({
  account,
  onConfirm,
  onCancel,
  deleting,
}: {
  account: AccountItem;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,.55)',
        backdropFilter: 'blur(4px)',
      }}
      onClick={onCancel}
    >
      <div
        style={{
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          padding: '28px 26px 22px',
          width: 380,
          maxWidth: 'calc(100vw - 32px)',
          boxShadow: '0 20px 60px rgba(0,0,0,.45)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* icon */}
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: 'rgba(255,91,108,.1)',
            border: '1px solid rgba(255,91,108,.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            color: 'var(--eb-red, #ff5b6c)',
          }}
        >
          <AlertTriangle size={20} />
        </div>

        <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 6 }}>
          Remove subaccount?
        </div>
        <div style={{ fontSize: 13, color: 'var(--eb-muted)', lineHeight: 1.55, marginBottom: 20 }}>
          <strong style={{ color: 'var(--eb-text)' }}>{account.label}</strong> and all its
          associated trades and positions will be permanently deleted. This cannot be undone.
        </div>

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
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
            onClick={onConfirm}
            disabled={deleting}
            style={{
              padding: '8px 18px',
              borderRadius: 9,
              border: '1px solid rgba(255,91,108,.5)',
              background: deleting ? 'rgba(255,91,108,.3)' : 'rgba(255,91,108,.15)',
              color: 'var(--eb-red, #ff5b6c)',
              fontSize: 13,
              fontWeight: 600,
              cursor: deleting ? 'not-allowed' : 'pointer',
              fontFamily: 'inherit',
            }}
          >
            {deleting ? 'Removing…' : 'Remove account'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── account card ───────────────────────────────────────────────────────────────

function AccountCard({
  account,
  onDelete,
  onEdit,
  onOpen,
}: {
  account: AccountItem;
  onDelete: (id: string) => void;
  onEdit: (account: AccountItem) => void;
  onOpen: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { logo, color, bg } = venueMeta(account.venue);
  const {
    label: catLabel,
    color: catColor,
    bg: catBg,
    border: catBorder,
  } = categoryMeta(account.category);

  async function handleDeleteConfirmed() {
    setDeleting(true);
    try {
      await onDelete(account.id);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const createdDate = new Date(account.createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      onClick={() => onOpen(account.id)}
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: 18,
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 11,
            background: bg,
            border: '1px solid var(--eb-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {logo ? (
            <Image
              src={logo}
              alt={account.venue}
              width={26}
              height={26}
              style={{ objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 14, fontWeight: 700, color }}>
              {account.venue[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: 'var(--eb-text)',
              marginBottom: 3,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {account.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color,
                padding: '1px 7px',
                borderRadius: 99,
                background: bg,
              }}
            >
              {account.venue.charAt(0).toUpperCase() + account.venue.slice(1)}
            </span>
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: catColor,
                padding: '1px 7px',
                borderRadius: 99,
                background: catBg,
                border: `1px solid ${catBorder}`,
              }}
            >
              {catLabel}
            </span>
            <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>
              {account.accountType} · {account.baseCurrency}
            </span>
          </div>
        </div>

        {/* kebab menu */}
        <div style={{ position: 'relative' }} onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--eb-muted)',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
            }}
          >
            <MoreHorizontal size={15} />
          </button>
          {menuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 28,
                  zIndex: 20,
                  background: 'var(--eb-panel)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 9,
                  padding: 4,
                  minWidth: 140,
                  boxShadow: '0 8px 24px rgba(0,0,0,.25)',
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    onEdit(account);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    color: 'var(--eb-muted-2)',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <Pencil size={13} /> Edit account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setConfirmOpen(true);
                  }}
                  disabled={deleting}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12.5,
                    color: 'var(--eb-red, #ff5b6c)',
                    fontFamily: 'inherit',
                    textAlign: 'left',
                  }}
                >
                  <Trash2 size={13} /> {deleting ? 'Removing…' : 'Remove account'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* footer */}
      <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 4 }}>
        Added {createdDate}
      </div>

      {confirmOpen && (
        <DeleteConfirmDialog
          account={account}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => setConfirmOpen(false)}
          deleting={deleting}
        />
      )}
    </div>
  );
}

// ─── main component ────────────────────────────────────────────────────────────

export default function ConnectAccountsClient() {
  const router = useRouter();
  const { data: accounts, isLoading } = useAccounts();
  const deleteAccount = useDeleteAccount();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<AccountItem | null>(null);

  if (isLoading) return <AccountsSkeleton />;

  const hasAccounts = (accounts?.length ?? 0) > 0;

  return (
    <div style={{ padding: '18px 26px 60px', maxWidth: 960, width: '100%', alignSelf: 'center' }}>
      {/* breadcrumb */}
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Workspace / Accounts
      </div>

      {/* header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 24,
        }}
      >
        <h1 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: 'var(--eb-text)' }}>
          Subaccounts
        </h1>
        {hasAccounts && (
          <button
            type="button"
            onClick={() => setDialogOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '8px 16px',
              borderRadius: 9,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={13} /> Add subaccount
          </button>
        )}
      </div>

      {hasAccounts ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {CATEGORY_ORDER.filter((cat) => (accounts ?? []).some((a) => a.category === cat)).map(
            (cat) => {
              const catAccounts = (accounts ?? []).filter((a) => a.category === cat);
              const meta = categoryMeta(cat);
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: meta.dot,
                        display: 'inline-block',
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: 'var(--eb-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '.07em',
                      }}
                    >
                      {CATEGORY_LABELS[cat]}
                    </span>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 600,
                        color: meta.color,
                        padding: '1px 7px',
                        borderRadius: 99,
                        background: meta.bg,
                        border: `1px solid ${meta.border}`,
                      }}
                    >
                      {catAccounts.length}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                    {catAccounts.map((account) => (
                      <AccountCard
                        key={account.id}
                        account={account}
                        onDelete={(id) => deleteAccount.mutateAsync(id)}
                        onEdit={setEditingAccount}
                        onOpen={(id) => router.push(`/accounts/${id}`)}
                      />
                    ))}
                  </div>
                </div>
              );
            },
          )}
        </div>
      ) : (
        <EmptyState onConnect={() => setDialogOpen(true)} />
      )}

      <AddAccountDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <EditAccountDialog
        account={editingAccount}
        onOpenChange={(open) => {
          if (!open) setEditingAccount(null);
        }}
      />
    </div>
  );
}
