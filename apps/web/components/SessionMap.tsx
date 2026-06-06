'use client';

import { useEffect, useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SessionMapEvent {
  label: string;
  utcHour: number;
  utcMinute?: number;
  impact?: 'high' | 'medium' | 'low';
}

export interface NoTradeWindow {
  startUtcHour: number;
  startUtcMinute?: number;
  endUtcHour: number;
  endUtcMinute?: number;
  label?: string;
}

export interface SessionMapProps {
  events?: SessionMapEvent[];
  noTradeWindows?: NoTradeWindow[];
  /** Reduce bar height for compact embedding */
  compact?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const SESSIONS = [
  {
    id: 'asia',
    label: 'Asia',
    flag: '🌏',
    startHour: 0,
    endHour: 8,
    color: '#a78bfa',
    colorGlow: 'rgba(167,139,250,.32)',
    colorDim: 'rgba(167,139,250,.10)',
    gradientDim: 'linear-gradient(180deg,rgba(139,92,246,.13) 0%,rgba(109,40,217,.03) 100%)',
    gradientActive: 'linear-gradient(180deg,rgba(167,139,250,.28) 0%,rgba(139,92,246,.10) 100%)',
    borderDim: 'rgba(167,139,250,.16)',
    borderActive: 'rgba(167,139,250,.48)',
    insetGlow: 'rgba(167,139,250,.22)',
  },
  {
    id: 'eu',
    label: 'EU',
    flag: '🌍',
    startHour: 8,
    endHour: 16,
    color: '#fbbf24',
    colorGlow: 'rgba(251,191,36,.32)',
    colorDim: 'rgba(251,191,36,.10)',
    gradientDim: 'linear-gradient(180deg,rgba(245,158,11,.13) 0%,rgba(217,119,6,.03) 100%)',
    gradientActive: 'linear-gradient(180deg,rgba(251,191,36,.26) 0%,rgba(245,158,11,.09) 100%)',
    borderDim: 'rgba(251,191,36,.16)',
    borderActive: 'rgba(251,191,36,.48)',
    insetGlow: 'rgba(251,191,36,.20)',
  },
  {
    id: 'us',
    label: 'US',
    flag: '🌎',
    startHour: 16,
    endHour: 24,
    color: '#34d399',
    colorGlow: 'rgba(52,211,153,.32)',
    colorDim: 'rgba(52,211,153,.10)',
    gradientDim: 'linear-gradient(180deg,rgba(16,185,129,.13) 0%,rgba(5,150,105,.03) 100%)',
    gradientActive: 'linear-gradient(180deg,rgba(52,211,153,.26) 0%,rgba(16,185,129,.09) 100%)',
    borderDim: 'rgba(52,211,153,.16)',
    borderActive: 'rgba(52,211,153,.48)',
    insetGlow: 'rgba(52,211,153,.20)',
  },
] as const;

const HOUR_MARKS = [0, 4, 8, 12, 16, 20, 24] as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function minutesOfDay(h: number, m = 0) {
  return h * 60 + m;
}

function pct(minutes: number) {
  return `${((minutes / 1440) * 100).toFixed(3)}%`;
}

function getActiveSession(utcHour: number) {
  if (utcHour < 8) return SESSIONS[0];
  if (utcHour < 16) return SESSIONS[1];
  return SESSIONS[2];
}

function fmtUtc(h: number, m: number) {
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function getNextSession(utcHour: number, utcMinute: number) {
  const activeIdx = utcHour < 8 ? 0 : utcHour < 16 ? 1 : 2;
  const next = SESSIONS[(activeIdx + 1) % SESSIONS.length] ?? SESSIONS[0];
  const nowMins = utcHour * 60 + utcMinute;
  const opensMins = next.startHour * 60;
  const minsUntil = opensMins > nowMins ? opensMins - nowMins : 1440 - nowMins + opensMins;
  const h = Math.floor(minsUntil / 60);
  const m = minsUntil % 60;
  const countdown = h > 0 ? `${h}h ${m}m` : `${m}m`;
  const opensAt = `${String(next.startHour === 24 ? 0 : next.startHour).padStart(2, '0')}:00`;
  return { next, opensAt, countdown };
}

function NextSessionChip({ utcH, utcM }: { utcH: number; utcM: number }) {
  const { next, opensAt, countdown } = getNextSession(utcH, utcM);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 12,
        padding: '3px 11px',
        borderRadius: 99,
        border: `1px solid ${next.borderDim}`,
        background: 'transparent',
        color: 'var(--eb-muted-2)',
      }}
    >
      <span style={{ color: next.color, fontWeight: 700 }}>
        {next.flag} {next.label}
      </span>
      <span style={{ opacity: 0.45 }}>·</span>
      <span style={{ fontFamily: 'var(--font-mono, monospace)', fontSize: 12.5, fontWeight: 600, color: 'var(--eb-text)' }}>
        {opensAt} UTC
      </span>
      <span style={{ opacity: 0.45 }}>·</span>
      <span style={{ fontSize: 11.5, color: 'var(--eb-muted)' }}>in {countdown}</span>
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function SessionMap({ events = [], noTradeWindows = [], compact = false }: SessionMapProps) {
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(id);
  }, []);

  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const nowMinutes = minutesOfDay(utcH, utcM);
  const nowPct = pct(nowMinutes);
  const activeSess = getActiveSession(utcH);
  const barHeight = compact ? 62 : 80;

  return (
    <div
      style={{
        background: 'var(--eb-panel)',
        border: '1px solid var(--eb-border)',
        borderRadius: 14,
        padding: compact ? '14px 16px 12px' : '16px 20px 14px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent top-edge glow tied to active session */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: 'linear-gradient(90deg,transparent 0%,#34d399 50%,transparent 100%)',
          opacity: 0.6,
          pointerEvents: 'none',
        }}
      />

      {/* Header ──────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 14,
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        {/* Left: label + live UTC clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--eb-muted)',
              letterSpacing: '.07em',
              textTransform: 'uppercase',
            }}
          >
            Session map
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--eb-text)',
              fontFamily: 'var(--font-mono, monospace)',
              background: 'var(--eb-panel-2)',
              border: '1px solid var(--eb-border)',
              borderRadius: 5,
              padding: '2px 8px',
              letterSpacing: '.03em',
            }}
          >
            {fmtUtc(utcH, utcM)} UTC
          </span>
        </div>

        {/* Right: active chip + next session */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {/* Active session */}
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 600,
              padding: '3px 11px',
              borderRadius: 99,
              border: `1px solid ${activeSess.borderActive}`,
              background: activeSess.colorDim,
              color: activeSess.color,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: activeSess.color,
                boxShadow: `0 0 0 2.5px ${activeSess.colorGlow}`,
                display: 'inline-block',
                animation: 'pulse 1.6s infinite',
                flexShrink: 0,
              }}
            />
            {activeSess.flag} {activeSess.label} active
          </span>

          {/* Separator */}
          <span style={{ fontSize: 11, color: 'var(--eb-muted)', opacity: 0.4 }}>→</span>

          {/* Next session */}
          <NextSessionChip utcH={utcH} utcM={utcM} />
        </div>
      </div>

      {/* Bar wrapper — paddingTop gives space for diamond head ── */}
      <div style={{ position: 'relative', paddingTop: 8, marginBottom: 10 }}>

        {/* Bar */}
        <div
          style={{
            position: 'relative',
            height: barHeight,
            borderRadius: 10,
            overflow: 'hidden',
            border: '1px solid var(--eb-border)',
            background: 'var(--eb-panel-2)',
          }}
        >
          {/* Session blocks */}
          {SESSIONS.map((s, i) => {
            const isActive = s.id === activeSess.id;
            const isLast = i === SESSIONS.length - 1;
            return (
              <div
                key={s.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(minutesOfDay(s.startHour)),
                  width: pct(minutesOfDay(s.endHour) - minutesOfDay(s.startHour)),
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  fontWeight: 700,
                  letterSpacing: '.05em',
                  textTransform: 'uppercase',
                  borderRight: isLast ? 'none' : `1px solid ${isActive ? s.borderActive : 'var(--eb-border)'}`,
                  background: isActive ? s.gradientActive : s.gradientDim,
                  boxShadow: isActive ? `inset 0 1px 0 ${s.insetGlow}` : undefined,
                  transition: 'background .3s',
                }}
              >
                {/* Session name — inherits session colour when active */}
                <span style={{ fontSize: 13, color: isActive ? s.color : 'var(--eb-text)' }}>
                  {s.flag}&nbsp;{s.label}
                </span>
                {/* Time range — always uses text var so amber/gold stays readable in light mode */}
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono, monospace)',
                    color: 'var(--eb-text)',
                    opacity: isActive ? 0.75 : 0.60,
                    letterSpacing: '.03em',
                  }}
                >
                  {String(s.startHour).padStart(2, '0')}:00–{s.endHour === 24 ? '00:00' : `${String(s.endHour).padStart(2, '0')}:00`}
                </span>
              </div>
            );
          })}

          {/* Hour tick lines */}
          {[4, 8, 12, 16, 20].map((h) => (
            <div
              key={h}
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: pct(minutesOfDay(h)),
                width: 1,
                background: 'var(--eb-border)',
                opacity: 0.4,
                pointerEvents: 'none',
              }}
            />
          ))}

          {/* No-trade windows */}
          {noTradeWindows.map((w) => {
            const startMin = minutesOfDay(w.startUtcHour, w.startUtcMinute ?? 0);
            const endMin = minutesOfDay(w.endUtcHour, w.endUtcMinute ?? 0);
            return (
              <div
                key={`ntw-${w.startUtcHour}-${w.startUtcMinute ?? 0}-${w.endUtcHour}`}
                title={w.label ?? 'No-trade window'}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(startMin),
                  width: pct(endMin - startMin),
                  background:
                    'repeating-linear-gradient(45deg,rgba(255,91,108,.14),rgba(255,91,108,.14) 4px,transparent 4px,transparent 8px)',
                  borderLeft: '2px solid rgba(255,91,108,.45)',
                  borderRight: '2px solid rgba(255,91,108,.45)',
                  zIndex: 2,
                }}
              />
            );
          })}

          {/* Event markers */}
          {events.map((ev) => {
            const evMin = minutesOfDay(ev.utcHour, ev.utcMinute ?? 0);
            const isHigh = ev.impact === 'high';
            const isMed = ev.impact === 'medium';
            const markerColor = isHigh ? '#ff5b6c' : isMed ? '#fbbf24' : 'rgba(255,255,255,.38)';
            return (
              <div
                key={`ev-${ev.utcHour}-${ev.utcMinute ?? 0}-${ev.label}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  bottom: 0,
                  left: pct(evMin),
                  width: 2,
                  background: markerColor,
                  boxShadow: isHigh ? '0 0 8px rgba(255,91,108,.55)' : undefined,
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 6,
                    left: 6,
                    fontSize: 10,
                    color: markerColor,
                    background: 'rgba(8,10,16,.92)',
                    border: `1px solid ${isHigh ? 'rgba(255,91,108,.4)' : 'rgba(255,255,255,.10)'}`,
                    borderRadius: 5,
                    padding: '2px 6px',
                    whiteSpace: 'nowrap',
                    fontFamily: 'var(--font-mono, monospace)',
                    fontWeight: 600,
                    pointerEvents: 'none',
                    boxShadow: '0 2px 8px rgba(0,0,0,.5)',
                  }}
                >
                  {ev.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* NOW line — lives on the wrapper so it extends above the bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: nowPct,
            width: 2,
            background: `linear-gradient(180deg,${activeSess.color} 0%,${activeSess.color}88 100%)`,
            boxShadow: `0 0 10px 2px ${activeSess.colorGlow}`,
            zIndex: 10,
            borderRadius: 1,
            pointerEvents: 'none',
          }}
        >
          {/* Diamond head in the padding area above the bar */}
          <div
            style={{
              position: 'absolute',
              top: 2,
              left: '50%',
              transform: 'translateX(-50%) rotate(45deg)',
              width: 8,
              height: 8,
              background: activeSess.color,
              boxShadow: `0 0 8px 2px ${activeSess.colorGlow}`,
              borderRadius: 1,
            }}
          />
        </div>
      </div>

      {/* Hour labels ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11.5,
          color: 'var(--eb-muted)',
          fontFamily: 'var(--font-mono, monospace)',
        }}
      >
        {HOUR_MARKS.map((h) => {
          const isNow = h === utcH || (h === utcH + 1 && utcM > 30);
          return (
            <span
              key={h}
              style={{
                color: isNow ? activeSess.color : undefined,
                fontWeight: isNow ? 700 : undefined,
                fontSize: isNow ? 12 : undefined,
              }}
            >
              {isNow && h !== 0 && h !== 24
                ? `${fmtUtc(utcH, utcM)} ▴`
                : h === 24
                  ? '24'
                  : String(h).padStart(2, '0')}
            </span>
          );
        })}
      </div>
    </div>
  );
}
