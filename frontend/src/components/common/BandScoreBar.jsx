import { motion } from 'framer-motion';
import { getBandColor } from '../../lib/utils';

export default function BandScoreBar({ label, score, maxScore = 9 }) {
  const percent = score ? (score / maxScore) * 100 : 0;
  const color = getBandColor(score);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color }}>
          {score ?? '—'}
        </span>
      </div>
      <div style={{ height: 6, background: 'var(--bg-elevated)', borderRadius: 3, overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${color}, ${color}88)`, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}
