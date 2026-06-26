'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  Lock,
  Minus,
  Plus,
  Target,
  TrendingDown,
  TrendingUp,
  Unlock,
  X,
  Zap,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

type SessionType = 'morning' | 'afternoon' | 'evening' | 'overnight';
type BiasDir = 'bull' | 'neutral' | 'bear';

interface BiasItem {
  id: string;
  symbol: string;
  direction: BiasDir;
  thesis: string;
}

interface SetupItem {
  id: string;
  text: string;
}

interface CustomPreflightItem {
  id: string;
  label: string;
}

interface SessionData {
  sessionType: SessionType;
  mood: 1 | 2 | 3 | 4 | 5;
  moodNote: string;
  biases: BiasItem[];
  setups: SetupItem[];
  maxLoss: string;
  maxTrades: string;
  riskPct: string;
  preflight: Record<string, boolean>;
  customPreflightItems?: CustomPreflightItem[];
  events: string;
  intention: string;
  lockedAt: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: 'morning',   label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening',   label: 'Evening' },
  { id: 'overnight', label: 'Overnight' },
];

const MOODS: { val: 1 | 2 | 3 | 4 | 5; emoji: string; label: string; color: string }[] = [
  { val: 1, emoji: '😰', label: 'Anxious', color: '#ff5b6c' },
  { val: 2, emoji: '😕', label: 'Off',     color: '#f5a524' },
  { val: 3, emoji: '😐', label: 'Neutral', color: '#7a8395' },
  { val: 4, emoji: '🙂', label: 'Good',    color: '#06b6d4' },
  { val: 5, emoji: '🔥', label: 'Sharp',   color: '#00d68f' },
];

const PREFLIGHT_ITEMS: { id: string; label: string }[] = [
  { id: 'sleep',        label: 'Rested — at least 6 hours of sleep' },
  { id: 'fomo',         label: 'Not trading out of boredom, revenge, or FOMO' },
  { id: 'risk',         label: 'Risk limits reviewed and set for today' },
  { id: 'calendar',     label: 'Economic calendar checked for events' },
  { id: 'invalidation', label: 'Know my invalidation level for each planned setup' },
  { id: 'stops',        label: 'Will respect stop losses — no moving them wider' },
  { id: 'screen',       label: 'Charts and workspace are set up and ready' },
];

const DEFAULT_SESSION: SessionData = {
  sessionType: 'morning',
  mood: 3,
  moodNote: '',
  biases: [
    { id: 'btc', symbol: 'BTC', direction: 'neutral', thesis: '' },
    { id: 'eth', symbol: 'ETH', direction: 'neutral', thesis: '' },
  ],
  setups: [],
  maxLoss: '',
  maxTrades: '',
  riskPct: '',
  preflight: Object.fromEntries(PREFLIGHT_ITEMS.map((p) => [p.id, false])),
  events: '',
  intention: '',
  lockedAt: null,
};

function todayKey(): string {
  const d = new Date();
  return `eb-session-${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function formatDate(d: Date): string {
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function elapsedLabel(iso: string): string {
  const secs = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionCard({
  icon,
  iconColor,
  title,
  subtitle,
  children,
  accent,
  badge,
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: string;
  badge?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderTop: accent ? `2px solid ${accent}` : '1px solid var(--eb-border)',
        borderRadius: 14,
        padding: '22px 26px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <div
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: `color-mix(in srgb, ${iconColor} 11%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            {icon}
          </div>
          <div style={{ paddingTop: 2 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--eb-text)', letterSpacing: '-.01em', lineHeight: 1.3 }}>
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 3, lineHeight: 1.4 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        {badge}
      </div>
      {children}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: '.08em',
        textTransform: 'uppercase', color: 'var(--eb-muted)', marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}

function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
  disabled,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  rows?: number;
  disabled?: boolean;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      disabled={disabled}
      style={{
        width: '100%',
        background: disabled ? 'transparent' : 'var(--eb-panel-2)',
        border: `1px solid ${disabled ? 'transparent' : 'var(--eb-border)'}`,
        borderRadius: 10,
        padding: '10px 13px',
        color: 'var(--eb-text)',
        fontSize: 13,
        fontFamily: 'inherit',
        lineHeight: 1.65,
        resize: 'vertical',
        outline: 0,
        boxSizing: 'border-box',
        opacity: disabled ? 0.8 : 1,
      }}
    />
  );
}

function Chip({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <span
      style={{
        fontSize: 11, fontWeight: 700,
        color,
        background: `color-mix(in srgb, ${color} 10%, transparent)`,
        border: `1px solid color-mix(in srgb, ${color} 28%, transparent)`,
        borderRadius: 99,
        padding: '2px 10px',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SessionClient() {
  const [session, setSession] = useState<SessionData>(DEFAULT_SESSION);
  const [tick, setTick] = useState(0);
  const [newSymbol, setNewSymbol] = useState('');
  const [newSetup, setNewSetup] = useState('');
  const newSymbolRef = useRef<HTMLInputElement>(null);
  const newSetupRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(todayKey());
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(todayKey(), JSON.stringify(session));
  }, [session]);

  // Re-render every second to update the elapsed timer
  useEffect(() => {
    if (!session.lockedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session.lockedAt]);

  void tick; // consumed by elapsedLabel via re-render

  const set = <K extends keyof SessionData>(key: K, val: SessionData[K]) =>
    setSession((s) => ({ ...s, [key]: val }));

  const isLocked = !!session.lockedAt;

  const preflightDone = Object.values(session.preflight).filter(Boolean).length;
  const completionItems = [
    session.mood !== 3,
    session.biases.length > 0,
    session.setups.length > 0,
    session.maxLoss !== '',
    preflightDone === PREFLIGHT_ITEMS.length,
    session.intention.trim() !== '',
  ];
  const completionPct = Math.round(
    (completionItems.filter(Boolean).length / completionItems.length) * 100,
  );

  const activeMood = MOODS.find((m) => m.val === session.mood);

  const addBias = () => {
    const sym = newSymbol.trim().toUpperCase();
    if (!sym) return;
    setSession((s) => ({
      ...s,
      biases: [...s.biases, { id: uid(), symbol: sym, direction: 'neutral', thesis: '' }],
    }));
    setNewSymbol('');
    newSymbolRef.current?.focus();
  };

  const updateBias = (id: string, patch: Partial<BiasItem>) =>
    setSession((s) => ({
      ...s,
      biases: s.biases.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    }));

  const removeBias = (id: string) =>
    setSession((s) => ({ ...s, biases: s.biases.filter((b) => b.id !== id) }));

  const addSetup = () => {
    const text = newSetup.trim();
    if (!text) return;
    setSession((s) => ({ ...s, setups: [...s.setups, { id: uid(), text }] }));
    setNewSetup('');
    newSetupRef.current?.focus();
  };

  const removeSetup = (id: string) =>
    setSession((s) => ({ ...s, setups: s.setups.filter((x) => x.id !== id) }));

  const togglePreflight = (id: string) =>
    setSession((s) => ({
      ...s,
      preflight: { ...s.preflight, [id]: !s.preflight[id] },
    }));

  const lockSession = () => set('lockedAt', new Date().toISOString());
  const unlockSession = () => set('lockedAt', null);
  const resetSession = () => {
    setSession({ ...DEFAULT_SESSION });
    localStorage.removeItem(todayKey());
  };

  const biasBtn = (item: BiasItem, dir: BiasDir) => {
    const configs: Record<BiasDir, { label: string; color: string; bg: string; Icon: typeof TrendingUp }> = {
      bull:    { label: 'Bull',    color: '#00d68f', bg: 'rgba(0,214,143,.13)',  Icon: TrendingUp },
      neutral: { label: 'Neutral', color: 'var(--eb-muted-2)', bg: 'var(--eb-panel)', Icon: Minus },
      bear:    { label: 'Bear',    color: '#ff5b6c', bg: 'rgba(255,91,108,.13)', Icon: TrendingDown },
    };
    const c = configs[dir];
    const active = item.direction === dir;
    return (
      <button
        key={dir}
        type="button"
        disabled={isLocked}
        onClick={() => updateBias(item.id, { direction: dir })}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5,
          padding: '5px 11px', borderRadius: 7,
          border: active
            ? `1px solid color-mix(in srgb, ${c.color} 45%, transparent)`
            : '1px solid var(--eb-border)',
          background: active ? c.bg : 'transparent',
          color: active ? c.color : 'var(--eb-muted)',
          fontSize: 11.5, fontWeight: active ? 600 : 400,
          cursor: isLocked ? 'default' : 'pointer',
          fontFamily: 'inherit',
          transition: 'all .12s',
        }}
      >
        <c.Icon size={11} />
        {c.label}
      </button>
    );
  };

  const inputBase: React.CSSProperties = {
    background: 'var(--eb-panel-2)',
    border: '1px solid var(--eb-border)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--eb-text)',
    fontSize: 13,
    fontFamily: 'inherit',
    outline: 0,
  };

  const addBtn: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 5,
    padding: '8px 16px', borderRadius: 8,
    border: '1px solid var(--eb-border)',
    background: 'var(--eb-panel)',
    color: 'var(--eb-muted-2)', fontSize: 12, fontWeight: 500,
    cursor: 'pointer', fontFamily: 'inherit',
  };

  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column',
        minHeight: 'calc(100vh - 53px)',
        background: 'var(--eb-bg)',
      }}
    >
      <style>{`
        @keyframes eb-pulse { 0%,100%{opacity:1} 50%{opacity:.45} }
        @keyframes eb-slide-in { from{opacity:0;transform:translateY(-6px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── Locked banner ─────────────────────────────────────────────── */}
      {isLocked && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '9px 36px',
            background: 'color-mix(in srgb, #00d68f 6%, var(--eb-panel))',
            borderBottom: '1px solid color-mix(in srgb, #00d68f 18%, var(--eb-border))',
            animation: 'eb-slide-in .2s ease',
          }}
        >
          <div
            style={{
              width: 7, height: 7, borderRadius: '50%', background: '#00d68f',
              animation: 'eb-pulse 2s infinite', flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 12.5, fontWeight: 600, color: '#00d68f' }}>Session active</span>
          <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
            · Started {formatTime(session.lockedAt ?? '')} · {elapsedLabel(session.lockedAt ?? '')} elapsed
          </span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={unlockSession}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel-2)',
              color: 'var(--eb-muted-2)', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            <Unlock size={11} /> Edit
          </button>
          <button
            type="button"
            onClick={resetSession}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 7,
              border: '1px solid color-mix(in srgb, #ff5b6c 35%, transparent)',
              background: 'rgba(255,91,108,.07)',
              color: '#ff5b6c', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            End Session
          </button>
        </div>
      )}

      {/* ── Main scroll area ───────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px 140px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Page header */}
          <div
            style={{
              display: 'flex', alignItems: 'flex-start',
              justifyContent: 'space-between', flexWrap: 'wrap',
              gap: 14, marginBottom: 6,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '.1em',
                  textTransform: 'uppercase', color: 'var(--eb-muted)', marginBottom: 6,
                }}
              >
                {formatDate(new Date())}
              </div>
              <div
                style={{
                  fontSize: 22, fontWeight: 800, color: 'var(--eb-text)',
                  letterSpacing: '-.03em', lineHeight: 1,
                }}
              >
                Pre-Session Checklist
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 4 }}>
              {!isLocked && (
                <Chip color={completionPct === 100 ? '#00d68f' : 'var(--eb-muted)'}>
                  {completionPct}% ready
                </Chip>
              )}

              {/* Session type selector */}
              <div
                style={{
                  display: 'flex', gap: 1,
                  background: 'var(--eb-panel)',
                  border: '1px solid var(--eb-border)',
                  borderRadius: 10, padding: 3,
                }}
              >
                {SESSION_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => set('sessionType', t.id)}
                    style={{
                      padding: '4px 12px', borderRadius: 7,
                      fontSize: 12, fontWeight: 500,
                      border: 0, cursor: isLocked ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      background: session.sessionType === t.id
                        ? 'rgba(139,92,246,.18)'
                        : 'transparent',
                      color: session.sessionType === t.id ? '#c4b5fd' : 'var(--eb-muted)',
                      transition: 'all .12s',
                    }}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── 1. Mental State ─────────────────────────────────────────── */}
          <SectionCard
            icon={<Brain size={16} style={{ color: '#8b5cf6' }} />}
            iconColor="#8b5cf6"
            title="Mental State"
            subtitle="Honest self-assessment before you risk capital"
            accent="#8b5cf6"
          >
            <div style={{ display: 'flex', gap: 8 }}>
              {MOODS.map((m) => {
                const active = session.mood === m.val;
                return (
                  <button
                    key={m.val}
                    type="button"
                    disabled={isLocked}
                    onClick={() => set('mood', m.val)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                      padding: '14px 10px', borderRadius: 11, flex: 1,
                      border: active
                        ? `1px solid color-mix(in srgb, ${m.color} 40%, transparent)`
                        : '1px solid var(--eb-border)',
                      background: active
                        ? `color-mix(in srgb, ${m.color} 10%, var(--eb-panel-2))`
                        : 'var(--eb-panel-2)',
                      boxShadow: active
                        ? `0 0 0 3px color-mix(in srgb, ${m.color} 12%, transparent)`
                        : 'none',
                      cursor: isLocked ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .15s',
                    }}
                  >
                    <span style={{ fontSize: 26, lineHeight: 1 }}>{m.emoji}</span>
                    <span
                      style={{
                        fontSize: 11, fontWeight: active ? 700 : 400,
                        color: active ? m.color : 'var(--eb-muted)',
                      }}
                    >
                      {m.label}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeMood && activeMood.val <= 2 && !isLocked && (
              <div
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 8,
                  padding: '10px 13px', borderRadius: 9,
                  background: 'rgba(245,165,36,.07)',
                  border: '1px solid rgba(245,165,36,.22)',
                }}
              >
                <AlertTriangle size={13} style={{ color: '#f5a524', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12.5, color: '#f5a524', lineHeight: 1.5 }}>
                  You rated yourself <strong>{activeMood.label}</strong>. Consider reducing position size or sitting out high-risk setups today.
                </span>
              </div>
            )}

            <div>
              <FieldLabel>Optional note</FieldLabel>
              <TextArea
                value={session.moodNote}
                onChange={(v) => set('moodNote', v)}
                placeholder="What's on your mind before this session?"
                rows={2}
                disabled={isLocked}
              />
            </div>
          </SectionCard>

          {/* ── 2. Market Bias ──────────────────────────────────────────── */}
          <SectionCard
            icon={<Zap size={16} style={{ color: '#06b6d4' }} />}
            iconColor="#06b6d4"
            title="Market Bias"
            subtitle="Define your directional conviction before the session starts"
            accent="#06b6d4"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {session.biases.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '13px 14px', borderRadius: 10,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 12.5, fontWeight: 700, color: 'var(--eb-text)',
                        minWidth: 44, letterSpacing: '.04em',
                      }}
                    >
                      {item.symbol}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flex: 1 }}>
                      {(['bull', 'neutral', 'bear'] as BiasDir[]).map((dir) => biasBtn(item, dir))}
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeBias(item.id)}
                        style={{
                          background: 'none', border: 0, padding: 3,
                          cursor: 'pointer', color: 'var(--eb-muted)',
                          borderRadius: 4, display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <input
                    value={item.thesis}
                    onChange={(e) => updateBias(item.id, { thesis: e.target.value })}
                    placeholder={`${item.symbol} thesis — why do you hold this bias?`}
                    disabled={isLocked}
                    style={{
                      width: '100%', boxSizing: 'border-box',
                      background: isLocked ? 'transparent' : 'var(--eb-panel)',
                      border: `1px solid ${isLocked ? 'transparent' : 'var(--eb-border)'}`,
                      borderRadius: 8, padding: '7px 10px',
                      color: 'var(--eb-text)', fontSize: 12.5,
                      fontFamily: 'inherit', outline: 0,
                      opacity: isLocked ? 0.8 : 1,
                    }}
                  />
                </div>
              ))}
            </div>

            {!isLocked && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={newSymbolRef}
                  value={newSymbol}
                  onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && addBias()}
                  placeholder="Symbol (e.g. SOL)"
                  maxLength={10}
                  style={{ ...inputBase, flex: 1, textTransform: 'uppercase' }}
                />
                <button type="button" onClick={addBias} style={addBtn}>
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
          </SectionCard>

          {/* ── 3. Setups on Watch ──────────────────────────────────────── */}
          <SectionCard
            icon={<Target size={16} style={{ color: '#00d68f' }} />}
            iconColor="#00d68f"
            title="Setups on Watch"
            subtitle="Be specific — vague setups lead to impulsive entries"
            accent="#00d68f"
            badge={
              session.setups.length > 0
                ? <Chip color="#00d68f">{session.setups.length}</Chip>
                : undefined
            }
          >
            {session.setups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                {session.setups.map((setup, i) => (
                  <div
                    key={setup.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '9px 12px', borderRadius: 8,
                      background: 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700, color: '#00d68f',
                        background: 'rgba(0,214,143,.1)',
                        border: '1px solid rgba(0,214,143,.22)',
                        borderRadius: 4, padding: '1px 6px', flexShrink: 0,
                        fontVariantNumeric: 'tabular-nums',
                      }}
                    >
                      {i + 1}
                    </span>
                    <span style={{ flex: 1, fontSize: 13, color: 'var(--eb-text)', lineHeight: 1.5 }}>
                      {setup.text}
                    </span>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeSetup(setup.id)}
                        style={{
                          background: 'none', border: 0, padding: 3,
                          cursor: 'pointer', color: 'var(--eb-muted)',
                          borderRadius: 4, display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!isLocked && (
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={newSetupRef}
                  value={newSetup}
                  onChange={(e) => setNewSetup(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addSetup()}
                  placeholder="e.g. BTC retest of 68k support — long if holds on 15m close"
                  style={{ ...inputBase, flex: 1 }}
                />
                <button type="button" onClick={addSetup} style={addBtn}>
                  <Plus size={13} /> Add
                </button>
              </div>
            )}

            {session.setups.length === 0 && isLocked && (
              <p style={{ margin: 0, fontSize: 13, color: 'var(--eb-muted)', fontStyle: 'italic' }}>
                No setups were noted for this session.
              </p>
            )}
          </SectionCard>

          {/* ── 4. Risk Limits ──────────────────────────────────────────── */}
          <SectionCard
            icon={<BookOpen size={16} style={{ color: '#f5a524' }} />}
            iconColor="#f5a524"
            title="Today's Risk Limits"
            subtitle="Lock in your numbers before the session begins"
            accent="#f5a524"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
              {[
                { key: 'maxLoss'   as const, label: 'Max Daily Loss', placeholder: '500', suffix: 'USDT' },
                { key: 'maxTrades' as const, label: 'Max Trades',     placeholder: '5',   suffix: 'trades' },
                { key: 'riskPct'   as const, label: 'Risk Per Trade', placeholder: '1',   suffix: '%' },
              ].map(({ key, label, placeholder, suffix }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <FieldLabel>{label}</FieldLabel>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: isLocked ? 'transparent' : 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      borderRadius: 9, overflow: 'hidden',
                      opacity: isLocked ? 0.8 : 1,
                    }}
                  >
                    <input
                      type="number"
                      value={session[key]}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={placeholder}
                      disabled={isLocked}
                      style={{
                        flex: 1, background: 'transparent', border: 0, outline: 0,
                        padding: '9px 11px', color: 'var(--eb-text)',
                        fontSize: 14, fontWeight: 600, fontFamily: 'inherit',
                      }}
                    />
                    <span
                      style={{
                        padding: '0 10px', fontSize: 11, color: 'var(--eb-muted)',
                        borderLeft: '1px solid var(--eb-border)',
                        background: 'var(--eb-panel)',
                        height: '100%', display: 'flex', alignItems: 'center',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {suffix}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>

          {/* ── 5. Pre-flight Checks ────────────────────────────────────── */}
          <SectionCard
            icon={<CheckCircle2 size={16} style={{ color: '#00d68f' }} />}
            iconColor="#00d68f"
            title="Pre-flight Checks"
            subtitle={`${preflightDone} of ${PREFLIGHT_ITEMS.length} confirmed`}
            accent="#00d68f"
            badge={
              preflightDone === PREFLIGHT_ITEMS.length
                ? <Chip color="#00d68f">All clear</Chip>
                : undefined
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {PREFLIGHT_ITEMS.map((item) => {
                const checked = session.preflight[item.id] ?? false;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={isLocked}
                    onClick={() => togglePreflight(item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 12px', borderRadius: 9,
                      border: 'none',
                      background: checked ? 'rgba(0,214,143,.05)' : 'transparent',
                      cursor: isLocked ? 'default' : 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                      transition: 'background .12s',
                    }}
                  >
                    {/* Custom checkbox */}
                    <div
                      style={{
                        width: 18, height: 18, borderRadius: 5, flexShrink: 0,
                        border: checked ? '1.5px solid #00d68f' : '1.5px solid var(--eb-border)',
                        background: checked ? '#00d68f' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .12s',
                      }}
                    >
                      {checked && (
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none" aria-hidden="true">
                          <path
                            d="M1 4L3.5 6.5L9 1"
                            stroke="var(--eb-bg)"
                            strokeWidth="1.6"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 13,
                        color: checked ? 'var(--eb-text)' : 'var(--eb-muted-2)',
                        lineHeight: 1.4,
                      }}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ── 6. Macro Events ─────────────────────────────────────────── */}
          <SectionCard
            icon={<CalendarClock size={16} style={{ color: '#06b6d4' }} />}
            iconColor="#06b6d4"
            title="Macro Events"
            subtitle="CPI, FOMC, earnings, open interest flips — anything that moves the tape"
            accent="#06b6d4"
          >
            <TextArea
              value={session.events}
              onChange={(v) => set('events', v)}
              placeholder="e.g. CPI at 8:30am EST (exp. 3.1%) · Fed speaker at 1pm · BTC options expiry Friday"
              rows={3}
              disabled={isLocked}
            />
          </SectionCard>

          {/* ── 7. Session Intention ────────────────────────────────────── */}
          <SectionCard
            icon={<BookOpen size={16} style={{ color: '#8b5cf6' }} />}
            iconColor="#8b5cf6"
            title="Session Intention"
            subtitle="One clear sentence about what you're here to do and how you'll do it"
            accent="#8b5cf6"
          >
            <TextArea
              value={session.intention}
              onChange={(v) => set('intention', v)}
              placeholder="e.g. I will only take A+ setups that match my playbook criteria, respect my 1% risk per trade, and stop trading if I hit my daily max loss."
              rows={3}
              disabled={isLocked}
            />
            {session.intention.trim() && (
              <div
                style={{
                  padding: '13px 16px', borderRadius: 10,
                  background: 'rgba(139,92,246,.07)',
                  border: '1px solid rgba(139,92,246,.18)',
                  fontSize: 13, color: '#c4b5fd', lineHeight: 1.65,
                  fontStyle: 'italic',
                }}
              >
                "{session.intention.trim()}"
              </div>
            )}
          </SectionCard>

        </div>
      </div>

      {/* ── Sticky CTA ─────────────────────────────────────────────────── */}
      {!isLocked && (
        <div
          style={{
            position: 'sticky', bottom: 0,
            borderTop: '1px solid var(--eb-border)',
            background: 'color-mix(in srgb, var(--eb-panel) 88%, transparent)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            padding: '14px 40px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}
        >
          {/* Progress bar */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div
              style={{
                flex: 1, height: 5, borderRadius: 99,
                background: 'var(--eb-panel-2)',
                border: '1px solid var(--eb-border)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%', borderRadius: 99,
                  width: `${completionPct}%`,
                  background: completionPct === 100
                    ? '#00d68f'
                    : 'linear-gradient(90deg, #8b5cf6 0%, #06b6d4 100%)',
                  transition: 'width .35s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </div>
            <span
              style={{
                fontSize: 12, color: 'var(--eb-muted)',
                flexShrink: 0, fontVariantNumeric: 'tabular-nums',
              }}
            >
              {completionPct}%
            </span>
          </div>

          <button
            type="button"
            onClick={lockSession}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 26px', borderRadius: 10,
              border: '1px solid #00b67a',
              background: 'linear-gradient(160deg, #00d68f 0%, #00b67a 100%)',
              color: '#052e17', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 16px rgba(0,214,143,.28)',
              letterSpacing: '-.01em',
            }}
          >
            <Lock size={13} /> Lock in & Start Session
          </button>
        </div>
      )}
    </div>
  );
}
