import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Flame } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useProgress, useProgressChart } from '../hooks/useProgress';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';
import BandScoreBar from '../components/common/BandScoreBar';
import { getBandColor, getBandLabel } from '../lib/utils';

const MODULE_COLORS = { overall: '#A855F7', writing: '#7C3AED', speaking: '#06B6D4', reading: '#10B981', listening: '#F59E0B' };

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

export default function Progress() {
  const [days, setDays] = useState(30);
  const { data: progress, isLoading } = useProgress();
  const { data: chartData } = useProgressChart(days);
  const isMobile = useIsMobile();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  if (isLoading) return (
    <div style={{ padding: pad }}>
      {[...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 100, marginBottom: 14 }} />)}
    </div>
  );

  const { latest_snapshot, module_stats, total_sessions, streak_days } = progress ?? {};

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <TrendingUp size={16} style={{ color: 'var(--accent-success)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Your Progress</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Track your IELTS journey</p>
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
        {chartData?.length > 0 ? (
          <ResponsiveContainer width="100%" height={isMobile ? 200 : 260}>
            <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: isMobile ? -20 : 0 }}>
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
            Complete practice sessions to see your progress chart
          </div>
        )}
      </GlowCard>

      {/* Module breakdown */}
      <h2 style={{ fontSize: isMobile ? 15 : 17, fontFamily: 'Space Grotesk', marginBottom: 14 }}>Module Breakdown</h2>
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(auto-fit, minmax(220px, 1fr))', gap: isMobile ? 10 : 16 }}>
        {Object.entries(module_stats ?? {}).map(([module, stats]) => (
          <GlowCard key={module} style={{ padding: isMobile ? 16 : 22 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: isMobile ? 13 : 15, fontWeight: 700, fontFamily: 'Space Grotesk', textTransform: 'capitalize' }}>{module}</div>
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
    </div>
  );
}
