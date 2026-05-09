import type { Metadata } from 'next';
import { Suspense } from 'react';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTabs } from '@/features/auth/components/AuthTabs';
import { SignInForm } from '@/features/auth/components/SignInForm';

export const metadata: Metadata = { title: 'Sign in — Edgebook' };

export default function Page() {
  return (
    <AuthCard>
      <AuthTabs current="sign-in" />
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthCard>
  );
}
