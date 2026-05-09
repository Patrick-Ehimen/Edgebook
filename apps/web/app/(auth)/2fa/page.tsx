import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { TwoFactorChallenge } from '@/features/auth/components/TwoFactorChallenge';
import { TwoFactorEnroll } from '@/features/auth/components/TwoFactorEnroll';

export const metadata: Metadata = { title: 'Two-factor authentication — Edgebook' };

interface PageProps {
  searchParams: Promise<{ challengeId?: string; mode?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { challengeId, mode } = await searchParams;

  return (
    <AuthCard>
      {challengeId ? (
        <TwoFactorChallenge challengeId={challengeId} />
      ) : mode === 'enroll' ? (
        <TwoFactorEnroll />
      ) : (
        <p className="text-sm text-muted-foreground">Invalid 2FA state.</p>
      )}
    </AuthCard>
  );
}
