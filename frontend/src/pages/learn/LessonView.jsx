import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronDown, ChevronUp, CheckCircle, Lightbulb, ArrowRight, Lock, Zap, Languages } from 'lucide-react';
import { LOCK_MESSAGES, SKILLS, allLessons } from '../../data/skills';
import { useCurriculum, useLesson, useLessonInBahasa } from '../../hooks/useCurriculum';
import FeedbackLanguageToggle from '../../components/common/FeedbackLanguage';
import StagedLoader from '../../components/feedback/StagedLoader';
import { useIsMobile } from '../../hooks/useIsMobile';
import DrillCard from '../../components/drills/DrillCard';

function TheorySection({ section, index, colorHex }) {
  const [open, setOpen] = useState(index === 0);

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 10 }}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: open ? `${colorHex}08` : 'var(--bg-card)', border: 'none', cursor: 'pointer', textAlign: 'left', gap: 12, borderBottom: open ? `1px solid ${colorHex}25` : 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 7, background: `${colorHex}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontFamily: 'var(--font-score)', fontSize: 12, fontWeight: 700, color: colorHex }}>{index + 1}</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>{section.heading}</span>
        </div>
        {open ? <ChevronUp size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}>
            <div style={{ padding: '16px 18px', background: 'var(--bg-card)' }}>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.75, marginBottom: section.tips?.length ? 14 : 0, whiteSpace: 'pre-line' }}>{section.body}</p>
              {section.tips?.length > 0 && (
                <div style={{ background: 'var(--bg-elevated)', border: `1px solid ${colorHex}20`, borderRadius: 10, padding: '12px 14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: 12, fontWeight: 600, color: colorHex }}><Lightbulb size={13} /> Tips</div>
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

function BahasaExplanation({ slug, colorHex }) {
  const [open, setOpen] = useState(false);
  const { data, isFetching, isError, error, refetch } = useLessonInBahasa(slug, open);

  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="btn-secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', fontSize: 14, marginBottom: 16, color: colorHex }}>
        <Languages size={16} /> Jelaskan dalam Bahasa Indonesia
      </button>
    );
  }

  return (
    <section aria-label="Penjelasan dalam Bahasa Indonesia" style={{ border: `2px solid ${colorHex}40`, borderRadius: 14, padding: '14px 16px', marginBottom: 20, background: 'var(--bg-card)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: colorHex, letterSpacing: '0.04em' }}><Languages size={14} /> PENJELASAN BAHASA INDONESIA</div>
        <button type="button" data-compact onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--text-muted)', textDecoration: 'underline' }}>Tutup</button>
      </div>
      {isFetching && !data && <StagedLoader stages={['Membaca materi lesson', 'Menyusun penjelasan sederhana', 'Merangkum poin penting']} colorHex={colorHex} note="Penjelasan pertama butuh beberapa detik, setelah itu langsung muncul." />}
      {isError && (
        <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
          {error?.response?.data?.message ?? 'Penjelasan belum bisa dibuat.'}
          <button type="button" className="btn-secondary" onClick={() => refetch()} style={{ display: 'block', marginTop: 8, padding: '7px 14px', fontSize: 13 }}>Coba lagi</button>
        </div>
      )}
      {data && (
        <div>
          <p style={{ fontSize: 15, color: 'var(--text-primary)', lineHeight: 1.7, marginBottom: 12 }}>{data.summary}</p>
          {data.points.map((point, i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text-primary)', marginBottom: 2 }}>{i + 1}. {point.heading}</div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{point.body}</p>
            </div>
          ))}
          {data.takeaways.length > 0 && (
            <div style={{ padding: '10px 12px', borderRadius: 10, background: `${colorHex}10`, marginTop: 6 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: colorHex, marginBottom: 4 }}>INTINYA</div>
              {data.takeaways.map((item, i) => <div key={i} style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>✓ {item}</div>)}
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function LockedLesson({ skill, reason, isMobile }) {
  return (
    <div style={{ padding: isMobile ? '40px 16px' : '60px 40px', maxWidth: 520, margin: '0 auto', textAlign: 'center' }}>
      <Lock size={30} style={{ color: 'var(--text-muted)', marginBottom: 14 }} />
      <h1 style={{ fontSize: 20, fontFamily: 'var(--font-display)', marginBottom: 8 }}>This lesson is locked</h1>
      <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>{LOCK_MESSAGES[reason] ?? 'Complete the earlier steps first.'}</p>
      <Link to={reason === 'rewrite' ? '/error-bank' : reason === 'diagnostic' ? '/learn/foundation' : `/learn/${skill}`} className="btn-primary" style={{ padding: '11px 22px', textDecoration: 'none', display: 'inline-block' }}>
        {reason === 'rewrite' ? 'Go to Rewrite Challenge' : reason === 'diagnostic' ? 'Go to the diagnostic' : 'Back to module'}
      </Link>
    </div>
  );
}

export default function LessonView() {
  const { skill, lessonId } = useParams();
  const isMobile = useIsMobile();
  const { data: lesson, isLoading, error } = useLesson(lessonId);
  const { data: snapshot } = useCurriculum();

  const skillData = SKILLS[skill];
  if (!skillData) return null;

  if (error?.response?.status === 423) return <LockedLesson skill={skill} reason={error.response.data.lockReason} isMobile={isMobile} />;

  const pad = isMobile ? '20px 16px 80px' : '36px 40px';

  if (error) return <div style={{ padding: pad, color: 'var(--text-muted)' }}>This lesson could not be loaded.</div>;

  if (isLoading || !lesson) {
    return <div style={{ padding: pad, maxWidth: 720, margin: '0 auto' }}><div className="skeleton" style={{ height: 240, borderRadius: 14 }} /></div>;
  }

  const { colorHex, label } = skillData;
  const lessons = allLessons(snapshot).filter(l => l.skill === skill);
  const position = lessons.findIndex(l => l.slug === lessonId);
  const current = lessons[position];
  const next = lessons[position + 1];
  const isDone = current?.status === 'completed';
  const { theory, keyTakeaways } = lesson.content;

  return (
    <div style={{ padding: pad, maxWidth: 720, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24, fontSize: 13, color: 'var(--text-muted)', flexWrap: 'wrap' }}>
        <Link to={`/learn/${skill}`} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '10px 10px 10px 0', color: 'var(--text-muted)', textDecoration: 'none' }}>
          <ChevronLeft size={14} /> {label}
        </Link>
        <span>›</span>
        <span>{lesson.module.title}</span>
      </div>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, letterSpacing: '0.06em', marginBottom: 4 }}>PHASE {lesson.module.phase} · {lesson.duration} MIN</div>
        <h1 style={{ fontSize: isMobile ? 22 : 26, fontFamily: 'var(--font-display)', marginBottom: 6, lineHeight: 1.25 }}>{lesson.title}</h1>
        <p style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{lesson.description}</p>
        {isDone && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', marginTop: 12, background: `${colorHex}10`, border: `1px solid ${colorHex}30`, borderRadius: 10, fontSize: 13, color: colorHex, fontWeight: 500 }}>
            <CheckCircle size={15} /> You have completed this lesson
          </div>
        )}
      </motion.div>

      {theory.length > 0 && <BahasaExplanation slug={lesson.slug} colorHex={colorHex} />}

      {theory.length > 0 && (
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: 12 }}>CONCEPT</div>
          {theory.map((section, i) => <TheorySection key={section.heading} section={section} index={i} colorHex={colorHex} />)}
        </div>
      )}

      {keyTakeaways.length > 0 && (
        <div style={{ background: `${colorHex}08`, border: `1px solid ${colorHex}25`, borderRadius: 14, padding: '16px 18px', marginBottom: 28 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: colorHex, letterSpacing: '0.06em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}><Zap size={13} /> KEY TAKEAWAYS</div>
          {keyTakeaways.map((point, i) => (
            <div key={point} style={{ display: 'flex', gap: 10, marginBottom: i < keyTakeaways.length - 1 ? 8 : 0 }}>
              <span style={{ color: colorHex, fontWeight: 700, fontSize: 14, flexShrink: 0 }}>✓</span>
              <span style={{ fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6 }}>{point}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap', marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '0.08em' }}>DRILL</div>
        {lesson.drills.some(d => d.evaluator === 'claude') && <FeedbackLanguageToggle />}
      </div>
      {lesson.drills.map(drill => <DrillCard key={drill.slug} drill={drill} colorHex={colorHex} />)}

      {isDone && (
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <Link to={`/learn/${skill}`} style={{ flex: 1, padding: 13, borderRadius: 12, border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: 14, fontWeight: 500, textAlign: 'center' }}>Back to modules</Link>
          {next && next.status !== 'locked' && (
            <Link to={`/learn/${skill}/lesson/${next.slug}`} style={{ flex: 2, padding: 13, borderRadius: 12, background: colorHex, color: 'white', textDecoration: 'none', fontSize: 14, fontWeight: 700, fontFamily: 'var(--font-display)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              Next lesson <ArrowRight size={15} />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
