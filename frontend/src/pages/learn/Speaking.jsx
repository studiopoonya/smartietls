import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Send, RotateCcw, BookMarked, Clock,
  ChevronRight, CheckCircle2, Loader2, AlertCircle,
} from 'lucide-react';
import { useSpeakingGenerate, useSpeakingEvaluate } from '../../hooks/useAI';
import { useIsMobile } from '../../hooks/useIsMobile';
import GlowCard from '../../components/common/GlowCard';
import BandScoreBar from '../../components/common/BandScoreBar';
import { getBandColor } from '../../lib/utils';
import api from '../../lib/axios';

const SpeechRecognitionAPI = typeof window !== 'undefined'
  ? (window.SpeechRecognition || window.webkitSpeechRecognition || null)
  : null;

const PART_COLORS = { 1: '#A855F7', 2: '#06B6D4', 3: '#10B981' };
const PART_LABELS = {
  1: 'Part 1 — Introduction & Interview',
  2: 'Part 2 — Individual Long Turn',
  3: 'Part 3 — Two-way Discussion',
};

/* ─── Per-answer feedback panel ─── */
function FeedbackCard({ feedback, isMobile }) {
  if (!feedback) return null;
  const { scores, grammarErrors, vocabularyUpgrades, betterPhrasing, strengths, tips } = feedback;
  return (
    <motion.div initial={{ opacity: 0, x: isMobile ? 0 : 20 }} animate={{ opacity: 1, x: 0 }}>
      <GlowCard style={{ padding: 18, marginBottom: 12 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14, letterSpacing: '0.06em' }}>Answer Feedback</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginBottom: 14 }}>
          {[['Overall', scores?.overall], ['Fluency', scores?.fluency], ['Vocab', scores?.vocabulary], ['Grammar', scores?.grammar]].map(([label, val]) => (
            <div key={label} style={{ textAlign: 'center', padding: '8px 4px', background: 'var(--bg-elevated)', borderRadius: 8 }}>
              <div style={{ fontFamily: 'Space Mono', fontSize: 20, fontWeight: 700, color: getBandColor(val) }}>{val ?? '–'}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </div>

        {grammarErrors?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-danger)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Grammar Fixes</div>
            {grammarErrors.slice(0, 3).map((e, i) => (
              <div key={i} style={{ marginBottom: 8, padding: '8px 10px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'var(--accent-danger)', fontFamily: 'Space Mono', textDecoration: 'line-through' }}>{e.original}</span>
                  <span style={{ color: 'var(--text-muted)' }}>→</span>
                  <span style={{ fontSize: 12, color: 'var(--accent-success)', fontFamily: 'Space Mono', fontWeight: 700 }}>{e.corrected}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 3 }}>{e.explanation}</div>
              </div>
            ))}
          </div>
        )}

        {vocabularyUpgrades?.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#F59E0B', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Vocab Upgrades</div>
            {vocabularyUpgrades.slice(0, 3).map((v, i) => (
              <div key={i} style={{ marginBottom: 6, padding: '7px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: 8 }}>
                <span style={{ fontSize: 12, color: 'var(--accent-danger)', fontFamily: 'Space Mono' }}>{v.original}</span>
                <span style={{ color: 'var(--text-muted)', margin: '0 6px' }}>→</span>
                <span style={{ fontSize: 12, color: 'var(--accent-success)', fontFamily: 'Space Mono', fontWeight: 700 }}>{v.suggestion}</span>
                {v.reason && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{v.reason}</div>}
              </div>
            ))}
          </div>
        )}

        {betterPhrasing && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: 'var(--accent-primary)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Better Phrasing</div>
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7, padding: '10px 12px', background: 'rgba(124,58,237,0.07)', border: '1px solid rgba(124,58,237,0.15)', borderRadius: 8, fontStyle: 'italic' }}>
              "{betterPhrasing}"
            </div>
          </div>
        )}

        {strengths?.length > 0 && (
          <div>
            <div style={{ fontSize: 11, color: 'var(--accent-success)', fontWeight: 600, marginBottom: 6, textTransform: 'uppercase' }}>Strengths</div>
            {strengths.map((s, i) => (
              <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', marginBottom: 4, paddingLeft: 10, borderLeft: '2px solid var(--accent-success)' }}>{s}</div>
            ))}
          </div>
        )}
      </GlowCard>

      {tips?.length > 0 && (
        <GlowCard style={{ padding: 16 }}>
          <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Tips</div>
          {tips.map((t, i) => (
            <div key={i} style={{ display: 'flex', gap: 7, fontSize: 12, color: 'var(--text-muted)', marginBottom: 5 }}>
              <span style={{ color: 'var(--accent-primary)', flexShrink: 0 }}>→</span>{t}
            </div>
          ))}
        </GlowCard>
      )}
    </motion.div>
  );
}

/* ─── Overall result screen ─── */
function OverallResults({ feedbacks, questions, saving, onSave, onRestart }) {
  const avg = (key) => {
    const vals = feedbacks.map(f => f?.scores?.[key]).filter(Boolean);
    return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
  };
  const overall = avg('overall');

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
      <GlowCard style={{ padding: 28, textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase' }}>Speaking Test Complete</div>
        <div style={{ fontFamily: 'Space Mono', fontSize: 64, fontWeight: 700, color: getBandColor(overall), lineHeight: 1 }}>{overall ?? '–'}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Average Band Score</div>
      </GlowCard>

      <GlowCard style={{ padding: 20, marginBottom: 14 }}>
        <BandScoreBar label="Fluency & Coherence" score={avg('fluency')} />
        <BandScoreBar label="Lexical Resource" score={avg('vocabulary')} />
        <BandScoreBar label="Grammatical Range" score={avg('grammar')} />
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button onClick={onSave} disabled={saving} className="btn-secondary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <BookMarked size={14} /> {saving ? 'Saving...' : 'Save Session'}
          </button>
          <button onClick={onRestart} className="btn-primary" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <RotateCcw size={14} /> New Test
          </button>
        </div>
      </GlowCard>

      {feedbacks.map((fb, i) => {
        const allQs = [
          ...(questions?.part1 ?? []).map((q, j) => ({ part: 1, question: q.question, label: `Part 1 · Q${j + 1}` })),
          questions?.part2 ? [{ part: 2, question: questions.part2.topic, label: 'Part 2 · Long Turn' }] : [],
          ...(questions?.part3 ?? []).map((q, j) => ({ part: 3, question: q.question, label: `Part 3 · Q${j + 1}` })),
        ].flat();
        const qInfo = allQs[i];
        if (!fb || !qInfo) return null;
        return (
          <GlowCard key={i} style={{ padding: 14, marginBottom: 10 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <div style={{ fontSize: 11, color: PART_COLORS[qInfo.part], fontWeight: 600 }}>{qInfo.label}</div>
              <div style={{ fontFamily: 'Space Mono', fontSize: 16, fontWeight: 700, color: getBandColor(fb.scores?.overall) }}>{fb.scores?.overall}</div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{qInfo.question}</div>
          </GlowCard>
        );
      })}
    </motion.div>
  );
}

/* ─── Main component ─── */
export default function Speaking() {
  const [phase, setPhase] = useState('start'); // start | generating | test | evaluating | feedback | complete
  const [questions, setQuestions] = useState(null);
  const [currentPart, setCurrentPart] = useState(1);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [prepTimeLeft, setPrepTimeLeft] = useState(60);
  const [prepActive, setPrepActive] = useState(false);
  const [prepDone, setPrepDone] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [textInput, setTextInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showTextInput, setShowTextInput] = useState(false);
  const [answerFeedback, setAnswerFeedback] = useState(null);
  const [allFeedbacks, setAllFeedbacks] = useState([]);
  const [saving, setSaving] = useState(false);
  const [genError, setGenError] = useState(null);
  const [evalError, setEvalError] = useState(null);

  const [recordingSecs, setRecordingSecs] = useState(0);

  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');
  const interimRef = useRef('');
  const prepTimerRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const animFrameRef = useRef(null);
  const [audioLevels, setAudioLevels] = useState([0, 0, 0, 0, 0, 0, 0]);
  const isMobile = useIsMobile();
  const hasSpeech = !!SpeechRecognitionAPI;

  const { mutate: generate, isPending: isGenerating } = useSpeakingGenerate();
  const { mutate: evaluate, isPending: isEvaluating } = useSpeakingEvaluate();

  const pad = isMobile ? '20px 16px' : '36px 40px';

  /* prep timer */
  useEffect(() => {
    if (!prepActive) return;
    prepTimerRef.current = setInterval(() => {
      setPrepTimeLeft(p => {
        if (p <= 1) { clearInterval(prepTimerRef.current); setPrepActive(false); setPrepDone(true); return 0; }
        return p - 1;
      });
    }, 1000);
    return () => clearInterval(prepTimerRef.current);
  }, [prepActive]);

  /* derived */
  const currentQuestion = (() => {
    if (!questions) return null;
    if (currentPart === 1) return questions.part1?.[questionIdx];
    if (currentPart === 2) return { id: 'p2', question: questions.part2?.topic };
    if (currentPart === 3) return questions.part3?.[questionIdx];
    return null;
  })();

  const totalQuestions = (() => {
    if (currentPart === 1) return questions?.part1?.length ?? 4;
    if (currentPart === 2) return 1;
    return questions?.part3?.length ?? 3;
  })();

  const questionLabel = (() => {
    if (currentPart === 2) return 'Long Turn';
    return `Q${questionIdx + 1} / ${totalQuestions}`;
  })();

  const currentInput = (transcript || textInput).trim();

  /* Progress counts: Part1(4) + Part2(1) + Part3(3) = 8 total questions */
  const totalAnswered = allFeedbacks.length;

  /* ── Audio level analyser ── */
  const stopAnalyser = useCallback(() => {
    cancelAnimationFrame(animFrameRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    streamRef.current = null;
    setAudioLevels([0, 0, 0, 0, 0, 0, 0]);
  }, []);

  const startAnalyser = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      audioCtxRef.current = ctx;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyserRef.current = analyser;
      ctx.createMediaStreamSource(stream).connect(analyser);
      const buf = new Uint8Array(analyser.frequencyBinCount);
      const BAR_COUNT = 7;
      const tick = () => {
        analyser.getByteFrequencyData(buf);
        const step = Math.floor(buf.length / BAR_COUNT);
        const levels = Array.from({ length: BAR_COUNT }, (_, i) => {
          const slice = buf.slice(i * step, (i + 1) * step);
          const avg = slice.reduce((s, v) => s + v, 0) / slice.length;
          return Math.min(1, avg / 160);
        });
        setAudioLevels(levels);
        animFrameRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch (_) { /* mic permission denied — silent */ }
  }, []);

  const RECOMMENDED_SECS = { 1: 40, 2: 90, 3: 50 };

  const stopRecordingTimer = () => {
    clearInterval(recordingTimerRef.current);
    recordingTimerRef.current = null;
  };

  /* ── Recording ── */
  const startRecording = () => {
    if (!SpeechRecognitionAPI || isRecording) return;
    finalTranscriptRef.current = '';
    interimRef.current = '';
    setTranscript(''); setInterimText(''); setRecordingSecs(0);
    const r = new SpeechRecognitionAPI();
    r.lang = 'en-US'; r.interimResults = true; r.continuous = true;
    r.onstart = () => {
      setIsRecording(true);
      startAnalyser();
      recordingTimerRef.current = setInterval(() => setRecordingSecs(s => s + 1), 1000);
    };
    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalTranscriptRef.current += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      interimRef.current = interim;
      setTranscript(finalTranscriptRef.current);
      setInterimText(interim);
    };
    r.onend = () => {
      stopRecordingTimer();
      stopAnalyser();
      setIsRecording(false);
      setInterimText('');
      // Merge final + any unsaved interim so transcript is never lost
      const full = (finalTranscriptRef.current + ' ' + interimRef.current).trim();
      finalTranscriptRef.current = full;
      interimRef.current = '';
      setTranscript(full);
    };
    r.onerror = () => { stopRecordingTimer(); stopAnalyser(); setIsRecording(false); setInterimText(''); };
    recognitionRef.current = r;
    r.start();
  };

  const stopRecording = () => recognitionRef.current?.stop();

  /* ── Start test ── */
  const handleStart = () => {
    setGenError(null);
    setPhase('generating');
    generate(undefined, {
      onSuccess: (data) => {
        setQuestions(data);
        setCurrentPart(1); setQuestionIdx(0);
        setAllFeedbacks([]); setAnswerFeedback(null);
        setTranscript(''); setTextInput(''); setPhase('test');
      },
      onError: (err) => {
        setGenError(err?.response?.data?.message || 'Failed to load questions. Please try again.');
        setPhase('start');
      },
    });
  };

  /* ── Submit answer ── */
  const handleSubmit = () => {
    const answer = currentInput;
    if (!answer || isEvaluating) return;
    setEvalError(null);
    const question = currentPart === 2 ? questions.part2.topic : currentQuestion?.question;
    const qNumber = currentPart === 2 ? 1 : questionIdx + 1;

    evaluate({ question, answer, part: currentPart }, {
      onSuccess: (data) => {
        setAllFeedbacks(prev => [...prev, data]);
        setAnswerFeedback(data);
        setPhase('feedback');
        // Auto-save every answer to DB immediately after evaluation
        api.post('/sessions', {
          module: 'speaking',
          input_data: {
            part: currentPart,
            question_number: qNumber,
            question,
            answer,
            duration_seconds: recordingSecs,
          },
          ai_feedback: data,
          band_score: data.scores?.overall ?? null,
        }).catch(() => { /* silent — don't block UI if save fails */ });
      },
      onError: (err) => {
        setEvalError(err?.response?.data?.message || 'Evaluation failed. Try again.');
      },
    });
  };

  /* ── Next question ── */
  const handleNext = () => {
    setAnswerFeedback(null);
    setTranscript(''); setTextInput('');
    finalTranscriptRef.current = '';
    setEvalError(null);

    if (currentPart === 1) {
      const nextIdx = questionIdx + 1;
      if (nextIdx < (questions?.part1?.length ?? 4)) {
        setQuestionIdx(nextIdx);
        setPhase('test');
      } else {
        setCurrentPart(2);
        setQuestionIdx(0);
        setPrepTimeLeft(60);
        setPrepActive(true);
        setPrepDone(false);
        setPhase('test');
      }
    } else if (currentPart === 2) {
      setCurrentPart(3);
      setQuestionIdx(0);
      setPhase('test');
    } else {
      const nextIdx = questionIdx + 1;
      if (nextIdx < (questions?.part3?.length ?? 3)) {
        setQuestionIdx(nextIdx);
        setPhase('test');
      } else {
        setPhase('complete');
      }
    }
  };

  /* ── Reset ── */
  const handleRestart = () => {
    recognitionRef.current?.stop();
    stopAnalyser();
    stopRecordingTimer();
    clearInterval(prepTimerRef.current);
    setRecordingSecs(0);
    setPhase('start'); setQuestions(null);
    setCurrentPart(1); setQuestionIdx(0);
    setTranscript(''); setTextInput(''); setIsRecording(false);
    setAllFeedbacks([]); setAnswerFeedback(null);
    setPrepActive(false); setPrepDone(false); setPrepTimeLeft(60);
    setGenError(null); setEvalError(null);
  };

  /* ── Save ── */
  const handleSave = async () => {
    setSaving(true);
    const avg = (key) => {
      const vals = allFeedbacks.map(f => f?.scores?.[key]).filter(Boolean);
      return vals.length ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    };
    try {
      await api.post('/sessions', {
        module: 'speaking',
        input_data: { questions, answers_count: allFeedbacks.length },
        ai_feedback: { feedbacks: allFeedbacks },
        band_score: avg('overall'),
      });
    } finally { setSaving(false); }
  };

  /* ── Complete screen ── */
  if (phase === 'complete') {
    return (
      <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 700 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Speaking Practice</h1>
        </div>
        <OverallResults feedbacks={allFeedbacks} questions={questions} saving={saving} onSave={handleSave} onRestart={handleRestart} />
      </div>
    );
  }

  return (
    <div style={{ padding: pad, maxWidth: isMobile ? '100%' : 1100 }}>
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Mic size={16} style={{ color: 'var(--accent-secondary)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Speaking Practice</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Answer each question — AI grades grammar, vocabulary & fluency</p>
      </motion.div>

      {/* ── Start screen ── */}
      {phase === 'start' && (
        <GlowCard style={{ padding: isMobile ? 28 : 48, textAlign: 'center', maxWidth: 520, margin: '0 auto' }}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', boxShadow: '0 0 48px rgba(6,182,212,0.35)' }}>
            <Mic size={30} color="white" />
          </div>
          <h2 style={{ fontSize: isMobile ? 20 : 24, marginBottom: 10 }}>IELTS Speaking Test</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, lineHeight: 1.7, marginBottom: 20, maxWidth: 360, margin: '0 auto 20px' }}>
            Answer questions across 3 parts. AI will evaluate your grammar, vocabulary, and fluency for each answer.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginBottom: 24 }}>
            {[[1,'Part 1','4 questions','Introduction'],[2,'Part 2','1 cue card','Long Turn'],[3,'Part 3','3 questions','Discussion']].map(([p, label, count, desc]) => (
              <div key={p} style={{ padding: '12px 8px', background: 'var(--bg-elevated)', borderRadius: 10, border: `1px solid ${PART_COLORS[p]}30` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: PART_COLORS[p], marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{count}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', opacity: 0.6 }}>{desc}</div>
              </div>
            ))}
          </div>
          {hasSpeech
            ? <div style={{ display: 'flex', gap: 6, alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 20, fontSize: 13, color: 'var(--accent-success)' }}><Mic size={13} /> Microphone available</div>
            : <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '8px 14px', marginBottom: 20, fontSize: 13, color: '#F59E0B' }}>Voice not supported — use text input</div>
          }
          {genError && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, fontSize: 13, color: 'var(--accent-danger)' }}>
              <AlertCircle size={14} /> {genError}
            </div>
          )}
          <button className="btn-primary" onClick={handleStart} style={{ padding: '13px 32px', fontSize: 15, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Mic size={17} /> Start Speaking Test
          </button>
        </GlowCard>
      )}

      {/* ── Generating screen ── */}
      {phase === 'generating' && (
        <GlowCard style={{ padding: 60, textAlign: 'center', maxWidth: 420, margin: '0 auto' }}>
          <Loader2 size={40} style={{ color: 'var(--accent-secondary)', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6 }}>Preparing your test...</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>AI is generating personalised questions</div>
        </GlowCard>
      )}

      {/* ── Test / Feedback screen ── */}
      {(phase === 'test' || phase === 'feedback' || phase === 'evaluating') && questions && (
        <motion.div key={`${currentPart}-${questionIdx}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          {/* Progress bar */}
          <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
            {[1, 2, 3].map(p => {
              const isActive = p === currentPart;
              const isPast = p < currentPart;
              return (
                <div key={p} style={{ flex: p === 2 ? 0.6 : 1, height: 4, borderRadius: 4, background: isPast ? 'var(--accent-success)' : isActive ? PART_COLORS[p] : 'var(--border)', transition: 'background 0.3s' }} />
              );
            })}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: !isMobile && phase === 'feedback' ? '1fr 360px' : '1fr', gap: 20 }}>
            <div>
              {/* Part label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: PART_COLORS[currentPart] }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: PART_COLORS[currentPart] }}>{PART_LABELS[currentPart]}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Space Mono' }}>{questionLabel}</span>
                </div>
                <button onClick={handleRestart} style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>
                  <RotateCcw size={12} /> Reset
                </button>
              </div>

              {/* Part 2: Cue card + prep */}
              {currentPart === 2 && (
                <GlowCard style={{ padding: isMobile ? 16 : 22, marginBottom: 14 }} hover={false}>
                  <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 10 }}>Cue Card</div>
                  <div style={{ fontSize: isMobile ? 16 : 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 14, padding: '12px 14px', background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', borderRadius: 10, lineHeight: 1.4 }}>
                    {questions.part2.topic}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>You should say:</div>
                  {questions.part2.points?.map((pt, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, alignItems: 'flex-start' }}>
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 10, fontWeight: 700, color: 'var(--accent-secondary)' }}>{i + 1}</div>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{pt}</span>
                    </div>
                  ))}
                  {(prepActive || !prepDone) && phase !== 'feedback' && (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'var(--bg-elevated)', borderRadius: 10, marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Clock size={14} style={{ color: '#F59E0B' }} />
                        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Preparation time</span>
                      </div>
                      <span style={{ fontFamily: 'Space Mono', fontSize: 22, fontWeight: 700, color: prepTimeLeft <= 10 ? 'var(--accent-danger)' : '#F59E0B' }}>
                        0:{String(prepTimeLeft).padStart(2, '0')}
                      </span>
                    </div>
                  )}
                  {prepActive && !prepDone && phase !== 'feedback' && (
                    <button className="btn-secondary" onClick={() => { clearInterval(prepTimerRef.current); setPrepActive(false); setPrepDone(true); }}
                      style={{ width: '100%', marginTop: 10 }}>
                      I'm ready to speak
                    </button>
                  )}
                </GlowCard>
              )}

              {/* Question card (Part 1 & 3) */}
              {currentPart !== 2 && (
                <GlowCard style={{ padding: isMobile ? 16 : 22, marginBottom: 14 }} hover={false}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 10 }}>Question</div>
                  <p style={{ fontSize: isMobile ? 16 : 18, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.65 }}>
                    {currentQuestion?.question}
                  </p>
                </GlowCard>
              )}

              {/* Input area — hide during prep, show when ready */}
              {(currentPart !== 2 || prepDone) && phase !== 'feedback' && (
                <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>Your Answer</span>
                    {hasSpeech && (
                      <button onClick={() => setShowTextInput(v => !v)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: 11, textDecoration: 'underline' }}>
                        {showTextInput ? 'use voice' : 'type instead'}
                      </button>
                    )}
                  </div>

                  {hasSpeech && !showTextInput ? (
                    /* Voice input */
                    <div style={{ padding: '14px' }}>
                      <AnimatePresence>
                        {(transcript || interimText) && (
                          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            style={{ background: 'var(--bg-elevated)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, fontSize: 14, color: 'var(--text-primary)', lineHeight: 1.6, maxHeight: 100, overflowY: 'auto', border: '1px solid var(--border)' }}>
                            {transcript}
                            {interimText && <span style={{ color: 'var(--text-muted)' }}> {interimText}</span>}
                          </motion.div>
                        )}
                      </AnimatePresence>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {isRecording && (
                            <>
                              <div style={{ position: 'absolute', width: 62, height: 62, borderRadius: '50%', border: '2px solid #EF4444', animation: 'ping1 1.2s ease-out infinite', pointerEvents: 'none' }} />
                              <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', border: '2px solid #EF4444', animation: 'ping2 1.2s ease-out infinite 0.4s', pointerEvents: 'none' }} />
                            </>
                          )}
                          <button onClick={isRecording ? stopRecording : startRecording} disabled={isEvaluating}
                            style={{ width: 56, height: 56, borderRadius: '50%', border: 'none', cursor: isEvaluating ? 'not-allowed' : 'pointer', background: isRecording ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, var(--accent-secondary), var(--accent-primary))', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', boxShadow: isRecording ? '0 0 24px rgba(239,68,68,0.5)' : '0 0 24px rgba(6,182,212,0.3)', opacity: isEvaluating ? 0.5 : 1 }}>
                            {isRecording ? <MicOff size={22} color="white" /> : <Mic size={22} color="white" />}
                          </button>
                        </div>
                        <div style={{ flex: 1 }}>
                          {isRecording ? (() => {
                            const target = RECOMMENDED_SECS[currentPart];
                            const progress = Math.min(1, recordingSecs / target);
                            const fmt = s => `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
                            const reached = recordingSecs >= target;
                            const timerColor = reached ? 'var(--accent-success)' : recordingSecs >= target * 0.5 ? '#F59E0B' : 'var(--accent-danger)';
                            return (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                {/* Timer row */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                  <span style={{ fontSize: 13, fontWeight: 700, color: timerColor, fontFamily: 'Space Mono' }}>{fmt(recordingSecs)}</span>
                                  <span style={{ fontSize: 11, color: reached ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                                    {reached ? '✓ Good length' : `~${fmt(target)} recommended`}
                                  </span>
                                </div>
                                {/* Duration progress bar */}
                                <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                                  <div style={{ height: '100%', width: `${progress * 100}%`, borderRadius: 2, background: reached ? 'var(--accent-success)' : '#F59E0B', transition: 'width 0.9s linear, background 0.3s' }} />
                                </div>
                                {/* Audio level bars */}
                                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 22 }}>
                                  {audioLevels.map((level, i) => {
                                    const h = Math.max(3, Math.round(level * 22));
                                    return (
                                      <div key={i} style={{ width: 4, height: h, borderRadius: 2, background: level > 0.5 ? '#EF4444' : level > 0.2 ? '#F59E0B' : 'rgba(239,68,68,0.35)', transition: 'height 80ms ease, background 80ms ease' }} />
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })() : (
                            <div style={{ fontSize: 13, fontWeight: 600, color: transcript ? 'var(--accent-success)' : 'var(--text-muted)' }}>
                              {transcript ? '✓ Ready to submit' : 'Tap mic to speak'}
                            </div>
                          )}
                        </div>
                        <AnimatePresence>
                          {transcript && !isRecording && (
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { setTranscript(''); finalTranscriptRef.current = ''; }} style={{ padding: '8px 10px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text-muted)', cursor: 'pointer', fontSize: 12 }}>Clear</button>
                              <button onClick={handleSubmit} disabled={isEvaluating} className="btn-primary" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, borderRadius: 10 }}>
                                {isEvaluating ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                                {isEvaluating ? 'Grading...' : 'Submit'}
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    /* Text input */
                    <div style={{ padding: '12px' }}>
                      <textarea className="input-dark" value={textInput} onChange={e => setTextInput(e.target.value)}
                        placeholder="Type your spoken answer here..."
                        style={{ borderRadius: 8, border: '1px solid var(--border)', minHeight: 100, padding: '12px', fontSize: 14, lineHeight: 1.7, resize: 'none', width: '100%', marginBottom: 8 }}
                        disabled={isEvaluating} />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn-primary" onClick={handleSubmit} disabled={isEvaluating || !textInput.trim()}
                          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px', fontSize: 14 }}>
                          {isEvaluating ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Grading...</> : <><Send size={14} /> Submit Answer</>}
                        </button>
                      </div>
                    </div>
                  )}

                  {evalError && (
                    <div style={{ margin: '0 14px 12px', padding: '10px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 12, color: 'var(--accent-danger)', display: 'flex', gap: 7, alignItems: 'center' }}>
                      <AlertCircle size={13} /> {evalError}
                    </div>
                  )}
                </GlowCard>
              )}

              {/* Feedback actions (mobile) */}
              {phase === 'feedback' && (
                <div style={{ marginTop: 14 }}>
                  {isMobile && <FeedbackCard feedback={answerFeedback} isMobile />}
                  <button className="btn-primary" onClick={handleNext}
                    style={{ width: '100%', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px' }}>
                    {currentPart === 3 && questionIdx >= (questions?.part3?.length ?? 3) - 1
                      ? 'See Overall Results'
                      : currentPart === 2
                      ? 'Continue to Part 3'
                      : currentPart === 1 && questionIdx >= (questions?.part1?.length ?? 4) - 1
                      ? 'Continue to Part 2'
                      : 'Next Question'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </div>

            {/* Desktop feedback panel */}
            <AnimatePresence>
              {!isMobile && phase === 'feedback' && answerFeedback && (
                <div>
                  <FeedbackCard feedback={answerFeedback} isMobile={false} />
                  <button className="btn-primary" onClick={handleNext}
                    style={{ width: '100%', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                    {currentPart === 3 && questionIdx >= (questions?.part3?.length ?? 3) - 1
                      ? 'See Overall Results'
                      : currentPart === 2
                      ? 'Continue to Part 3'
                      : currentPart === 1 && questionIdx >= (questions?.part1?.length ?? 4) - 1
                      ? 'Continue to Part 2'
                      : 'Next Question'}
                    <ChevronRight size={16} />
                  </button>
                </div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}

      <style>{`
        @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping1 { 0%{transform:scale(1);opacity:0.7} 100%{transform:scale(1.9);opacity:0} }
        @keyframes ping2 { 0%{transform:scale(1);opacity:0.4} 100%{transform:scale(2.4);opacity:0} }
      `}</style>
    </div>
  );
}
