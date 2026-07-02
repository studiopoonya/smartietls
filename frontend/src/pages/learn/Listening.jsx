import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQueryClient } from '@tanstack/react-query';
import { Headphones, Play, Square, RotateCcw, Volume2, CheckCircle, XCircle, X, ChevronRight, FileText, Lock } from 'lucide-react';
import { useListeningGenerate } from '../../hooks/useAI';
import { useLevels } from '../../hooks/useLevels';
import { useIsMobile } from '../../hooks/useIsMobile';
import GlowCard from '../../components/common/GlowCard';
import Timer from '../../components/common/Timer';
import api from '../../lib/axios';

const SECTIONS = [
  { id: 0, label: 'Random', desc: 'Surprise me', color: '#A855F7' },
  { id: 1, label: 'Section 1', desc: 'Social Dialogue', color: '#06B6D4' },
  { id: 2, label: 'Section 2', desc: 'Social Monologue', color: '#10B981' },
  { id: 3, label: 'Section 3', desc: 'Academic Discussion', color: '#F59E0B' },
  { id: 4, label: 'Section 4', desc: 'Academic Lecture', color: '#EF4444' },
];

const SECTION_COLORS = { 1: '#06B6D4', 2: '#10B981', 3: '#F59E0B', 4: '#EF4444' };

// Waveform bar heights (CSS animation, not random)
const BAR_HEIGHTS = [
  [8, 32], [20, 10], [14, 28], [26, 8], [10, 24],
  [30, 12], [16, 26], [22, 8], [12, 30], [28, 14],
  [8, 22], [24, 10], [18, 28], [10, 20], [30, 8],
  [14, 26], [22, 12], [16, 30], [8, 24], [26, 10],
];

export default function Listening() {
  const [section, setSection] = useState(0);
  const [difficulty, setDifficulty] = useState(6);
  const [exercise, setExercise] = useState(null);
  const [answers, setAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);
  const [showTranscript, setShowTranscript] = useState(false);
  const [timerRunning, setTimerRunning] = useState(false);
  const [showQuestions, setShowQuestions] = useState(false);
  // Audio / TTS state
  const [audioState, setAudioState] = useState('idle'); // idle | playing | finished
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioError, setAudioError] = useState(false);
  const [generateError, setGenerateError] = useState(null);
  const [fromCache, setFromCache] = useState(false);

  const utteranceRef = useRef(null);
  const progressIntervalRef = useRef(null);
  const audioStartTimeRef = useRef(null);
  const estimatedDurationRef = useRef(0);
  const isMobile = useIsMobile();
  const { mutate: generate, isPending } = useListeningGenerate();
  const { data: levels } = useLevels();
  const qc = useQueryClient();
  const unlockedLevel = levels?.listening ?? 5;
  const pad = isMobile ? '20px 16px' : '36px 40px';
  const hasTTS = typeof window !== 'undefined' && 'speechSynthesis' in window;

  // Default difficulty selection to the user's current unlocked level
  useEffect(() => { if (levels) setDifficulty(levels.listening); }, [levels]);

  // Estimate duration: ~130 words per minute at 0.85 rate
  const estimateDuration = (text) => {
    const words = text.split(/\s+/).length;
    return (words / 130) * 60 * (1 / 0.85);
  };

  const stoppedRef = useRef(false);

  const stopAudio = useCallback(() => {
    stoppedRef.current = true;
    window.speechSynthesis?.cancel();
    clearInterval(progressIntervalRef.current);
    setAudioState('idle');
    setAudioProgress(0);
  }, []);

  useEffect(() => () => stopAudio(), [stopAudio]);

  // Pick the best available English voice (prefers online neural voices)
  const getBestVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    return (
      voices.find(v => /natural|neural|online/i.test(v.name) && v.lang.startsWith('en')) ||
      voices.find(v => v.lang === 'en-GB' && !v.localService) ||
      voices.find(v => v.lang === 'en-US' && !v.localService) ||
      voices.find(v => v.lang.startsWith('en-GB')) ||
      voices.find(v => v.lang.startsWith('en-US')) ||
      voices.find(v => v.lang.startsWith('en')) ||
      null
    );
  };

  // Clean transcript for TTS: remove speaker labels, normalize whitespace
  const prepareForTTS = (text) => {
    return text
      .replace(/^[A-Za-z ]{1,20}:\s*/gm, '') // Remove "Speaker: " labels at line start
      .replace(/\n+/g, ' ')                   // Newlines → spaces (smooth flow)
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

  // Split into short chunks ≤180 chars at sentence boundaries (fixes Chrome TTS bug)
  const chunkText = (text) => {
    const raw = text.match(/[^.!?]+[.!?]+/g) || [text];
    const chunks = [];
    let current = '';
    for (const s of raw) {
      if ((current + s).length > 180 && current) {
        chunks.push(current.trim());
        current = s;
      } else {
        current += s;
      }
    }
    if (current.trim()) chunks.push(current.trim());
    return chunks.length ? chunks : [text];
  };

  const playAudio = () => {
    if (!hasTTS || !exercise) return;
    window.speechSynthesis.cancel();
    clearInterval(progressIntervalRef.current);
    setAudioProgress(0);
    setAudioError(false);
    stoppedRef.current = false;

    const startPlay = () => {
      const voice = getBestVoice();
      const cleanText = prepareForTTS(exercise.transcript);
      const chunks = chunkText(cleanText);
      const totalDuration = estimateDuration(cleanText);
      estimatedDurationRef.current = totalDuration;
      audioStartTimeRef.current = Date.now();

      setAudioState('playing');
      progressIntervalRef.current = setInterval(() => {
        const elapsed = (Date.now() - audioStartTimeRef.current) / 1000;
        setAudioProgress(Math.min((elapsed / totalDuration) * 100, 99));
      }, 300);

      let idx = 0;
      const speakNext = () => {
        if (stoppedRef.current || idx >= chunks.length) {
          if (!stoppedRef.current) {
            clearInterval(progressIntervalRef.current);
            setAudioState('finished');
            setAudioProgress(100);
          }
          return;
        }
        const utt = new SpeechSynthesisUtterance(chunks[idx]);
        utt.rate = 0.88;
        utt.pitch = 1.0;
        if (voice) utt.voice = voice;
        utt.onend = () => { idx++; speakNext(); };
        utt.onerror = (e) => {
          if (e.error === 'interrupted') return;
          clearInterval(progressIntervalRef.current);
          setAudioState('idle');
          setAudioError(true);
        };
        utteranceRef.current = utt;
        window.speechSynthesis.speak(utt);
      };
      speakNext();
    };

    // Wait for voices to load if not yet available
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.onvoiceschanged = null;
        startPlay();
      };
    } else {
      startPlay();
    }
  };

  const handleGenerate = () => {
    stopAudio();
    setExercise(null); setAnswers({}); setSubmitted(false); setScore(null);
    setShowTranscript(false); setShowQuestions(false); setAudioProgress(0); setAudioError(false);
    setGenerateError(null); setFromCache(false);
    generate({ section: section || undefined, difficulty }, {
      onSuccess: (data) => { setExercise(data); setTimerRunning(true); setFromCache(!!data._cached); },
      onError: (err) => setGenerateError(err?.response?.data?.message || 'Failed to generate exercise'),
    });
  };

  const handleSubmit = () => {
    if (!exercise) return;
    stopAudio();
    setTimerRunning(false);
    let correct = 0;
    exercise.questions.forEach(q => {
      const correct_ans = exercise.answers[q.id]?.toLowerCase().trim();
      const user_ans = answers[q.id]?.toLowerCase().trim();
      if (user_ans && correct_ans && (user_ans === correct_ans || correct_ans.includes(user_ans) || user_ans.includes(correct_ans))) correct++;
    });
    const total = exercise.questions.length;
    const band = Math.max(4, Math.min(9, 4 + (correct / total) * 5));
    setScore({ correct, total, band: band.toFixed(1) });
    setSubmitted(true);
    if (isMobile) setShowQuestions(false);
    api.post('/sessions', {
      module: 'listening',
      input_data: { section: exercise.section, difficulty: exercise.difficulty ?? difficulty },
      ai_feedback: { correct, total },
      band_score: band,
    }).catch(() => {}).finally(() => qc.invalidateQueries({ queryKey: ['levels'] }));
  };

  const sectionColor = exercise ? (SECTION_COLORS[exercise.section] ?? '#06B6D4') : '#06B6D4';

  // Questions panel content (shared between desktop and mobile sheet)
  const QuestionsPanel = () => (
    <>
      {exercise.questions?.map((q, i) => (
        <div key={q.id} style={{ marginBottom: 20, paddingBottom: 20, borderBottom: i < exercise.questions.length - 1 ? '1px solid var(--border)' : 'none' }}>
          <div style={{ fontSize: 13, color: 'var(--text-primary)', marginBottom: 8, fontWeight: 500, lineHeight: 1.5 }}>
            <span style={{ fontFamily: 'Space Mono', fontWeight: 700, color: sectionColor, marginRight: 7, fontSize: 12 }}>{q.id}.</span>
            {q.question}
          </div>
          {q.type === 'mcq' && q.options ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {q.options.map((opt, oi) => {
                const isCorrect = submitted && exercise.answers[q.id]?.toLowerCase() === opt.replace(/^[ABC]\.\s*/, '').toLowerCase();
                const isSelected = answers[q.id] === opt;
                const isWrong = submitted && isSelected && !isCorrect;
                return (
                  <label key={oi} style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', borderRadius: 8, border: `1px solid ${isCorrect ? 'var(--accent-success)' : isWrong ? 'var(--accent-danger)' : isSelected ? sectionColor : 'var(--border)'}`, background: isCorrect ? 'rgba(16,185,129,0.1)' : isWrong ? 'rgba(239,68,68,0.1)' : 'transparent', cursor: submitted ? 'default' : 'pointer', fontSize: 13, transition: 'all 0.15s' }}>
                    <input type="radio" name={`q-${q.id}`} value={opt} disabled={submitted} checked={isSelected} onChange={() => setAnswers(a => ({ ...a, [q.id]: opt }))} style={{ accentColor: sectionColor, flexShrink: 0 }} />
                    {opt}
                    {isCorrect && <CheckCircle size={13} style={{ marginLeft: 'auto', color: 'var(--accent-success)' }} />}
                    {isWrong && <XCircle size={13} style={{ marginLeft: 'auto', color: 'var(--accent-danger)' }} />}
                  </label>
                );
              })}
            </div>
          ) : (
            <div>
              <input className="input-dark" placeholder="Write your answer (max 3 words)..." value={answers[q.id] ?? ''} disabled={submitted}
                onChange={e => setAnswers(a => ({ ...a, [q.id]: e.target.value }))}
                style={{ fontSize: 13, padding: '9px 12px' }} />
              {submitted && (() => {
                const ua = answers[q.id]?.toLowerCase().trim() || '';
                const ca = exercise.answers[q.id]?.toLowerCase().trim() || '';
                const correct = ca && (ua === ca || ca.includes(ua) || ua.includes(ca));
                return !correct && ca ? (
                  <div style={{ fontSize: 12, color: 'var(--accent-success)', marginTop: 4, paddingLeft: 4 }}>✓ {exercise.answers[q.id]}</div>
                ) : null;
              })()}
            </div>
          )}
        </div>
      ))}
      {!submitted ? (
        <button className="btn-primary" onClick={handleSubmit} style={{ width: '100%', padding: '13px', fontSize: 15 }}>
          Submit Answers
        </button>
      ) : score && (
        <div style={{ textAlign: 'center', padding: '16px', background: 'var(--bg-elevated)', borderRadius: 12, border: `1px solid ${sectionColor}40` }}>
          <div style={{ fontFamily: 'Space Mono', fontSize: 30, fontWeight: 700, color: sectionColor }}>{score.correct}/{score.total}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>Approx Band <span style={{ fontWeight: 700, color: 'var(--accent-secondary)' }}>{score.band}</span></div>
          <button className="btn-secondary" onClick={handleGenerate} style={{ marginTop: 10, width: '100%' }}>New Exercise</button>
        </div>
      )}
    </>
  );

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1100 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Headphones size={16} style={{ color: '#F59E0B' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Listening Practice</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Listen to AI-generated audio and answer IELTS questions</p>
      </motion.div>

      {/* Mobile questions bottom sheet */}
      <AnimatePresence>
        {isMobile && showQuestions && exercise && (
          <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'var(--bg-secondary)', overflowY: 'auto', padding: '0 0 80px' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, background: 'var(--bg-secondary)', zIndex: 1 }}>
              <span style={{ fontSize: 15, fontWeight: 700 }}>Questions ({exercise.questions?.length})</span>
              <button onClick={() => setShowQuestions(false)} style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ padding: '16px' }}><QuestionsPanel /></div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Setup screen */}
      {!exercise && !isPending && (
        <GlowCard style={{ padding: isMobile ? 22 : 36, maxWidth: 560, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #F59E0B, #EF4444)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', boxShadow: '0 0 40px rgba(245,158,11,0.3)' }}>
              <Headphones size={26} color="white" />
            </div>
            <h2 style={{ fontSize: isMobile ? 18 : 20, marginBottom: 6 }}>IELTS Listening Test</h2>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>Choose a section, then listen to the AI-generated audio and answer comprehension questions.</p>
          </div>

          <div style={{ marginBottom: 18 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, fontWeight: 600 }}>Section</label>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : 'repeat(5, 1fr)', gap: 8 }}>
              {SECTIONS.map(s => (
                <button key={s.id} onClick={() => setSection(s.id)}
                  style={{ padding: '10px 6px', borderRadius: 10, border: `1px solid ${section === s.id ? s.color : 'var(--border)'}`, background: section === s.id ? `${s.color}18` : 'var(--bg-elevated)', color: section === s.id ? s.color : 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s', textAlign: 'center' }}>
                  <div style={{ fontSize: 11, fontWeight: 700 }}>{s.label}</div>
                  <div style={{ fontSize: 9, color: section === s.id ? s.color : 'var(--text-muted)', marginTop: 2, lineHeight: 1.2 }}>{s.desc}</div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: 'block', fontSize: 13, color: 'var(--text-secondary)', marginBottom: 8, fontWeight: 600 }}>
              Difficulty (Band) <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>— unlocked up to Band {unlockedLevel}</span>
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[5, 6, 7, 8, 9].map(d => {
                const locked = d > unlockedLevel;
                return (
                  <button key={d} disabled={locked} onClick={() => !locked && setDifficulty(d)}
                    title={locked ? `Score Band ${d} in an easier exercise to unlock` : undefined}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: `1px solid ${difficulty === d ? '#F59E0B' : 'var(--border)'}`, background: difficulty === d ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)', color: locked ? 'var(--text-muted)' : (difficulty === d ? '#F59E0B' : 'var(--text-secondary)'), cursor: locked ? 'not-allowed' : 'pointer', fontFamily: 'Space Mono', fontWeight: 700, transition: 'all 0.2s', opacity: locked ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                    {locked && <Lock size={10} />}{d}
                  </button>
                );
              })}
            </div>
          </div>

          <button className="btn-primary" onClick={handleGenerate} style={{ width: '100%', padding: '13px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Headphones size={17} /> Generate Listening Exercise
          </button>
        </GlowCard>
      )}

      {/* Error display */}
      {generateError && !isPending && !exercise && (
        <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '16px 18px', marginBottom: 16 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent-danger)', marginBottom: 4 }}>Generation failed</div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{generateError}</div>
          <button className="btn-secondary" onClick={handleGenerate} style={{ marginTop: 12, padding: '8px 16px', fontSize: 12 }}>Try again</button>
        </div>
      )}

      {/* Loading */}
      {isPending && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ width: 44, height: 44, border: '3px solid var(--border)', borderTopColor: '#F59E0B', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 14px' }} />
          <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Generating listening exercise...</p>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* Exercise */}
      {exercise && (
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: 20 }}>
          {/* Left: audio player + info */}
          <div>
            {/* Score banner (mobile, after submit) */}
            {score && isMobile && (
              <div style={{ marginBottom: 12, padding: '14px 16px', background: 'var(--bg-card)', border: `1px solid ${sectionColor}40`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: sectionColor }}>{score.correct}/{score.total}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Band {score.band}</div>
                </div>
                <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '8px 14px', fontSize: 12 }}>New</button>
              </div>
            )}

            {/* Audio Player Card */}
            <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden', marginBottom: 12 }}>
              {/* Header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 10, color: sectionColor, textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.08em' }}>{exercise.sectionLabel || `Section ${exercise.section}`}</span>
                    {fromCache && <span style={{ fontSize: 9, background: 'rgba(16,185,129,0.15)', color: 'var(--accent-success)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>⚡ Instant</span>}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{exercise.title}</div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <Timer running={timerRunning} />
                  <button className="btn-secondary" onClick={handleGenerate} style={{ padding: '5px 10px', fontSize: 11 }}>New</button>
                </div>
              </div>

              {/* Scenario */}
              <div style={{ padding: '12px 16px', background: `${sectionColor}08`, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 10, color: sectionColor, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Situation</div>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 4 }}>{exercise.scenario}</p>
                {exercise.speakerInfo && <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>{exercise.speakerInfo}</div>}
              </div>

              {/* Audio Player */}
              <div style={{ padding: '20px 16px' }}>
                {hasTTS ? (
                  <>
                    {/* Waveform visualizer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 48, marginBottom: 14 }}>
                      {BAR_HEIGHTS.map(([min, max], i) => (
                        <div key={i} style={{
                          width: 3, borderRadius: 3,
                          background: audioState === 'playing' ? sectionColor : 'var(--border)',
                          height: audioState === 'playing' ? `${min}px` : '4px',
                          transition: 'height 0.15s, background 0.3s',
                          animation: audioState === 'playing' ? `wave${i % 6} ${0.35 + (i % 4) * 0.12}s ease-in-out infinite alternate` : 'none',
                          ['--min']: `${min}px`,
                          ['--max']: `${max}px`,
                        }} />
                      ))}
                    </div>

                    {/* Progress bar */}
                    <div style={{ height: 4, background: 'var(--border)', borderRadius: 3, marginBottom: 16, overflow: 'hidden' }}>
                      <motion.div animate={{ width: `${audioProgress}%` }} transition={{ duration: 0.3 }}
                        style={{ height: '100%', background: `linear-gradient(90deg, ${sectionColor}, #F59E0B)`, borderRadius: 3 }} />
                    </div>

                    {/* Controls */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
                      {audioState === 'idle' || audioState === 'finished' ? (
                        <button onClick={playAudio}
                          style={{ width: 52, height: 52, borderRadius: '50%', background: `linear-gradient(135deg, ${sectionColor}, #F59E0B)`, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 24px ${sectionColor}50`, transition: 'all 0.2s' }}>
                          {audioState === 'finished' ? <RotateCcw size={20} color="white" /> : <Play size={20} color="white" style={{ marginLeft: 3 }} />}
                        </button>
                      ) : (
                        <button onClick={stopAudio}
                          style={{ width: 52, height: 52, borderRadius: '50%', background: 'linear-gradient(135deg, #EF4444, #DC2626)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(239,68,68,0.4)' }}>
                          <Square size={18} color="white" fill="white" />
                        </button>
                      )}
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: audioState === 'playing' ? sectionColor : audioState === 'finished' ? 'var(--accent-success)' : 'var(--text-secondary)' }}>
                          {audioState === 'idle' ? 'Ready to play' : audioState === 'playing' ? '● Playing audio...' : '✓ Audio finished'}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {audioState === 'idle' ? 'Press play to listen' : audioState === 'playing' ? 'Listen carefully' : 'Replay or answer questions'}
                        </div>
                      </div>
                      {audioState !== 'idle' && (
                        <button onClick={() => { stopAudio(); setTimeout(playAudio, 100); }}
                          style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 12px', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, display: 'flex', alignItems: 'center', gap: 4 }}>
                          <RotateCcw size={12} /> Replay
                        </button>
                      )}
                    </div>

                    {audioError && (
                      <div style={{ marginTop: 12, textAlign: 'center', fontSize: 12, color: 'var(--accent-warning)' }}>
                        Audio failed. Read the transcript below to practice.
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center', padding: '10px 0', color: 'var(--text-muted)', fontSize: 13 }}>
                    Audio not supported on this browser — read the transcript below.
                  </div>
                )}
              </div>

              {/* Transcript (collapsible, hidden by default) */}
              <div style={{ borderTop: '1px solid var(--border)' }}>
                <button onClick={() => setShowTranscript(!showTranscript)}
                  style={{ width: '100%', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <FileText size={13} />
                    Transcript {!submitted && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>(reveal after listening)</span>}
                  </div>
                  <ChevronRight size={14} style={{ transform: showTranscript ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
                </button>
                <AnimatePresence>
                  {showTranscript && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden' }}>
                      <div style={{ padding: '0 16px 16px', lineHeight: 1.9, fontSize: 13, color: 'var(--text-secondary)', maxHeight: isMobile ? '35vh' : '40vh', overflowY: 'auto', whiteSpace: 'pre-line' }}>
                        {exercise.transcript}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlowCard>

            {/* Mobile CTA */}
            {isMobile && (
              !submitted ? (
                <button className="btn-primary" onClick={() => setShowQuestions(true)} style={{ width: '100%', padding: '13px', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Answer Questions ({exercise.questions?.length})
                </button>
              ) : (
                <button className="btn-secondary" onClick={handleGenerate} style={{ width: '100%', padding: '13px' }}>New Exercise</button>
              )
            )}
          </div>

          {/* Right: Questions (desktop only) */}
          {!isMobile && (
            <GlowCard hover={false} style={{ padding: 18 }}>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 14, fontFamily: 'Space Grotesk', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Questions</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 400 }}>{exercise.questions?.length} items</span>
              </div>
              <div style={{ maxHeight: '68vh', overflowY: 'auto' }}><QuestionsPanel /></div>
            </GlowCard>
          )}
        </div>
      )}

      <style>{`
        @keyframes wave0 { from{height:var(--min,8px)} to{height:var(--max,32px)} }
        @keyframes wave1 { from{height:16px} to{height:8px} }
        @keyframes wave2 { from{height:10px} to{height:28px} }
        @keyframes wave3 { from{height:24px} to{height:6px} }
        @keyframes wave4 { from{height:8px} to{height:22px} }
        @keyframes wave5 { from{height:20px} to{height:10px} }
      `}</style>
    </div>
  );
}
