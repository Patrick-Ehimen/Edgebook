'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Chip } from '@/components/ui/chip';
import { Button } from '@/components/ui/button';
import { Binance, Bybit, BybitDark, HyperliquidLight, HyperliquidDark } from '@/public';

type ExchangeId = 'binance' | 'bybit' | 'hyperliquid';

interface Exchange {
  id: ExchangeId;
  name: string;
  meta: string;
  badge?: string;
  disabled?: boolean;
}

const EXCHANGES: Exchange[] = [
  { id: 'binance', name: 'Binance', meta: 'USDM · COINM' },
  { id: 'bybit', name: 'Bybit', meta: 'USDT · USDC' },
  { id: 'hyperliquid', name: 'Hyperliquid', meta: 'on-chain', badge: 'Soon', disabled: true },
];

function ExchangeLogo({ id, name }: { id: ExchangeId; name: string }) {
  if (id === 'binance') {
    return <Image src={Binance} alt={name} className="h-8 w-auto object-contain" />;
  }
  if (id === 'bybit') {
    return (
      <>
        <Image src={Bybit} alt={name} className="h-7 w-auto object-contain dark:hidden" />
        <Image src={BybitDark} alt={name} className="h-7 w-auto object-contain hidden dark:block" />
      </>
    );
  }
  if (id === 'hyperliquid') {
    return (
      <>
        <Image src={HyperliquidLight} alt={name} className="h-7 w-auto object-contain dark:hidden" />
        <Image src={HyperliquidDark} alt={name} className="h-7 w-auto object-contain hidden dark:block" />
      </>
    );
  }
}

export function ConnectExchangeStep({
  onNext: _onNext,
  onBack: _onBack,
}: { onNext: () => void; onBack: () => void }) {
  const [selected, setSelected] = useState<ExchangeId>('binance');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<null | { success: boolean; msg: string }>(null);

  const handleExchangeSelect = (id: ExchangeId, disabled?: boolean) => {
    if (disabled) return;
    setSelected(id);
    setTestResult(null);
  };

  const testConnection = () => {
    setTesting(true);
    setTestResult(null);
    setTimeout(() => {
      setTesting(false);
      setTestResult({
        success: true,
        msg: '✓ Read-only confirmed · spot+futures access · 0 withdrawal',
      });
    }, 1500);
  };

  const selectedEx = EXCHANGES.find((e) => e.id === selected);

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11.5px] text-[var(--ob-muted)] uppercase tracking-widest font-semibold mb-2">
          Step 2 · Data source
        </div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">Connect your first exchange</h1>
        <p className="text-[var(--ob-muted-2)]">
          Read-only API only. We test for withdrawal permissions and refuse keys that have any. Or
          upload a CSV — same end result.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {EXCHANGES.map((ex) => (
          <div
            key={ex.id}
            onClick={() => handleExchangeSelect(ex.id, ex.disabled)}
            className={`relative flex flex-col items-center justify-center gap-3 py-5 px-4 rounded-xl border-2 bg-[var(--ob-panel)] transition-all ${
              ex.disabled
                ? 'opacity-50 cursor-not-allowed border-[var(--ob-border)]'
                : selected === ex.id
                  ? 'cursor-pointer border-[var(--green)] shadow-[0_0_0_3px_rgba(0,214,143,0.15)]'
                  : 'cursor-pointer border-[var(--ob-border)] hover:border-[var(--ob-muted)]/40'
            }`}
          >
            {ex.badge && (
              <span className="absolute top-2 right-2 text-[9.5px] px-1.5 py-0.5 rounded-full bg-[#8b5cf6]/20 text-[#8b5cf6] font-medium">
                {ex.badge}
              </span>
            )}
            <div className="h-9 flex items-center justify-center">
              <ExchangeLogo id={ex.id} name={ex.name} />
            </div>
            <div className="text-center">
              <div className="text-[13px] font-semibold">{ex.name}</div>
              <div className="text-[10.5px] text-[var(--ob-muted)] mt-0.5">{ex.meta}</div>
            </div>
          </div>
        ))}
      </div>

      <Card className="p-5 bg-[var(--ob-panel)] border-[var(--ob-border)]">
        <h4 className="text-[11px] uppercase tracking-widest text-[var(--ob-muted)] font-semibold mb-4">
          {selectedEx?.name} API key
        </h4>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-[var(--ob-muted)] font-semibold">
              API key
            </Label>
            <Input
              className="bg-[var(--ob-panel-2)] border-[var(--ob-border)] font-mono text-[13.5px]"
              placeholder="64-char read-only API key"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-[var(--ob-muted)] font-semibold">
              API secret
            </Label>
            <Input
              type="password"
              className="bg-[var(--ob-panel-2)] border-[var(--ob-border)] font-mono text-[13.5px]"
              placeholder="••••••••••••••••"
            />
            <p className="text-[11.5px] text-[var(--ob-muted)]">
              Encrypted with envelope KMS. We never log secrets.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[11px] uppercase tracking-wider text-[var(--ob-muted)] font-semibold">
              Account label
            </Label>
            <Input
              className="bg-[var(--ob-panel-2)] border-[var(--ob-border)] text-[13.5px]"
              defaultValue={`${selectedEx?.name} — Main`}
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button
              onClick={testConnection}
              disabled={testing}
              className="cursor-pointer px-3.5 py-2 text-[13px] font-medium rounded-lg border border-[var(--ob-border)] bg-[var(--ob-panel-2)] hover:brightness-110 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              🔌 {testing ? 'Testing...' : 'Test connection'}
            </Button>
            {testResult && (
              <Chip tone={testResult.success ? 'emerald' : 'rose'}>{testResult.msg}</Chip>
            )}
          </div>
        </div>

        <hr className="my-5 border-[var(--ob-border)]" />

        <details className="group">
          <summary className="flex items-center gap-2 cursor-pointer text-[12.5px] text-[var(--ob-muted-2)] hover:text-[var(--ob-text)] transition-colors list-none">
            <span className="group-open:rotate-90 transition-transform">▶</span>📖 How to create a
            read-only API key on {selectedEx?.name} (4 steps)
          </summary>
          <div className="mt-3 pl-6">
            <ol className="text-xs text-[var(--ob-muted)] space-y-2 list-decimal leading-relaxed">
              <li>Go to API Management → Create API.</li>
              <li>Label it &quot;Edgebook (read-only)&quot;.</li>
              <li>
                Disable <b>Enable Withdrawals</b>, <b>Enable Spot & Margin Trading</b>,{' '}
                <b>Enable Futures</b> trade. Keep only <b>Enable Reading</b>.
              </li>
              <li>Restrict to your IP if you have a static one. Save and paste here.</li>
            </ol>
          </div>
        </details>

        <div className="flex gap-2 mt-4">
          <Button className="cursor-pointer text-[11.5px] px-3 py-1.5 rounded-full border border-[var(--ob-border)] bg-[var(--ob-panel-2)] text-[var(--ob-muted-2)] hover:text-[var(--ob-text)] transition-all">
            📁 Or upload CSV instead
          </Button>
          <Button className="cursor-pointer text-[11.5px] px-3 py-1.5 rounded-full border border-[var(--ob-border)] bg-[var(--ob-panel-2)] text-[var(--ob-muted-2)] hover:text-[var(--ob-text)] transition-all">
            ⌨ Or enter trades manually
          </Button>
        </div>
      </Card>
    </div>
  );
}
