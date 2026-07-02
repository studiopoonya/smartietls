import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, Mic2, BookOpen, Headphones, FlaskConical, BookMarked, TrendingUp, Flame, Target, AlertCircle, Clock, CalendarDays } from 'lucide-react';
import { useDashboard } from '../hooks/useProgress';
import { useAppStore } from '../store/useAppStore';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';
import BandScoreBar from '../components/common/BandScoreBar';
import { getBandColor, formatDate } from '../lib/utils';

const modules = [
  { to: '/learn/writing', icon: PenLine, label: 'Writing', color: 'var(--accent-primary)', desc: 'Task 1 & 2 feedback' },
  { to: '/learn/speaking', icon: Mic2, label: 'Speaking', color: 'var(--accent-secondary)', desc: 'Part 1, 2 & 3' },
  { to: '/learn/reading', icon: BookOpen, label: 'Reading', color: 'var(--accent-success)', desc: 'Academic passages' },
  { to: '/learn/listening', icon: Headphones, label: 'Listening', color: '#F59E0B', desc: 'Transcripts & Q&A' },
];

const tools = [
  { to: '/mock-test', icon: FlaskConical, label: 'Mock Test', color: 'var(--accent-danger)' },
  { to: '/vocabulary', icon: BookMarked, label: 'Vocabulary', color: 'var(--accent-primary)' },
  { to: '/progress', icon: TrendingUp, label: 'Progress', color: 'var(--accent-success)' },
];

export default function Dashboard() {
  const { data, isLoading } = useDashboard();
  const storeUser = useAppStore(s => s.user);
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  if (isLoading) return (
    <div style={{ padding: pad }}>
      <div className="skeleton" style={{ height: 60, marginBottom: 20, borderRadius: 12 }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
        {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90 }} />)}
      </div>
    </div>
  );

  const { user, stats, latest_bands, recent_sessions } = data ?? {};

  const examDate = storeUser?.exam_date ?? user?.exam_date;
  const daysToExam = examDate
    ? Math.ceil((new Date(examDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1200 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        {!isMobile ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <h1 style={{ fontSize: 28, marginBottom: 6 }}>Hey, {user?.name?.split(' ')[0]} 👋</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Let's keep that streak going. You're doing great.</p>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '10px 16px' }}>
                <Flame size={18} style={{ color: '#F59E0B' }} />
                <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 16, color: '#F59E0B' }}>{user?.streak_days ?? 0}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>day streak</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 10, padding: '10px 16px' }}>
                <Target size={16} style={{ color: 'var(--accent-glow)' }} />
                <span style={{ fontFamily: 'Space Mono', fontWeight: 700, fontSize: 16, color: 'var(--accent-glow)' }}>Band {user?.target_band ?? 7}</span>
                <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>goal</span>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <h1 style={{ fontSize: 22, marginBottom: 4 }}>Hey, {user?.name?.split(' ')[0]} 👋</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Let's keep that streak going!</p>
          </div>
        )}
      </motion.div>

      {/* No API key warning */}
      {!user?.has_api_key && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', gap: 10, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 16px', marginBottom: 20 }}>
          <AlertCircle size={16} style={{ color: '#F59E0B', flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#F59E0B', marginBottom: 3 }}>API key not configured</div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>
              <Link to="/setup" style={{ color: 'var(--accent-secondary)', textDecoration: 'none', fontWeight: 600 }}>Set up your Anthropic API key →</Link>
            </div>
          </div>
        </motion.div>
      )}

      {/* Exam countdown */}
      {daysToExam !== null && daysToExam > 0 && (
        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', marginBottom: 20, borderRadius: 14, background: daysToExam <= 14 ? 'rgba(239,68,68,0.08)' : daysToExam <= 30 ? 'rgba(245,158,11,0.08)' : 'rgba(124,58,237,0.08)', border: `1px solid ${daysToExam <= 14 ? 'rgba(239,68,68,0.25)' : daysToExam <= 30 ? 'rgba(245,158,11,0.25)' : 'rgba(124,58,237,0.25)'}` }}>
          <CalendarDays size={22} style={{ color: daysToExam <= 14 ? 'var(--accent-danger)' : daysToExam <= 30 ? '#F59E0B' : 'var(--accent-primary)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
              <span style={{ fontFamily: 'Space Mono', fontSize: 20, color: daysToExam <= 14 ? 'var(--accent-danger)' : daysToExam <= 30 ? '#F59E0B' : 'var(--accent-primary)' }}>{daysToExam}</span>
              {' '}days until your IELTS exam
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {daysToExam <= 7 ? 'Final stretch — focus on mock tests and weak areas!'
                : daysToExam <= 14 ? 'Almost there — review tips and practice daily.'
                : daysToExam <= 30 ? 'Keep up the momentum — consistent daily practice wins.'
                : 'You have time — build strong habits now.'}
            </div>
          </div>
          <Link to="/setup" style={{ fontSize: 11, color: 'var(--text-muted)', textDecoration: 'none', flexShrink: 0, padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 7 }}>Edit date</Link>
        </motion.div>
      )}

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
        {[
          { label: 'Sessions', value: stats?.total_sessions ?? 0, icon: FlaskConical },
          { label: 'Vocab', value: stats?.vocab_saved ?? 0, icon: BookMarked },
          { label: 'Band', value: latest_bands?.overall_band ?? '—', icon: TrendingUp, mono: true, colored: true },
          { label: 'Streak', value: `${user?.streak_days ?? 0}d`, icon: Flame, flame: true },
        ].map((s, i) => (
          <motion.div key={s.label} className="glow-card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={{ padding: isMobile ? '14px 16px' : '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <s.icon size={13} style={{ color: s.flame ? '#F59E0B' : 'var(--text-muted)' }} />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: s.mono ? 'Space Mono' : 'Space Grotesk', fontSize: isMobile ? 22 : 26, fontWeight: 700, color: s.colored ? getBandColor(s.value) : s.flame ? '#F59E0B' : 'var(--text-primary)' }}>
              {s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main content: modules + bands */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: isMobile ? 16 : 24, marginBottom: 24, alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: isMobile ? 15 : 17, marginBottom: 12, fontFamily: 'Space Grotesk' }}>Practice Modules</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 14 }}>
            {modules.map((m, i) => (
              <motion.div key={m.to} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}>
                <Link to={m.to} style={{ textDecoration: 'none' }}>
                  <div className="glow-card" style={{ padding: isMobile ? '16px 14px' : 22, cursor: 'pointer' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: `${m.color}20`, border: `1px solid ${m.color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10 }}>
                      <m.icon size={16} style={{ color: m.color }} />
                    </div>
                    <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 700, fontFamily: 'Space Grotesk', marginBottom: 3, color: 'var(--text-primary)' }}>{m.label}</div>
                    {!isMobile && <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{m.desc}</div>}
                    {stats?.avg_bands?.[m.label.toLowerCase()] && (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>avg</span>
                        <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: getBandColor(stats.avg_bands[m.label.toLowerCase()]) }}>{stats.avg_bands[m.label.toLowerCase()]}</span>
                      </div>
                    )}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Tools row — visible on mobile below modules */}
          {isMobile && (
            <div style={{ marginTop: 12 }}>
              <h2 style={{ fontSize: 15, marginBottom: 10, fontFamily: 'Space Grotesk' }}>Tools</h2>
              <div style={{ display: 'flex', gap: 8 }}>
                {tools.map(t => (
                  <Link key={t.to} to={t.to} style={{ flex: 1, textDecoration: 'none' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 8px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, transition: 'all 0.2s' }}>
                      <t.icon size={18} style={{ color: t.color }} />
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-secondary)', fontFamily: 'Space Grotesk' }}>{t.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Band scores — desktop only sidebar, mobile shows below */}
        {(!isMobile || latest_bands) && (
          <div>
            <h2 style={{ fontSize: isMobile ? 15 : 17, marginBottom: 12, fontFamily: 'Space Grotesk', marginTop: isMobile ? 16 : 0 }}>Current Bands</h2>
            <GlowCard>
              {latest_bands ? (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 16, padding: '10px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600 }}>OVERALL BAND</div>
                    <div style={{ fontFamily: 'Space Mono', fontSize: 40, fontWeight: 700, color: getBandColor(latest_bands.overall_band) }}>{latest_bands.overall_band}</div>
                  </div>
                  <BandScoreBar label="Writing" score={latest_bands.writing_band} />
                  <BandScoreBar label="Speaking" score={latest_bands.speaking_band} />
                  <BandScoreBar label="Reading" score={latest_bands.reading_band} />
                  <BandScoreBar label="Listening" score={latest_bands.listening_band} />
                </>
              ) : (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                  <TrendingUp size={28} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.3 }} />
                  Complete a session to see your bands
                </div>
              )}
            </GlowCard>

            {/* Quick tools desktop */}
            {!isMobile && (
              <div style={{ marginTop: 14 }}>
                {tools.map(t => (
                  <Link key={t.to} to={t.to} style={{ textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', marginBottom: 8, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, transition: 'all 0.2s', cursor: 'pointer' }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = t.color}
                      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                      <t.icon size={15} style={{ color: t.color }} />
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{t.label}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {recent_sessions?.length > 0 && (
        <div>
          <h2 style={{ fontSize: isMobile ? 15 : 17, marginBottom: 12, fontFamily: 'Space Grotesk' }}>Recent Sessions</h2>
          <GlowCard>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Module', 'Band', 'Date'].map(h => (
                      <th key={h} style={{ padding: isMobile ? '8px 10px' : '8px 12px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {recent_sessions.map(s => (
                    <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: isMobile ? '10px' : '12px', fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{s.module.replace('_', ' ')}</td>
                      <td style={{ padding: isMobile ? '10px' : '12px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: getBandColor(s.band_score) }}>{s.band_score ?? '—'}</td>
                      <td style={{ padding: isMobile ? '10px' : '12px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlowCard>
        </div>
      )}
    </div>
  );
}
