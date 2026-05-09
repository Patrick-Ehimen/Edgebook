import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { AuthTabs } from '@/features/auth/components/AuthTabs';
import { SignUpForm } from '@/features/auth/components/SignUpForm';

export const metadata: Metadata = { title: 'Create account — Edgebook' };

export default function Page() {
  return (
    <AuthCard>
      <AuthTabs current="sign-up" />
      <SignUpForm />
    </AuthCard>
  );
}
