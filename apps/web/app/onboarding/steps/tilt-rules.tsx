'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const INITIAL_RULES = [
  {
    id: 'cooldown',
    title: 'Cooldown after consecutive losses',
    description: 'Forced 30-minute read-only mode after N consecutive losing trades.',
    enabled: true,
    params: { losses: 3, window: 30, level: 'hard pause' },
  },
  {
    id: 'revenge',
    title: 'Block revenge re-entry',
    description: 'Block new positions opened within X seconds of a stop-out on the same symbol.',
    enabled: true,
    params: { window: 60, level: 'hard pause' },
  },
  {
    id: 'oversize',
    title: 'Confirm dialog on oversize entry',
    description:
      'If position size exceeds N× your 30-trade rolling average, require explicit confirmation.',
    enabled: true,
    params: { multiple: 2.0, level: 'soft' },
  },
  {
    id: 'news',
    title: 'News window',
    description:
      'Flag trades opened ±15 minutes around scheduled high-impact news (CPI, FOMC, NFP).',
    enabled: false,
    params: { source: 'ForexFactory feed', level: 'soft' },
  },
  {
    id: 'maxloss',
    title: 'Daily max loss',
    description: 'Halt trading for the day after a max-loss is hit. Most prop firms require this.',
    enabled: false,
    params: { limit: 2.0, level: 'hard pause' },
  },
];

export function TiltRulesStep({ onNext: _onNext, onBack: _onBack }: { onNext: () => void; onBack: () => void }) {
  const [rules, setRules] = useState(INITIAL_RULES);

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] text-[var(--ob-muted)] uppercase tracking-widest font-semibold mb-2">
          Step 5 · Discipline
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Set your tilt rules</h1>
        <p className="text-[var(--ob-muted-2)]">
          These run in real-time. Soft alerts by default; flip to{' '}
          <b className="text-[var(--ob-text)]">hard pause</b> if you want them to physically stop you
          trading.
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-start gap-4 p-4 rounded-xl border transition-all ${
              rule.enabled
                ? 'bg-[var(--ob-panel)] border-[var(--ob-border)]'
                : 'bg-[var(--ob-bg)] border-[var(--ob-border)]/50 opacity-60'
            }`}
          >
            <label className="relative inline-flex items-center cursor-pointer mt-1 flex-none">
              <input
                type="checkbox"
                checked={rule.enabled}
                onChange={() => toggleRule(rule.id)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-[var(--ob-panel-2)] border border-[var(--ob-border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-[var(--ob-muted)] after:border-[var(--ob-border)] after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[var(--green)]/20 peer-checked:border-[var(--green)]/50 peer-checked:after:bg-[var(--green)]" />
            </label>

            <div className="flex-1 space-y-2">
              <div>
                <h4 className="text-[13.5px] font-semibold leading-tight">{rule.title}</h4>
                <p className="text-[11.5px] text-[var(--ob-muted)] leading-relaxed">{rule.description}</p>
              </div>

              {rule.enabled && (
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11.5px] text-[var(--ob-muted)] pt-1">
                  {rule.id === 'cooldown' && (
                    <>
                      <span>
                        Trigger after{' '}
                        <Input
                          className="inline-block w-12 h-6 py-0 px-1 text-center bg-[var(--ob-panel-2)] border-[var(--ob-border)] mx-1 text-[var(--ob-text)]"
                          defaultValue={rule.params.losses}
                        />{' '}
                        losses
                      </span>
                      <span>
                        cooldown{' '}
                        <Input
                          className="inline-block w-12 h-6 py-0 px-1 text-center bg-[var(--ob-panel-2)] border-[var(--ob-border)] mx-1 text-[var(--ob-text)]"
                          defaultValue={rule.params.window}
                        />{' '}
                        min
                      </span>
                    </>
                  )}
                  {rule.id === 'revenge' && (
                    <span>
                      Window{' '}
                      <Input
                        className="inline-block w-12 h-6 py-0 px-1 text-center bg-[var(--ob-panel-2)] border-[var(--ob-border)] mx-1 text-[var(--ob-text)]"
                        defaultValue={rule.params.window}
                      />{' '}
                      seconds
                    </span>
                  )}
                  {rule.id === 'oversize' && (
                    <span>
                      Multiple{' '}
                      <Input
                        className="inline-block w-12 h-6 py-0 px-1 text-center bg-[var(--ob-panel-2)] border-[var(--ob-border)] mx-1 text-[var(--ob-text)]"
                        defaultValue={rule.params.multiple}
                      />{' '}
                      × avg
                    </span>
                  )}
                  {rule.id === 'maxloss' && (
                    <span>
                      Limit{' '}
                      <Input
                        className="inline-block w-12 h-6 py-0 px-1 text-center bg-[var(--ob-panel-2)] border-[var(--ob-border)] mx-1 text-[var(--ob-text)]"
                        defaultValue={rule.params.limit}
                      />
                      % of account
                    </span>
                  )}

                  <div className="flex items-center gap-1.5">
                    <span>alert level</span>
                    <select className="bg-[var(--ob-panel-2)] border border-[var(--ob-border)] rounded px-1.5 py-0.5 text-[var(--ob-text)] outline-none">
                      <option selected={rule.params.level === 'soft'}>soft</option>
                      <option selected={rule.params.level === 'hard pause'}>hard pause</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <Card className="p-4 bg-gradient-to-b from-[#f5a524]/5 to-transparent border-[#f5a524]/20">
        <div className="flex gap-3 text-xs leading-relaxed">
          <span className="text-[#f5a524] font-bold flex-none">⚠ Heads up</span>
          <span className="text-[var(--ob-muted-2)]">
            <b className="text-[#f5a524]/80">hard-pause</b> rules disable order placement for the
            cooldown window. You&apos;ll still see your positions, P&L, and journal.
          </span>
        </div>
      </Card>
    </div>
  );
}
