import { AuthLayout } from '@/features/auth/components/AuthLayout';
import { AuthHero } from '@/features/auth/components/AuthHero';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AuthLayout leftContent={<AuthHero />}>{children}</AuthLayout>;
}
