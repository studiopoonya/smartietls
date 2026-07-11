import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Lightbulb, ArrowRight, BookOpen, Headphones, PenLine, Mic2, Zap } from 'lucide-react';
import { CURRICULUM } from '../../data/curriculum';
import { useLessonProgress, useCompleteLesson } from '../../hooks/useCurriculum';
import { useIsMobile } from '../../hooks/useIsMobile';

const ICONS = { BookOpen, Headphones, PenLine, Mic2 };

function TheorySection({ section, index, colorHex }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button onClick={() => setOpen(o => !o)} style={{
        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', background: open ? `${colorHex}08` : 'var(--bg-card)',
        border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12,
        borderBottom: open ? `1px solid ${colorHex}25` : 'none',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: `${colorHex}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'Space Mono', fontSize: 11, fontWeight: 700, color: colorHex }}>{index + 1}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'Space Grotesk' }}>{section.heading}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ padding: '16px 18px', background: 'var(--bg-card)' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: section.tips?.length ? 14 : 0, whiteSpace: 'pre-line' }}>
                {section.body}
              </p>
              {section.tips?.length > 0 && (
                <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${colorHex}20`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: colorHex }}>
                    <Lightbulb size={13} /> Tips
                  </div>
                  {section.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: i < section.tips.length - 1 ? 6 : 0 }}>
                      <span style={{ color: colorHex, fontSize: 14, lineHeight: 1.5, flexShrink: 0 }}>•</span>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{tip}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function LessonView() {
  const { skill, lessonId } = useParams();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { data: completed = [] } = useLessonProgress();
  const { mutate: completeLesson, isPending } = useCompleteLesson();

  const skillData = CURRICULUM[skill];
  if (!skillData) return null;

  const lessons = skillData.lessons;
  const lesson = lessons.find(l => l.id === lessonId);
  if (!lesson) return null;

  const lessonIndex = lessons.findIndex(l => l.id === lessonId);
  const isDone = completed.includes(lessonId);
  const nextLesson = lessons[lessonIndex + 1];
  const { colorHex, label } = skillData;
  const Icon = ICONS[skillData.icon] ?? BookOpen;

  const handleComplete = () => {
    completeLesson(lessonId, {
      onSuccess: () => {
        if (nextLesson) {
          navigate(`/learn/${skill}/lesson/${nextLesson.id}`);
        } else {
          navigate(`/learn/${skill}`);
        }
      },
    });
  };

  const pad = isMobile ? '20px 16px 80px' : '36px 40px';

  return (
    <div style={{ padding: pad, maxWidth: 720, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)' }}>
        <Link to={`/learn/${skill}`} style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', textDecoration: 'none', transition: 'color 0.15s' }}
          onMouseEnter={e => e.currentTarget.style.color = colorHex}
          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
          <ChevronLeft size={14} /> IELTS {label}
        </Link>
        <span>›</span>
        <span style={{ color: 'var(--text-secondary)' }}>Lesson {lessonIndex + 1}</span>
      </div>

      {/* Lesson header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: `${colorHex}20`, border: `1px solid ${colorHex}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Icon size={20} style={{ color: colorHex }} />
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, letterSpacing: '0.06em', marginBottom: 4 }}>
              LESSON {lessonIndex + 1} OF {lessons.length}
            </div>
            <h1 style={{ fontSize: isMobile ? 22 : 26, fontFamily: 'Space Grotesk', marginBottom: 6, lineHeight: 1.25 }}>{lesson.title}</h1>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{lesson.description}</p>
          </div>
        </div>

        {isDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: `${colorHex}10`, border: `1px solid ${colorHex}30`, borderRadius: 10, fontSize: 13, color: colorHex, fontWeight: 500 }}>
            <CheckCircle size={15} /> You have completed this lesson
          </div>
        )}
      </motion.div>

      {/* Theory sections */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>THEORY</div>
        {lesson.theory.map((section, i) => (
          <TheorySection key={i} section={section} index={i} colorHex={colorHex} />
        ))}
      </div>

      {/* Key takeaways */}
      <div style={{ background: `${colorHex}08`, border: `1px solid ${colorHex}25`, borderRadius: 14, padding: '16px 18px', marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Zap size={13} /> KEY TAKEAWAYS
        </div>
        {lesson.keyTakeaways.map((point, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, marginBottom: i < lesson.keyTakeaways.length - 1 ? 8 : 0 }}>
            <span style={{ color: colorHex, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
            <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{point}</span>
          </div>
        ))}
      </div>

      {/* Practice section */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>PRACTICE</div>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.6 }}>
          Apply what you've learned in a real AI-generated exercise. Spend at least 10–15 minutes practicing before marking this lesson complete.
        </p>
        <Link to={`/learn/${skill}/practice`} style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '11px 20px', borderRadius: 10,
          background: `linear-gradient(135deg, ${colorHex}, ${colorHex}cc)`,
          color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 600,
          boxShadow: `0 0 20px ${colorHex}30`,
        }}>
          Practice with AI <ArrowRight size={15} />
        </Link>
      </div>

      {/* Complete / Next */}
      {!isDone ? (
        <button onClick={handleComplete} disabled={isPending} style={{
          width: '100%', padding: '15px', borderRadius: 12, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
          background: `linear-gradient(135deg, ${colorHex}, ${colorHex}bb)`,
          color: 'white', fontSize: 16, fontWeight: 700, fontFamily: 'Space Grotesk',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          opacity: isPending ? 0.7 : 1,
          boxShadow: `0 0 28px ${colorHex}35`,
        }}>
          {isPending ? 'Saving...' : (
            <>
              <CheckCircle size={18} />
              {nextLesson ? `Complete & Go to Lesson ${lessonIndex + 2}` : 'Complete Lesson'}
            </>
          )}
        </button>
      ) : (
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to={`/learn/${skill}`} style={{
            flex: 1, padding: '13px', borderRadius: 12, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text-secondary)', textDecoration: 'none',
            fontSize: 14, fontWeight: 500, textAlign: 'center',
          }}>
            Back to Curriculum
          </Link>
          {nextLesson && (
            <Link to={`/learn/${skill}/lesson/${nextLesson.id}`} style={{
              flex: 2, padding: '13px', borderRadius: 12, border: 'none',
              background: `linear-gradient(135deg, ${colorHex}, ${colorHex}bb)`,
              color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700,
              fontFamily: 'Space Grotesk', textAlign: 'center', display: 'flex',
              alignItems: 'center', justifyContent: 'center', gap: 6,
            }}>
              Next Lesson <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
