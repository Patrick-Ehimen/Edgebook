import SidebarNav from './_components/sidebar-nav';
import Topbar from './_components/topbar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
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
        {children}
      </main>
    </div>
  );
}
