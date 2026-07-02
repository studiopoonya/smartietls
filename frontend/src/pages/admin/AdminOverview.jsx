import { motion } from 'framer-motion';
import { Users, BookOpen, TrendingUp, Flame, BarChart2, UserPlus, Layers, RefreshCw } from 'lucide-react';
import { useAdminOverview } from '../../hooks/useAdmin';
import { useQueryClient } from '@tanstack/react-query';
import { useIsMobile } from '../../hooks/useIsMobile';

const MODULE_META = {
  writing:   { label: 'Writing',   color: '#7C3AED' },
  speaking:  { label: 'Speaking',  color: '#06B6D4' },
  reading:   { label: 'Reading',   color: '#10B981' },
  listening: { label: 'Listening', color: '#F59E0B' },
  mock_test: { label: 'Mock Test', color: '#EF4444' },
};

function StatCard({ icon: Icon, label, value, sub, color, delay }) {
  return (
    <motion.div className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      style={{ padding: '20px 22px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 8, background: `${color}18`, border: `1px solid ${color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={15} style={{ color }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontFamily: 'Space Mono', fontSize: 30, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{sub}</div>}
    </motion.div>
  );
}

export default function AdminOverview() {
  const { data, isLoading } = useAdminOverview();
  const qc = useQueryClient();
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '32px 36px';

  if (isLoading) {
    return (
      <div style={{ padding: pad }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginBottom: 24 }}>
          {[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, borderRadius: 12 }} />)}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 10 : 16 }}>
          {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 90, borderRadius: 12 }} />)}
        </div>
      </div>
    );
  }

  const { stats, sessions_by_module, daily_sessions, recent_users } = data ?? {};

  const maxModuleCount = Math.max(...Object.values(sessions_by_module ?? {}), 1);
  const maxDaily = Math.max(...(daily_sessions ?? []).map(d => d.count), 1);

  return (
    <div style={{ padding: pad, maxWidth: 1200 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', justifyContent: 'space-between', marginBottom: isMobile ? 20 : 28, flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 12 : 0 }}>
        <div>
          <h1 style={{ fontSize: isMobile ? 20 : 24, fontFamily: 'Space Grotesk', marginBottom: 4 }}>Platform Overview</h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Real-time metrics across all users</p>
        </div>
        <button onClick={() => qc.invalidateQueries({ queryKey: ['admin-overview'] })}
          className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '8px 14px', fontSize: 13 }}>
          <RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Top stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 10 : 16 }}>
        <StatCard icon={Users}     label="Total Users"       value={stats?.total_users ?? 0}     color="#7C3AED" delay={0} />
        <StatCard icon={Layers}    label="Total Sessions"    value={stats?.total_sessions ?? 0}   color="#06B6D4" delay={0.05} />
        <StatCard icon={BookOpen}  label="Total Vocab Saved" value={stats?.total_vocab ?? 0}      color="#10B981" delay={0.1} />
        <StatCard icon={TrendingUp} label="Avg Band Score"   value={stats?.avg_band ?? '—'}       color="#F59E0B" delay={0.15} />
      </div>

      {/* Secondary stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: isMobile ? 10 : 16, marginBottom: isMobile ? 20 : 28 }}>
        <StatCard icon={UserPlus}  label="New Users (7d)"     value={stats?.new_users_7d ?? 0}     sub="Registered this week"       color="#06B6D4" delay={0.2} />
        <StatCard icon={Flame}     label="Active Users (7d)"  value={stats?.active_users_7d ?? 0}  sub="Had activity this week"     color="#F59E0B" delay={0.25} />
        <StatCard icon={BarChart2} label="Sessions (7d)"      value={stats?.sessions_7d ?? 0}      sub="Practice sessions this week" color="#EF4444" delay={0.3} />
      </div>

      {/* Bottom row */}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 16 : 20, marginBottom: isMobile ? 20 : 28 }}>
        {/* Sessions by module */}
        <motion.div className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 14, fontFamily: 'Space Grotesk', marginBottom: 18, fontWeight: 700 }}>Sessions by Module</h3>
          {Object.entries(MODULE_META).map(([key, { label, color }]) => {
            const count = sessions_by_module?.[key] ?? 0;
            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, alignItems: 'center' }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                  <span style={{ fontFamily: 'Space Mono', fontSize: 12, fontWeight: 700, color }}>{count}</span>
                </div>
                <div style={{ height: 7, background: 'var(--border)', borderRadius: 4, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${(count / maxModuleCount) * 100}%` }}
                    transition={{ delay: 0.4, duration: 0.7, ease: 'easeOut' }}
                    style={{ height: '100%', background: color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Recent users */}
        <motion.div className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          style={{ padding: '22px 24px' }}>
          <h3 style={{ fontSize: 14, fontFamily: 'Space Grotesk', marginBottom: 18, fontWeight: 700 }}>Newest Users</h3>
          {(recent_users ?? []).map((u, i) => (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: i < recent_users.length - 1 ? 12 : 0, marginBottom: i < recent_users.length - 1 ? 12 : 0, borderBottom: i < recent_users.length - 1 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {u.name?.charAt(0)?.toUpperCase()}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.name}</span>
                  {u.is_admin && <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent-primary)', background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', borderRadius: 4, padding: '1px 5px', flexShrink: 0 }}>ADMIN</span>}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.email}</div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0, fontFamily: 'Space Mono' }}>
                {u.learning_sessions_count}s
              </div>
            </div>
          ))}
          {!recent_users?.length && <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: '20px 0' }}>No users yet</div>}
        </motion.div>
      </div>

      {/* Daily activity chart */}
      {daily_sessions?.length > 0 && (
        <motion.div className="glow-card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
          style={{ padding: '22px 24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
            <h3 style={{ fontSize: 14, fontFamily: 'Space Grotesk', fontWeight: 700 }}>Daily Sessions (Last 30 Days)</h3>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{daily_sessions.length} days with activity</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 72 }}>
            {daily_sessions.map((d, i) => (
              <div key={d.date} title={`${d.date}: ${d.count} session${d.count !== 1 ? 's' : ''}`}
                style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', height: '100%' }}>
                <motion.div initial={{ height: 0 }} animate={{ height: `${Math.max((d.count / maxDaily) * 64, 3)}px` }}
                  transition={{ delay: 0.5 + i * 0.01, duration: 0.4, ease: 'easeOut' }}
                  style={{ width: '100%', background: 'var(--accent-primary)', borderRadius: 2, opacity: 0.75 }} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{daily_sessions[0]?.date}</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{daily_sessions[daily_sessions.length - 1]?.date}</span>
          </div>
        </motion.div>
      )}
    </div>
  );
}
