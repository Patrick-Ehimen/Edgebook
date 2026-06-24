'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Brain,
  CalendarClock,
  CheckCircle2,
  CheckSquare,
  Circle,
  Clock,
  ListChecks,
  Lock,
  Minus,
  Plus,
  Square,
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
  events: string;
  intention: string;
  lockedAt: string | null;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSION_TYPES: { id: SessionType; label: string }[] = [
  { id: 'morning', label: 'Morning' },
  { id: 'afternoon', label: 'Afternoon' },
  { id: 'evening', label: 'Evening' },
  { id: 'overnight', label: 'Overnight' },
];

const MOODS: { val: 1 | 2 | 3 | 4 | 5; emoji: string; label: string; color: string }[] = [
  { val: 1, emoji: '😰', label: 'Anxious', color: '#ff5b6c' },
  { val: 2, emoji: '😕', label: 'Off', color: '#f5a524' },
  { val: 3, emoji: '😐', label: 'Neutral', color: 'var(--eb-muted-2)' },
  { val: 4, emoji: '🙂', label: 'Good', color: '#06b6d4' },
  { val: 5, emoji: '🔥', label: 'Sharp', color: '#00d68f' },
];

const PREFLIGHT_ITEMS: { id: string; label: string }[] = [
  { id: 'sleep',       label: 'Rested — at least 6 hours of sleep' },
  { id: 'fomo',        label: 'Not trading out of boredom, revenge, or FOMO' },
  { id: 'risk',        label: 'Risk limits reviewed and set for today' },
  { id: 'calendar',    label: 'Economic calendar checked for events' },
  { id: 'invalidation', label: 'Know my invalidation level for each planned setup' },
  { id: 'stops',       label: 'Will respect stop losses — no moving them wider' },
  { id: 'screen',      label: 'Charts and workspace are set up and ready' },
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
}: {
  icon: React.ReactNode;
  iconColor: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  accent?: string;
}) {
  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderTop: accent ? `3px solid ${accent}` : '1px solid var(--eb-border)',
        borderRadius: 12,
        padding: '20px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        <div
          style={{
            width: 36, height: 36, borderRadius: 9, flexShrink: 0,
            background: `color-mix(in srgb, ${iconColor} 15%, transparent)`,
            border: `1px solid color-mix(in srgb, ${iconColor} 30%, transparent)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--eb-text)', letterSpacing: '-.01em' }}>
            {title}
          </div>
          {subtitle && (
            <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 2 }}>{subtitle}</div>
          )}
        </div>
      </div>
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
        border: '1px solid var(--eb-border)',
        borderRadius: 8,
        padding: '10px 12px',
        color: 'var(--eb-text)',
        fontSize: 13,
        fontFamily: 'inherit',
        lineHeight: 1.6,
        resize: 'vertical',
        outline: 0,
        boxSizing: 'border-box',
        opacity: disabled ? 0.7 : 1,
      }}
    />
  );
}

function InlineInput({
  value,
  onChange,
  placeholder,
  disabled,
  style,
}: {
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  disabled?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        background: disabled ? 'transparent' : 'var(--eb-panel-2)',
        border: '1px solid var(--eb-border)',
        borderRadius: 7,
        padding: '7px 10px',
        color: 'var(--eb-text)',
        fontSize: 13,
        fontFamily: 'inherit',
        outline: 0,
        opacity: disabled ? 0.7 : 1,
        ...style,
      }}
    />
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

  // Load from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(todayKey());
    if (saved) {
      try { setSession(JSON.parse(saved)); } catch { /* ignore */ }
    }
  }, []);

  // Persist on change
  useEffect(() => {
    localStorage.setItem(todayKey(), JSON.stringify(session));
  }, [session]);

  // Live timer tick when session locked
  useEffect(() => {
    if (!session.lockedAt) return;
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, [session.lockedAt]);

  const set = <K extends keyof SessionData>(key: K, val: SessionData[K]) =>
    setSession((s) => ({ ...s, [key]: val }));

  const isLocked = !!session.lockedAt;

  // Completion score
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

  // ── Bias helpers ──
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

  // ── Setup helpers ──
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
    const fresh = { ...DEFAULT_SESSION };
    setSession(fresh);
    localStorage.removeItem(todayKey());
  };

  const biasBtn = (item: BiasItem, dir: BiasDir) => {
    const configs: Record<BiasDir, { label: string; color: string; bg: string; Icon: typeof TrendingUp }> = {
      bull:    { label: 'Bull',    color: '#00d68f', bg: 'rgba(0,214,143,.15)',   Icon: TrendingUp },
      neutral: { label: 'Neutral', color: 'var(--eb-muted-2)', bg: 'var(--eb-panel-2)', Icon: Minus },
      bear:    { label: 'Bear',    color: '#ff5b6c', bg: 'rgba(255,91,108,.15)',  Icon: TrendingDown },
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
          padding: '5px 10px', borderRadius: 6,
          border: active ? `1px solid color-mix(in srgb, ${c.color} 50%, transparent)` : '1px solid var(--eb-border)',
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 53px)', background: 'var(--eb-bg, var(--eb-panel-2))' }}>
      <style>{`@keyframes eb-pulse { 0%,100%{opacity:1} 50%{opacity:.5} }`}</style>

      {/* ── Locked banner ──────────────────────────────────────────────── */}
      {isLocked && (
        <div
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 32px',
            background: 'rgba(0,214,143,.08)',
            borderBottom: '1px solid rgba(0,214,143,.2)',
          }}
        >
          <div
            style={{
              width: 8, height: 8, borderRadius: '50%',
              background: '#00d68f',
              animation: 'eb-pulse 2s infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 13, fontWeight: 600, color: '#00d68f' }}>
            Session active
          </span>
          <span style={{ fontSize: 12, color: 'var(--eb-muted)' }}>
            Started at {formatTime(session.lockedAt!)} · {elapsedLabel(session.lockedAt!)} elapsed
          </span>
          <div style={{ flex: 1 }} />
          <button
            type="button"
            onClick={unlockSession}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '5px 12px', borderRadius: 7,
              border: '1px solid var(--eb-border)',
              background: 'var(--eb-panel)',
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
              padding: '5px 12px', borderRadius: 7,
              border: '1px solid rgba(255,91,108,.35)',
              background: 'rgba(255,91,108,.08)',
              color: '#ff5b6c', fontSize: 12, fontWeight: 500,
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            End Session
          </button>
        </div>
      )}

      {/* ── Main scroll area ────────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '28px 36px 120px' }}>
        <div style={{ maxWidth: 780, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Page header */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 9,
                    background: 'rgba(139,92,246,.15)',
                    border: '1px solid rgba(139,92,246,.3)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <ListChecks size={18} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--eb-text)', letterSpacing: '-.02em' }}>
                    Pre-Session Checklist
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--eb-muted)', marginTop: 1 }}>
                    {formatDate(new Date())}
                  </div>
                </div>
              </div>
            </div>

            {/* Session type tabs */}
            <div
              style={{
                display: 'flex', gap: 2,
                background: 'var(--eb-panel)',
                border: '1px solid var(--eb-border)',
                borderRadius: 9, padding: 3,
              }}
            >
              {SESSION_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  disabled={isLocked}
                  onClick={() => set('sessionType', t.id)}
                  style={{
                    padding: '5px 14px', borderRadius: 6, fontSize: 12, fontWeight: 500,
                    border: 0, cursor: isLocked ? 'default' : 'pointer', fontFamily: 'inherit',
                    background: session.sessionType === t.id ? 'rgba(139,92,246,.2)' : 'transparent',
                    color: session.sessionType === t.id ? '#c4b5fd' : 'var(--eb-muted)',
                    transition: 'all .12s',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* ── Section 1: Mood ──────────────────────────────────────────── */}
          <SectionCard
            icon={<Brain size={17} style={{ color: '#8b5cf6' }} />}
            iconColor="#8b5cf6"
            title="How are you feeling today?"
            subtitle="Honest self-assessment before you risk capital"
            accent="#8b5cf6"
          >
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {MOODS.map((m) => {
                const active = session.mood === m.val;
                return (
                  <button
                    key={m.val}
                    type="button"
                    disabled={isLocked}
                    onClick={() => set('mood', m.val)}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                      padding: '12px 18px', borderRadius: 10, flex: 1, minWidth: 80,
                      border: active
                        ? `1px solid color-mix(in srgb, ${m.color} 50%, transparent)`
                        : '1px solid var(--eb-border)',
                      background: active
                        ? `color-mix(in srgb, ${m.color} 12%, transparent)`
                        : 'var(--eb-panel-2)',
                      cursor: isLocked ? 'default' : 'pointer',
                      fontFamily: 'inherit',
                      transition: 'all .12s',
                    }}
                  >
                    <span style={{ fontSize: 24, lineHeight: 1 }}>{m.emoji}</span>
                    <span
                      style={{
                        fontSize: 11.5, fontWeight: active ? 700 : 400,
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
                  padding: '10px 14px', borderRadius: 8,
                  background: 'rgba(245,165,36,.08)',
                  border: '1px solid rgba(245,165,36,.25)',
                }}
              >
                <AlertTriangle size={14} style={{ color: '#f5a524', flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 12.5, color: '#f5a524', lineHeight: 1.5 }}>
                  You rated yourself <strong>{activeMood.label}</strong>. Consider reducing position size or sitting out high-risk setups today.
                </span>
              </div>
            )}

            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--eb-muted)', marginBottom: 6 }}>
                Optional note
              </div>
              <TextArea
                value={session.moodNote}
                onChange={(v) => set('moodNote', v)}
                placeholder="What's on your mind before this session?"
                rows={2}
                disabled={isLocked}
              />
            </div>
          </SectionCard>

          {/* ── Section 2: Market Bias ───────────────────────────────────── */}
          <SectionCard
            icon={<Zap size={17} style={{ color: '#06b6d4' }} />}
            iconColor="#06b6d4"
            title="Market Bias"
            subtitle="Define your directional conviction before the session starts"
            accent="#06b6d4"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {session.biases.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '14px 16px', borderRadius: 10,
                    background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        fontSize: 13, fontWeight: 700, color: 'var(--eb-text)',
                        minWidth: 48, letterSpacing: '.03em',
                      }}
                    >
                      {item.symbol}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flex: 1, flexWrap: 'wrap' }}>
                      {(['bull', 'neutral', 'bear'] as BiasDir[]).map((dir) => biasBtn(item, dir))}
                    </div>
                    {!isLocked && (
                      <button
                        type="button"
                        onClick={() => removeBias(item.id)}
                        style={{
                          background: 'none', border: 0, padding: '2px 4px',
                          cursor: 'pointer', color: 'var(--eb-muted)', lineHeight: 1,
                          borderRadius: 4, display: 'flex', alignItems: 'center',
                        }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                  <InlineInput
                    value={item.thesis}
                    onChange={(v) => updateBias(item.id, { thesis: v })}
                    placeholder={`${item.symbol} thesis — why do you hold this bias?`}
                    disabled={isLocked}
                    style={{ width: '100%', boxSizing: 'border-box' }}
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
                  placeholder="Add symbol (e.g. SOL)"
                  maxLength={10}
                  style={{
                    flex: 1, background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)', borderRadius: 7,
                    padding: '7px 10px', color: 'var(--eb-text)',
                    fontSize: 13, fontFamily: 'inherit', outline: 0,
                    textTransform: 'uppercase',
                  }}
                />
                <button
                  type="button"
                  onClick={addBias}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 7,
                    border: '1px solid var(--eb-border)',
                    background: 'var(--eb-panel)',
                    color: 'var(--eb-muted-2)', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  <Plus size={13} /> Add
                </button>
              </div>
            )}
          </SectionCard>

          {/* ── Section 3: Setups on Watch ───────────────────────────────── */}
          <SectionCard
            icon={<Target size={17} style={{ color: '#00d68f' }} />}
            iconColor="#00d68f"
            title="Setups on Watch"
            subtitle="What are you actually watching today? Be specific."
            accent="#00d68f"
          >
            {session.setups.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                        background: 'rgba(0,214,143,.12)',
                        border: '1px solid rgba(0,214,143,.25)',
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
                          background: 'none', border: 0, padding: '2px 4px',
                          cursor: 'pointer', color: 'var(--eb-muted)', lineHeight: 1,
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
                  style={{
                    flex: 1, background: 'var(--eb-panel-2)',
                    border: '1px solid var(--eb-border)', borderRadius: 7,
                    padding: '7px 10px', color: 'var(--eb-text)',
                    fontSize: 13, fontFamily: 'inherit', outline: 0,
                  }}
                />
                <button
                  type="button"
                  onClick={addSetup}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '7px 14px', borderRadius: 7,
                    border: '1px solid var(--eb-border)',
                    background: 'var(--eb-panel)',
                    color: 'var(--eb-muted-2)', fontSize: 12, fontWeight: 500,
                    cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
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

          {/* ── Section 4: Risk Parameters ───────────────────────────────── */}
          <SectionCard
            icon={<BookOpen size={17} style={{ color: '#f5a524' }} />}
            iconColor="#f5a524"
            title="Today's Risk Limits"
            subtitle="Lock in your numbers before the market opens"
            accent="#f5a524"
          >
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { key: 'maxLoss' as const, label: 'Max Daily Loss', placeholder: '500', suffix: 'USDT' },
                { key: 'maxTrades' as const, label: 'Max Trades', placeholder: '5', suffix: 'trades' },
                { key: 'riskPct' as const, label: 'Risk Per Trade', placeholder: '1', suffix: '%' },
              ].map(({ key, label, placeholder, suffix }) => (
                <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: '.08em', textTransform: 'uppercase', color: 'var(--eb-muted)' }}>
                    {label}
                  </div>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center',
                      background: isLocked ? 'transparent' : 'var(--eb-panel-2)',
                      border: '1px solid var(--eb-border)',
                      borderRadius: 8, overflow: 'hidden',
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
                        padding: '8px 10px', color: 'var(--eb-text)',
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

          {/* ── Section 5: Pre-flight Checks ─────────────────────────────── */}
          <SectionCard
            icon={<CheckCircle2 size={17} style={{ color: '#00d68f' }} />}
            iconColor="#00d68f"
            title="Pre-flight Checks"
            subtitle={`${preflightDone} of ${PREFLIGHT_ITEMS.length} confirmed`}
            accent="#00d68f"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
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
                      padding: '10px 14px', borderRadius: 8,
                      border: checked
                        ? '1px solid rgba(0,214,143,.25)'
                        : '1px solid var(--eb-border)',
                      background: checked ? 'rgba(0,214,143,.06)' : 'transparent',
                      cursor: isLocked ? 'default' : 'pointer',
                      textAlign: 'left', fontFamily: 'inherit',
                      transition: 'all .12s',
                    }}
                  >
                    {checked
                      ? <CheckCircle2 size={16} style={{ color: '#00d68f', flexShrink: 0 }} />
                      : <Circle size={16} style={{ color: 'var(--eb-muted)', flexShrink: 0 }} />
                    }
                    <span style={{ fontSize: 13, color: checked ? 'var(--eb-text)' : 'var(--eb-muted-2)', lineHeight: 1.4 }}>
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </SectionCard>

          {/* ── Section 6: Macro Events ───────────────────────────────────── */}
          <SectionCard
            icon={<CalendarClock size={17} style={{ color: '#06b6d4' }} />}
            iconColor="#06b6d4"
            title="Macro Events Today"
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

          {/* ── Section 7: Session Intention ─────────────────────────────── */}
          <SectionCard
            icon={<BookOpen size={17} style={{ color: '#8b5cf6' }} />}
            iconColor="#8b5cf6"
            title="Session Intention"
            subtitle="One clear sentence about what you're here to do — and how you'll do it"
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
                  padding: '12px 16px', borderRadius: 8,
                  background: 'rgba(139,92,246,.08)',
                  border: '1px solid rgba(139,92,246,.2)',
                  fontSize: 13, color: '#c4b5fd', lineHeight: 1.6,
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
            background: 'var(--eb-panel)',
            padding: '14px 36px',
            display: 'flex', alignItems: 'center', gap: 20,
          }}
        >
          {/* Progress */}
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
                    ? 'var(--green)'
                    : 'linear-gradient(90deg,#8b5cf6,#06b6d4)',
                  transition: 'width .3s ease',
                }}
              />
            </div>
            <span style={{ fontSize: 12, color: 'var(--eb-muted)', flexShrink: 0 }}>
              {completionPct}% complete
            </span>
          </div>

          <button
            type="button"
            onClick={lockSession}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '10px 24px', borderRadius: 9,
              border: '1px solid #00b67a',
              background: 'linear-gradient(180deg,#00d68f,#00b67a)',
              color: '#06140f', fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
              boxShadow: '0 2px 12px rgba(0,214,143,.25)',
            }}
          >
            <Lock size={14} /> Lock in & Start Session
          </button>
        </div>
      )}
    </div>
  );
}
