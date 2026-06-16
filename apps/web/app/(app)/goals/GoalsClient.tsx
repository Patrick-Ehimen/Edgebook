'use client';

import { useAccounts } from '@/features/accounts';
import type { AccountItem } from '@/features/accounts';
import { usePositions } from '@/features/positions';
import { useGoals } from '@/providers/goals-provider';
import type { AccountConfig, GoalDef, RuleDef } from '@/providers/goals-provider';
import { useSelectedAccount } from '@/providers/selected-account-provider';
import {
  BellRing,
  Check,
  ChevronRight,
  Pause,
  Plus,
  Scale,
  Shield,
  Target,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// ─── Preset definitions ───────────────────────────────────────────────────────

type Preset = {
  id: string;
  Icon: typeof Zap;
  name: string;
  desc: string;
  features: string[];
  badge: string | null;
  badgeColor: string;
  goals: GoalDef[];
  rules: RuleDef[];
};

const PRESETS: Preset[] = [
  {
    id: 'scalper',
    Icon: Zap,
    name: 'Active scalper',
    desc: 'Tight cooldowns, aggressive revenge-trade blocking, soft news alerts.',
    features: [
      'Cooldown 30m after 3 losses',
      '60s revenge block',
      'Oversize confirm at 2×',
      'News flag (soft)',
      '0.5% risk cap',
    ],
    badge: null,
    badgeColor: 'var(--green)',
    goals: [
      {
        id: 'g1',
        label: 'Daily P&L target',
        period: 'daily',
        target: '$400',
        unit: 'USDT',
        current: 0,
        pct: 0,
        status: 'on-track',
      },
      {
        id: 'g2',
        label: 'Max trades / day',
        period: 'daily',
        target: '8',
        unit: 'trades',
        current: 0,
        pct: 0,
        status: 'safe',
      },
      {
        id: 'g3',
        label: 'Daily max loss',
        period: 'daily',
        target: '−2%',
        unit: 'account',
        current: 0,
        pct: 0,
        status: 'safe',
      },
    ],
    rules: [
      {
        id: 'r1',
        label: 'Cooldown after consecutive losses',
        desc: 'Block new entries for a cooldown window after N losses in a row on any symbol.',
        level: 'hard',
        enabled: true,
        params: [
          { label: 'Trigger after', value: '3', unit: 'losses' },
          { label: 'Cooldown', value: '30', unit: 'min' },
        ],
        triggerCount: 0,
      },
      {
        id: 'r2',
        label: 'Block revenge re-entry',
        desc: 'Block new positions opened within a window after a stop-out on the same symbol.',
        level: 'hard',
        enabled: true,
        params: [{ label: 'Window', value: '60', unit: 'sec' }],
        triggerCount: 0,
      },
      {
        id: 'r3',
        label: 'Confirm oversize entry',
        desc: 'Require explicit confirmation when position size exceeds N× your rolling average.',
        level: 'soft',
        enabled: true,
        params: [{ label: 'Multiple', value: '2.0', unit: '× avg' }],
        triggerCount: 0,
      },
      {
        id: 'r4',
        label: 'News window flag',
        desc: 'Flag trades opened within a window of scheduled high-impact macro events.',
        level: 'soft',
        enabled: false,
        params: [{ label: 'Window', value: '15', unit: 'min ±' }],
        triggerCount: 0,
      },
    ],
  },
  {
    id: 'prop',
    Icon: Shield,
    name: 'Funded / prop firm',
    desc: 'Hard halt on max-loss, leverage cap, news block. Built to keep your account.',
    features: [
      'Daily max loss −2%',
      'Monthly DD −5% kill switch',
      'News block (hard)',
      'Leverage cap 10×',
      'Min R:R 1:2',
    ],
    badge: 'Strict',
    badgeColor: 'var(--eb-yellow)',
    goals: [
      {
        id: 'g1',
        label: 'Daily max loss',
        period: 'daily',
        target: '−2%',
        unit: 'account',
        current: 0,
        pct: 0,
        status: 'safe',
      },
      {
        id: 'g2',
        label: 'Monthly drawdown cap',
        period: 'monthly',
        target: '−5%',
        unit: 'account',
        current: 0,
        pct: 0,
        status: 'safe',
      },
    ],
    rules: [
      {
        id: 'r1',
        label: 'Daily max loss circuit breaker',
        desc: 'Hard pause when daily loss hits the configured % of account balance.',
        level: 'hard',
        enabled: true,
        params: [{ label: 'Cap', value: '2', unit: '% account' }],
        triggerCount: 0,
      },
      {
        id: 'r2',
        label: 'News window block',
        desc: 'Block entries around high-impact macro events entirely.',
        level: 'hard',
        enabled: true,
        params: [{ label: 'Window', value: '15', unit: 'min ±' }],
        triggerCount: 0,
      },
      {
        id: 'r3',
        label: 'Monthly drawdown kill switch',
        desc: 'Lock account for the rest of the month when cumulative DD threshold is hit.',
        level: 'hard',
        enabled: true,
        params: [{ label: 'Cap', value: '5', unit: '% account' }],
        triggerCount: 0,
      },
    ],
  },
  {
    id: 'swing',
    Icon: TrendingUp,
    name: 'Conservative swing',
    desc: 'Looser cooldowns, no revenge block for low-cadence trading, tighter sizing.',
    features: [
      'Cooldown 60m after 2 losses',
      'No revenge block',
      'Oversize confirm at 1.5×',
      '0.7% risk cap',
      'Min R:R 1:2',
    ],
    badge: 'Coach',
    badgeColor: 'var(--eb-cyan)',
    goals: [
      {
        id: 'g1',
        label: 'Weekly P&L target',
        period: 'weekly',
        target: '$1,500',
        unit: 'USDT',
        current: 0,
        pct: 0,
        status: 'on-track',
      },
      {
        id: 'g2',
        label: 'Win rate floor',
        period: 'weekly',
        target: '55%',
        unit: 'win rate',
        current: 0,
        pct: 0,
        status: 'drift',
      },
    ],
    rules: [
      {
        id: 'r1',
        label: 'Cooldown after consecutive losses',
        desc: 'Block new entries for a cooldown window after N losses in a row.',
        level: 'soft',
        enabled: true,
        params: [
          { label: 'Trigger after', value: '2', unit: 'losses' },
          { label: 'Cooldown', value: '60', unit: 'min' },
        ],
        triggerCount: 0,
      },
      {
        id: 'r2',
        label: 'Confirm oversize entry',
        desc: 'Require explicit confirmation when position size exceeds N× your rolling average.',
        level: 'soft',
        enabled: true,
        params: [{ label: 'Multiple', value: '1.5', unit: '× avg' }],
        triggerCount: 0,
      },
    ],
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_CHIP: Record<
  GoalDef['status'],
  { label: string; color: string; bg: string; border: string }
> = {
  'on-track': {
    label: 'on track',
    color: 'var(--green)',
    bg: 'rgba(0,214,143,.10)',
    border: 'rgba(0,214,143,.30)',
  },
  ahead: {
    label: 'ahead',
    color: 'var(--green)',
    bg: 'rgba(0,214,143,.10)',
    border: 'rgba(0,214,143,.30)',
  },
  drift: {
    label: 'drift',
    color: 'var(--eb-yellow)',
    bg: 'rgba(245,165,36,.10)',
    border: 'rgba(245,165,36,.30)',
  },
  safe: {
    label: 'safe',
    color: 'var(--green)',
    bg: 'rgba(0,214,143,.10)',
    border: 'rgba(0,214,143,.30)',
  },
};

const LEVEL_CHIP: Record<
  RuleDef['level'],
  { label: string; color: string; bg: string; border: string }
> = {
  soft: {
    label: 'soft alert',
    color: 'var(--eb-yellow)',
    bg: 'rgba(245,165,36,.10)',
    border: 'rgba(245,165,36,.30)',
  },
  hard: {
    label: 'hard pause',
    color: 'var(--eb-red)',
    bg: 'rgba(255,91,108,.10)',
    border: 'rgba(255,91,108,.30)',
  },
};

// ─── Chip ─────────────────────────────────────────────────────────────────────

function Chip({
  label,
  color,
  bg,
  border,
}: { label: string; color: string; bg: string; border: string }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontSize: 10.5,
        padding: '2px 8px',
        borderRadius: 99,
        color,
        background: bg,
        border: `1px solid ${border}`,
        fontWeight: 600,
        flexShrink: 0,
      }}
    >
      {label}
    </span>
  );
}

// ─── Toggle ───────────────────────────────────────────────────────────────────

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        position: 'relative',
        width: 36,
        height: 20,
        borderRadius: 99,
        flexShrink: 0,
        background: checked ? 'rgba(0,214,143,.25)' : 'var(--eb-panel-2)',
        border: `1px solid ${checked ? 'rgba(0,214,143,.5)' : 'var(--eb-border)'}`,
        cursor: 'pointer',
        transition: 'background .15s, border-color .15s',
        padding: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 1,
          left: checked ? 17 : 1,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: checked ? 'var(--green)' : 'var(--eb-muted)',
          transition: 'left .15s, background .15s',
          display: 'block',
        }}
      />
    </button>
  );
}

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ pct, status }: { pct: number; status: GoalDef['status'] }) {
  const color =
    status === 'drift'
      ? 'linear-gradient(90deg,var(--eb-cyan),var(--eb-yellow))'
      : 'linear-gradient(90deg,var(--green),var(--eb-cyan))';
  return (
    <div
      style={{
        position: 'relative',
        height: 7,
        background: 'var(--eb-panel-2)',
        borderRadius: 99,
        overflow: 'hidden',
        marginTop: 10,
      }}
    >
      <span
        style={{
          display: 'block',
          height: '100%',
          width: `${Math.min(pct, 100)}%`,
          borderRadius: 99,
          background: color,
          transition: 'width .3s',
        }}
      />
    </div>
  );
}

// ─── Account selection prompt ─────────────────────────────────────────────────

function AccountPrompt({
  accounts,
  onSelect,
}: { accounts: AccountItem[] | undefined; onSelect: (id: string) => void }) {
  const list = accounts ?? [];
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
      }}
    >
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 32, maxWidth: 480 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg,var(--green),var(--eb-cyan))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16,
            boxShadow: '0 8px 24px rgba(0,214,143,.20)',
          }}
        >
          <Target size={26} color="#06140f" />
        </div>
        <h1
          style={{
            fontSize: 22,
            fontWeight: 600,
            margin: '0 0 8px',
            color: 'var(--eb-text)',
            letterSpacing: '-.01em',
          }}
        >
          Goals &amp; rules
        </h1>
        <p style={{ margin: 0, fontSize: 13.5, color: 'var(--eb-muted)', lineHeight: 1.6 }}>
          Goals and rules are scoped to a subaccount.
          <br />
          Pick one below to configure it.
        </p>
      </div>

      {list.length === 0 ? (
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px dashed var(--eb-border)',
            borderRadius: 14,
            padding: '40px 32px',
            textAlign: 'center',
            maxWidth: 420,
            width: '100%',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6, color: 'var(--eb-text)' }}>
            No accounts connected yet
          </div>
          <p style={{ color: 'var(--eb-muted)', margin: 0, fontSize: 13, lineHeight: 1.6 }}>
            Head to <strong style={{ color: 'var(--eb-text)' }}>Accounts</strong> to connect a
            subaccount, then come back here to set up goals and tilt rules for it.
          </p>
        </div>
      ) : (
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%', maxWidth: 520 }}
        >
          {list.map((acc) => (
            <button
              key={acc.id}
              type="button"
              onClick={() => onSelect(acc.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                padding: '14px 16px',
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'border-color .15s, background .15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = 'rgba(0,214,143,.40)';
                e.currentTarget.style.background = 'var(--eb-panel-2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--eb-border)';
                e.currentTarget.style.background = 'var(--eb-panel)';
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                }}
              >
                {acc.label.charAt(0)}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontWeight: 600,
                    fontSize: 13.5,
                    color: 'var(--eb-text)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {acc.label}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
                  {acc.venue} · {acc.category}
                </div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Empty / Onboarding state ─────────────────────────────────────────────────

const WHAT_YOU_GET = [
  {
    label: 'Performance goals',
    desc: 'Daily, weekly, monthly P&L targets with real-time pacing bars from your synced fills.',
    color: 'var(--green)',
    colorRgb: '0,214,143',
  },
  {
    label: 'Tilt rules',
    desc: 'Behavioral guardrails that fire before you blow up. Soft alerts warn you; hard rules pause the account.',
    color: 'var(--eb-purple)',
    colorRgb: '139,92,246',
  },
  {
    label: 'Risk & sizing',
    desc: 'Per-trade risk cap, max exposure, and oversize confirmation. Numbers that enforce themselves.',
    color: 'var(--eb-cyan)',
    colorRgb: '6,182,212',
  },
  {
    label: 'Discipline tracking',
    desc: 'Every rule trigger or bypass is logged. See your adherence score, streaks, and counterfactual R saved.',
    color: 'var(--eb-yellow)',
    colorRgb: '245,165,36',
  },
];

const EXPLAINERS = [
  {
    Icon: BellRing,
    kind: 'soft',
    title: 'Soft alert',
    desc: 'In-app banner + optional push. You can override and proceed. Goes into your rule-bypass log.',
    color: 'var(--eb-yellow)',
    colorRgb: '245,165,36',
  },
  {
    Icon: Pause,
    kind: 'hard',
    title: 'Hard pause',
    desc: 'Account flips read-only for the cooldown window. Existing positions stay open with their stops intact.',
    color: 'var(--eb-red)',
    colorRgb: '255,91,108',
  },
  {
    Icon: Scale,
    kind: 'risk',
    title: 'Risk modifier',
    desc: 'Default risk cap halved until the condition clears. Less extreme than a hard pause — keeps you in the market.',
    color: 'var(--eb-cyan)',
    colorRgb: '6,182,212',
  },
];

// ─── Setup wizard modal ───────────────────────────────────────────────────────

type WizardTab = 'goals' | 'rules' | 'risk';

type GoalChoice = {
  id: string;
  label: string;
  desc: string;
  period: 'daily' | 'weekly' | 'monthly';
  target: string;
  unit: string;
  enabled: boolean;
};

type RuleChoice = {
  id: string;
  label: string;
  desc: string;
  level: 'soft' | 'hard';
  enabled: boolean;
  params: { label: string; value: string; unit?: string }[];
};

const WIZARD_GOALS: GoalChoice[] = [
  {
    id: 'daily-pnl',
    label: 'Daily P&L target',
    desc: 'Resets 00:00 UTC · Mon–Fri',
    period: 'daily',
    target: '$400',
    unit: 'USDT',
    enabled: true,
  },
  {
    id: 'weekly-pnl',
    label: 'Weekly P&L target',
    desc: 'Resets Monday 00:00 UTC',
    period: 'weekly',
    target: '$2,000',
    unit: 'USDT',
    enabled: true,
  },
  {
    id: 'monthly-pnl',
    label: 'Monthly P&L target',
    desc: 'Rolling calendar month',
    period: 'monthly',
    target: '$8,000',
    unit: 'USDT',
    enabled: false,
  },
  {
    id: 'daily-loss',
    label: 'Daily max loss',
    desc: 'Hard pause when breached',
    period: 'daily',
    target: '−2%',
    unit: 'account',
    enabled: true,
  },
  {
    id: 'win-rate',
    label: 'Win rate floor',
    desc: 'Rolling 50-trade sample',
    period: 'weekly',
    target: '55%',
    unit: 'win rate',
    enabled: false,
  },
  {
    id: 'max-trades',
    label: 'Max trades / day',
    desc: 'Soft alert at 80% of limit',
    period: 'daily',
    target: '8',
    unit: 'trades',
    enabled: true,
  },
];

const WIZARD_RULES: RuleChoice[] = [
  {
    id: 'cooldown',
    label: 'Cooldown after losses',
    desc: 'Block new entries for a cooldown window after N consecutive losses on any symbol.',
    level: 'hard',
    enabled: true,
    params: [
      { label: 'Trigger after', value: '3', unit: 'losses' },
      { label: 'Cooldown', value: '30', unit: 'min' },
    ],
  },
  {
    id: 'revenge',
    label: 'Block revenge re-entry',
    desc: 'Block new positions opened within a window after a stop-out on the same symbol.',
    level: 'hard',
    enabled: true,
    params: [{ label: 'Window', value: '60', unit: 'sec' }],
  },
  {
    id: 'oversize',
    label: 'Confirm oversize entry',
    desc: 'Require confirmation when position size exceeds N× your rolling average.',
    level: 'soft',
    enabled: true,
    params: [{ label: 'Multiple', value: '2.0', unit: '× avg' }],
  },
  {
    id: 'news',
    label: 'News window flag',
    desc: 'Flag trades opened within ±N min of scheduled high-impact macro events.',
    level: 'soft',
    enabled: false,
    params: [{ label: 'Window', value: '15', unit: 'min ±' }],
  },
  {
    id: 'daily-loss-breaker',
    label: 'Daily loss circuit breaker',
    desc: 'Hard pause when daily P&L drops below your configured cap.',
    level: 'hard',
    enabled: false,
    params: [{ label: 'Cap', value: '2', unit: '% account' }],
  },
];

const WIZARD_STEPS: { id: WizardTab; label: string; Icon: typeof Target }[] = [
  { id: 'goals', label: 'Goals', Icon: Target },
  { id: 'rules', label: 'Tilt rules', Icon: Shield },
  { id: 'risk', label: 'Risk & sizing', Icon: Scale },
];

const PERIOD_COLOR: Record<GoalChoice['period'], string> = {
  daily: 'var(--green)',
  weekly: 'var(--eb-cyan)',
  monthly: 'var(--eb-purple)',
};
const PERIOD_BG: Record<GoalChoice['period'], string> = {
  daily: 'rgba(0,214,143,.10)',
  weekly: 'rgba(6,182,212,.10)',
  monthly: 'rgba(139,92,246,.10)',
};
const PERIOD_BORDER: Record<GoalChoice['period'], string> = {
  daily: 'rgba(0,214,143,.30)',
  weekly: 'rgba(6,182,212,.30)',
  monthly: 'rgba(139,92,246,.30)',
};

function GoalsStep({ goals, onToggle }: { goals: GoalChoice[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}>
          Performance goals
        </div>
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
          Select the targets you want to track. Pacing bars update in real time from your synced
          fills. You can add more or edit values after setup.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {goals.map((g) => (
          <button
            key={g.id}
            type="button"
            onClick={() => onToggle(g.id)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '12px 14px',
              background: g.enabled ? 'rgba(0,214,143,.05)' : 'var(--eb-panel-2)',
              border: `1px solid ${g.enabled ? 'rgba(0,214,143,.28)' : 'var(--eb-border)'}`,
              borderRadius: 10,
              cursor: 'pointer',
              fontFamily: 'inherit',
              textAlign: 'left',
              transition: 'border-color .15s, background .15s',
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                flexShrink: 0,
                marginTop: 2,
                border: `1.5px solid ${g.enabled ? 'var(--green)' : 'var(--eb-muted)'}`,
                background: g.enabled ? 'var(--green)' : 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all .15s',
              }}
            >
              {g.enabled && <Check size={10} color="#06140f" strokeWidth={3} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: 12.5,
                  color: 'var(--eb-text)',
                  marginBottom: 2,
                }}
              >
                {g.label}
              </div>
              <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginBottom: 6 }}>
                {g.desc}
              </div>
              <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: 9.5,
                    padding: '1px 6px',
                    borderRadius: 99,
                    fontWeight: 600,
                    color: PERIOD_COLOR[g.period],
                    background: PERIOD_BG[g.period],
                    border: `1px solid ${PERIOD_BORDER[g.period]}`,
                  }}
                >
                  {g.period}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    color: 'var(--eb-muted)',
                    fontFamily: 'var(--font-mono, monospace)',
                  }}
                >
                  {g.target}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function RulesStep({ rules, onToggle }: { rules: RuleChoice[]; onToggle: (id: string) => void }) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}>
          Tilt rules
        </div>
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
          Behavioral guardrails that fire before tilt costs you money.{' '}
          <strong style={{ color: 'var(--eb-text)' }}>Hard rules</strong> pause the account;{' '}
          <strong style={{ color: 'var(--eb-text)' }}>soft alerts</strong> warn and let you proceed.
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {rules.map((r) => {
          const isHard = r.level === 'hard';
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => onToggle(r.id)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 12,
                padding: '13px 14px',
                background: r.enabled
                  ? isHard
                    ? 'rgba(255,91,108,.04)'
                    : 'rgba(245,165,36,.04)'
                  : 'var(--eb-panel-2)',
                border: `1px solid ${
                  r.enabled
                    ? isHard
                      ? 'rgba(255,91,108,.25)'
                      : 'rgba(245,165,36,.25)'
                    : 'var(--eb-border)'
                }`,
                borderRadius: 10,
                cursor: 'pointer',
                fontFamily: 'inherit',
                textAlign: 'left',
                transition: 'all .15s',
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: 5,
                  flexShrink: 0,
                  marginTop: 2,
                  border: `1.5px solid ${
                    r.enabled ? (isHard ? 'var(--eb-red)' : 'var(--eb-yellow)') : 'var(--eb-muted)'
                  }`,
                  background: r.enabled
                    ? isHard
                      ? 'var(--eb-red)'
                      : 'var(--eb-yellow)'
                    : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all .15s',
                }}
              >
                {r.enabled && <Check size={10} color="#06140f" strokeWidth={3} />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 3,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ fontWeight: 600, fontSize: 12.5, color: 'var(--eb-text)' }}>
                    {r.label}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 99,
                      fontWeight: 600,
                      color: isHard ? 'var(--eb-red)' : 'var(--eb-yellow)',
                      background: isHard ? 'rgba(255,91,108,.10)' : 'rgba(245,165,36,.10)',
                      border: `1px solid ${isHard ? 'rgba(255,91,108,.30)' : 'rgba(245,165,36,.30)'}`,
                    }}
                  >
                    {isHard ? 'hard pause' : 'soft alert'}
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11.5,
                    color: 'var(--eb-muted)',
                    lineHeight: 1.5,
                    marginBottom: 6,
                  }}
                >
                  {r.desc}
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    fontSize: 11,
                    color: 'var(--eb-muted-2)',
                    flexWrap: 'wrap',
                  }}
                >
                  {r.params.map((p) => (
                    <span key={p.label}>
                      {p.label}:{' '}
                      <span
                        style={{
                          fontFamily: 'var(--font-mono, monospace)',
                          color: 'var(--eb-text)',
                          fontWeight: 600,
                        }}
                      >
                        {p.value}
                      </span>
                      {p.unit ? ` ${p.unit}` : ''}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type RiskStepProps = {
  riskCap: string;
  onRiskCap: (v: string) => void;
  defaultRisk: string;
  onDefaultRisk: (v: string) => void;
  maxConcurrent: string;
  onMaxConcurrent: (v: string) => void;
  killSwitch: string;
  onKillSwitch: (v: string) => void;
  leverageCap: string;
  onLeverageCap: (v: string) => void;
  minRR: string;
  onMinRR: (v: string) => void;
};

function RiskField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 14 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--eb-muted)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {label}
      </span>
      <input
        style={{
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 7,
          padding: '7px 10px',
          color: 'var(--eb-text)',
          fontSize: 13,
          fontFamily: 'var(--font-mono, monospace)',
          width: '100%',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{hint}</span>
    </div>
  );
}

function RiskStep({
  riskCap,
  onRiskCap,
  defaultRisk,
  onDefaultRisk,
  maxConcurrent,
  onMaxConcurrent,
  killSwitch,
  onKillSwitch,
  leverageCap,
  onLeverageCap,
  minRR,
  onMinRR,
}: RiskStepProps) {
  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--eb-text)', marginBottom: 4 }}>
          Risk &amp; position sizing
        </div>
        <div style={{ fontSize: 12, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
          Account-level circuit breakers and per-trade caps. Trades that breach these are tagged as
          rule violations.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
        <div>
          <RiskField
            label="Risk per trade · cap"
            value={riskCap}
            onChange={onRiskCap}
            hint="Max % of account · soft alert at 80%"
          />
          <RiskField
            label="Default risk per trade"
            value={defaultRisk}
            onChange={onDefaultRisk}
            hint="Pre-filled in new trade form"
          />
          <RiskField
            label="Max concurrent positions"
            value={maxConcurrent}
            onChange={onMaxConcurrent}
            hint="Soft alert when exceeded"
          />
        </div>
        <div>
          <RiskField
            label="Account kill switch"
            value={killSwitch}
            onChange={onKillSwitch}
            hint="Monthly drawdown · hard pause & email"
          />
          <RiskField
            label="Leverage cap"
            value={leverageCap}
            onChange={onLeverageCap}
            hint="Breach = rule violation logged"
          />
          <RiskField
            label="Min R:R"
            value={minRR}
            onChange={onMinRR}
            hint="Trades below this flagged at log time"
          />
        </div>
      </div>
    </div>
  );
}

function SetupModal({
  onClose,
  onApply,
}: { onClose: () => void; onApply: (preset: Preset) => void }) {
  const [activeTab, setActiveTab] = useState<WizardTab>('goals');
  const [goals, setGoals] = useState<GoalChoice[]>(() => WIZARD_GOALS.map((g) => ({ ...g })));
  const [rules, setRules] = useState<RuleChoice[]>(() => WIZARD_RULES.map((r) => ({ ...r })));
  const [riskCap, setRiskCap] = useState('0.5%');
  const [defaultRisk, setDefaultRisk] = useState('0.3%');
  const [maxConcurrent, setMaxConcurrent] = useState('3');
  const [killSwitch, setKillSwitch] = useState('−5%');
  const [leverageCap, setLeverageCap] = useState('20×');
  const [minRR, setMinRR] = useState('1 : 1.5');

  const tabIdx = WIZARD_STEPS.findIndex((s) => s.id === activeTab);
  const isLast = tabIdx === WIZARD_STEPS.length - 1;

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function toggleGoal(id: string) {
    setGoals((prev) => prev.map((g) => (g.id === id ? { ...g, enabled: !g.enabled } : g)));
  }

  function toggleRule(id: string) {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  }

  function handleApply() {
    const enabledGoals = goals.filter((g) => g.enabled);
    const enabledRules = rules.filter((r) => r.enabled);

    const goalDefs: GoalDef[] = enabledGoals.map((g) => ({
      id: g.id,
      label: g.label,
      period: g.period,
      target: g.target,
      unit: g.unit,
      current: 0,
      pct: 0,
      status: 'on-track' as const,
    }));

    const ruleDefs: RuleDef[] = enabledRules.map((r) => ({
      id: r.id,
      label: r.label,
      desc: r.desc,
      level: r.level,
      enabled: true,
      params: r.params,
      triggerCount: 0,
    }));

    const features = [
      ...enabledGoals.map((g) => g.label),
      ...enabledRules.map((r) => r.label),
    ].slice(0, 5);

    onApply({
      id: 'custom',
      Icon: Target,
      name: 'Custom setup',
      desc: 'Configured during onboarding.',
      features,
      badge: null,
      badgeColor: 'var(--green)',
      goals: goalDefs,
      rules: ruleDefs,
    });
  }

  function goNext() {
    const next = WIZARD_STEPS[tabIdx + 1];
    if (next) {
      setActiveTab(next.id);
    } else {
      handleApply();
    }
  }

  function goBack() {
    const prev = WIZARD_STEPS[tabIdx - 1];
    if (prev) setActiveTab(prev.id);
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.65)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
          padding: 0,
        }}
      />

      {/* Sheet */}
      <dialog
        open
        aria-label="Set up goals and rules"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: 0,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 16,
          width: '100%',
          maxWidth: 680,
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          color: 'var(--eb-text)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--eb-text)' }}>
              Set up goals &amp; rules
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
              Step {tabIdx + 1} of {WIZARD_STEPS.length}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 30,
              height: 30,
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--eb-muted)',
              padding: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Step tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '8px 20px',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          {WIZARD_STEPS.map(({ id, label, Icon }, i) => {
            const active = id === activeTab;
            const done = i < tabIdx;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '5px 12px',
                  borderRadius: 7,
                  border: active ? '1px solid var(--eb-border)' : '1px solid transparent',
                  background: active ? 'var(--eb-panel-2)' : 'transparent',
                  color: active ? 'var(--eb-text)' : done ? 'var(--green)' : 'var(--eb-muted)',
                  fontSize: 12.5,
                  fontWeight: active ? 600 : 400,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all .12s',
                }}
              >
                {done ? <Check size={12} /> : <Icon size={12} />}
                {label}
              </button>
            );
          })}
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 20px' }}>
          {activeTab === 'goals' && <GoalsStep goals={goals} onToggle={toggleGoal} />}
          {activeTab === 'rules' && <RulesStep rules={rules} onToggle={toggleRule} />}
          {activeTab === 'risk' && (
            <RiskStep
              riskCap={riskCap}
              onRiskCap={setRiskCap}
              defaultRisk={defaultRisk}
              onDefaultRisk={setDefaultRisk}
              maxConcurrent={maxConcurrent}
              onMaxConcurrent={setMaxConcurrent}
              killSwitch={killSwitch}
              onKillSwitch={setKillSwitch}
              leverageCap={leverageCap}
              onLeverageCap={setLeverageCap}
              minRR={minRR}
              onMinRR={setMinRR}
            />
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderTop: '1px solid var(--eb-border)',
            background: 'var(--eb-panel)',
          }}
        >
          <div style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>
            {activeTab === 'goals' &&
              `${goals.filter((g) => g.enabled).length} of ${goals.length} goals selected`}
            {activeTab === 'rules' &&
              `${rules.filter((r) => r.enabled).length} of ${rules.length} rules enabled`}
            {activeTab === 'risk' && 'Configure risk & sizing parameters'}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {tabIdx > 0 && (
              <button
                type="button"
                onClick={goBack}
                style={{
                  padding: '7px 14px',
                  borderRadius: 8,
                  border: '1px solid var(--eb-border)',
                  background: 'var(--eb-panel-2)',
                  color: 'var(--eb-muted)',
                  fontSize: 12.5,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                }}
              >
                Back
              </button>
            )}
            <button
              type="button"
              onClick={goNext}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 16px',
                borderRadius: 8,
                border: '1px solid #00b67a',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 12.5,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {isLast ? (
                <>
                  <Check size={13} /> Apply &amp; start
                </>
              ) : (
                <>
                  Next <ChevronRight size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

function EmptyState({
  account,
  onApplyPreset,
}: { account: AccountItem | undefined; onApplyPreset: (preset: Preset) => void }) {
  const [showModal, setShowModal] = useState(false);
  return (
    <>
      <div
        style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}
      >
        <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
          Coaching / Goals &amp; rules
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 22,
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}
            >
              Goals &amp; rules
            </h1>
            {account && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 12,
                  color: 'var(--eb-muted)',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: account.keyCount > 0 ? 'var(--green)' : 'var(--eb-yellow)',
                    display: 'inline-block',
                  }}
                />
                {account.label}
                <span
                  style={{
                    padding: '1px 6px',
                    borderRadius: 99,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                    fontSize: 10,
                    color: 'var(--eb-muted-2)',
                  }}
                >
                  {account.category}
                </span>
              </div>
            )}
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(245,165,36,.10)',
              border: '1px solid rgba(245,165,36,.30)',
              color: 'var(--eb-yellow)',
              fontWeight: 600,
              flexShrink: 0,
            }}
          >
            ○ Not configured
          </span>
        </div>

        {/* Hero */}
        <div
          style={{
            background:
              'linear-gradient(135deg,rgba(0,214,143,.07),rgba(6,182,212,.03) 50%,rgba(139,92,246,.05))',
            border: '1px solid var(--eb-border)',
            borderRadius: 14,
            padding: '36px 28px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden',
            marginBottom: 14,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(500px 200px at 20% 15%,rgba(0,214,143,.08),transparent 60%), radial-gradient(500px 200px at 80% 85%,rgba(139,92,246,.08),transparent 60%)',
              pointerEvents: 'none',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              width: 72,
              height: 72,
              borderRadius: 18,
              background: 'linear-gradient(135deg,var(--green),var(--eb-cyan))',
              color: '#06140f',
              fontSize: 34,
              fontWeight: 700,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 14,
              boxShadow: '0 12px 32px rgba(0,214,143,.22)',
            }}
          >
            <Target size={34} />
          </div>
          <h2
            style={{
              position: 'relative',
              zIndex: 1,
              margin: '0 0 8px',
              fontSize: 26,
              fontWeight: 600,
              letterSpacing: '-.01em',
              color: 'var(--eb-text)',
            }}
          >
            Set the guardrails for your{' '}
            <span
              style={{
                background: 'linear-gradient(90deg,var(--green),var(--eb-cyan),var(--eb-purple))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              future self
            </span>
          </h2>
          <p
            style={{
              position: 'relative',
              zIndex: 1,
              color: 'var(--eb-muted-2)',
              maxWidth: 580,
              margin: '0 auto 20px',
              fontSize: 13.5,
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: 'var(--eb-text)' }}>Goals pace you. Rules protect you.</strong>{' '}
            Together, they're how serious traders stay serious. Edgebook tracks your discipline in
            real time, fires alerts before tilt costs you money, and shows you exactly how much your
            guardrails earn back over time.
          </p>
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              type="button"
              onClick={() => setShowModal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '9px 18px',
                borderRadius: 9,
                border: '1px solid #00b67a',
                background: 'linear-gradient(180deg,#00d68f,#00b67a)',
                color: '#06140f',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={14} /> Get started
            </button>
          </div>
        </div>

        {/* What you'll get */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12,
            marginBottom: 14,
          }}
        >
          {WHAT_YOU_GET.map(({ label, desc, color, colorRgb }) => (
            <div
              key={label}
              style={{
                padding: '14px',
                border: '1px solid var(--eb-border)',
                borderRadius: 11,
                background: 'var(--eb-panel)',
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `rgba(${colorRgb},.12)`,
                  border: `1px solid rgba(${colorRgb},.25)`,
                  color,
                  marginBottom: 10,
                }}
              >
                <Target size={18} />
              </div>
              <div
                style={{ fontWeight: 600, fontSize: 13, marginBottom: 4, color: 'var(--eb-text)' }}
              >
                {label}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
                {desc}
              </div>
            </div>
          ))}
        </div>

        {/* Mini explainers */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3,1fr)',
            gap: 10,
            marginBottom: 14,
          }}
        >
          {EXPLAINERS.map(({ Icon, title, desc, color, colorRgb }) => (
            <div
              key={title}
              style={{
                padding: '11px 13px',
                border: '1px solid var(--eb-border)',
                borderRadius: 10,
                background: 'var(--eb-panel)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 7,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: `rgba(${colorRgb},.15)`,
                    color,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={12} />
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>
                  {title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--eb-muted)', lineHeight: 1.5 }}>
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
      {showModal && (
        <SetupModal
          onClose={() => setShowModal(false)}
          onApply={(preset) => {
            onApplyPreset(preset);
            setShowModal(false);
          }}
        />
      )}
    </>
  );
}

// ─── Edit goal modal ──────────────────────────────────────────────────────────

function EditField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint: string;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span
        style={{
          fontSize: 10.5,
          fontWeight: 600,
          color: 'var(--eb-muted)',
          textTransform: 'uppercase',
          letterSpacing: '.06em',
        }}
      >
        {label}
      </span>
      <input
        style={{
          background: 'var(--eb-panel-2)',
          border: '1px solid var(--eb-border)',
          borderRadius: 7,
          padding: '7px 10px',
          color: 'var(--eb-text)',
          fontSize: 13,
          fontFamily: 'var(--font-mono, monospace)',
          width: '100%',
        }}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <span style={{ fontSize: 11, color: 'var(--eb-muted)' }}>{hint}</span>
    </div>
  );
}

function EditGoalModal({
  goal,
  onSave,
  onClose,
}: {
  goal: GoalDef;
  onSave: (patch: Partial<Pick<GoalDef, 'label' | 'target' | 'unit' | 'period'>>) => void;
  onClose: () => void;
}) {
  const [label, setLabel] = useState(goal.label);
  const [target, setTarget] = useState(goal.target);
  const [unit, setUnit] = useState(goal.unit);
  const [period, setPeriod] = useState<GoalDef['period']>(goal.period);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  function handleSave() {
    onSave({ label, target, unit, period });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.65)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
          padding: 0,
        }}
      />
      <dialog
        open
        aria-label="Edit goal"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: 0,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 420,
          color: 'var(--eb-text)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>Edit goal</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--eb-muted)',
              padding: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EditField
            label="Goal label"
            value={label}
            onChange={setLabel}
            hint="What you want to achieve"
          />
          <EditField
            label="Target value"
            value={target}
            onChange={setTarget}
            hint="e.g. $400, 55%, 8"
          />
          <EditField
            label="Unit"
            value={unit}
            onChange={setUnit}
            hint="e.g. USDT, trades, win rate, account"
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Period
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 7,
                    border: `1px solid ${period === p ? 'rgba(0,214,143,.4)' : 'var(--eb-border)'}`,
                    background: period === p ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
                    color: period === p ? 'var(--green)' : 'var(--eb-muted)',
                    fontSize: 12.5,
                    fontWeight: period === p ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .12s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 18px',
            borderTop: '1px solid var(--eb-border)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Check size={12} /> Save
          </button>
        </div>
      </dialog>
    </div>
  );
}

// ─── Add goal modal ───────────────────────────────────────────────────────────

function AddGoalModal({
  onSave,
  onClose,
}: { onSave: (goal: GoalDef) => void; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [target, setTarget] = useState('');
  const [unit, setUnit] = useState('USDT');
  const [period, setPeriod] = useState<GoalDef['period']>('daily');

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const canSave = label.trim().length > 0 && target.trim().length > 0;

  function handleSave() {
    if (!canSave) return;
    onSave({
      id: crypto.randomUUID(),
      label: label.trim(),
      period,
      target: target.trim(),
      unit: unit.trim() || 'USDT',
      current: 0,
      pct: 0,
      status: 'on-track',
    });
    onClose();
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.65)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
          padding: 0,
        }}
      />
      <dialog
        open
        aria-label="Add goal"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: 0,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 420,
          color: 'var(--eb-text)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--eb-border)',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>Add goal</div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
              Define a new performance target
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--eb-muted)',
              padding: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <EditField
            label="Goal label"
            value={label}
            onChange={setLabel}
            hint="What you want to achieve"
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <EditField
              label="Target value"
              value={target}
              onChange={setTarget}
              hint="e.g. $400, 55%, 8"
            />
            <EditField
              label="Unit"
              value={unit}
              onChange={setUnit}
              hint="USDT, trades, win rate…"
            />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Period
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriod(p)}
                  style={{
                    flex: 1,
                    padding: '7px 0',
                    borderRadius: 7,
                    border: `1px solid ${period === p ? 'rgba(0,214,143,.4)' : 'var(--eb-border)'}`,
                    background: period === p ? 'rgba(0,214,143,.08)' : 'var(--eb-panel-2)',
                    color: period === p ? 'var(--green)' : 'var(--eb-muted)',
                    fontSize: 12.5,
                    fontWeight: period === p ? 600 : 400,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all .12s',
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 18px',
            borderTop: '1px solid var(--eb-border)',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              opacity: canSave ? 1 : 0.45,
            }}
          >
            <Plus size={12} /> Add goal
          </button>
        </div>
      </dialog>
    </div>
  );
}

// ─── Add rule modal ───────────────────────────────────────────────────────────

type ParamRow = { label: string; value: string; unit: string };

function AddRuleModal({
  onSave,
  onClose,
}: { onSave: (rule: RuleDef) => void; onClose: () => void }) {
  const [label, setLabel] = useState('');
  const [desc, setDesc] = useState('');
  const [level, setLevel] = useState<RuleDef['level']>('soft');
  const [paramRows, setParamRows] = useState<ParamRow[]>([]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const canSave = label.trim().length > 0;

  function addParamRow() {
    if (paramRows.length >= 3) return;
    setParamRows((prev) => [...prev, { label: '', value: '', unit: '' }]);
  }

  function removeParamRow(i: number) {
    setParamRows((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateParamRow(i: number, field: keyof ParamRow, val: string) {
    setParamRows((prev) => prev.map((p, idx) => (idx === i ? { ...p, [field]: val } : p)));
  }

  function handleSave() {
    if (!canSave) return;
    const builtParams = paramRows
      .filter((p) => p.label.trim() && p.value.trim())
      .map((p) => {
        const base: { label: string; value: string } = {
          label: p.label.trim(),
          value: p.value.trim(),
        };
        return p.unit.trim() ? { ...base, unit: p.unit.trim() } : base;
      });
    onSave({
      id: crypto.randomUUID(),
      label: label.trim(),
      desc: desc.trim(),
      level,
      enabled: true,
      params: builtParams,
      triggerCount: 0,
    });
    onClose();
  }

  const isHard = level === 'hard';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <button
        type="button"
        aria-label="Close"
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,.65)',
          backdropFilter: 'blur(4px)',
          border: 'none',
          cursor: 'default',
          padding: 0,
        }}
      />
      <dialog
        open
        aria-label="Add tilt rule"
        style={{
          position: 'relative',
          zIndex: 1,
          margin: 0,
          padding: 0,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 14,
          width: '100%',
          maxWidth: 480,
          maxHeight: '88vh',
          color: 'var(--eb-text)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 18px',
            borderBottom: '1px solid var(--eb-border)',
            flexShrink: 0,
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--eb-text)' }}>
              New tilt rule
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--eb-muted)', marginTop: 2 }}>
              Behavioral guardrail that fires in real time
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--eb-muted)',
              padding: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px 18px',
            display: 'flex',
            flexDirection: 'column',
            gap: 14,
          }}
        >
          {/* Level selector */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Rule type
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              {(['soft', 'hard'] as const).map((lv) => {
                const active = level === lv;
                const accent = lv === 'hard' ? 'rgba(255,91,108' : 'rgba(245,165,36';
                const accentSolid = lv === 'hard' ? 'var(--eb-red)' : 'var(--eb-yellow)';
                return (
                  <button
                    key={lv}
                    type="button"
                    onClick={() => setLevel(lv)}
                    style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 3,
                      padding: '10px 12px',
                      borderRadius: 9,
                      border: `1px solid ${active ? `${accent},.40)` : 'var(--eb-border)'}`,
                      background: active ? `${accent},.07)` : 'var(--eb-panel-2)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      textAlign: 'left',
                      transition: 'all .12s',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: active ? accentSolid : 'var(--eb-muted)',
                      }}
                    >
                      {lv === 'soft' ? 'Soft alert' : 'Hard pause'}
                    </span>
                    <span style={{ fontSize: 10.5, color: 'var(--eb-muted)', lineHeight: 1.4 }}>
                      {lv === 'soft'
                        ? 'In-app banner · you can override and proceed'
                        : 'Account flips read-only for the cooldown window'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <EditField
            label="Rule name"
            value={label}
            onChange={setLabel}
            hint="Short name shown on the card"
          />

          {/* Description */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              Description
            </span>
            <textarea
              rows={2}
              placeholder="Describe when this rule fires…"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              style={{
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                borderRadius: 7,
                padding: '7px 10px',
                color: 'var(--eb-text)',
                fontSize: 13,
                fontFamily: 'inherit',
                width: '100%',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 600,
                  color: 'var(--eb-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '.06em',
                }}
              >
                Parameters
              </span>
              {paramRows.length < 3 && (
                <button
                  type="button"
                  onClick={addParamRow}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid var(--eb-border)',
                    background: 'var(--eb-panel-2)',
                    color: 'var(--eb-muted)',
                    fontSize: 11,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                  }}
                >
                  <Plus size={10} /> Add param
                </button>
              )}
            </div>
            {paramRows.length === 0 && (
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--eb-muted)',
                  padding: '10px 0',
                  fontStyle: 'italic',
                }}
              >
                No parameters — add one if this rule has a configurable threshold.
              </div>
            )}
            {paramRows.map((row, i) => (
              <div
                key={`param-${
                  // biome-ignore lint/suspicious/noArrayIndexKey: stable form rows
                  i
                }`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 80px auto',
                  gap: 6,
                  alignItems: 'flex-end',
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--eb-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                      }}
                    >
                      Name
                    </span>
                  )}
                  <input
                    placeholder='e.g. "Trigger after"'
                    value={row.label}
                    onChange={(e) => updateParamRow(i, 'label', e.target.value)}
                    style={{
                      background: 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: 'var(--eb-text)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--eb-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                      }}
                    >
                      Value
                    </span>
                  )}
                  <input
                    placeholder="3"
                    value={row.value}
                    onChange={(e) => updateParamRow(i, 'value', e.target.value)}
                    style={{
                      background: 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: 'var(--eb-text)',
                      fontSize: 12,
                      fontFamily: 'var(--font-mono, monospace)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {i === 0 && (
                    <span
                      style={{
                        fontSize: 9.5,
                        color: 'var(--eb-muted)',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '.06em',
                      }}
                    >
                      Unit
                    </span>
                  )}
                  <input
                    placeholder="losses"
                    value={row.unit}
                    onChange={(e) => updateParamRow(i, 'unit', e.target.value)}
                    style={{
                      background: 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      borderRadius: 6,
                      padding: '6px 8px',
                      color: 'var(--eb-text)',
                      fontSize: 12,
                      fontFamily: 'inherit',
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeParamRow(i)}
                  aria-label="Remove parameter"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 6,
                    border: '1px solid var(--eb-border)',
                    background: 'transparent',
                    color: 'var(--eb-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 0,
                    flexShrink: 0,
                    alignSelf: 'flex-end',
                  }}
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>

          {/* Preview chip */}
          <div
            style={{
              padding: '10px 12px',
              borderRadius: 9,
              background: `${isHard ? 'rgba(255,91,108' : 'rgba(245,165,36'},.05)`,
              border: `1px solid ${isHard ? 'rgba(255,91,108,.20)' : 'rgba(245,165,36,.20)'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>
                {label.trim() || 'Rule name'}
              </span>
              <span
                style={{
                  fontSize: 10,
                  padding: '1px 6px',
                  borderRadius: 99,
                  fontWeight: 600,
                  color: isHard ? 'var(--eb-red)' : 'var(--eb-yellow)',
                  background: isHard ? 'rgba(255,91,108,.10)' : 'rgba(245,165,36,.10)',
                  border: `1px solid ${isHard ? 'rgba(255,91,108,.30)' : 'rgba(245,165,36,.30)'}`,
                }}
              >
                {isHard ? 'hard pause' : 'soft alert'}
              </span>
            </div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)', lineHeight: 1.4 }}>
              {desc.trim() || 'No description yet'}
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            padding: '12px 18px',
            borderTop: '1px solid var(--eb-border)',
            flexShrink: 0,
          }}
        >
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px 14px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted)',
              fontSize: 12.5,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 16px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12.5,
              fontWeight: 600,
              cursor: canSave ? 'pointer' : 'not-allowed',
              fontFamily: 'inherit',
              opacity: canSave ? 1 : 0.45,
            }}
          >
            <Plus size={12} /> Create rule
          </button>
        </div>
      </dialog>
    </div>
  );
}

// ─── Live PnL stats ───────────────────────────────────────────────────────────

type PnlStats = {
  todayPnl: number;
  weekPnl: number;
  monthPnl: number;
  todayTrades: number;
  winRate: number;
  totalClosed: number;
  // calendar context
  dailyPnlMap: Record<string, number>; // 'YYYY-MM-DD' → net P&L
  tradingDaysThisMonth: number; // weekdays elapsed 1st → today
  totalTradingDaysThisMonth: number; // weekdays in the full month
  weekdaysThisWeek: number; // weekdays elapsed Mon → today
  weekStart: Date;
  weekNum: number;
  monthName: string;
};

function countWeekdays(from: Date, to: Date): number {
  let count = 0;
  const d = new Date(from);
  while (d <= to) {
    const day = d.getUTCDay();
    if (day >= 1 && day <= 5) count++;
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return count;
}

function isoWeekNum(d: Date): number {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

function computeGoalMeta(g: GoalDef, stats: PnlStats): string {
  const lbl = g.label.toLowerCase();

  if (lbl.includes('win rate')) {
    const t = Number.parseFloat(g.target.replace('%', '').trim()) || 55;
    return `Floor: ${t}% · sample window: rolling 50 trades`;
  }

  if (lbl.includes('max trades') || lbl.includes('trades /')) {
    return `Limit: ${g.target} · prevents over-trading · soft alert at 80%`;
  }

  if (lbl.includes('max loss') || lbl.includes('drawdown')) {
    const isMonthly = lbl.includes('monthly') || lbl.includes('drawdown cap');
    return isMonthly
      ? `${g.target} ${g.unit} · triggers account halt · ${stats.monthName}`
      : `${g.target} ${g.unit} · hard pause when hit · circuit breaker`;
  }

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });

  if (lbl.includes('weekly')) {
    const weekEnd = new Date(stats.weekStart);
    weekEnd.setUTCDate(stats.weekStart.getUTCDate() + 6);
    return `Week ${stats.weekNum} · ${fmtDate(stats.weekStart)} → ${fmtDate(weekEnd)} · ${stats.weekdaysThisWeek} of 5 days complete`;
  }

  if (lbl.includes('monthly')) {
    return `${stats.monthName} · target ${g.target} · ${stats.tradingDaysThisMonth} of ${stats.totalTradingDaysThisMonth} trading days done`;
  }

  // daily P&L — count how many days hit target
  const targetNum = Number.parseFloat(g.target.replace(/[$,]/g, '').trim()) || 0;
  const daysHit = Object.values(stats.dailyPnlMap).filter((v) => v >= targetNum).length;
  return `Mon–Fri · resets 00:00 UTC · ${daysHit} of ${stats.totalTradingDaysThisMonth} trading days hit this month`;
}

function fmtUsd(v: number): string {
  const abs = Math.abs(v);
  const sign = v >= 0 ? '+' : '-';
  if (abs >= 1000) return `${sign}$${abs.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
  return `${sign}$${abs.toFixed(2)}`;
}

function computeGoalLive(
  g: GoalDef,
  stats: PnlStats,
): { displayValue: string; subtext: string; pct: number; status: GoalDef['status'] } {
  const lbl = g.label.toLowerCase();

  if (lbl.includes('win rate')) {
    const targetNum = Number.parseFloat(g.target.replace('%', '').trim()) || 55;
    const current = stats.winRate;
    const ratio = targetNum > 0 ? current / targetNum : 0;
    const pct = Math.min(ratio * 100, 100);
    const status: GoalDef['status'] = current >= targetNum ? 'on-track' : 'drift';
    return {
      displayValue: stats.totalClosed === 0 ? '—' : `${current.toFixed(0)}%`,
      subtext:
        stats.totalClosed === 0
          ? 'No closed trades yet'
          : `Last ${Math.min(stats.totalClosed, 50)} trades`,
      pct,
      status,
    };
  }

  if (lbl.includes('max trades') || lbl.includes('trades /')) {
    const targetNum = Number.parseFloat(g.target) || 8;
    const pct = Math.min((stats.todayTrades / targetNum) * 100, 100);
    const status: GoalDef['status'] = pct >= 80 ? 'drift' : 'safe';
    return {
      displayValue: `${stats.todayTrades}`,
      subtext: `/ ${targetNum} limit today`,
      pct,
      status,
    };
  }

  if (lbl.includes('max loss') || lbl.includes('drawdown')) {
    const isMonthly = lbl.includes('monthly') || lbl.includes('drawdown cap');
    const rawPnl = isMonthly ? stats.monthPnl : stats.todayPnl;
    const loss = Math.min(rawPnl, 0);
    const status: GoalDef['status'] = loss < 0 ? 'drift' : 'safe';
    return {
      displayValue: loss === 0 ? '$0.00' : `-$${Math.abs(loss).toFixed(2)}`,
      subtext:
        loss < 0
          ? `${isMonthly ? 'Month' : 'Today'}'s loss`
          : `No losses ${isMonthly ? 'this month' : 'today'}`,
      pct: 0,
      status,
    };
  }

  // P&L goals — daily / weekly / monthly
  const rawPnl = lbl.includes('weekly')
    ? stats.weekPnl
    : lbl.includes('monthly')
      ? stats.monthPnl
      : stats.todayPnl;
  const targetNum = Number.parseFloat(g.target.replace(/[$,]/g, '').trim()) || 1;
  const ratio = targetNum > 0 ? rawPnl / targetNum : 0;
  const status: GoalDef['status'] = ratio >= 1.1 ? 'ahead' : ratio >= 0.3 ? 'on-track' : 'drift';
  return {
    displayValue: stats.totalClosed === 0 && rawPnl === 0 ? '—' : fmtUsd(rawPnl),
    subtext:
      stats.totalClosed === 0
        ? 'No closed trades yet'
        : `${Math.max(0, ratio * 100).toFixed(0)}% of ${g.target} target`,
    pct: Math.min(Math.max(ratio * 100, 0), 100),
    status: stats.totalClosed === 0 ? 'on-track' : status,
  };
}

// ─── Configured / Dashboard state ─────────────────────────────────────────────

type Tab = 'goals' | 'rules';

function GoalsDashboard({
  account,
  presetName,
  goals,
  rules,
  onToggleRule,
  onReset,
  onEditGoal,
  onAddGoal,
  onAddRule,
}: {
  account: AccountItem | undefined;
  presetName: string;
  goals: GoalDef[];
  rules: RuleDef[];
  onToggleRule: (id: string, enabled: boolean) => void;
  onReset: () => void;
  onEditGoal: (
    goalId: string,
    patch: Partial<Pick<GoalDef, 'label' | 'target' | 'unit' | 'period'>>,
  ) => void;
  onAddGoal: (goal: GoalDef) => void;
  onAddRule: (rule: RuleDef) => void;
}) {
  const [tab, setTab] = useState<Tab>('goals');
  const [editingGoal, setEditingGoal] = useState<GoalDef | null>(null);
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [showAddRule, setShowAddRule] = useState(false);
  const activeRules = rules.filter((r) => r.enabled).length;

  const { data: positions } = usePositions(account?.id ?? null, { refetchInterval: 30_000 });

  const pnlStats = useMemo((): PnlStats => {
    const closed = (positions ?? []).filter((p) => p.status === 'closed' && p.closedAt != null);
    const now = new Date();
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth();
    const d = now.getUTCDate();

    const todayStart = new Date(Date.UTC(y, m, d));
    const daysFromMonday = (todayStart.getUTCDay() + 6) % 7;
    const weekStart = new Date(todayStart);
    weekStart.setUTCDate(todayStart.getUTCDate() - daysFromMonday);
    const monthStart = new Date(Date.UTC(y, m, 1));
    const monthEnd = new Date(Date.UTC(y, m + 1, 0)); // last day of month

    let todayPnl = 0;
    let weekPnl = 0;
    let monthPnl = 0;
    let todayTrades = 0;
    const dailyPnlMap: Record<string, number> = {};

    for (const p of closed) {
      const closedAt = new Date(p.closedAt ?? '');
      const pnl = Number.parseFloat(p.netPnl);
      if (Number.isNaN(pnl)) continue;
      if (closedAt >= todayStart) {
        todayPnl += pnl;
        todayTrades++;
      }
      if (closedAt >= weekStart) weekPnl += pnl;
      if (closedAt >= monthStart) {
        monthPnl += pnl;
        const key = closedAt.toISOString().slice(0, 10);
        dailyPnlMap[key] = (dailyPnlMap[key] ?? 0) + pnl;
      }
    }

    const last50 = [...closed]
      .sort((a, b) => new Date(b.closedAt ?? '').getTime() - new Date(a.closedAt ?? '').getTime())
      .slice(0, 50);
    const wins = last50.filter((p) => Number.parseFloat(p.netPnl) > 0).length;
    const winRate = last50.length > 0 ? (wins / last50.length) * 100 : 0;

    return {
      todayPnl,
      weekPnl,
      monthPnl,
      todayTrades,
      winRate,
      totalClosed: closed.length,
      dailyPnlMap,
      tradingDaysThisMonth: countWeekdays(monthStart, todayStart),
      totalTradingDaysThisMonth: countWeekdays(monthStart, monthEnd),
      weekdaysThisWeek: countWeekdays(weekStart, todayStart),
      weekStart,
      weekNum: isoWeekNum(now),
      monthName: now.toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC' }),
    };
  }, [positions]);

  const tabs: { id: Tab; label: string }[] = [
    { id: 'goals', label: 'Goals' },
    { id: 'rules', label: 'Tilt rules' },
  ];

  return (
    <div style={{ padding: '22px 26px 60px', maxWidth: 1400, width: '100%', alignSelf: 'center' }}>
      <div style={{ color: 'var(--eb-muted)', fontSize: 12, marginBottom: 6 }}>
        Coaching / Goals &amp; rules
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 18,
          gap: 12,
        }}
      >
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, margin: '0 0 4px', color: 'var(--eb-text)' }}>
            Goals &amp; rules
          </h1>
          {account && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontSize: 12,
                color: 'var(--eb-muted)',
              }}
            >
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: account.keyCount > 0 ? 'var(--green)' : 'var(--eb-yellow)',
                  display: 'inline-block',
                }}
              />
              {account.label}
              <span
                style={{
                  padding: '1px 6px',
                  borderRadius: 99,
                  background: 'var(--eb-panel-2)',
                  border: '1px solid var(--eb-border)',
                  fontSize: 10,
                  color: 'var(--eb-muted-2)',
                }}
              >
                {account.category}
              </span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontSize: 11,
              padding: '3px 10px',
              borderRadius: 99,
              background: 'rgba(0,214,143,.10)',
              border: '1px solid rgba(0,214,143,.30)',
              color: 'var(--green)',
              fontWeight: 600,
            }}
          >
            ● {activeRules} rules armed
          </span>
          <button
            type="button"
            onClick={onReset}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted)',
              fontSize: 12,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Reset
          </button>
          <button
            type="button"
            onClick={() => setShowAddRule(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            <Plus size={12} /> New rule
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}
      >
        {[
          {
            label: 'Active rules',
            value: String(activeRules),
            sub: presetName,
            color: 'var(--eb-text)',
          },
          {
            label: 'Active goals',
            value: String(goals.length),
            sub: `${goals.length} tracking`,
            color: 'var(--eb-text)',
          },
          { label: 'Triggers (90D)', value: '—', sub: 'No data yet', color: 'var(--eb-muted)' },
          { label: 'Discipline avg', value: '—', sub: 'Needs 10 trades', color: 'var(--eb-muted)' },
        ].map(({ label, value, sub, color }) => (
          <div
            key={label}
            style={{
              background: 'var(--eb-panel)',
              border: '1px solid var(--eb-border)',
              borderRadius: 10,
              padding: '12px 14px',
            }}
          >
            <div
              style={{
                fontSize: 10.5,
                color: 'var(--eb-muted)',
                textTransform: 'uppercase',
                letterSpacing: '.06em',
                marginBottom: 4,
              }}
            >
              {label}
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 600,
                color,
                fontFamily: 'var(--font-mono, monospace)',
              }}
            >
              {value}
            </div>
            <div style={{ fontSize: 11, color: 'var(--eb-muted)', marginTop: 2 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Tab nav */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: 4,
          background: 'var(--eb-panel)',
          border: '1px solid var(--eb-border)',
          borderRadius: 10,
          marginBottom: 14,
          width: 'fit-content',
        }}
      >
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            style={{
              padding: '6px 14px',
              borderRadius: 7,
              fontSize: 12.5,
              fontWeight: tab === id ? 600 : 400,
              cursor: 'pointer',
              fontFamily: 'inherit',
              border: tab === id ? '1px solid var(--eb-border)' : '1px solid transparent',
              background: tab === id ? 'var(--eb-panel-2)' : 'transparent',
              color: tab === id ? 'var(--eb-text)' : 'var(--eb-muted)',
              transition: 'background .1s, color .1s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Goals tab */}
      {tab === 'goals' && (
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: 16,
            marginBottom: 14,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>
              Active goals
            </h3>
            <button
              type="button"
              onClick={() => setShowAddGoal(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 7,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                color: 'var(--eb-muted)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={11} /> Add goal
            </button>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--eb-muted)' }}>
            Targets that pace you. Pacing bars update in real time off your synced fills.
          </p>
          {goals.map((g) => {
            const live = computeGoalLive(g, pnlStats);
            const sc = STATUS_CHIP[live.status];
            const isPos = live.displayValue.startsWith('+');
            const isNeg = live.displayValue.startsWith('-') && live.displayValue !== '-';
            const valueColor = isPos ? 'var(--green)' : isNeg ? 'var(--eb-red)' : 'var(--eb-muted)';
            return (
              <div
                key={g.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 260px',
                  gap: 16,
                  alignItems: 'center',
                  padding: 14,
                  border: '1px solid var(--eb-border)',
                  borderRadius: 11,
                  background: 'var(--eb-panel-2)',
                  marginBottom: 10,
                }}
              >
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'var(--eb-text)',
                    }}
                  >
                    {g.label}
                    <Chip label={sc.label} color={sc.color} bg={sc.bg} border={sc.border} />
                  </div>
                  <div style={{ color: 'var(--eb-muted)', fontSize: 11.5, marginTop: 3 }}>
                    {computeGoalMeta(g, pnlStats)}
                  </div>
                  <ProgressBar pct={live.pct} status={live.status} />
                </div>
                <div>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'baseline',
                      gap: 6,
                      justifyContent: 'flex-end',
                    }}
                  >
                    <span
                      style={{
                        fontFamily: 'var(--font-mono, monospace)',
                        fontSize: 20,
                        fontWeight: 600,
                        color: valueColor,
                      }}
                    >
                      {live.displayValue}
                    </span>
                    <span style={{ color: 'var(--eb-muted)', fontSize: 12 }}>
                      / {g.target} {g.unit}
                    </span>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--eb-muted)',
                      textAlign: 'right',
                      marginTop: 4,
                    }}
                  >
                    {live.subtext}
                  </div>
                  <div
                    style={{ display: 'flex', gap: 5, marginTop: 6, justifyContent: 'flex-end' }}
                  >
                    <button
                      type="button"
                      onClick={() => setEditingGoal(g)}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 7,
                        border: '1px solid var(--eb-border)',
                        background: 'transparent',
                        color: 'var(--eb-muted-2)',
                        fontSize: 11.5,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {editingGoal && (
        <EditGoalModal
          key={editingGoal.id}
          goal={editingGoal}
          onSave={(patch) => {
            onEditGoal(editingGoal.id, patch);
          }}
          onClose={() => setEditingGoal(null)}
        />
      )}

      {showAddGoal && (
        <AddGoalModal
          onSave={(goal) => {
            onAddGoal(goal);
            setTab('goals');
          }}
          onClose={() => setShowAddGoal(false)}
        />
      )}

      {showAddRule && (
        <AddRuleModal
          onSave={(rule) => {
            onAddRule(rule);
            setTab('rules');
          }}
          onClose={() => setShowAddRule(false)}
        />
      )}

      {/* Rules tab */}
      {tab === 'rules' && (
        <div
          style={{
            background: 'var(--eb-panel)',
            border: '1px solid var(--eb-border)',
            borderRadius: 12,
            padding: 16,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--eb-text)' }}>
                Tilt rules
              </h3>
              <Chip
                label={`${activeRules} active`}
                color="var(--green)"
                bg="rgba(0,214,143,.10)"
                border="rgba(0,214,143,.30)"
              />
            </div>
            <button
              type="button"
              onClick={() => setShowAddRule(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                padding: '5px 10px',
                borderRadius: 7,
                border: '1px solid var(--eb-border)',
                background: 'var(--eb-panel-2)',
                color: 'var(--eb-muted)',
                fontSize: 12,
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              <Plus size={11} /> New rule
            </button>
          </div>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: 'var(--eb-muted)' }}>
            Real-time behavioral guardrails. Soft alerts banner you in-app; hard pause flips the
            account into read-only.
          </p>
          {rules.map((rule) => {
            const lc = LEVEL_CHIP[rule.level];
            return (
              <div
                key={rule.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr',
                  gap: 14,
                  padding: 14,
                  border: `1px solid ${rule.enabled ? 'var(--eb-border)' : 'var(--eb-border)'}`,
                  borderRadius: 11,
                  background: rule.enabled ? 'var(--eb-panel-2)' : 'transparent',
                  marginBottom: 10,
                  alignItems: 'flex-start',
                  opacity: rule.enabled ? 1 : 0.55,
                }}
              >
                <Toggle checked={rule.enabled} onChange={(v) => onToggleRule(rule.id, v)} />
                <div>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 13.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      color: 'var(--eb-text)',
                      flexWrap: 'wrap',
                    }}
                  >
                    {rule.label}
                    <Chip label={lc.label} color={lc.color} bg={lc.bg} border={lc.border} />
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--eb-muted-2)',
                      lineHeight: 1.5,
                      marginTop: 3,
                    }}
                  >
                    {rule.desc}
                  </div>
                  {rule.params.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        gap: 8,
                        flexWrap: 'wrap',
                        alignItems: 'center',
                        marginTop: 8,
                        fontSize: 11.5,
                        color: 'var(--eb-muted)',
                      }}
                    >
                      {rule.params.map((p) => (
                        <span
                          key={p.label}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}
                        >
                          <span>{p.label}</span>
                          <span
                            style={{
                              fontFamily: 'var(--font-mono, monospace)',
                              fontWeight: 600,
                              color: 'var(--eb-text)',
                              background: 'var(--eb-panel)',
                              border: '1px solid var(--eb-border)',
                              padding: '2px 7px',
                              borderRadius: 5,
                              fontSize: 12,
                            }}
                          >
                            {p.value}
                          </span>
                          {p.unit && <span>{p.unit}</span>}
                        </span>
                      ))}
                    </div>
                  )}
                  <div
                    style={{
                      display: 'flex',
                      gap: 14,
                      fontSize: 11,
                      color: 'var(--eb-muted)',
                      marginTop: 8,
                      paddingTop: 8,
                      borderTop: '1px dashed var(--eb-border)',
                    }}
                  >
                    <span>
                      Triggered{' '}
                      <strong
                        style={{
                          color: 'var(--eb-text)',
                          fontFamily: 'var(--font-mono, monospace)',
                        }}
                      >
                        0
                      </strong>{' '}
                      times
                    </span>
                    <span>No data yet — needs fills to compute counterfactual</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export function GoalsClient() {
  const { selectedAccountId, setSelectedAccountId } = useSelectedAccount();
  const { data: accounts } = useAccounts();
  const {
    configByAccount,
    setAccountConfig,
    addGoal: ctxAddGoal,
    updateGoal,
    addRule: ctxAddRule,
    toggleRule: ctxToggleRule,
    resetAccount,
  } = useGoals();

  const account = (accounts ?? []).find((a) => a.id === selectedAccountId);
  const config = selectedAccountId !== 'all' ? (configByAccount[selectedAccountId] ?? null) : null;

  function applyPreset(preset: Preset) {
    if (selectedAccountId === 'all') return;
    setAccountConfig(selectedAccountId, {
      presetName: preset.name,
      goals: preset.goals.map((g) => ({ ...g })),
      rules: preset.rules.map((r) => ({ ...r })),
    });
  }

  function toggleRule(ruleId: string, enabled: boolean) {
    if (selectedAccountId === 'all') return;
    ctxToggleRule(selectedAccountId, ruleId, enabled);
  }

  function editGoal(
    goalId: string,
    patch: Partial<Pick<GoalDef, 'label' | 'target' | 'unit' | 'period'>>,
  ) {
    if (selectedAccountId === 'all') return;
    updateGoal(selectedAccountId, goalId, patch);
  }

  function handleAddGoal(goal: GoalDef) {
    if (selectedAccountId === 'all') return;
    ctxAddGoal(selectedAccountId, goal);
  }

  function handleAddRule(rule: RuleDef) {
    if (selectedAccountId === 'all') return;
    ctxAddRule(selectedAccountId, rule);
  }

  function resetConfig() {
    if (selectedAccountId === 'all') return;
    resetAccount(selectedAccountId);
  }

  if (selectedAccountId === 'all') {
    return <AccountPrompt accounts={accounts} onSelect={setSelectedAccountId} />;
  }

  if (!config) {
    return <EmptyState account={account} onApplyPreset={applyPreset} />;
  }

  return (
    <GoalsDashboard
      account={account}
      presetName={config.presetName}
      goals={config.goals}
      rules={config.rules}
      onToggleRule={toggleRule}
      onReset={resetConfig}
      onEditGoal={editGoal}
      onAddGoal={handleAddGoal}
      onAddRule={handleAddRule}
    />
  );
}
