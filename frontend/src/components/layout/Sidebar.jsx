import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, PenLine, Mic2, BookOpen, Headphones, FlaskConical, BookMarked, TrendingUp, LogOut, Flame, Target, Lightbulb, GraduationCap } from 'lucide-react';
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
];

export default function Sidebar() {
  const user = useAppStore(s => s.user);
  const { mutate: logout } = useLogout();

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
      position: 'sticky', top: 0, height: '100vh', overflowY: 'auto'
    }}>
      {/* Logo */}
      <div style={{ padding: '20px 16px', borderBottom: '1px solid var(--border)' }}>
        <img src={logo} alt="Smart IELTS" style={{ height: 40, objectFit: 'contain', display: 'block' }} />
        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6, letterSpacing: '0.04em' }}>SMART WAY TO YOUR TARGET SCORE</div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px' }}>
        {navItems.map((item, i) => {
          if (item.isHeader) return (
            <div key={i} style={{ padding: '16px 8px 6px', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', fontFamily: 'Space Grotesk' }}>{item.label}</div>
          );
          return (
            <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 10,
              marginBottom: 2, textDecoration: 'none', fontSize: 14, fontWeight: 500,
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(6,182,212,0.05))' : 'transparent',
              borderLeft: isActive ? '2px solid var(--accent-primary)' : '2px solid transparent',
              transition: 'all 0.2s ease',
            })}>
              <item.icon size={16} />
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* User section */}
      <div style={{ padding: '16px 16px', borderTop: '1px solid var(--border)' }}>
        {user && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: 'white', flexShrink: 0 }}>
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Flame size={11} style={{ color: '#F59E0B' }} />
                {user.streak_days ?? 0}d streak
                <span style={{ marginLeft: 4, color: 'var(--accent-secondary)' }}>
                  <Target size={11} />
                </span>
                Band {user.target_band ?? 7}
              </div>
            </div>
          </div>
        )}
        <button onClick={() => logout()} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 13, width: '100%', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = 'var(--accent-danger)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
          <LogOut size={14} /> Log out
        </button>
      </div>
    </aside>
  );
}
