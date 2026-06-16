import { TiltBanner } from '@/components/TiltBanner';
import { GoalsProvider } from '@/providers/goals-provider';
import { LogTradeProvider } from '@/providers/log-trade-provider';
import { SelectedAccountProvider } from '@/providers/selected-account-provider';
import { TiltProvider } from '@/providers/tilt-provider';
import SidebarNav from './_components/sidebar-nav';
import Topbar from './_components/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <GoalsProvider>
      <SelectedAccountProvider>
        <LogTradeProvider>
          <TiltProvider>
            <div
              style={{
                display: 'grid',
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
          </TiltProvider>
        </LogTradeProvider>
      </SelectedAccountProvider>
    </GoalsProvider>
  );
}
