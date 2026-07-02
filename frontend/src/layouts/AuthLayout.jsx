import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import logo from '../assets/logo-removebg-preview.png';

export default function AuthLayout() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', display: 'flex', flexDirection: 'column' }}>
      {/* Ambient background */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%), radial-gradient(ellipse 40% 30% at 90% 90%, rgba(6,182,212,0.08) 0%, transparent 60%)',
        zIndex: 0
      }} />
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <header style={{ padding: '20px 32px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <img src={logo} alt="Smart IELTS" style={{ height: 36, objectFit: 'contain' }} />
          </Link>
        </header>
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
            style={{ width: '100%', maxWidth: 440 }}>
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
