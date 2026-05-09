import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { VerifyEmailForm } from '@/features/auth/components/VerifyEmailForm';

export const metadata: Metadata = { title: 'Verify email — Edgebook' };

interface PageProps {
  searchParams: Promise<{ email?: string }>;
}

export default async function Page({ searchParams }: PageProps) {
  const { email = '' } = await searchParams;
  return (
    <AuthCard>
      <VerifyEmailForm email={decodeURIComponent(email)} />
    </AuthCard>
  );
}
