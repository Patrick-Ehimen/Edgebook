import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTabs } from '@/features/auth/components/AuthTabs';
import { SignUpForm } from '@/features/auth/components/SignUpForm';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';

export const metadata: Metadata = { title: 'Create account — Edgebook' };

export default function Page() {
  return (
    <AuthCard>
      <AuthTabs current="sign-up" />
      <Suspense fallback={<AuthFormSkeleton variant="sign-up" />}>
        <SignUpForm />
      </Suspense>
    </AuthCard>
  );
}
