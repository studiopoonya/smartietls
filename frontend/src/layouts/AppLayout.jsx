import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import BottomNav from '../components/layout/BottomNav';
import MobileHeader from '../components/layout/MobileHeader';
import MobileDrawer from '../components/layout/MobileDrawer';
import { useIsMobile } from '../hooks/useIsMobile';

export default function AppLayout() {
  const isMobile = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  // <main> keeps the same position in both layouts, so crossing the mobile breakpoint
  // (rotating a phone, resizing a window) does not remount the page and wipe drill answers.
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: isMobile ? 'column' : 'row' }}>
      {isMobile ? <MobileHeader onMenuOpen={() => setDrawerOpen(true)} /> : <Sidebar />}
      {isMobile && <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />}
      <main style={{ flex: 1, minWidth: 0, paddingBottom: isMobile ? 'calc(76px + env(safe-area-inset-bottom, 0px))' : 0 }}>
        <Outlet />
      </main>
      {isMobile && <BottomNav onMenuOpen={() => setDrawerOpen(true)} />}
    </div>
  );
}
