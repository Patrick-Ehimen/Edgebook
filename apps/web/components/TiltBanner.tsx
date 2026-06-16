'use client';

import { useTilt } from '@/providers/tilt-provider';
import { AlertTriangle, ShieldOff, X } from 'lucide-react';
import { useEffect, useState } from 'react';

export function TiltBanner() {
  const { globalEvents } = useTilt();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Reset dismissals for events that are no longer firing
  useEffect(() => {
    const activeIds = new Set(globalEvents.map((e) => e.ruleId));
    setDismissed((prev) => {
      const next = new Set([...prev].filter((id) => activeIds.has(id)));
      return next.size === prev.size ? prev : next;
    });
  }, [globalEvents]);

  const visible = globalEvents.filter((e) => !dismissed.has(e.ruleId));
  if (visible.length === 0) return null;

  return (
    <div>
      {visible.map((event) => {
        const isHard = event.level === 'hard';
        const accentColor = isHard ? 'var(--eb-red)' : 'var(--eb-yellow)';
        const accentAlpha = isHard ? 'rgba(255,91,108' : 'rgba(245,165,36';

        return (
          <div
            key={event.ruleId}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: '8px 22px',
              background: `${accentAlpha},.07)`,
              borderBottom: `1px solid ${accentAlpha},.22)`,
              fontSize: 12.5,
            }}
          >
            {isHard ? (
              <ShieldOff size={13} style={{ color: accentColor, flexShrink: 0 }} />
            ) : (
              <AlertTriangle size={13} style={{ color: accentColor, flexShrink: 0 }} />
            )}
            <span
              style={{
                fontWeight: 600,
                color: accentColor,
                flexShrink: 0,
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '.06em',
              }}
            >
              {isHard ? 'Hard pause' : 'Soft alert'}
            </span>
            <span style={{ color: 'var(--eb-muted-2)' }}>
              <strong style={{ color: 'var(--eb-text)', fontWeight: 600 }}>
                {event.ruleLabel}
              </strong>
              {' — '}
              {event.detail}
            </span>
            {!isHard && (
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => setDismissed((prev) => new Set([...prev, event.ruleId]))}
                style={{
                  marginLeft: 'auto',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 4,
                  color: 'var(--eb-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  borderRadius: 4,
                  flexShrink: 0,
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
