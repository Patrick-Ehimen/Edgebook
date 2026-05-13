'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';

interface RecoveryCodesPanelProps {
  codes: string[];
  onSaved: () => void;
}

export function RecoveryCodesPanel({ codes, onSaved }: RecoveryCodesPanelProps) {
  const [saved, setSaved] = useState(false);

  const handleCopyAll = async () => {
    await navigator.clipboard.writeText(codes.join('\n'));
  };

  const handleDownload = () => {
    const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'edgebook-recovery-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <h2 className="mb-1.5 mt-0.5 text-[22px] font-semibold tracking-[-0.02em] text-foreground">
        Save your recovery codes
      </h2>
      <p className="mb-4 text-[13px] text-muted-foreground">
        Store these codes in a safe place. Each code can only be used once. If you lose access to
        your authenticator app, these are the only way to recover your account.
      </p>

      {/* Code grid */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-[10px] border border-border bg-muted/20 p-4">
        {codes.map((code) => (
          <span key={code} className="font-mono text-[13px] font-medium text-foreground">
            {code}
          </span>
        ))}
      </div>

      {/* Action buttons */}
      <div className="mb-5 flex gap-2">
        <button
          type="button"
          onClick={handleCopyAll}
          className="flex-1 rounded-[9px] border border-border bg-background/80 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-card"
        >
          Copy all
        </button>
        <button
          type="button"
          onClick={handleDownload}
          className="flex-1 rounded-[9px] border border-border bg-background/80 py-2 text-[13px] font-medium text-foreground transition-colors hover:bg-card"
        >
          Download .txt
        </button>
      </div>

      {/* Confirmation checkbox */}
      <label className="mb-5 flex cursor-pointer items-start gap-2 text-[12.5px] text-muted-foreground">
        <Checkbox
          checked={saved}
          onCheckedChange={(v) => setSaved(Boolean(v))}
          className="mt-0.5 h-[14px] w-[14px] flex-shrink-0"
        />
        <span>I&apos;ve saved my recovery codes in a safe place</span>
      </label>

      <Button
        type="button"
        disabled={!saved}
        onClick={onSaved}
        className="h-[46px] w-full rounded-[10px] text-[14px] font-semibold"
        style={{
          background: 'linear-gradient(180deg,#00e29a,#00b67a)',
          color: '#06140f',
          boxShadow: '0 12px 30px rgba(0,214,143,.22), inset 0 1px 0 rgba(255,255,255,.18)',
        }}
      >
        Continue to dashboard →
      </Button>
    </div>
  );
}
