import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, LayoutDashboard, PenLine, Mic2, BookOpen, Headphones, FlaskConical, BookMarked, TrendingUp, LogOut, Settings, Lightbulb, GraduationCap } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import { useLogout } from '../../hooks/useAuth';
import logo from '../../assets/logo-removebg-preview.png';

const navItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { label: 'LEARN', isHeader: true },
  { to: '/learn/writing', icon: PenLine, label: 'Writing' },
  { to: '/learn/speaking', icon: Mic2, label: 'Speaking' },
  { to: '/learn/reading', icon: BookOpen, label: 'Reading' },
  { to: '/learn/listening', icon: Headphones, label: 'Listening' },
  { label: 'TOOLS', isHeader: true },
  { to: '/mock-test', icon: FlaskConical, label: 'Mock Test' },
  { to: '/vocabulary', icon: BookMarked, label: 'Vocabulary' },
  { to: '/progress', icon: TrendingUp, label: 'Progress' },
  { to: '/tips', icon: Lightbulb, label: 'Tips & Tricks' },
  { to: '/scholarships', icon: GraduationCap, label: 'Scholarships' },
  { label: 'ACCOUNT', isHeader: true },
  { to: '/setup', icon: Settings, label: 'API Key Settings' },
];

export default function MobileDrawer({ open, onClose }) {
  const user = useAppStore(s => s.user);
  const { mutate: logout } = useLogout();

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />

          {/* Drawer */}
          <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 201,
              width: 280, background: 'var(--bg-secondary)',
              borderRight: '1px solid var(--border)',
              display: 'flex', flexDirection: 'column', overflowY: 'auto',
            }}>
            {/* Header */}
            <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <img src={logo} alt="Smart IELTS" style={{ height: 32, objectFit: 'contain' }} />
              </div>
              <button onClick={onClose} style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={16} />
              </button>
            </div>

            {/* User pill */}
            {user && (
              <div style={{ margin: '12px 12px 4px', padding: '12px', background: 'var(--bg-elevated)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Target: Band {user.target_band ?? 7}</div>
                </div>
              </div>
            )}

            {/* Nav */}
            <nav style={{ flex: 1, padding: '8px 12px' }}>
              {navItems.map((item, i) => {
                if (item.isHeader) return (
                  <div key={i} style={{ padding: '16px 8px 6px', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: 'Space Grotesk' }}>{item.label}</div>
                );
                return (
                  <NavLink key={item.to} to={item.to} onClick={onClose} style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 12px', borderRadius: 10,
                    marginBottom: 2, textDecoration: 'none', fontSize: 15, fontWeight: 500,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.05))' : 'transparent',
                    borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  })}>
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                );
              })}
            </nav>

            {/* Logout */}
            <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
              <button onClick={() => { logout(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 12px', borderRadius: 10, border: 'none', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: 'var(--accent-danger)', cursor: 'pointer', fontSize: 14, fontWeight: 500, width: '100%' }}>
                <LogOut size={16} /> Log out
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
