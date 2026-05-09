import type { Metadata } from 'next';
import { AuthCard } from '@/features/auth/components/AuthCard';
import { ForgotPasswordFlow } from '@/features/auth/components/ForgotPasswordFlow';

export const metadata: Metadata = { title: 'Reset password — Edgebook' };

export default function Page() {
  return (
    <AuthCard>
      <ForgotPasswordFlow />
    </AuthCard>
  );
}
