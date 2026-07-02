import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { BookOpen, RefreshCw, CheckCircle, XCircle, X, Lock } from 'lucide-react';
import { useReadingGenerate } from '../../hooks/useAI';
import { useLevels } from '../../hooks/useLevels';
import { useIsMobile } from '../../hooks/useIsMobile';
import GlowCard from '../../components/common/GlowCard';
import Timer from '../../components/common/Timer';
import api from '../../lib/axios';

const TOPICS = ['Environment & Climate', 'Technology & AI', 'Health & Medicine', 'Education & Society', 'Business & Economy', 'Science & Space', 'Art & Culture', 'Urban Development', 'Psychology & Behaviour', 'Renewable Energy'];
const DIFFICULTIES = [5, 6, 7, 8, 9];

const pickParams = (maxLevel) => {
  const pool = DIFFICULTIES.filter(d => d <= maxLevel);
  return {
    topic: TOPICS[Math.floor(Math.random() * TOPICS.length)],
    difficulty: pool.length ? pool[Math.floor(Math.random() * pool.length)] : 5,
  };
};

export default function Reading() {
  const [passage, setPassage] = useState(null);
  const [genParams, setGenParams] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  const isMobile = useIsMobile();
  const { mutate: generate, isPending } = useReadingGenerate();
  const { data: levels } = useLevels();
  const qc = useQueryClient();
  const unlockedLevel = levels?.reading ?? 5;
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const handleGenerate = () => {
    setPassage(null); setAnswers({}); setSubmitted(false); setScore(null); setShowQuestions(false);
    const params = pickParams(unlockedLevel);
    setGenParams(params);
    generate(params, {
      onSuccess: (data) => { setPassage(data); setTimerRunning(true); },
    });
  };

  // Auto-generate on first load
  useEffect(() => { handleGenerate(); }, []);

  const handleSubmit = () => {
    if (!passage) return;
    setTimerRunning(false);
    let correct = 0;
    passage.questions.forEach(q => {
      const ans = passage.answers[q.id];
      const userAns = answers[q.id];
      if (userAns && ans && userAns.toLowerCase().trim() === ans.toLowerCase().trim()) correct++;
    });
    const total = passage.questions.length;
    const band = Math.max(4, Math.min(9, 4 + (correct / total) * 5));
    setScore({ correct, total, band: band.toFixed(1) });
    setSubmitted(true);
    if (isMobile) setShowQuestions(false);
    api.post('/sessions', {
      module: 'reading',
      input_data: { topic: genParams?.topic, difficulty: passage.difficulty ?? genParams?.difficulty },
      ai_feedback: { correct, total },
      band_score: band,
    }).catch(() => {}).finally(() => qc.invalidateQueries({ queryKey: ['levels'] }));
  };

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BookOpen size={16} style={{ color: 'var(--accent-success)' }} />
            </div>
            <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Reading Practice</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 20, padding: '5px 12px' }}>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Unlocked</span>
            <span style={{ fontFamily: 'Space Mono', fontSize: 13, fontWeight: 700, color: 'var(--accent-success)' }}>Band {unlockedLevel}</span>
            {unlockedLevel < 9 && <Lock size={11} style={{ color: 'var(--text-muted)' }} />}
          </div>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>AI-generated IELTS passages with authentic questions, adapted to your level</p>
      </motion.div>

      {/* Mobile questions modal */}
      <AnimatePresence>
        {isMobile && showQuestions && passage && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg-secondary)', overflowY: 'auto', padding: '0 0 80px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Questions ({passage.questions?.length})</span>
              <button onClick={() => setShowQuestions(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px' }}>
              {passage.questions?.map((q, i) => (
                <QuestionItem key={q.id} q={q} i={i} total={passage.questions.length} answers={answers} setAnswers={setAnswers} submitted={submitted} passage={passage} />
              ))}
              {!submitted ? (
                <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '14px', fontSize: 15 }}>Submit Answers</button>
              ) : score && <ScoreResult score={score} onNew={handleGenerate} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isPending && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: 'var(--accent-success)', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Generating passage...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {passage && !isMobile && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20 }}>
          <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 2 }}>Passage</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>{passage.title}</div>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Timer running={timerRunning} />
                <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '6px 12px', fontSize: 12 }}>New</button>
              </div>
            </div>
            <div style={{ padding: '20px', lineHeight: 1.9, fontSize: 14, color: 'var(--text-secondary)', maxHeight: '62vh', overflowY: 'auto' }}>
              {passage.passage}
            </div>
          </GlowCard>
          <GlowCard hover={false} style={{ padding: 18 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, fontFamily: 'Space Grotesk' }}>Questions ({passage.questions?.length})</div>
            <div style={{ maxHeight: '62vh', overflowY: 'auto' }}>
              {passage.questions?.map((q, i) => (
                <QuestionItem key={q.id} q={q} i={i} total={passage.questions.length} answers={answers} setAnswers={setAnswers} submitted={submitted} passage={passage} />
              ))}
            </div>
            {!submitted ? (
              <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', marginTop: 8, padding: '11px' }}>Submit Answers</button>
            ) : score && <ScoreResult score={score} onNew={handleGenerate} />}
          </GlowCard>
        </div>
      )}

      {/* Mobile: passage + floating button */}
      {passage && isMobile && (
        <div>
          {score && (
            <div style={{ marginBottom: 14, textAlign: 'center', padding: '14px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12 }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: 28, fontWeight: 700, color: 'var(--accent-success)' }}>{score.correct}/{score.total}</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Approx Band: <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{score.band}</span></div>
            </div>
          )}
          <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{passage.title}</div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Timer running={timerRunning} />
                <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '5px 10px', fontSize: 11 }}>New</button>
              </div>
            </div>
            <div style={{ padding: '16px', lineHeight: 1.9, fontSize: 14, color: 'var(--text-secondary)', maxHeight: '50vh', overflowY: 'auto' }}>
              {passage.passage}
            </div>
          </GlowCard>
          {!submitted ? (
            <button className="btn-primary" onClick={() => setShowQuestions(true)} style={{ width: '100%', padding: '14px', fontSize: 15 }}>
              Answer Questions ({passage.questions?.length})
            </button>
          ) : (
            <button className="btn-secondary" onClick={handleGenerate} style={{ width: '100%', padding: '13px', fontSize: 14 }}>New Passage</button>
          )}
        </div>
      )}
    </div>
  );
}

function QuestionItem({ q, i, total, answers, setAnswers, submitted, passage }) {
  const isMobile = useIsMobile();
  return (
    <div style={{ marginBottom: 18, paddingBottom: 18, borderBottom: i < total - 1 ? '1px solid var(--border)' : 'none' }}>
      <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500, lineHeight: 1.5 }}>
        <span style={{ color: 'var(--accent-success)', fontFamily: 'Space Mono', fontWeight: 700, marginRight: 7 }}>{q.id}.</span>
        {q.question}
      </div>
      {q.type === 'mcq' && q.options ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {q.options.map((opt, oi) => {
            const isCorrect = submitted && passage.answers[q.id] === opt;
            const isWrong = submitted && answers[q.id] === opt && !isCorrect;
            return (
              <label key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: `1px solid ${isCorrect ? 'var(--accent-success)' : isWrong ? 'var(--accent-danger)' : answers[q.id] === opt ? 'var(--accent-primary)' : 'var(--border)'}`, background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'transparent', cursor: submitted ? 'default' : 'pointer', fontSize: 13 }}>
                <input type="radio" name={`q-${q.id}`} value={opt} disabled={submitted} checked={answers[q.id] === opt} onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{ accentColor: 'var(--accent-primary)', flexShrink: 0 }} />
                {opt}
                {isCorrect && <CheckCircle size={14} style={{ marginLeft: 'auto', color: 'var(--accent-success)' }} />}
                {isWrong && <XCircle size={14} style={{ marginLeft: 'auto', color: 'var(--accent-danger)' }} />}
              </label>
            );
          })}
        </div>
      ) : (
        <div>
          <input className="input-dark" placeholder="Your answer..." value={answers[q.id] ?? ''} disabled={submitted}
            onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))} />
          {submitted && answers[q.id]?.toLowerCase().trim() !== passage.answers[q.id]?.toLowerCase().trim() && (
            <div style={{ fontSize: 12, color: 'var(--accent-success)', marginTop: 4 }}>✓ {passage.answers[q.id]}</div>
          )}
        </div>
      )}
    </div>
  );
}

function ScoreResult({ score, onNew }) {
  return (
    <div style={{ marginTop: 12, textAlign: 'center', padding: '14px', background: 'var(--bg-elevated)', borderRadius: 10 }}>
      <div style={{ fontFamily: 'Space Mono', fontSize: 28, fontWeight: 700, color: 'var(--accent-success)' }}>{score.correct}/{score.total}</div>
      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Approx Band: <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{score.band}</span></div>
      <button className="btn-secondary" onClick={onNew} style={{ marginTop: 10, width: '100%' }}>New Passage</button>
    </div>
  );
}
