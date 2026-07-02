import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, LogOut, Shield, Menu, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { useLogout } from '../hooks/useAuth';
import { useIsMobile } from '../hooks/useIsMobile';

const NAV = [
  { to: '/admin', end: true, icon: LayoutDashboard, label: 'Overview' },
  { to: '/admin/users',      icon: Users,           label: 'Users' },
];

export default function AdminLayout() {
  const user = useAppStore(s => s.user);
  const logout = useLogout();
  const isMobile = useIsMobile();
  const [menuOpen, setMenuOpen] = useState(false);

  if (isMobile) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
        <header style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Shield size={14} color="white" />
            </div>
            <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15, color: 'var(--text-primary)' }}>Admin Panel</span>
          </div>
          <button onClick={() => setMenuOpen(true)} style={{ width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
            <Menu size={18} />
          </button>
        </header>

        <AnimatePresence>
          {menuOpen && (
            <>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setMenuOpen(false)}
                style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
              <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
                transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                style={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201, width: 260, background: 'var(--bg-secondary)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Shield size={15} color="white" />
                    </div>
                    <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 15 }}>Admin Panel</span>
                  </div>
                  <button onClick={() => setMenuOpen(false)} style={{ width: 30, height: 30, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                    <X size={15} />
                  </button>
                </div>

                <div style={{ margin: '12px 12px 4px', padding: 12, background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </div>
                  <div style={{ overflow: 'hidden' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>Administrator</div>
                  </div>
                </div>

                <nav style={{ flex: 1, padding: '12px 12px' }}>
                  {NAV.map(item => (
                    <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMenuOpen(false)}
                      style={({ isActive }) => ({
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 12px', borderRadius: 10, marginBottom: 2,
                        background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                        color: isActive ? 'var(--accent-glow)' : 'var(--text-secondary)',
                        textDecoration: 'none', fontSize: 15,
                        fontWeight: isActive ? 600 : 400,
                        border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                      })}>
                      <item.icon size={17} />
                      {item.label}
                    </NavLink>
                  ))}
                </nav>

                <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
                  <button onClick={() => { logout.mutate(); setMenuOpen(false); }} disabled={logout.isPending}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.08)', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 14, fontWeight: 500, width: '100%' }}>
                    <LogOut size={15} />
                    {logout.isPending ? 'Logging out…' : 'Logout'}
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <main>
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Sidebar */}
      <div style={{ width: 220, background: 'var(--bg-card)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0, position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '18px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(124,58,237,0.4)', flexShrink: 0 }}>
              <Shield size={16} color="white" />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'var(--text-primary)', lineHeight: 1.2 }}>Admin Panel</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', letterSpacing: '0.05em' }}>IELTS AI</div>
            </div>
          </div>
        </div>

        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {NAV.map(item => (
            <NavLink key={item.to} to={item.to} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8, marginBottom: 2,
                background: isActive ? 'rgba(124,58,237,0.15)' : 'transparent',
                color: isActive ? 'var(--accent-glow)' : 'var(--text-secondary)',
                textDecoration: 'none', fontSize: 14,
                fontWeight: isActive ? 600 : 400,
                border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                transition: 'all 0.15s',
              })}>
              <item.icon size={15} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)' }}>
          <button onClick={() => logout.mutate()} disabled={logout.isPending}
            style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--accent-danger)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, marginBottom: 14, padding: 0, transition: 'opacity 0.15s', opacity: logout.isPending ? 0.6 : 1 }}>
            <LogOut size={13} />
            {logout.isPending ? 'Logging out…' : 'Logout'}
          </button>
          <div style={{ fontSize: 12, color: 'var(--text-primary)', fontWeight: 600, fontFamily: 'Space Grotesk', marginBottom: 2 }}>{user?.name}</div>
          <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600 }}>Administrator</div>
        </div>
      </div>

      {/* Content area */}
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        <Outlet />
      </div>
    </div>
  );
}
