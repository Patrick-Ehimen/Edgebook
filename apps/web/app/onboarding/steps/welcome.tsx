'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { useAuth } from '@/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { CompleteOnboardingResponse } from '@edgebook/shared/auth';

export function WelcomeStep() {
  const router = useRouter();
  const { refreshSession, user } = useAuth();

  const handleComplete = async () => {
    try {
      await api.post('/auth/complete-onboarding', CompleteOnboardingResponse, {});
      await refreshSession();
      router.push('/dashboard');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  return (
    <div className="space-y-8 py-10 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-3">
          You&apos;re all set, {user?.handle}
        </h1>
        <p className="text-[var(--ob-muted-2)] max-w-[520px] mx-auto text-sm leading-relaxed">
          We backfilled <b className="text-[var(--ob-text)]">1,284 trades</b> from the last 90 days,
          computed your equity curve, and your tilt detector is armed. Here&apos;s the first thing
          we noticed.
        </p>
      </div>

      <div className="flex gap-4 text-left bg-gradient-to-b from-[#8b5cf6]/10 to-transparent border border-[#8b5cf6]/30 rounded-xl p-5 max-w-[580px] mx-auto">
        <div className="flex-none w-9 h-9 rounded-lg bg-[#8b5cf6]/20 flex items-center justify-center text-[#8b5cf6] font-bold text-sm">
          AI
        </div>
        <div>
          <b className="text-[var(--ob-text)] block mb-1">Your edge clusters in the EU session.</b>
          <p className="text-xs text-[var(--ob-muted-2)] leading-relaxed">
            Of your 1,284 imported trades, EU-session trades have a profit factor of{' '}
            <b className="text-[var(--green)]">2.31</b> vs <b className="text-[#f5a524]">1.04</b>{' '}
            elsewhere. Consider front-loading risk into 07:00–11:00 UTC.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3 pt-4">
        <Button
          onClick={handleComplete}
          className="cursor-pointer px-6 py-2.5 text-[14px] font-semibold rounded-lg bg-gradient-to-b from-[#00e29a] to-[#00b67a] text-[#06140f] shadow-[0_8px_24px_rgba(0,214,143,0.18)] hover:brightness-105 transition-all"
        >
          Open dashboard →
        </Button>
        <Button className="cursor-pointer px-5 py-2.5 text-[14px] font-medium rounded-lg border border-[var(--ob-border)] bg-[var(--ob-panel-2)] text-[var(--ob-text)] hover:brightness-110 transition-all">
          📓 Write today&apos;s intent
        </Button>
        <Button className="cursor-pointer px-5 py-2.5 text-[14px] font-medium rounded-lg text-[var(--ob-muted)] hover:bg-[var(--ob-panel-2)] hover:text-[var(--ob-text)] transition-all">
          ⚙ Settings
        </Button>
      </div>
    </div>
  );
}
