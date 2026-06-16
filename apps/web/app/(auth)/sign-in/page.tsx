import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTabs } from '@/features/auth/components/AuthTabs';
import { SignInForm } from '@/features/auth/components/SignInForm';
import { AuthFormSkeleton } from '@/features/auth/components/AuthFormSkeleton';

export const metadata: Metadata = { title: 'Sign in — Edgebook' };

export default function Page() {
  return (
    <AuthCard>
      <AuthTabs current="sign-in" />
      <Suspense fallback={<AuthFormSkeleton variant="sign-in" />}>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
