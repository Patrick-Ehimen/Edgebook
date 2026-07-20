import { AuthGuard } from '@/components/AuthGuard';
import { TiltBanner } from '@/components/TiltBanner';
import { ArchiveProvider } from '@/providers/archive-provider';
import { GoalsProvider } from '@/providers/goals-provider';
import { LogTradeProvider } from '@/providers/log-trade-provider';
import { SelectedAccountProvider } from '@/providers/selected-account-provider';
import { TiltProvider } from '@/providers/tilt-provider';
import Image from 'next/image';
import SidebarNav from './_components/sidebar-nav';
import Topbar from './_components/topbar';

function MobileBlock() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center gap-6 px-8 text-center"
      style={{ background: 'var(--eb-bg)' }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: 18,
          background: 'linear-gradient(135deg,#00d68f,#00b67a)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 0 10px rgba(0,214,143,.12), 0 0 0 20px rgba(0,214,143,.05)',
        }}
      >
        <Image src="/assets/logo-mark.svg" alt="Edgebook" width={36} height={36} priority />
      </div>

      <div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: 'var(--eb-text)',
            marginBottom: 8,
            letterSpacing: '-.02em',
          }}
        >
          Edgebook needs more space
        </div>
        <div style={{ fontSize: 14, color: 'var(--eb-muted-2)', lineHeight: 1.6, maxWidth: 280 }}>
          This platform is built for serious analysis. Open it on a laptop or desktop for the full
          experience.
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 16px',
          borderRadius: 10,
          background: 'rgba(0,214,143,.08)',
          border: '1px solid rgba(0,214,143,.2)',
          fontSize: 12.5,
          color: '#00d68f',
          fontWeight: 500,
        }}
      >
        <span style={{ fontSize: 18 }}>🖥️</span>
        Best on screens wider than 1024px
      </div>
    </div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      {/* Mobile blocker — visible below lg breakpoint */}
      <div className="flex lg:hidden">
        <MobileBlock />
      </div>

      {/* Full app — hidden below lg breakpoint */}
      <GoalsProvider>
        <SelectedAccountProvider>
          <LogTradeProvider>
            <TiltProvider>
              <ArchiveProvider>
                <div
                  className="hidden lg:grid"
                  style={{
                    gridTemplateColumns: '228px 1fr',
                    minHeight: '100vh',
                    background: 'var(--eb-bg)',
                  }}
                >
                  <SidebarNav />
                  <main style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <Topbar />
                    <TiltBanner />
                    {children}
                  </main>
                </div>
              </ArchiveProvider>
            </TiltProvider>
          </LogTradeProvider>
        </SelectedAccountProvider>
      </GoalsProvider>
    </AuthGuard>
  );
}
