'use client';

import { useRouter } from 'next/navigation';
import { api } from '@/lib/api-client';
import { CompleteOnboardingResponse } from '@edgebook/shared/auth';
import { Button } from '@/components/ui/button';

export function SkipSetupButton() {
  const router = useRouter();

  const handleSkip = async () => {
    try {
      await api.post('/auth/complete-onboarding', CompleteOnboardingResponse, {});
    } catch {
      // If it fails (e.g. already onboarded), continue to dashboard anyway
    }
    router.push('/dashboard');
  };

  return (
    <Button
      onClick={handleSkip}
      className="cursor-pointer px-3.5 py-2 text-[13px] text-[var(--ob-muted)] hover:bg-[var(--ob-panel-2)] hover:text-[var(--ob-text)] rounded-lg transition-all border border-transparent hover:border-[var(--ob-border)]"
    >
      Skip setup
    </Button>
  );
}
