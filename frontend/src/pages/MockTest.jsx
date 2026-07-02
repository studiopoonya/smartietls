import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FlaskConical, CheckCircle, BookMarked, ChevronRight } from 'lucide-react';
import { useMockTestEvaluate } from '../hooks/useAI';
import { useIsMobile } from '../hooks/useIsMobile';
import GlowCard from '../components/common/GlowCard';
import BandScoreBar from '../components/common/BandScoreBar';
import WordCounter from '../components/common/WordCounter';
import { getBandColor } from '../lib/utils';
import api from '../lib/axios';

const STEPS = ['Writing', 'Speaking', 'Reading', 'Listening', 'Results'];

export default function MockTest() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({ writing_response: '', speaking_summary: '', reading_score: '', listening_score: '' });
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const isMobile = useIsMobile();
  const { mutate: evaluate, isPending } = useMockTestEvaluate();
  const pad = isMobile ? '20px 16px' : '36px 40px';

  const handleSubmit = () => {
    evaluate(formData, {
      onSuccess: (data) => { setResult(data); setStep(4); },
    });
  };

  const handleSave = async () => {
    if (!result) return;
    setSaving(true);
    try {
      await api.post('/sessions', { module: 'mock_test', input_data: formData, ai_feedback: result, band_score: result.overallBand });
    } finally { setSaving(false); }
  };

  const resetTest = () => { setStep(0); setResult(null); setFormData({ writing_response: '', speaking_summary: '', reading_score: '', listening_score: '' }); };

  return (
    <div style={{ padding: pad, maxWidth: 860 }}>
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: isMobile ? 20 : 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <div style={{ width: 36, height: 36, background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FlaskConical size={16} style={{ color: 'var(--accent-danger)' }} />
          </div>
          <h1 style={{ fontSize: isMobile ? 20 : 26 }}>Mock Test</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 14 }}>Simulate a full IELTS test and get your overall band score</p>
      </motion.div>

      {/* Stepper */}
      {isMobile ? (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ flex: 1, height: 3, borderRadius: 2, background: step > i ? 'var(--accent-success)' : step === i ? 'var(--accent-danger)' : 'var(--border)', cursor: step > i ? 'pointer' : 'default' }} onClick={() => step > i && setStep(i)} />
            ))}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Step {step + 1} of {STEPS.length}</span> — {STEPS[step]}
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 0, marginBottom: 32, background: 'var(--bg-card)', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden' }}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ flex: 1, padding: '12px 8px', textAlign: 'center', fontSize: 13, fontWeight: 600, fontFamily: 'Space Grotesk', background: step === i ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))' : 'transparent', borderRight: i < STEPS.length - 1 ? '1px solid var(--border)' : 'none', color: step === i ? 'var(--accent-danger)' : step > i ? 'var(--accent-success)' : 'var(--text-muted)', cursor: step > i ? 'pointer' : 'default', transition: 'all 0.2s' }} onClick={() => step > i && setStep(i)}>
              {step > i ? <CheckCircle size={14} style={{ display: 'inline', marginRight: 4 }} /> : null}{s}
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="writing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlowCard hover={false} style={{ padding: 0, overflow: 'hidden', marginBottom: 16 }}>
              <div style={{ padding: isMobile ? '12px 14px' : '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 700 }}>Writing Task 2</div>
                <WordCounter text={formData.writing_response} target={250} />
              </div>
              <div style={{ padding: isMobile ? '12px 14px' : '16px 20px', background: 'rgba(239,68,68,0.05)', borderBottom: '1px solid var(--border)', fontSize: isMobile ? 13 : 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                Some people believe that the best way to reduce crime is to give longer prison sentences. Others think there are better approaches. Discuss both views and give your own opinion.
              </div>
              <textarea className="input-dark" value={formData.writing_response} onChange={e => setFormData(p => ({ ...p, writing_response: e.target.value }))}
                placeholder="Write your essay here... (minimum 250 words)"
                style={{ borderRadius: 0, border: 'none', minHeight: isMobile ? 240 : 320, padding: isMobile ? '14px' : '20px', resize: 'none' }} />
            </GlowCard>
            <button className="btn-primary" onClick={() => setStep(1)} disabled={formData.writing_response.length < 50}
              style={{ padding: '12px 28px', float: 'right', display: 'flex', alignItems: 'center', gap: 6 }}>
              Next <ChevronRight size={16} />
            </button>
            <div style={{ clear: 'both' }} />
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="speaking" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlowCard hover={false} style={{ padding: isMobile ? 18 : 24, marginBottom: 16 }}>
              <h3 style={{ fontSize: isMobile ? 15 : 16, marginBottom: 10 }}>Speaking Summary</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 14, lineHeight: 1.7 }}>
                Practice your speaking test separately (use the Speaking module), then summarize your experience here.
              </p>
              <textarea className="input-dark" value={formData.speaking_summary} onChange={e => setFormData(p => ({ ...p, speaking_summary: e.target.value }))}
                placeholder="Describe your speaking session: topics discussed, your fluency, vocabulary, grammar, any difficulties..."
                style={{ minHeight: isMobile ? 130 : 160, resize: 'none', fontSize: 13 }} />
            </GlowCard>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setStep(0)} style={{ padding: '11px 20px', fontSize: 13 }}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(2)} style={{ padding: '11px 24px', fontSize: 13 }}>Next →</button>
            </div>
          </motion.div>
        )}

        {step === 2 && (
          <motion.div key="reading" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlowCard style={{ padding: isMobile ? 18 : 28, marginBottom: 16 }}>
              <h3 style={{ fontSize: isMobile ? 15 : 16, marginBottom: 6 }}>Reading Score</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
                Complete a Reading exercise (use the Reading module) and enter your approximate band score.
              </p>
              <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'wrap' }}>
                {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(b => (
                  <button key={b} onClick={() => setFormData(p => ({ ...p, reading_score: b }))}
                    style={{ padding: isMobile ? '8px 12px' : '10px 18px', borderRadius: 8, border: `1px solid ${formData.reading_score === b ? 'var(--accent-success)' : 'var(--border)'}`, background: formData.reading_score === b ? 'rgba(16,185,129,0.15)' : 'var(--bg-elevated)', color: formData.reading_score === b ? 'var(--accent-success)' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Space Mono', fontWeight: 700, fontSize: isMobile ? 12 : 14, transition: 'all 0.2s' }}>
                    {b}
                  </button>
                ))}
              </div>
            </GlowCard>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setStep(1)} style={{ padding: '11px 20px', fontSize: 13 }}>← Back</button>
              <button className="btn-primary" onClick={() => setStep(3)} style={{ padding: '11px 24px', fontSize: 13 }}>Next →</button>
            </div>
          </motion.div>
        )}

        {step === 3 && (
          <motion.div key="listening" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <GlowCard style={{ padding: isMobile ? 18 : 28, marginBottom: 16 }}>
              <h3 style={{ fontSize: isMobile ? 15 : 16, marginBottom: 6 }}>Listening Score</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16, lineHeight: 1.7 }}>
                Complete a Listening exercise (use the Listening module) and enter your approximate band score.
              </p>
              <div style={{ display: 'flex', gap: isMobile ? 6 : 10, flexWrap: 'wrap' }}>
                {[4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map(b => (
                  <button key={b} onClick={() => setFormData(p => ({ ...p, listening_score: b }))}
                    style={{ padding: isMobile ? '8px 12px' : '10px 18px', borderRadius: 8, border: `1px solid ${formData.listening_score === b ? '#F59E0B' : 'var(--border)'}`, background: formData.listening_score === b ? 'rgba(245,158,11,0.1)' : 'var(--bg-elevated)', color: formData.listening_score === b ? '#F59E0B' : 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'Space Mono', fontWeight: 700, fontSize: isMobile ? 12 : 14, transition: 'all 0.2s' }}>
                    {b}
                  </button>
                ))}
              </div>
            </GlowCard>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setStep(2)} style={{ padding: '11px 20px', fontSize: 13 }}>← Back</button>
              <button className="btn-primary" onClick={handleSubmit} disabled={isPending} style={{ padding: '11px 28px', fontSize: 13 }}>
                {isPending ? 'Evaluating...' : 'Get Results →'}
              </button>
            </div>
          </motion.div>
        )}

        {step === 4 && result && (
          <motion.div key="results" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 12 : 20 }}>
              <GlowCard style={{ padding: isMobile ? 20 : 28 }}>
                <div style={{ textAlign: 'center', marginBottom: isMobile ? 18 : 24 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Overall Band</div>
                  <div style={{ fontFamily: 'Space Mono', fontSize: isMobile ? 54 : 68, fontWeight: 700, color: getBandColor(result.overallBand) }}>{result.overallBand}</div>
                </div>
                <BandScoreBar label="Writing" score={result.skills?.writing?.band} />
                <BandScoreBar label="Speaking" score={result.skills?.speaking?.band} />
                <BandScoreBar label="Reading" score={result.skills?.reading?.band} />
                <BandScoreBar label="Listening" score={result.skills?.listening?.band} />
                <button onClick={handleSave} disabled={saving} className="btn-secondary" style={{ width: '100%', marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  <BookMarked size={14} /> {saving ? 'Saving...' : 'Save Results'}
                </button>
              </GlowCard>
              <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 10 : 16 }}>
                <GlowCard style={{ padding: isMobile ? 16 : 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--accent-success)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Strengths</div>
                  {result.strengths?.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, paddingLeft: 10, borderLeft: '2px solid var(--accent-success)' }}>{s}</div>)}
                </GlowCard>
                <GlowCard style={{ padding: isMobile ? 16 : 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--accent-warning)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Improvements</div>
                  {result.improvements?.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, paddingLeft: 10, borderLeft: '2px solid var(--accent-warning)' }}>{s}</div>)}
                </GlowCard>
                <GlowCard style={{ padding: isMobile ? 16 : 20 }}>
                  <div style={{ fontSize: 11, color: 'var(--accent-secondary)', fontWeight: 600, marginBottom: 8, textTransform: 'uppercase' }}>Study Plan</div>
                  {result.studyPlan?.map((s, i) => <div key={i} style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 6, display: 'flex', gap: 8 }}><span style={{ color: 'var(--accent-secondary)', flexShrink: 0 }}>{i + 1}.</span>{s}</div>)}
                </GlowCard>
              </div>
            </div>
            <div style={{ marginTop: 18, textAlign: 'center' }}>
              <button className="btn-secondary" onClick={resetTest} style={{ padding: '12px 28px' }}>
                Take Another Mock Test
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
