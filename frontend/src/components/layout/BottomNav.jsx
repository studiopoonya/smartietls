import { NavLink } from 'react-router-dom';
import { LayoutDashboard, PenLine, Mic2, BookOpen, Menu } from 'lucide-react';

const mainItems = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Home' },
  { to: '/learn/writing', icon: PenLine, label: 'Writing' },
  { to: '/learn/speaking', icon: Mic2, label: 'Speaking' },
  { to: '/learn/reading', icon: BookOpen, label: 'Reading' },
];

export default function BottomNav({ onMenuOpen }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: 'rgba(17,17,24,0.92)', backdropFilter: 'blur(20px)',
      borderTop: '1px solid var(--border)',
      display: 'flex', alignItems: 'center',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      {mainItems.map(item => (
        <NavLink key={item.to} to={item.to} style={({ isActive }) => ({
          flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
          justifyContent: 'center', gap: 4, padding: '10px 0 8px',
          textDecoration: 'none', color: isActive ? 'var(--accent-glow)' : 'var(--text-muted)',
          fontSize: 10, fontWeight: 600, fontFamily: 'Space Grotesk',
          transition: 'color 0.2s',
          position: 'relative',
        })}>
          {({ isActive }) => (
            <>
              {isActive && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 32, height: 2, background: 'var(--accent-primary)', borderRadius: '0 0 2px 2px',
                }} />
              )}
              <item.icon size={20} />
              {item.label}
            </>
          )}
        </NavLink>
      ))}
      {/* More button */}
      <button onClick={onMenuOpen} style={{
        flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 4, padding: '10px 0 8px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text-muted)', fontSize: 10, fontWeight: 600, fontFamily: 'Space Grotesk',
      }}>
        <Menu size={20} />
        More
      </button>
    </nav>
  );
}
