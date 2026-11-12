import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle, FlaskConical, Lock, RotateCcw } from 'lucide-react';
import { useCurriculum, useErrorBank, useUpdateSkillMinimums, useUpdateTargetBand } from '../../hooks/useCurriculum';
import { BASELINE_SKILLS, SKILLS, TARGET_BANDS, nextAvailableLesson } from '../../data/skills';
import { getBandColor } from '../../lib/utils';
import { useIsMobile } from '../../hooks/useIsMobile';
import FeedbackLanguageToggle from '../../components/common/FeedbackLanguage';

const PHASE_COLORS = ['#CF2873', '#6A35E8', '#AE5408', '#0A7A9E'];
const emptyMinimums = Object.fromEntries(BASELINE_SKILLS.map(skill => [skill, null]));

export function BaselineCard({ baseline }) {
  const target = baseline.targetBand ?? 7;
  const minimums = baseline.skillMinimums ?? {};
  const setCount = BASELINE_SKILLS.filter(skill => minimums[skill] != null).length;
  const { mutate: updateTarget, isPending } = useUpdateTargetBand();
  const { mutate: updateMinimums, isPending: savingMinimums } = useUpdateSkillMinimums();
  return (
    <div className="glow-card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <h2 style={{ fontSize: 15, fontFamily: 'var(--font-display)' }}>Your Current Baseline</h2>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
          University target
          <select aria-label="University target band" value={target} disabled={isPending} onChange={e => updateTarget(Number(e.target.value))} style={{ fontFamily: 'var(--font-score)', fontWeight: 700, fontSize: 13, padding: '3px 6px', borderRadius: 6, color: 'var(--text-primary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}>
            {TARGET_BANDS.map(band => <option key={band} value={band}>{band.toFixed(1)}</option>)}
          </select>
        </label>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
        {BASELINE_SKILLS.map(skill => {
          const band = baseline.bands?.[skill];
          const required = minimums[skill] ?? target;
          return (
            <div key={skill} style={{ textAlign: 'center', padding: '10px 4px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
              <div style={{ fontFamily: 'var(--font-score)', fontSize: 20, fontWeight: 700, color: band ? getBandColor(band) : 'var(--text-muted)' }}>{band ?? '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{SKILLS[skill].label}</div>
              {band != null && <div style={{ fontSize: 12, marginTop: 2, color: band >= required ? 'var(--accent-success)' : 'var(--accent-warning)' }}>{band >= required ? 'On target' : `${(required - band).toFixed(1)} to go`}</div>}
            </div>
          );
        })}
      </div>

      <details style={{ marginTop: 12 }}>
        <summary style={{ cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>Minimum per skill{setCount > 0 ? ` (${setCount} set)` : ' (optional)'}</summary>
        <p style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, margin: '4px 0 10px' }}>Many programmes also need a minimum in each skill, for example "no band below 6.0". Check your programme's official page.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: 8 }}>
          {BASELINE_SKILLS.map(skill => (
            <label key={skill} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6, fontSize: 13, color: 'var(--text-secondary)' }}>
              {SKILLS[skill].label}
              <select aria-label={`${SKILLS[skill].label} minimum band`} value={minimums[skill] ?? ''} disabled={savingMinimums} onChange={e => updateMinimums({ ...emptyMinimums, ...minimums, [skill]: e.target.value === '' ? null : Number(e.target.value) })} style={{ fontFamily: 'var(--font-score)', fontWeight: 700, fontSize: 13, padding: '3px 6px', borderRadius: 6, color: 'var(--text-primary)', background: 'var(--bg-elevated)', border: '1px solid var(--border)', cursor: 'pointer' }}>
                <option value="">None</option>
                {TARGET_BANDS.map(band => <option key={band} value={band}>{band.toFixed(1)}</option>)}
              </select>
            </label>
          ))}
        </div>
      </details>
    </div>
  );
}

function PhaseHeader({ phase, done }) {
  return (
    <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-score)', fontSize: 18, fontWeight: 700, color: 'white', background: done ? 'var(--accent-success)' : PHASE_COLORS[phase.number - 1], boxShadow: 'inset 0 -3px 0 rgba(0,0,0,0.2)' }}>
        {done ? <CheckCircle size={19} /> : phase.number}
      </div>
      <div>
        <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 2 }}>{phase.title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{phase.description}</p>
      </div>
    </div>
  );
}

function ModuleLinks({ modules }) {
  const skills = [...new Set(modules.map(m => m.skill))];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 8 }}>
      {skills.map(skill => {
        const list = modules.filter(m => m.skill === skill);
        const lessons = list.flatMap(m => m.lessons);
        const done = lessons.filter(l => l.status === 'completed').length;
        const { label, colorHex, icon: Icon } = SKILLS[skill];
        const allLocked = lessons.every(l => l.status === 'locked');
        return (
          <Link key={skill} to={`/learn/${skill}`} style={{ textDecoration: 'none', padding: '12px 14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, opacity: allLocked ? 0.6 : 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Icon size={15} style={{ color: colorHex }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1 }}>{label}</span>
              {allLocked && <Lock size={12} style={{ color: 'var(--text-muted)' }} />}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>{list.length} module{list.length > 1 ? 's' : ''} · {done}/{lessons.length} lessons</div>
            <div style={{ height: 4, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${lessons.length ? (done / lessons.length) * 100 : 0}%`, background: colorHex }} />
            </div>
          </Link>
        );
      })}
    </div>
  );
}

export default function LearningPath() {
  const isMobile = useIsMobile();
  const { data: snapshot, isLoading } = useCurriculum();
  const { data: errorBank } = useErrorBank();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  if (isLoading || !snapshot) {
    return <div style={{ padding: pad, maxWidth: 820, margin: '0 auto' }}>{[...Array(4)].map((_, i) => <div key={i} className="skeleton" style={{ height: 130, borderRadius: 14, marginBottom: 14 }} />)}</div>;
  }

  const { phases, modules, gates, baseline, track } = snapshot;
  const next = nextAvailableLesson(snapshot);
  const byPhase = (n) => modules.filter(m => m.phase === n);
  const { components, pendingRewrite, examUnlocked } = gates;

  return (
    <div style={{ padding: pad, maxWidth: 820, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <h1 style={{ fontSize: isMobile ? 22 : 28, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{track.title} Learning Path</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 10 }}>{track.description}</p>
        <FeedbackLanguageToggle label="Claude explains in" />
      </motion.div>

      {pendingRewrite ? (
        <Link to="/error-bank" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, marginBottom: 14, textDecoration: 'none', color: 'var(--accent-warning)', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', fontSize: 14, fontWeight: 600 }}>
          <AlertTriangle size={17} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>Rewrite Challenge required for {pendingRewrite.moduleTitle} before you can continue</span>
          <ArrowRight size={16} />
        </Link>
      ) : next && (
        <Link to={`/learn/${next.skill}/lesson/${next.slug}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', borderRadius: 12, marginBottom: 14, textDecoration: 'none', color: 'white', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-glow))' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, opacity: 0.85 }}>CONTINUE · {next.moduleTitle}</div>
            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)' }}>{next.title}</div>
          </div>
          <ArrowRight size={17} />
        </Link>
      )}

      <div style={{ marginBottom: 26 }}><BaselineCard baseline={baseline} /></div>

      <section style={{ marginBottom: 26 }}>
        <PhaseHeader phase={phases[0]} done={gates.placementComplete} />
        <ModuleLinks modules={byPhase(1)} />
      </section>

      <section style={{ marginBottom: 26 }}>
        <PhaseHeader phase={phases[1]} done={components.completed === components.total} />
        <ModuleLinks modules={byPhase(2)} />
      </section>

      <section style={{ marginBottom: 26 }}>
        <PhaseHeader phase={phases[2]} />
        <Link to="/error-bank" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none' }}>
          <RotateCcw size={17} style={{ color: 'var(--accent-danger)', flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>Error Bank</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{errorBank ? `${errorBank.daily.length} due today · ${errorBank.stats.quarantined} in quarantine · ${errorBank.stats.cleared} cleared` : 'Grammar & Collocation Quarantine and Rewrite Challenges'}</div>
          </div>
          <ArrowRight size={15} style={{ color: 'var(--text-muted)' }} />
        </Link>
      </section>

      <section>
        <PhaseHeader phase={phases[3]} />
        <Link to="/mock-test" style={{ display: 'block', padding: '14px 16px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, textDecoration: 'none' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
            {examUnlocked ? <FlaskConical size={17} style={{ color: 'var(--accent-danger)' }} /> : <Lock size={15} style={{ color: 'var(--text-muted)' }} />}
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', flex: 1 }}>Full Simulation & Readiness Report</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-score)', color: 'var(--text-muted)' }}>{components.percent}% / {components.required}%</span>
          </div>
          <div style={{ height: 5, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (components.percent / components.required) * 100)}%`, background: examUnlocked ? 'var(--accent-success)' : 'var(--accent-primary)' }} />
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>{components.completed} of {components.total} component modules complete</div>
        </Link>
      </section>
    </div>
  );
}
