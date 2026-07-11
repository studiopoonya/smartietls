import { Menu, Flame, Target, Sun, Moon } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';
import logo from '../../assets/logo-removebg-preview.png';

export default function MobileHeader({ onMenuOpen }) {
  const user = useAppStore(s => s.user);
  const theme = useAppStore(s => s.theme);
  const toggleTheme = useAppStore(s => s.toggleTheme);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'var(--header-bg)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <img src={logo} alt="Smart IELTS" style={{ height: 30, objectFit: 'contain' }} />
      </div>

      {/* Stats + hamburger */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {user && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 20, padding: '4px 10px' }}>
              <Flame size={13} style={{ color: '#F59E0B' }} />
              <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: '#F59E0B' }}>{user.streak_days ?? 0}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 20, padding: '4px 10px' }}>
              <Target size={12} style={{ color: 'var(--accent-glow)' }} />
              <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: 'var(--accent-glow)' }}>{user.target_band ?? 7}</span>
            </div>
          </>
        )}
        <button onClick={toggleTheme} style={{
          width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
        }}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <button onClick={onMenuOpen} style={{
          width: 34, height: 34, borderRadius: 8, background: 'var(--bg-elevated)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)',
        }}>
          <Menu size={18} />
        </button>
      </div>
    </header>
  );
}
