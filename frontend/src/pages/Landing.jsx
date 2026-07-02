import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Zap, Target, TrendingUp, BookOpen, Mic2, PenLine, Headphones } from 'lucide-react';

const features = [
  { icon: PenLine, title: 'AI Writing Coach', desc: 'Real-time band scores across all 4 IELTS criteria with line-by-line feedback.', color: 'var(--accent-primary)' },
  { icon: Mic2, title: 'Speaking Examiner', desc: 'Practice with an AI examiner that responds, evaluates, and guides you.', color: 'var(--accent-secondary)' },
  { icon: BookOpen, title: 'Reading Practice', desc: 'AI-generated authentic passages with True/False, MCQ, and matching questions.', color: 'var(--accent-success)' },
  { icon: Headphones, title: 'Listening Simulator', desc: 'Generated conversation transcripts and comprehension questions for practice.', color: 'var(--accent-warning)' },
];

export default function Landing() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', overflowX: 'hidden' }}>
      {/* Ambient bg */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,58,237,0.2) 0%, transparent 60%), radial-gradient(ellipse 40% 40% at 90% 80%, rgba(6,182,212,0.1) 0%, transparent 50%)' }} />

      {/* Navbar */}
      <nav style={{ position: 'relative', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 40px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700, fontFamily: 'Space Grotesk', color: 'white' }}>I</div>
          <span style={{ fontFamily: 'Space Grotesk', fontWeight: 700, fontSize: 18, color: 'var(--text-primary)' }}>IELTS AI</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link to="/login" style={{ padding: '9px 20px', borderRadius: 10, border: '1px solid var(--border)', background: 'transparent', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, fontFamily: 'Space Grotesk', transition: 'all 0.2s' }}>Log in</Link>
          <Link to="/register" style={{ padding: '9px 20px', borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600, fontFamily: 'Space Grotesk', boxShadow: '0 0 20px rgba(124,58,237,0.3)' }}>Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '100px 40px 80px' }}>
        <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 20, padding: '6px 16px', marginBottom: 32 }}>
            <Zap size={14} style={{ color: 'var(--accent-glow)' }} />
            <span style={{ fontSize: 13, color: 'var(--accent-glow)', fontWeight: 600, fontFamily: 'Space Grotesk' }}>Powered by Claude AI</span>
          </div>
          <h1 style={{ fontSize: 'clamp(40px, 7vw, 76px)', fontFamily: 'Space Grotesk', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1.1, marginBottom: 24, maxWidth: 800, margin: '0 auto 24px' }}>
            Score Band 7+ with
            <span style={{ display: 'block', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>AI-Powered IELTS Prep</span>
          </h1>
          <p style={{ fontSize: 18, color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto 40px', lineHeight: 1.7 }}>
            Get real-time feedback from an AI examiner trained on official IELTS band descriptors. Writing, Speaking, Reading, Listening — all four skills in one platform.
          </p>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', color: 'white', textDecoration: 'none', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk', boxShadow: '0 0 40px rgba(124,58,237,0.4)' }}>
              Start for free <ArrowRight size={18} />
            </Link>
            <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 16, fontWeight: 500, background: 'var(--bg-elevated)' }}>
              Log in
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features */}
      <section style={{ position: 'relative', zIndex: 1, padding: '60px 40px 100px', maxWidth: 1100, margin: '0 auto' }}>
        <motion.h2 initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ duration: 0.5 }}
          style={{ textAlign: 'center', fontSize: 36, marginBottom: 60, fontFamily: 'Space Grotesk' }}>
          Everything you need to ace IELTS
        </motion.h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
          {features.map((f, i) => (
            <motion.div key={f.title} className="glow-card" initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ padding: 28 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: `${f.color}20`, border: `1px solid ${f.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontSize: 17, marginBottom: 8, fontFamily: 'Space Grotesk' }}>{f.title}</h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', padding: '60px 40px', textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: 60, flexWrap: 'wrap' }}>
          {[['Band 7+', 'Average improvement'], ['4 Skills', 'Writing, Speaking, Reading, Listening'], ['Real-time', 'AI feedback on every attempt']].map(([stat, label]) => (
            <div key={stat}>
              <div style={{ fontFamily: 'Space Mono', fontSize: 32, fontWeight: 700, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{stat}</div>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)', marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={{ position: 'relative', zIndex: 1, textAlign: 'center', padding: '80px 40px' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ duration: 0.5 }}>
          <h2 style={{ fontSize: 40, fontFamily: 'Space Grotesk', marginBottom: 16 }}>Ready to level up?</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 32, fontSize: 16 }}>Start practicing with your personal AI IELTS tutor today.</p>
          <Link to="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '16px 36px', borderRadius: 14, background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', color: 'white', textDecoration: 'none', fontSize: 17, fontWeight: 700, fontFamily: 'Space Grotesk', boxShadow: '0 0 60px rgba(124,58,237,0.5)' }}>
            Get started for free <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      <footer style={{ position: 'relative', zIndex: 1, borderTop: '1px solid var(--border)', padding: '24px 40px', textAlign: 'center', fontSize: 13, color: 'var(--text-muted)' }}>
        © 2024 IELTS AI Platform. Powered by Claude AI.
      </footer>
    </div>
  );
}
