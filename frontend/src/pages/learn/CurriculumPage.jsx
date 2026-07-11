import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Lock, ChevronRight, Clock, BookOpen, Headphones, PenLine, Mic2 } from 'lucide-react';
import { CURRICULUM } from '../../data/curriculum';
import { useLessonProgress } from '../../hooks/useCurriculum';
import { useIsMobile } from '../../hooks/useIsMobile';

const ICONS = { BookOpen, Headphones, PenLine, Mic2 };

export default function CurriculumPage() {
  const { skill } = useParams();
  const isMobile = useIsMobile();
  const { data: completed = [], isLoading } = useLessonProgress();

  const skillData = CURRICULUM[skill];
  if (!skillData) return <div style={{ padding: 40, color: 'var(--text-muted)' }}>Skill not found.</div>;

  const { lessons, label, color, colorHex, description, icon } = skillData;
  const Icon = ICONS[icon] ?? BookOpen;

  const completedCount = lessons.filter(l => completed.includes(l.id)).length;
  const progress = Math.round((completedCount / lessons.length) * 100);

  const isUnlocked = (index) => {
    if (index === 0) return true;
    return completed.includes(lessons[index - 1].id);
  };

  const pad = isMobile ? '20px 16px' : '36px 40px';

  return (
    <div style={{ padding: pad, maxWidth: 760, margin: '0 auto' }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: `${colorHex}20`, border: `1px solid ${colorHex}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={22} style={{ color: colorHex }} />
          </div>
          <div>
            <h1 style={{ fontSize: isMobile ? 22 : 28, fontFamily: 'Space Grotesk', marginBottom: 4 }}>IELTS {label}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{description}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ background: 'var(--bg-elevated)', borderRadius: 12, padding: '14px 18px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Your progress</span>
            <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'Space Mono', color: colorHex }}>{completedCount}/{lessons.length} lessons</span>
          </div>
          <div style={{ height: 6, background: 'var(--border)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: `linear-gradient(90deg, ${colorHex}, ${colorHex}99)`, borderRadius: 99 }} />
          </div>
          {progress === 100 && (
            <div style={{ marginTop: 8, fontSize: 13, color: colorHex, fontWeight: 600 }}>
              🎉 All lessons complete! Try the Mock Test to test yourself.
            </div>
          )}
        </div>
      </motion.div>

      {/* Lessons list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {isLoading ? (
          [...Array(5)].map((_, i) => (
            <div key={i} className="skeleton" style={{ height: 88, borderRadius: 14 }} />
          ))
        ) : (
          lessons.map((lesson, index) => {
            const isDone = completed.includes(lesson.id);
            const unlocked = isUnlocked(index);
            const isCurrent = !isDone && unlocked;

            return (
              <motion.div key={lesson.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.06 }}>
                {unlocked ? (
                  <Link to={`/learn/${skill}/lesson/${lesson.id}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: isMobile ? '14px 16px' : '16px 20px',
                      background: isCurrent ? `${colorHex}08` : 'var(--bg-card)',
                      border: `1px solid ${isDone ? colorHex + '40' : isCurrent ? colorHex + '30' : 'var(--border)'}`,
                      borderRadius: 14, cursor: 'pointer', transition: 'all 0.2s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.borderColor = colorHex + '60'}
                      onMouseLeave={e => e.currentTarget.style.borderColor = isDone ? colorHex + '40' : isCurrent ? colorHex + '30' : 'var(--border)'}>
                      {/* Step indicator */}
                      <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: isDone ? `${colorHex}20` : isCurrent ? `${colorHex}15` : 'var(--bg-elevated)',
                        border: `2px solid ${isDone ? colorHex : isCurrent ? colorHex + '60' : 'var(--border)'}` }}>
                        {isDone
                          ? <CheckCircle size={18} style={{ color: colorHex }} />
                          : <span style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: isCurrent ? colorHex : 'var(--text-muted)' }}>{index + 1}</span>}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                          <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: isDone ? 'var(--text-secondary)' : 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>
                            {lesson.title}
                          </span>
                          {isDone && <span style={{ fontSize: 11, fontWeight: 600, color: colorHex, background: `${colorHex}15`, padding: '2px 8px', borderRadius: 99 }}>Done</span>}
                          {isCurrent && <span style={{ fontSize: 11, fontWeight: 600, color: colorHex, background: `${colorHex}15`, padding: '2px 8px', borderRadius: 99 }}>Current</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {lesson.description}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                          <Clock size={12} /> {lesson.duration}
                        </div>
                        <ChevronRight size={16} style={{ color: colorHex, opacity: 0.7 }} />
                      </div>
                    </div>
                  </Link>
                ) : (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: isMobile ? '14px 16px' : '16px 20px',
                    background: 'var(--bg-card)', border: '1px solid var(--border)',
                    borderRadius: 14, opacity: 0.5,
                  }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-elevated)', border: '2px solid var(--border)' }}>
                      <Lock size={14} style={{ color: 'var(--text-muted)' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, color: 'var(--text-muted)', fontFamily: 'Space Grotesk', marginBottom: 3 }}>{lesson.title}</div>
                      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Complete the previous lesson to unlock</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: 12 }}>
                      <Clock size={12} /> {lesson.duration}
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </div>

      {/* Free Practice link */}
      <div style={{ marginTop: 28, padding: '16px 20px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Space Grotesk', marginBottom: 2 }}>Free Practice Mode</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Practice freely without following the curriculum</div>
        </div>
        <Link to={`/learn/${skill}/practice`} style={{ padding: '9px 18px', borderRadius: 10, background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap' }}>
          Free Practice →
        </Link>
      </div>
    </div>
  );
}
