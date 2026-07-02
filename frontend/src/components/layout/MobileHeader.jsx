import { Menu, Flame, Target } from 'lucide-react';
import { useAppStore } from '../../store/useAppStore';

export default function MobileHeader({ onMenuOpen }) {
  const user = useAppStore(s => s.user);

  return (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px',
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width: 30, height: 30, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))',
          borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 15, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'white',
        }}>I</div>
        <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 16, color: 'var(--text-primary)' }}>IELTS AI</span>
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
