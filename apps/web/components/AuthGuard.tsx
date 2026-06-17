'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/auth-provider';
import Image from 'next/image';

function AppLoader() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--eb-bg)',
        gap: 16,
      }}
    >
      <style>{`
        @keyframes eb-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: .55; transform: scale(.92); }
        }
        .eb-logo-pulse {
          animation: eb-pulse 1.6s ease-in-out infinite;
        }
      `}</style>

      <div className="eb-logo-pulse" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: 16,
            background: 'linear-gradient(135deg,#00d68f,#00b67a)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 0 8px rgba(0,214,143,.15), 0 0 0 16px rgba(0,214,143,.06)',
          }}
        >
          <Image src="/assets/logo-mark.svg" alt="Edgebook" width={32} height={32} priority />
        </div>
        <span
          style={{
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: '-.02em',
            color: 'var(--eb-text)',
          }}
        >
          Edgebook
        </span>
      </div>
    </div>
  );
}

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, session } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(`/sign-in?next=${encodeURIComponent(pathname)}`);
      return;
    }
    if (!session?.isOnboarded && pathname !== '/onboarding') {
      router.replace('/onboarding');
    }
  }, [isAuthenticated, isLoading, session?.isOnboarded, pathname, router]);

  if (isLoading) return <AppLoader />;

  if (!isAuthenticated) return null;

  return <>{children}</>;
}
