'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

const PLAYBOOKS = [
  {
    id: 'sweep',
    title: 'Liquidity sweep',
    description: 'Sweep of session high/low into HTF level → reclaim → opposing liquidity.',
    sessions: 'EU, US',
    risk: '0.5%',
  },
  {
    id: 'retest',
    title: 'Breakout retest',
    description: 'Wait for break + retest of HTF level. Conservative entry on confirmation.',
    sessions: 'any',
    risk: '0.5%',
  },
  {
    id: 'fade',
    title: 'Range fade',
    description: 'Fade extremes of well-defined intraday ranges.',
    sessions: 'Asia',
    risk: '0.4%',
  },
  {
    id: 'trend',
    title: 'Trend pullback',
    description: 'Buy/sell pullbacks to 20EMA in trending tape.',
    sessions: 'US',
    risk: '0.5%',
  },
];

export function PlaybookStep({ onNext, onBack: _onBack }: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState("sweep");

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] text-[var(--ob-muted)] uppercase tracking-widest font-semibold mb-2">
          Step 4 · Playbook
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Build your first playbook</h1>
        <p className="text-[var(--ob-muted-2)]">
          Pick a starter template — or skip and we&apos;ll auto-tag your imported trades. You can
          rename, edit, and add more later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {PLAYBOOKS.map((pb) => (
          <div
            key={pb.id}
            onClick={() => setSelected(pb.id)}
            className={`p-4 rounded-xl border-2 cursor-pointer bg-[var(--ob-panel)] transition-all relative ${
              selected === pb.id
                ? 'border-[var(--green)] shadow-[0_0_0_3px_rgba(0,214,143,0.15)]'
                : 'border-[var(--ob-border)] hover:border-[var(--ob-muted)]/30'
            }`}
          >
            <h4 className="font-semibold mb-1 text-[13.5px]">{pb.title}</h4>
            <p className="text-[11.5px] text-[var(--ob-muted)] leading-relaxed mb-3">{pb.description}</p>
            <div className="flex gap-3 text-[11px] text-[var(--ob-muted)]">
              <span>
                Sessions: <b className="text-[var(--ob-text)] font-mono">{pb.sessions}</b>
              </span>
              <span>
                Risk: <b className="text-[var(--ob-text)] font-mono">{pb.risk}</b>
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-3 pt-2">
        <Button className="cursor-pointer px-4 py-2 text-[13px] font-medium rounded-lg border border-[var(--ob-border)] bg-[var(--ob-panel-2)] text-[var(--ob-text)] hover:brightness-110 transition-all">
          + Create custom from scratch
        </Button>
        <Button
          onClick={onNext}
          className="cursor-pointer px-4 py-2 text-[13px] font-medium text-[var(--ob-muted)] hover:bg-[var(--ob-panel-2)] hover:text-[var(--ob-text)] rounded-lg transition-all"
        >
          Skip — I&apos;ll do this later
        </Button>
      </div>
    </div>
  );
}
