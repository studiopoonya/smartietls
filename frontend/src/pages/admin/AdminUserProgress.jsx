import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, TrendingUp, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAdminUser, useAdminUserProgress, useAdminUserSessions } from '../../hooks/useAdmin';
import { getBandColor, getBandLabel, formatDate } from '../../lib/utils';
import GlowCard from '../../components/common/GlowCard';
import BandScoreBar from '../../components/common/BandScoreBar';
import { useIsMobile } from '../../hooks/useIsMobile';

const MODULE_COLORS = { overall: '#A855F7', writing: '#7C3AED', speaking: '#06B6D4', reading: '#10B981', listening: '#F59E0B' };
const MODULE_FILTERS = ['all', 'writing', 'speaking', 'reading', 'listening', 'mock_test'];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 14px' }}>
      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>{label}</div>
      {payload.map(p => p.value && (
        <div key={p.dataKey} style={{ display: 'flex', gap: 6, marginBottom: 3, alignItems: 'center' }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: p.color }} />
          <span style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'capitalize' }}>{p.dataKey}:</span>
          <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color: p.color }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AdminUserProgress() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '32px 36px';

  const [days, setDays] = useState(30);
  const [module, setModule] = useState('all');
  const [page, setPage] = useState(1);

  const { data: userData } = useAdminUser(id);
  const { data: progress, isLoading } = useAdminUserProgress(id, days);
  const { data: sessionsData, isLoading: sessionsLoading } = useAdminUserSessions(id, { module: module === 'all' ? undefined : module, page });

  const user = userData?.user;
  const { latest_snapshot, module_stats, chart_data, total_sessions, streak_days } = progress ?? {};
  const sessions = sessionsData?.data ?? [];
  const meta = sessionsData?.meta ?? {};

  if (isLoading) {
    return (
      <div style={{ padding: pad }}>
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 14, borderRadius: 12 }} />)}
      </div>
    );
  }

  return (
    <div style={{ padding: pad, maxWidth: 1100 }}>
      <button onClick={() => navigate(`/admin/users/${id}`)}
        style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 18 }}>
        <ArrowLeft size={15} /> Back to {user?.name ?? 'User'}
      </button>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-success)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>{user?.name}'s Progress</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{user?.email}</p>
      </motion.div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: isMobile ? 10 : 16, marginBottom: 20 }}>
        {[
          { label: 'Overall Band', value: latest_snapshot?.overall_band ?? '—', color: getBandColor(latest_snapshot?.overall_band), mono: true, large: true },
          { label: 'Band Level', value: getBandLabel(latest_snapshot?.overall_band), color: getBandColor(latest_snapshot?.overall_band) },
          { label: 'Sessions', value: total_sessions ?? 0, color: 'var(--accent-secondary)' },
          { label: 'Day Streak', value: streak_days ?? 0, color: '#F59E0B', icon: Flame },
        ].map((s, i) => (
          <motion.div key={s.label} className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ padding: isMobile ? '14px' : '20px 22px', textAlign: 'center' }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontFamily: s.mono ? 'Space Mono' : 'Space Grotesk', fontSize: s.large ? (isMobile ? 34 : 40) : (isMobile ? 20 : 28), fontWeight: 700, color: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              {s.icon && <s.icon size={18} />}{s.value}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <GlowCard hover={false} style={{ padding: isMobile ? 16 : 24, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, flexWrap: 'wrap', gap: 10 }}>
          <h2 style={{ fontSize: isMobile ? 15 : 17, fontFamily: 'Space Grotesk' }}>Band Score Trend</h2>
          <div style={{ display: 'flex', gap: 6 }}>
            {[7, 14, 30, 60].map(d => (
              <button key={d} onClick={() => setDays(d)}
                style={{ padding: '4px 10px', borderRadius: 7, border: `1px solid ${days === d ? 'var(--accent-primary)' : 'var(--border)'}`, background: days === d ? 'rgba(124,58,237,0.15)' : 'transparent', color: days === d ? 'var(--accent-glow)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600, transition: 'all 0.2s' }}>
                {d}d
              </button>
            ))}
          </div>
        </div>
        {chart_data?.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <LineChart data={chart_data} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 9]} tick={{ fill: 'var(--text-muted)', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              {!isMobile && <Legend wrapperStyle={{ paddingTop: 12, fontSize: 11, color: 'var(--text-secondary)' }} />}
              {Object.entries(MODULE_COLORS).map(([key, color]) => (
                <Line key={key} type="monotone" dataKey={key} stroke={color} strokeWidth={isMobile ? 1.5 : 2} dot={{ fill: color, r: 2 }} activeDot={{ r: 4 }} connectNulls />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div style={{ height: isMobile ? 140 : 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>
            No progress snapshots in this period
          </div>
        )}
      </GlowCard>

      {/* Module breakdown */}
      <h2 style={{ fontSize: isMobile ? 15 : 17, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Module Breakdown</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 10 : 16, marginBottom: 28 }}>
        {Object.entries(module_stats ?? {}).map(([mod, stats]) => (
          <GlowCard key={mod} style={{ padding: isMobile ? 16 : 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'capitalize' }}>{mod}</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: isMobile ? 18 : 22, fontWeight: 700, color: getBandColor(stats.latest_band) }}>
                {stats.latest_band ?? '—'}
              </div>
            </div>
            <BandScoreBar label="Latest" score={stats.latest_band} />
            <BandScoreBar label="Avg" score={stats.avg_band} />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{stats.sessions} session{stats.sessions !== 1 ? 's' : ''}</div>
          </GlowCard>
        ))}
      </div>

      {/* Full session history */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: 14, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0 }}>
        <h2 style={{ fontSize: isMobile ? 15 : 17, fontFamily: 'Space Grotesk' }}>Full Session History</h2>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MODULE_FILTERS.map(m => (
            <button key={m} onClick={() => { setModule(m); setPage(1); }}
              style={{ padding: '5px 11px', borderRadius: 7, border: `1px solid ${module === m ? 'var(--accent-primary)' : 'var(--border)'}`, background: module === m ? 'rgba(124,58,237,0.15)' : 'transparent', color: module === m ? 'var(--accent-glow)' : 'var(--text-muted)', cursor: 'pointer', fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
              {m.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="glow-card" style={{ padding: 0, overflow: 'hidden' }}>
        {sessionsLoading ? (
          <div style={{ padding: 20 }}>
            {[...Array(5)].map((_, i) => <div key={i} className="skeleton" style={{ height: 44, marginBottom: 8, borderRadius: 8 }} />)}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-elevated)' }}>
                  {['Module', 'Band', 'Duration', 'Date'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: MODULE_COLORS[s.module] ?? 'var(--border)', flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', textTransform: 'capitalize' }}>{s.module.replace('_', ' ')}</span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: getBandColor(s.band_score) }}>{s.band_score ?? '—'}</td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)' }}>
                      {s.duration_seconds ? `${Math.round(s.duration_seconds / 60)}m` : '—'}
                    </td>
                    <td style={{ padding: '12px 14px', fontSize: 12, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatDate(s.created_at)}</td>
                  </tr>
                ))}
                {!sessions.length && (
                  <tr>
                    <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                      No sessions {module !== 'all' ? `for ${module.replace('_', ' ')}` : 'yet'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {meta.last_page > 1 && (
          <div style={{ display: 'flex', alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between', padding: isMobile ? '14px 16px' : '14px 20px', borderTop: '1px solid var(--border)', background: 'var(--bg-elevated)', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 10 : 0 }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Page {meta.current_page} of {meta.last_page} · {meta.total} sessions
            </span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={meta.current_page <= 1}
                className="btn-secondary" style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                <ChevronLeft size={14} /> Prev
              </button>
              <button onClick={() => setPage(p => Math.min(meta.last_page, p + 1))} disabled={meta.current_page >= meta.last_page}
                className="btn-secondary" style={{ padding: '6px 10px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
                Next <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
