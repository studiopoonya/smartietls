import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, ChevronRight, Clock } from 'lucide-react';
import { LOCK_MESSAGES, SKILLS } from '../../data/skills';
import { useCurriculum } from '../../hooks/useCurriculum';
import { useIsMobile } from '../../hooks/useIsMobile';

function LessonRow({ lesson, skill, number, colorHex, isMobile }) {
  const isDone = lesson.status === 'completed';
  const isCurrent = lesson.status === 'available';
  const locked = lesson.status === 'locked';

  const row = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: isMobile ? '12px 14px' : '14px 18px', background: isCurrent ? `${colorHex}08` : 'var(--bg-card)', border: `1px solid ${isDone ? `${colorHex}40` : isCurrent ? `${colorHex}30` : 'var(--border)'}`, borderRadius: 12, opacity: locked ? 0.55 : 1 }}>
      <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDone ? `${colorHex}20` : 'var(--bg-elevated)', border: `2px solid ${isDone ? colorHex : isCurrent ? `${colorHex}60` : 'var(--border)'}` }}>
        {isDone ? <CheckCircle size={16} style={{ color: colorHex }} /> : locked ? <Lock size={13} style={{ color: 'var(--text-muted)' }} /> : <span style={{ fontFamily: 'var(--font-score)', fontSize: 12, fontWeight: 700, color: colorHex }}>{number}</span>}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: locked ? 'var(--text-muted)' : 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>{lesson.title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{locked ? LOCK_MESSAGES[lesson.lockReason] : lesson.description}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, color: 'var(--text-muted)', fontSize: 12 }}>
        <Clock size={12} /> {lesson.duration}m
        {!locked && <ChevronRight size={15} style={{ color: colorHex }} />}
      </div>
    </div>
  );

  return locked ? row : <Link to={`/learn/${skill}/lesson/${lesson.slug}`} style={{ textDecoration: 'none', display: 'block' }}>{row}</Link>;
}

export default function CurriculumPage() {
  const { skill } = useParams();
  const isMobile = useIsMobile();
  const { data: snapshot, isLoading } = useCurriculum();

  const skillData = SKILLS[skill];
  if (!skillData) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Skill not found.</div>;

  const { label, colorHex, description, icon: Icon } = skillData;
  const modules = snapshot?.modules.filter(m => m.skill === skill) ?? [];
  const lessons = modules.flatMap(m => m.lessons);
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progress = lessons.length ? Math.round((completedCount / lessons.length) * 100) : 0;
  let lessonNumber = 0;

  return (
    <div style={{ padding: isMobile ? '20px 16px' : '36px 40px', maxWidth: 760, margin: '0 auto' }}>
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${colorHex}20`, border: `1px solid ${colorHex}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={22} style={{ color: colorHex }} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontFamily: 'var(--font-display)', marginBottom: 4 }}>{skill === 'foundation' ? 'Phase 1: Foundation' : `${label} Track`}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{description}</p>
          </div>
        </div>
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-score)', color: colorHex }}>{completedCount}/{lessons.length} lessons</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }} style={{ height: '100%', background: colorHex, borderRadius: 99 }} />
          </div>
        </div>
      </motion.div>

      {isLoading ? (
        [...Array(3)].map((_, i) => <div key={i} className="skeleton" style={{ height: 140, borderRadius: 14, marginBottom: 14 }} />)
      ) : modules.map(module => (
        <section key={module.slug} style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <h2 style={{ fontSize: 16, fontFamily: 'var(--font-display)' }}>{module.title}</h2>
            {module.optional && <span style={{ fontSize: 12, fontWeight: 700, color: colorHex, background: `${colorHex}15`, padding: '1px 8px', borderRadius: 99 }}>Optional</span>}
            {module.status === 'completed' && <CheckCircle size={15} style={{ color: colorHex }} />}
            {module.status === 'locked' && <Lock size={13} style={{ color: 'var(--text-muted)' }} />}
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 10 }}>{module.description}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {module.lessons.map(lesson => {
              lessonNumber += 1;
              return <LessonRow key={lesson.slug} lesson={lesson} skill={skill} number={lessonNumber} colorHex={colorHex} isMobile={isMobile} />;
            })}
          </div>
        </section>
      ))}

      {skill !== 'foundation' && (
        <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginBottom: 2 }}>Free Practice Mode</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Practice freely without following the path</div>
          </div>
          <Link to={`/learn/${skill}/practice`} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>Free Practice →</Link>
        </div>
      )}
    </div>
  );
}
